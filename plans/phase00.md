# Phase 00: Planning Notes

## Objective

Turn the design in `PRD.md` into an implementation plan suitable for Codex.

This phase should produce an implementation sequence, but should not change the core design.

## Inputs

- `PRD.md`
- `AGENTS.md`
- `plans/agent-handoff.md`

## Planning Questions to Resolve

1. Where should failing examples live: `fixtures/failing`, `examples/failing`, or `demo-repo-failing`?
2. Which test runner should be used: Vitest or Jest?
3. Which MCP SDK package and server transport should be used after the evaluator is stable?
4. How should relative imports be resolved in the first version?
5. Should package aliases be supported immediately?
6. Should `archlint check` default to `demo-repo`, or require `--repo`?
7. How should escalation metadata be represented in CLI and MCP output?

## Planning Output

The planning agent should write:

```text
plans/phase01.md
```

That plan should include:

- file-by-file implementation sequence
- commands to run
- test strategy
- acceptance checks
- risks and simplifications
- explicit note that evaluator comes before MCP
