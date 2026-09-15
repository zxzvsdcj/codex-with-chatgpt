import { describe, expect, it } from "vitest";
import { CursorTaskOrchestrator } from "../src/cursor/orchestrator.js";
import { renderCursorPrompt, type CursorExecutionResult, type CursorTask } from "../src/cursor/task.js";

const task: CursorTask = {
  taskId: "TEST-001",
  workspace: process.cwd(),
  goal: "Implement the requested feature",
  phase: "implementation",
  mode: "agent",
  requiredCapabilities: ["testing", "debugging"],
  constraints: ["Do not rewrite unrelated code"],
  deliverables: ["Implementation", "Tests"],
  successCriteria: ["Tests pass"],
};

function result(status: CursorExecutionResult["status"]): CursorExecutionResult {
  return {
    taskId: task.taskId,
    executor: "cursor-agent",
    status,
    exitCode: status === "ok" ? 0 : 1,
    durationMs: 10,
    output: "ok",
    errorOutput: "",
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
  };
}

describe("Cursor task contract", () => {
  it("renders all execution constraints into the prompt", () => {
    const prompt = renderCursorPrompt(task);
    expect(prompt).toContain("TEST-001");
    expect(prompt).toContain("testing");
    expect(prompt).toContain("Do not rewrite unrelated code");
    expect(prompt).toContain("Tests pass");
  });

  it("maps a successful Cursor execution to EXECUTED", async () => {
    const states: string[] = [];
    const orchestrator = new CursorTaskOrchestrator({
      adapter: { execute: async () => result("ok") },
      onExecution: (execution) => states.push(execution.state),
    });

    const execution = await orchestrator.execute(task);
    expect(execution.state).toBe("EXECUTED");
    expect(states).toEqual(["INIT", "EXECUTING", "EXECUTED"]);
  });

  it("maps a timeout to BLOCKED instead of claiming success", async () => {
    const orchestrator = new CursorTaskOrchestrator({
      adapter: { execute: async () => result("timeout") },
    });

    const execution = await orchestrator.execute(task);
    expect(execution.state).toBe("BLOCKED");
  });
});
