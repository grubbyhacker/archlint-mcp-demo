# Agent Handoff

## Project

Archlint MCP Demo

## Current Intent

Build a small, local, reproducible demonstration of architectural linting for coding agents.

The system should show one policy source of truth exposed through:

- CLI
- Make/presubmit
- MCP server

The key idea is that MCP provides agent-readable visibility, while CLI/Make/CI provide non-optional enforcement.

## Current Design Position

Do not build an MCP-only demo.

The policy engine is the product. MCP is an adapter.

Target architecture:

```text
architecture.yaml
        ↓
shared policy/evaluator library
        ↓
CLI: archlint check / explain
        ↓
Makefile + CI: enforcement
        ↓
MCP server: agent-facing policy lookup
```

## Decisions Made

- Use a synthetic demo repository instead of depending on external open-source repos.
- Use a fake bank/payments domain so architectural boundaries are intuitive.
- The default repository state should pass `make presubmit`.
- Put intentional violations under `fixtures/failing/`.
- Include escalation metadata in the policy schema, even if initially only displayed/preserved.
- Stabilize the shared evaluator before implementing MCP.
- Keep the initial analyzer path-based and import-based.
- Support relative TypeScript imports only in v1.
- Make `archlint check` default to `demo-repo/`, with `--repo` available for explicit checks.
- Use Vitest for tests.
- Use stable `@modelcontextprotocol/sdk` v1.29.0 over stdio for the MCP adapter.
- Avoid symbol-level analysis.
- Avoid GitHub authentication.
- Avoid risk scoring in the initial design.
- Keep MCP tools narrow and factual.
- Keep the evaluator shared by CLI and MCP.

## Current State

V1 implementation is complete and committed on `main`.

Implemented:

- TypeScript project tooling, npm scripts, and `Makefile`.
- Policy schema loading and validation.
- Pure `evaluatePolicy(policy, facts)` evaluator.
- TypeScript import analyzer for relative imports.
- CLI commands: `check`, `check --json`, `explain`, `list-rules`.
- Passing `demo-repo/`.
- Intentional failing examples under `fixtures/failing/`.
- MCP stdio adapter exposing `list_architecture_rules`, `explain_policy_for_file`, and `check_files`.
- README quickstart and harness explanation.
- Current working tree is clean except ignored generated/install directories: `dist/` and `node_modules/`.

## Commit Stack

- `4b23e55` Add project planning baseline
- `42e830c` Initialize TypeScript project tooling
- `9c6c3d9` Implement policy evaluator
- `bf15eda` Add demo repo and import analyzer
- `68b097d` Implement archlint CLI
- `810f7a4` Add MCP adapter
- `f6daac6` Document enforcement workflow

## Files Changed

- Added project tooling: `package.json`, `package-lock.json`, `tsconfig.json`, `vitest.config.ts`, `Makefile`, `.gitignore`.
- Added implementation under `src/`.
- Added tests under `test/`.
- Added `policies/architecture.yaml`.
- Added `demo-repo/` and `fixtures/failing/`.
- Updated `README.md` and this handoff file.

## Commands Run

- `npm install` failed inside the network-restricted sandbox with `EAI_AGAIN`.
- Escalated `npm install` succeeded.
- `npm uninstall tsx`
- `npm test`
- `npm run build`
- `npm run archlint -- check --json`
- `npm run archlint -- check --repo fixtures/failing --json`
- `npm run archlint -- explain packages/web/src/accountPage.ts`
- `npm run archlint -- explain demo-repo/packages/web/src/accountPage.ts --repo demo-repo`
- `npm run archlint -- list-rules`
- `npm ls --depth=0`
- `make presubmit`

## Tests Passing

- `npm test`
- `npm run build`
- `npm run archlint -- check --json`
- `npm run archlint -- check --repo fixtures/failing --json` returns non-zero with expected violations.
- `npm run archlint -- explain demo-repo/packages/web/src/accountPage.ts --repo demo-repo`
- `make presubmit`

## Suggested Next Task

Plan a small, deterministic MCP integration/demo layer showing how an agent-facing client would query the MCP server before enforcement. Current MCP coverage only verifies that `createArchlintMcpServer()` constructs successfully; there is no protocol-level stdio MCP client test, no Codex CLI/harness simulation, and no deterministic agent-style flow that queries MCP before `make presubmit`.

Prefer testing MCP protocol calls directly with an SDK client. Treat real Codex CLI usage as optional documentation or a manual demo because it is likely too environment-dependent for presubmit.

Deferred follow-up work:

- CI workflow running `make presubmit`
- stronger MCP integration tests beyond adapter construction
- deterministic agent-style MCP demo or test
- `archlint check --changed-only`
- package alias support
- article draft
- GitHub PR integration
- richer import parsing or language-server integration

## Known Risks

- Import extraction is intentionally simple and static.
- Package aliases are intentionally unsupported in v1.
- Escalation metadata is preserved/displayed, not enforced as an approval workflow.
- MCP tests cover adapter construction; they do not perform a full protocol-level stdio integration test.

## Non-Negotiable Invariants

- `architecture.yaml` remains the source of truth.
- CLI and MCP use the same evaluator.
- MCP does not enforce policy by itself.
- `make presubmit` runs the verifier.
- The demo can run locally without external services.
