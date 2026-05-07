# Phase 1: MCP Protocol and Codex CLI Integration Tests

## Summary

Add deterministic integration coverage for the MCP adapter without changing the project thesis: MCP exposes policy facts, while CLI, Make, and CI remain the enforcement path.

Phase 1 focuses on:

- Standalone stdio MCP protocol tests using `@modelcontextprotocol/sdk`.
- Separate Codex CLI integration tests that prove Codex can register the Archlint MCP server in an isolated config.
- Documentation and handoff updates so the next agent can continue from a tested state.

## Key Changes

- Update `npm test` so it builds before Vitest, allowing protocol tests to spawn `node dist/src/mcp.js`.
- Add MCP protocol tests that:
  - Spawn the built stdio server with `StdioClientTransport`.
  - Verify the exposed tools are exactly `list_architecture_rules`, `explain_policy_for_file`, and `check_files`.
  - Call each tool and assert responses match the shared policy/evaluator behavior.
  - Check both the passing `demo-repo` and violating `fixtures/failing` paths.
- Add Codex CLI integration tests that:
  - Use a temporary `CODEX_HOME`.
  - Run `codex mcp add archlint -- node dist/src/mcp.js`.
  - Verify `codex mcp list` reports the server as enabled.
  - Read the temporary Codex config and validate the registered command by connecting to it as an MCP stdio server.
- Keep real model-backed `codex exec` usage as a manual smoke test, not a presubmit requirement.

## Public Interfaces

- Do not change `policies/architecture.yaml`.
- Do not add MCP tools or change existing tool response shapes.
- Do not move policy interpretation into `src/mcp.ts`; the adapter must continue to call shared service/evaluator code.
- `make presubmit` remains the required enforcement command.

## Test Plan

Run:

```bash
npm test
npm run build
npm run archlint -- check --json
npm run archlint -- check --repo fixtures/failing --json
make presubmit
```

Expected results:

- `npm test` builds first, then passes all unit and integration tests.
- MCP protocol tests start and close the stdio server cleanly.
- Codex CLI integration tests do not touch the user’s real Codex config.
- The failing fixture check still exits non-zero with expected violations.
- `make presubmit` remains green for the default `demo-repo`.

## Assumptions

- If `codex` is unavailable, Codex-specific tests skip clearly while MCP protocol tests still run.
- Automated Codex coverage means deterministic CLI registration/config plus protocol validation of the registered MCP command, not a model-authenticated `codex exec` run.
- `dist/` remains ignored/generated and may be rebuilt by test commands.
