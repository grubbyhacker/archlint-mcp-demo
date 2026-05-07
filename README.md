# Archlint MCP Demo

A small TypeScript demo of architectural linting for coding agents.

The key rule is that MCP is only an adapter. The source of truth is `policies/architecture.yaml`, and enforcement happens through the same verifier used by the CLI and `make presubmit`.

```text
architecture.yaml
        ↓
shared policy/evaluator library
        ↓
CLI: archlint check / explain
        ↓
Makefile: presubmit enforcement
        ↓
MCP server: agent-facing lookup/check adapter
```

## Quickstart

```bash
npm install
make presubmit
```

The default check targets `demo-repo/`, a passing fake bank/payments repository.

To see intentional failures:

```bash
npm run archlint -- check --repo fixtures/failing
```

To inspect the rule for a file:

```bash
npm run archlint -- explain packages/web/src/accountPage.ts
```

## CLI

```bash
npm run archlint -- check
npm run archlint -- check --json
npm run archlint -- check --repo fixtures/failing
npm run archlint -- explain packages/web/src/accountPage.ts
npm run archlint -- list-rules
```

`check` exits `0` when there are no error-level violations and non-zero when error-level violations exist.

## MCP

Run the MCP stdio server:

```bash
npm run mcp
```

Tools exposed:

- `list_architecture_rules`
- `explain_policy_for_file`
- `check_files`

These tools call the shared policy loader, analyzer, and evaluator. They do not contain independent policy logic.

The test suite includes standalone stdio protocol coverage. It starts `node dist/src/mcp.js` with the MCP SDK client and calls each tool through the protocol.

## Codex CLI

The Codex CLI can register the MCP server as a local stdio server:

```bash
codex mcp add archlint -- node dist/src/mcp.js
codex mcp list
```

Automated tests cover this registration flow with an isolated temporary `CODEX_HOME`, then launch the configured command through the MCP SDK client. Model-backed `codex exec` flows are intentionally left as manual smoke tests so `make presubmit` does not depend on Codex auth or model availability.

## Project Shape

- `policies/architecture.yaml`: architecture rules and metadata.
- `src/policy.ts`: policy loading, validation, and applicable-rule lookup.
- `src/analyzer.ts`: TypeScript import fact extraction.
- `src/verifier.ts`: pure policy evaluation.
- `src/cli.ts`: developer-facing CLI.
- `src/mcp.ts`: MCP adapter.
- `test/mcp.test.ts`: stdio MCP protocol coverage.
- `test/codexCli.test.ts`: deterministic Codex CLI MCP registration coverage.
- `demo-repo/`: passing synthetic demo repository.
- `fixtures/failing/`: intentional violations for demos and tests.

## Harness Model

A coding-agent harness should require `make presubmit` before accepting work as complete. The MCP server helps the agent discover constraints earlier, but the verifier is the non-optional enforcement point.
