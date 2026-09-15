export type CursorTaskPhase =
  | "architecture"
  | "implementation"
  | "debug"
  | "review"
  | "verification";

export type CursorAgentMode = "ask" | "plan" | "agent";

export interface CursorTask {
  taskId: string;
  workspace: string;
  goal: string;
  phase: CursorTaskPhase;
  mode: CursorAgentMode;
  requiredCapabilities: string[];
  constraints: string[];
  deliverables: string[];
  successCriteria: string[];
}

export interface CursorExecutionResult {
  taskId: string;
  executor: "cursor-agent";
  status: "ok" | "failed" | "blocked" | "timeout";
  exitCode: number | null;
  durationMs: number;
  output: string;
  errorOutput: string;
  startedAt: string;
  finishedAt: string;
}

export function renderCursorPrompt(task: CursorTask): string {
  const section = (title: string, values: string[]) =>
    values.length ? `\n${title}:\n${values.map((v) => `- ${v}`).join("\n")}` : "";

  return [
    "You are the execution agent for ChatGPT with Cursor.",
    "ChatGPT owns high-level reasoning; you own execution in the current workspace.",
    "Complete the task using Cursor's native search, file editing, terminal, Rules, Skills, and MCP capabilities when useful.",
    "Do not merely describe changes: perform them, verify them, and report the concrete result.",
    `\nTASK ID: ${task.taskId}`,
    `PHASE: ${task.phase}`,
    `MODE: ${task.mode}`,
    `\nGOAL:\n${task.goal}`,
    section("REQUIRED CAPABILITIES", task.requiredCapabilities),
    section("CONSTRAINTS", task.constraints),
    section("DELIVERABLES", task.deliverables),
    section("SUCCESS CRITERIA", task.successCriteria),
    "\nBefore finishing, inspect the resulting diff and run the most relevant tests or checks. If blocked, explain the exact blocker and do not claim success.",
  ].join("\n");
}
