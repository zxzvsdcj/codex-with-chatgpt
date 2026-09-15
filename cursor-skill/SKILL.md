---
name: chatgpt-with-cursor
description: Use ChatGPT as the planning and review brain while Cursor owns local coding execution. Use when a task should follow PLAN → EXECUTE → REVIEW and when Cursor Skills, Rules, MCP, tests, or repository engineering governance should be applied.
---

# ChatGPT with Cursor

> ChatGPT thinks. Cursor works.

## Execution ownership

Cursor owns all local execution:

- repository search and code tracing;
- file edits and refactors;
- shell commands and tests;
- Git operations when explicitly required;
- Cursor Rules and `AGENTS.md`;
- Cursor Skills / Custom Modes;
- configured MCP servers.

ChatGPT owns high-level reasoning and independent review. Do not paste large files, diffs, or logs into ChatGPT. ChatGPT should pull read-only workspace information through the bridge.

## Required loop

1. `INIT` — inspect the workspace and identify the real implementation boundary.
2. `PLAN` — produce a finite plan with affected files, constraints, risks, and success criteria.
3. `EXECUTING` — implement the plan in Cursor.
4. `EXECUTED` — report metadata only; never claim correctness merely because the agent finished.
5. `REVIEW` — ChatGPT inspects actual diff, tests, and workspace state.
6. `DONE` or `REPLAN` — fix review findings and verify again.

## Capability routing

When the task mentions a capability, use the corresponding Cursor-native workflow:

- `architecture-review` → Plan mode + architecture skill/rules.
- `debugging` → reproduce first, then Agent mode and focused tests.
- `security-audit` → read-only inspection first; inspect trust boundaries and secret handling.
- `database-migration` → inspect existing migration conventions before editing.
- `codebase-cleanup` → preserve behavior; remove duplication only with clear ownership.
- `testing` → run focused tests, then broader tests when practical.
- `skills` → use an actual installed Skill/Custom Mode when relevant.
- `mcp` → use configured MCP tools when they materially help.
- `rules` → obey `.cursor/rules` and `AGENTS.md`.

## Cursor CLI

For automated execution, prefer the Cursor Agent CLI in non-interactive print mode:

```text
agent -p "<structured task>" --output-format json
```

Use an explicit workspace root. Never construct a shell command by concatenating untrusted repository content. Pass the task as an argument to the process launcher.

For future protocol integrations, prefer Cursor ACP (`agent acp`) over GUI automation.

## Failure handling

- Never convert a timeout or blocked execution into success.
- Never report tests as passing without an actual test record.
- If Cursor Agent is unavailable, report the environment blocker and keep the task in `BLOCKED`/`ERROR`.
- Preserve the bridge's read-only boundary for ChatGPT.

## Engineering principle

Do not reimplement Cursor's coding harness in the bridge. The bridge coordinates and records; Cursor searches, edits, runs commands, uses Skills/MCP, and verifies the workspace.
