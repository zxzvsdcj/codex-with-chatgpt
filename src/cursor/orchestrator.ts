import { CursorCliAdapter } from "./adapter.js";
import type { CursorExecutionResult, CursorTask } from "./task.js";

export type TaskState = "INIT" | "EXECUTING" | "EXECUTED" | "BLOCKED" | "ERROR";

export interface TaskExecution {
  state: TaskState;
  task: CursorTask;
  result: CursorExecutionResult | null;
}

export interface CursorTaskOrchestratorOptions {
  adapter?: CursorCliAdapter;
  onExecution?: (execution: TaskExecution) => Promise<void> | void;
}

export class CursorTaskOrchestrator {
  private readonly adapter: CursorCliAdapter;
  private readonly onExecution?: CursorTaskOrchestratorOptions["onExecution"];

  constructor(options: CursorTaskOrchestratorOptions = {}) {
    this.adapter = options.adapter ?? new CursorCliAdapter();
    this.onExecution = options.onExecution;
  }

  async execute(task: CursorTask): Promise<TaskExecution> {
    let execution: TaskExecution = { state: "INIT", task, result: null };
    await this.onExecution?.(execution);

    execution = { ...execution, state: "EXECUTING" };
    await this.onExecution?.(execution);

    try {
      const result = await this.adapter.execute(task);
      execution = {
        state: result.status === "ok" ? "EXECUTED" : result.status === "timeout" ? "BLOCKED" : "ERROR",
        task,
        result,
      };
    } catch (error) {
      execution = {
        state: "ERROR",
        task,
        result: {
          taskId: task.taskId,
          executor: "cursor-agent",
          status: "failed",
          exitCode: null,
          durationMs: 0,
          output: "",
          errorOutput: error instanceof Error ? error.message : String(error),
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
        },
      };
    }

    await this.onExecution?.(execution);
    return execution;
  }
}
