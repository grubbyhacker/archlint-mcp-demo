# AGENTS.md

## Project: Archlint MCP Demo

## Purpose

This repository demonstrates architectural linting for coding agents.

The central rule for all agents:

> MCP is an adapter. The policy engine is the source of truth. Enforcement must happen through the CLI, Makefile, and CI path.

Do not build an MCP-only demo. Do not put architectural logic inside the MCP server that is not also used by the CLI verifier.

## Project Thesis

Architectural constraints should not rely on prompt obedience.

Agents may inspect policy through MCP, but compliance must be enforced deterministically by a verifier that can run as:

```bash
make presubmit
```

The intended architecture is:

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

## Working Rules for Agents

### Keep the Design Small

Avoid turning this into:

- a general static analyzer
- a dependency graph platform
- a GitHub PR review bot
- a risk scoring product
- a semantic architecture advisor
- a full coding-agent harness

The demo should remain understandable in under five minutes.

Use a fake bank/payments domain for the demo repository. Avoid making the test subject look like infrastructure unless that becomes explicitly necessary.

### Preserve the Core Separation

The following must remain separate:

| Component | Responsibility |
|---|---|
| `policies/architecture.yaml` | source of truth |
| shared evaluator library | deterministic rule evaluation |
| CLI | developer-facing execution |
| Makefile / CI | enforcement |
| MCP server | agent-facing lookup/check adapter |

Never duplicate policy logic between CLI and MCP.

### Prefer Deterministic Behavior

Use explicit rules and canned source examples.

Avoid heuristics unless they are isolated and tested.

### Prefer Synthetic Demo Data

Use the local `demo-repo/` as the primary passing test case.

The default repository state should pass `make presubmit`.

Put intentional violations under fixtures or explicit failing examples. External repositories may be added later as examples, but they must not be required for the core demo.

### Do Not Overfit to MCP

MCP tools should expose facts and checks, not make architectural decisions.

Good MCP tools:

```text
list_architecture_rules()
explain_policy_for_file(filePath)
check_files(files[])
```

Bad MCP tools:

```text
design_feature(...)
suggest_architecture(...)
assess_business_risk(...)
implement_change(...)
```

## Repository Shape

Target structure:

```text
archlint-mcp-demo/
├── AGENTS.md
├── PRD.md
├── Makefile
├── package.json
├── policies/
│   └── architecture.yaml
├── src/
│   ├── policy.ts
│   ├── analyzer.ts
│   ├── verifier.ts
│   ├── formatter.ts
│   ├── cli.ts
│   └── mcp.ts
├── test/
│   ├── policy.test.ts
│   ├── analyzer.test.ts
│   ├── verifier.test.ts
│   └── cli.test.ts
├── demo-repo/
│   ├── package.json
│   ├── tsconfig.json
│   └── packages/
│       ├── web/
│       ├── api/
│       ├── ledger/
│       ├── auth/
│       └── contracts/
└── plans/
    ├── phase00.md
    └── agent-handoff.md
```

## Design Invariants

Agents must preserve these invariants:

1. `architecture.yaml` is the source of truth.
2. CLI and MCP must use the same evaluator.
3. `make presubmit` must run the architectural verifier.
4. The verifier must return non-zero on error-level violations.
5. MCP must not be required for enforcement.
6. The demo must run locally without company data.
7. The demo must not require GitHub authentication.
8. The core evaluator must be testable without filesystem access.
9. Output should be structured enough for agents and readable enough for humans.
10. The project should remain small.

## Policy Format

Expected policy shape:

```yaml
rules:
  - id: web-cannot-import-ledger
    from: "packages/web/**"
    disallowImports:
      - "packages/ledger/**"
    reason: "Browser-facing code must not depend on ledger internals."
    suggestedFixes:
      - "Call packages/api instead."
      - "Use packages/contracts for shared types."
    severity: error
    requiredChecks:
      - "npm test"
      - "npm run archlint:check"
    escalation:
      required: true
      reviewGroups:
        - platform
        - security
      reason: "Ledger access from browser-facing code requires explicit architectural review."
```

Do not expand the schema without updating:

- `PRD.md`
- tests
- CLI formatting
- MCP response formatting

## Evaluator Contract

The evaluator should operate on facts, not raw files.

Preferred shape:

```ts
type ImportFact = {
  fromFile: string;
  importedPath: string;
  rawImport: string;
};

type Violation = {
  ruleId: string;
  severity: "error" | "warning";
  fromFile: string;
  importedPath: string;
  reason: string;
  suggestedFixes: string[];
};
```

Core function:

```ts
evaluatePolicy(policy, facts): Violation[]
```

This function should be pure and unit-tested.

## CLI Contract

Required commands:

```bash
archlint check
archlint check --json
archlint explain <file>
archlint list-rules
```

Exit behavior:

- `0` when no error-level violations exist.
- non-zero when one or more error-level violations exist.

## Makefile Contract

`make presubmit` must run the verifier.

Expected shape:

```make
presubmit:
	npm test
	npm run archlint:check
```

## MCP Contract

MCP server exposes the same evaluator.

Recommended tools:

```text
list_architecture_rules
explain_policy_for_file
check_files
```

The MCP server should not contain independent policy interpretation.

## Testing Guidance

Write tests around the evaluator first.

Minimum useful tests:

1. Web importing ledger produces an error.
2. Web importing API produces no violation.
3. Contracts importing runtime code produces an error.
4. `explain` returns applicable rules for a file.
5. CLI exits non-zero on error-level violations.

## Output Style

Diagnostics should be concise and repair-oriented.

Example:

```text
FAIL web-cannot-import-ledger

packages/web/src/accountPage.bad.ts
  imports packages/ledger/src/postTransaction.ts

Browser-facing code must not depend on ledger internals.

Suggested fixes:
  - Call packages/api instead.
  - Use packages/contracts for shared types.
```

Avoid verbose philosophical output in the CLI. Save explanation for README or article.

## Implementation Ordering

Stabilize the evaluator first.

Do not implement MCP before the shared policy loader, analyzer, verifier, and evaluator tests are working. MCP must wrap the same evaluator used by CLI.

## Deferred Ideas

Do not implement unless explicitly requested:

- GitHub OAuth
- PR diff mode
- CODEOWNERS integration
- OpenTelemetry traces
- package graph visualization
- TypeScript language-server integration
- symbol-level analysis
- risk scoring
- external repo submodules
- Docker setup
- web UI

## Planning Notes

Before implementation, resolve these design choices:

1. Exact location for intentional failing examples: `fixtures/failing`, `examples/failing`, or separate `demo-repo-failing`.
2. Whether the repo should include an article draft.
3. Whether package aliases should be supported in the first evaluator.
4. Whether `archlint check` should require an explicit repo path or default to `demo-repo`.

Record decisions in `plans/agent-handoff.md`.

## Agent Handoff Discipline

At the end of each meaningful work session, update:

```text
plans/agent-handoff.md
```

Include:

- current state
- decisions made
- files changed
- commands run
- tests passing/failing
- next recommended task
- known risks
