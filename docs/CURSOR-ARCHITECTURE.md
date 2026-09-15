# ChatGPT with Cursor — Architecture

> ChatGPT thinks. Cursor works.

This branch evolves the proven `codex-with-chatgpt` bridge into a Cursor execution backend without weakening the original security boundary.

## Goals

- ChatGPT remains the planning and review brain.
- Cursor Agent owns local execution: search, edit, shell, tests, Skills, Rules, and MCP.
- The bridge never becomes a second coding harness.
- ChatGPT receives read-only workspace/git/execution data through MCP.
- Every execution is represented by a structured task and an auditable execution record.

## Runtime

```text
ChatGPT Web
   │
   │ PLAN / REVIEW
   ▼
C2C Bridge
   │
   ├── read-only MCP
   ├── OAuth / pairing / tunnel
   └── execution records
   │
   ▼
Task Orchestrator
   │
   ▼
Cursor Adapter
   │
   ├── Cursor Agent CLI (-p)
   └── Cursor ACP (future preferred transport)
   │
   ▼
Cursor Agent
   │
   ├── .cursor/rules
   ├── AGENTS.md
   ├── Skills
   ├── MCP
   └── local workspace
```

Cursor's current CLI supports non-interactive `-p/--print` execution, JSON output, project rules, `AGENTS.md`, MCP discovery, and ACP. The adapter therefore treats CLI print mode as the initial stable backend and keeps ACP behind an interface for the next iteration.

## Task contract

```ts
interface CursorTask {
  taskId: string;
  workspace: string;
  goal: string;
  phase: "architecture" | "implementation" | "debug" | "review" | "verification";
  mode: "ask" | "plan" | "agent";
  requiredCapabilities: string[];
  constraints: string[];
  deliverables: string[];
  successCriteria: string[];
}
```

The task is intentionally declarative. ChatGPT decides **what** must happen; Cursor decides **how** to use its native tools to make it happen.

## Execution lifecycle

```text
INIT
  ↓
PLAN
  ↓
EXECUTING
  ↓
EXECUTED
  ↓
REVIEW
  ├── DONE
  ├── REPLAN
  ├── BLOCKED
  └── ERROR
```

The `EXECUTED` state never means “trusted as correct”. ChatGPT must inspect the actual workspace state, diff, and test records before accepting the result.

## Capability routing

The orchestrator maps requested capabilities to Cursor-native behavior:

| Capability | Cursor execution behavior |
|---|---|
| `code-tracing` | Agent search/read tools |
| `architecture-review` | Plan/Ask mode + architecture skill/rules |
| `debugging` | Agent mode + debugging skill |
| `testing` | Agent mode + terminal/test commands |
| `security-audit` | Security skill + read/search/test |
| `codebase-cleanup` | Agent mode + cleanup skill |
| `database-migration` | Migration skill + tests |
| `mcp` | Cursor's configured MCP servers |
| `rules` | `.cursor/rules`, `AGENTS.md` |
| `skills` | Cursor Skills / Custom Modes |

The router should not hard-code individual MCP servers. Cursor remains responsible for discovering and selecting the configured tools.

## Security boundary

ChatGPT does **not** receive write, shell, commit, package-install, or arbitrary process execution capabilities from the bridge. Cursor is the sole execution owner.

The Cursor adapter must:

1. launch only from an explicit workspace root;
2. pass the task as a prompt, never as shell fragments generated from untrusted file content;
3. capture only sanitized execution metadata;
4. never persist Cursor credentials;
5. preserve the existing workspace/path/sensitive-file protections;
6. record executor identity as `cursor-agent`;
7. fail closed when Cursor Agent is unavailable.

## V0.1 scope

1. Cursor CLI adapter using `agent -p`.
2. JSON/text output capture with bounded size.
3. Structured task model.
4. Orchestrator that executes one task and writes an execution record.
5. CLI diagnostics for Cursor availability.
6. Tests for command construction, workspace containment, timeout, and failure mapping.

## V0.2 scope

- ACP adapter.
- Capability router with project Skill discovery.
- task queue and resume.
- richer execution/test records.
- explicit pause/resume control.

## V0.3 scope

- autonomous PLAN → EXECUTE → REVIEW → REPLAN loop.
- multiple workspaces.
- parallel isolated Cursor worktrees.
- deterministic Git publishing owned by the bridge, not by the model.
