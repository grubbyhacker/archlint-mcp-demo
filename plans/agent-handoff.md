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
- Treat automated Codex CLI coverage as deterministic MCP registration/config validation, not a model-authenticated `codex exec` run.
- Avoid symbol-level analysis.
- Avoid GitHub authentication.
- Avoid risk scoring in the initial design.
- Keep MCP tools narrow and factual.
- Keep the evaluator shared by CLI and MCP.
- GitHub Actions should run the same `make presubmit` path used locally.
- Documentation milestone uses Mermaid diagrams rather than generated bitmap assets.
- Documentation milestone includes a Substack-ready follow-up draft at `docs/article-draft.md`.
- Hypothetical agent MCP usage is documented as transcript plus exact tool call examples.

## Current State

V1 implementation is complete and committed on `main`.

Phase 1 MCP/Codex integration coverage and CI presubmit are implemented.

The documentation milestone is implemented in the working tree. The README is now the entry point and links to a multi-file `docs/` set covering system architecture, walkthroughs, agent MCP usage, hard enforcement, policy authoring, and a follow-up article draft.

Implemented:

- TypeScript project tooling, npm scripts, and `Makefile`.
- Policy schema loading and validation.
- Pure `evaluatePolicy(policy, facts)` evaluator.
- TypeScript import analyzer for relative imports.
- CLI commands: `check`, `check --json`, `explain`, `list-rules`.
- Passing `demo-repo/`.
- Intentional failing examples under `fixtures/failing/`.
- MCP stdio adapter exposing `list_architecture_rules`, `explain_policy_for_file`, and `check_files`.
- Standalone MCP protocol tests that spawn `node dist/src/mcp.js` and call each tool through the SDK client.
- Codex CLI integration tests that register the MCP server under a temporary `CODEX_HOME`, verify `codex mcp list`, and validate the registered command with an SDK client.
- GitHub Actions workflow that runs `npm ci` and `make presubmit`.
- Persisted Phase 1 plan in `plans/phase1.md`.
- README quickstart, documentation entry point, and harness explanation.
- Documentation under `docs/` explaining Architectural Linting, MCP as an adapter, and CLI/Make/CI as the hard enforcement path.
- MIT license added for public GitHub publication.
- Ignored generated/install directories remain `dist/` and `node_modules/`.

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
- Added `plans/phase1.md`.
- Added `test/mcpClient.ts` and `test/codexCli.test.ts`.
- Added `.github/workflows/presubmit.yml`.
- Expanded `test/mcp.test.ts`.
- Updated `package.json` so `npm test` builds before Vitest.
- Replaced `README.md` as the concise documentation entry point.
- Added documentation files under `docs/`: `index.md`, `architecture.md`, `demo-walkthrough.md`, `agent-mcp-workflow.md`, `enforcement.md`, `policy-authoring.md`, and `article-draft.md`.
- Added `LICENSE` with the MIT license and linked it from `README.md`.

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
- `npm run build`
- `npm test`
- `make presubmit`
- `npm run archlint -- list-rules`
- `npm run archlint -- check`
- `npm run archlint -- check --json`
- `npm run archlint -- explain demo-repo/packages/web/src/accountPage.ts --repo demo-repo`
- `npm run archlint -- check --repo fixtures/failing`
- Local Markdown link validation with a Node one-liner
- Documentation stale-claim search with `rg`
- `npm test`
- `make presubmit`
- `git diff --check`

## Tests Passing

- `npm test`
- `npm run build`
- MCP stdio protocol tests call `list_architecture_rules`, `explain_policy_for_file`, and `check_files`.
- Codex CLI integration test passes when `codex` is available; it is skipped if the executable is unavailable.
- `npm run archlint -- check --json`
- `npm run archlint -- check --repo fixtures/failing --json` returns non-zero with expected violations.
- `npm run archlint -- explain demo-repo/packages/web/src/accountPage.ts --repo demo-repo`
- Local Markdown links in README and `docs/*.md` resolve.
- Documentation examples match current CLI output.
- `make presubmit`

## Suggested Next Task

Review and polish the documentation prose for publication voice, then optionally add a deterministic agent-style MCP demo or test that mirrors `docs/agent-mcp-workflow.md`.

Deferred follow-up work:

- deterministic agent-style MCP demo or test
- `archlint check --changed-only`
- package alias support
- GitHub PR integration
- richer import parsing or language-server integration

## Known Risks

- Import extraction is intentionally simple and static.
- Package aliases are intentionally unsupported in v1.
- Escalation metadata is preserved/displayed, not enforced as an approval workflow.
- Model-backed Codex CLI flows are intentionally not in presubmit because they can require auth and network/model availability.

## Non-Negotiable Invariants

- `architecture.yaml` remains the source of truth.
- CLI and MCP use the same evaluator.
- MCP does not enforce policy by itself.
- `make presubmit` runs the verifier.
- The demo can run locally without external services.
