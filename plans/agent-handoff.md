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

Run final acceptance checks and commit in reviewable phases if desired.

Deferred follow-up work:

- `archlint check --changed-only`
- package alias support
- CI workflow
- article draft
- GitHub PR integration
- richer import parsing or language-server integration

## Known Risks

- Import extraction is intentionally simple and static.
- Package aliases are intentionally unsupported in v1.
- MCP tests cover adapter construction; they do not perform a full protocol-level stdio integration test.

## Non-Negotiable Invariants

- `architecture.yaml` remains the source of truth.
- CLI and MCP use the same evaluator.
- MCP does not enforce policy by itself.
- `make presubmit` runs the verifier.
- The demo can run locally without external services.
