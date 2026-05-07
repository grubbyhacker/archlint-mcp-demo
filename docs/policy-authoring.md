# Policy Authoring

The policy file is `policies/architecture.yaml`. It is the source of truth for architecture rules. Do not add policy logic only to the MCP server, CLI formatter, tests, or documentation.

## Current Schema

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

## Fields

| Field | Required | Purpose |
|---|---:|---|
| `id` | yes | Stable rule identifier used in diagnostics and tests. |
| `from` | yes | Glob for source files the rule applies to, relative to the checked repo. |
| `disallowImports` | yes | List of forbidden imported path globs. |
| `reason` | yes | Human-readable rationale shown in CLI and MCP output. |
| `suggestedFixes` | yes | Repair hints shown in diagnostics. Use concrete alternatives. |
| `severity` | yes | `error` or `warning`. Error-level violations fail `check`. |
| `requiredChecks` | no | Related checks to display as policy context. |
| `escalation` | no | Human-review metadata displayed/preserved by the policy system. |

## Authoring Guidance

Good rules are explicit and repair-oriented:

- Name the architectural boundary, not an implementation preference.
- Keep `from` and `disallowImports` path-based in v1.
- Use `reason` to explain why the boundary exists.
- Use `suggestedFixes` to point to allowed paths.
- Prefer `severity: error` only for boundaries that should block completion.

Avoid rules that require semantic inference in v1:

- No symbol-level ownership rules.
- No risk scoring.
- No inferred package graphs.
- No package alias assumptions.
- No rules that only exist in MCP prompts.

## Adding a Rule

1. Add the rule to `policies/architecture.yaml`.
2. Add evaluator tests for matching and non-matching import facts.
3. Add analyzer or verifier coverage only if the current path-based behavior is insufficient.
4. Verify CLI formatting remains clear with `npm run archlint -- list-rules`.
5. Verify failing output is repair-oriented with a fixture or targeted test.
6. Run `make presubmit`.

## Schema Changes

Do not expand the schema casually. If a new field is needed, update all of these together:

- `PRD.md`
- policy loader validation
- TypeScript types
- evaluator tests
- CLI formatting
- MCP response formatting
- this document

The rule of thumb is simple: if an agent can see it through MCP, the CLI verifier and tests must understand it too.
