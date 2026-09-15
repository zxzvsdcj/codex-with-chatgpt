import { spawn } from "node:child_process";
import { renderCursorPrompt, type CursorExecutionResult, type CursorTask } from "./task.js";

export interface CursorAdapterOptions {
  executable?: string;
  timeoutMs?: number;
  maxOutputBytes?: number;
}

const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;
const DEFAULT_MAX_OUTPUT_BYTES = 256 * 1024;

function boundedAppend(current: string, chunk: Buffer | string, maxBytes: number): string {
  const next = current + chunk.toString();
  if (Buffer.byteLength(next, "utf8") <= maxBytes) return next;
  return Buffer.from(next, "utf8").subarray(0, maxBytes).toString("utf8") + "\n[output truncated]";
}

export class CursorCliAdapter {
  private readonly executable: string;
  private readonly timeoutMs: number;
  private readonly maxOutputBytes: number;

  constructor(options: CursorAdapterOptions = {}) {
    this.executable = options.executable ?? process.env.CURSOR_AGENT_COMMAND ?? "agent";
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxOutputBytes = options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;
  }

  async execute(task: CursorTask): Promise<CursorExecutionResult> {
    const startedAt = new Date();
    const startedMs = Date.now();
    const prompt = renderCursorPrompt(task);
    const args = ["-p", prompt, "--output-format", "json"];

    return new Promise((resolve) => {
      let stdout = "";
      let stderr = "";
      let timedOut = false;
      let settled = false;

      const child = spawn(this.executable, args, {
        cwd: task.workspace,
        shell: false,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });

      const finish = (status: CursorExecutionResult["status"], exitCode: number | null) => {
        if (settled) return;
        settled = true;
        const finishedAt = new Date();
        resolve({
          taskId: task.taskId,
          executor: "cursor-agent",
          status,
          exitCode,
          durationMs: Date.now() - startedMs,
          output: stdout,
          errorOutput: stderr,
          startedAt: startedAt.toISOString(),
          finishedAt: finishedAt.toISOString(),
        });
      };

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill();
        finish("timeout", null);
      }, this.timeoutMs);

      child.stdout.on("data", (chunk: Buffer) => {
        stdout = boundedAppend(stdout, chunk, this.maxOutputBytes);
      });
      child.stderr.on("data", (chunk: Buffer) => {
        stderr = boundedAppend(stderr, chunk, this.maxOutputBytes);
      });
      child.on("error", (error) => {
        stderr = boundedAppend(stderr, error.message, this.maxOutputBytes);
        clearTimeout(timer);
        finish("failed", null);
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        if (timedOut) return;
        finish(code === 0 ? "ok" : "failed", code);
      });
    });
  }
}
