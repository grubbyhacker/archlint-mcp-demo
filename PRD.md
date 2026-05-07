# PRD: Archlint MCP Demo

## Working Title

**Archlint MCP Demo: Agent-Readable Architectural Linting with Deterministic Enforcement**

## Summary

This project demonstrates a small but production-shaped architectural linting system designed for coding agents.

The core idea is simple:

> Architectural rules should be readable by agents, runnable by developers, and enforceable by CI. MCP is useful only as an adapter over the same policy engine used by the verifier.

The project is not an MCP-only demo. It is a policy and verification system with multiple surfaces:

- A declarative architecture policy file.
- A deterministic CLI verifier.
- A `make presubmit` enforcement path.
- An MCP server that exposes the same rules and checks to coding agents.
- A synthetic demo repository with intentionally valid and invalid dependency examples.

## Problem

Coding agents can read instructions, but they can also ignore, forget, misinterpret, or optimize around them. Architectural constraints should not rely on prompt obedience.

Current lightweight approaches often put rules in documents such as `AGENTS.md`, `README.md`, or contributor guides. That is useful context, but not enforcement.

This project demonstrates a better pattern:

1. Put architectural rules in a machine-readable policy file.
2. Evaluate those rules deterministically.
3. Expose the evaluator through CLI, Make, CI, and MCP.
4. Treat MCP as a visibility layer, not the authority.

## Goals

### Primary Goals

- Demonstrate architectural linting as deterministic infrastructure, not agent guidance.
- Keep the source of truth independent of MCP.
- Provide a simple, reproducible demo that runs locally with minimal setup.
- Make the architecture understandable to both humans and coding agents.
- Show how an agent can inspect rules before making changes.
- Show how the same rules block invalid changes during presubmit.

### Secondary Goals

- Provide an artifact suitable for GitHub and interview discussion.
- Create a clean basis for a short article on agentic governance and architectural linting.
- Leave room for future extensions such as GitHub PR diff mode, CODEOWNERS, risk scoring, and richer static analysis.

## Non-Goals

- This is not a full static analysis platform.
- This is not a general-purpose dependency graph engine.
- This is not an architecture inference system.
- This is not an AI architecture advisor.
- This is not a replacement for CI.
- This does not require a real company repository.
- This does not initially require GitHub authentication.
- This does not initially require external data.
- This does not try to determine semantic correctness of code changes.

## Core Thesis

MCP is appropriate for exposing architectural context to agents, but not for enforcing compliance.

The correct system shape is:

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

The agent may ignore MCP. It should not be able to ignore a failing verifier.

## Intended Audience

- Engineers evaluating MCP beyond toy examples.
- Engineering leaders thinking about agent governance.
- Developers building coding-agent harnesses.
- Interviewers or hiring managers interested in agentic developer infrastructure.
- Future maintainers using this repo as a compact demonstration of architectural linting.

## Demo Scenario

The repository contains a synthetic TypeScript monorepo representing a small fake bank/payments application.

This domain is intentionally simple and familiar. The goal is to make architectural boundaries obvious without making the demo itself look like infrastructure testing infrastructure.

Example packages:

```text
packages/
  web/
  api/
  ledger/
  auth/
  contracts/
```

Example architectural rules:

- Browser-facing code must not import ledger internals.
- API code must not import browser/UI code.
- Shared contracts must not import runtime packages.
- Auth and ledger packages may be sensitive zones with required checks.

The demo includes both compliant and violating source files.

The default repository state should pass `make presubmit`. Failing examples should live under explicit fixtures or examples so the repository remains usable as a real presubmit demonstration while still allowing an intentional failure demo.

A user or agent can run:

```bash
make presubmit
```

If architectural rules are violated, the command fails with structured output explaining:

- the violated rule
- the source file
- the disallowed import
- the reason
- suggested fixes

An MCP client can query the same policy engine to ask:

- What architecture rules apply to this file?
- Are these files compliant?
- What checks are required for this path?
- What rules exist in the repository?

## System Design

### 1. Policy Source of Truth

The policy file is the single source of truth.

Suggested location:

```text
policies/architecture.yaml
```

Example:

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

  - id: api-cannot-import-web
    from: "packages/api/**"
    disallowImports:
      - "packages/web/**"
    reason: "Server API must not depend on browser/UI code."
    suggestedFixes:
      - "Move shared logic into packages/contracts."
      - "Expose behavior through an API boundary."
    severity: error

  - id: contracts-cannot-import-runtime
    from: "packages/contracts/**"
    disallowImports:
      - "packages/web/**"
      - "packages/api/**"
      - "packages/auth/**"
      - "packages/ledger/**"
    reason: "Contracts must remain pure shared schema/types."
    suggestedFixes:
      - "Move runtime behavior out of contracts."
      - "Keep contracts limited to types and schemas."
    severity: error
```

### Policy Design Requirements

The policy format should be:

- human-readable
- stable
- easy to validate
- easy for agents to inspect
- independent of MCP
- usable by CLI, tests, and MCP server

The policy schema should support at least:

| Field | Purpose |
|---|---|
| `id` | Stable rule identifier |
| `from` | Glob for source files the rule applies to |
| `disallowImports` | List of forbidden import path globs |
| `reason` | Human-readable rationale |
| `suggestedFixes` | Allowed alternatives or repair hints |
| `severity` | `error` or `warning` |
| `requiredChecks` | Optional checks associated with the rule |
| `escalation` | Optional human-review or ownership escalation metadata |

### 2. Shared Evaluator Library

All surfaces must use the same evaluator.

Suggested internal modules:

```text
src/
  policy.ts
  analyzer.ts
  verifier.ts
  formatter.ts
```

Responsibilities:

#### `policy.ts`

- Load `architecture.yaml`.
- Validate schema.
- Normalize rule fields.
- Return typed policy objects.

#### `analyzer.ts`

- Scan TypeScript files.
- Extract import statements.
- Resolve relative imports to repo-relative paths.
- Produce dependency facts.

Example fact:

```json
{
  "fromFile": "packages/web/src/accountPage.ts",
  "importedPath": "packages/ledger/src/postTransaction.ts",
  "rawImport": "../../ledger/src/postTransaction"
}
```

#### `verifier.ts`

- Match facts against policy rules.
- Produce violations.
- Avoid formatting concerns.

Example violation:

```json
{
  "ruleId": "web-cannot-import-ledger",
  "severity": "error",
  "fromFile": "packages/web/src/accountPage.ts",
  "importedPath": "packages/ledger/src/postTransaction.ts",
  "reason": "Browser-facing code must not depend on ledger internals.",
  "suggestedFixes": [
    "Call packages/api instead.",
    "Use packages/contracts for shared types."
  ]
}
```

#### `formatter.ts`

- Format violations for CLI.
- Format JSON output.
- Format MCP responses.

### 3. CLI Surface

The CLI is the primary developer-facing interface.

Suggested commands:

```bash
archlint check
archlint check --json
archlint check --changed-only
archlint explain <file>
archlint list-rules
```

#### `archlint check`

Runs the verifier against the configured repository.

Expected behavior:

- exit `0` if no error-level violations
- exit non-zero if error-level violations exist
- print readable diagnostics

Example output:

```text
FAIL web-cannot-import-ledger

packages/web/src/accountPage.ts
  imports packages/ledger/src/postTransaction.ts

Browser-facing code must not depend on ledger internals.

Suggested fixes:
  - Call packages/api instead.
  - Use packages/contracts for shared types.
```

#### `archlint explain <file>`

Shows rules that apply to a file.

Example:

```text
Applicable rules for packages/web/src/accountPage.ts:

web-cannot-import-ledger
  Disallowed imports:
    - packages/ledger/**
  Reason:
    Browser-facing code must not depend on ledger internals.
```

### 4. Make / Presubmit Surface

The repository should include a Makefile.

Example:

```make
presubmit:
	npm test
	npm run archlint:check
```

This is the enforcement path.

The important point is that a coding agent can be required by its harness to run `make presubmit`, but the rule enforcement does not depend on the agent voluntarily querying MCP.

### 5. MCP Surface

The MCP server exposes the same policy and evaluator to agents.

MCP tools should be narrow and factual.

Recommended tools:

```text
list_architecture_rules()
explain_policy_for_file(filePath)
check_files(files[])
```

#### `list_architecture_rules`

Returns all configured rules.

#### `explain_policy_for_file(filePath)`

Returns the rules that apply to a file.

Example response:

```json
{
  "file": "packages/web/src/accountPage.ts",
  "applicableRules": [
    {
      "id": "web-cannot-import-ledger",
      "disallowedImports": ["packages/ledger/**"],
      "reason": "Browser-facing code must not depend on ledger internals.",
      "suggestedFixes": [
        "Call packages/api instead.",
        "Use packages/contracts for shared types."
      ]
    }
  ]
}
```

#### `check_files(files[])`

Runs the same verifier on a subset of files.

Example response:

```json
{
  "ok": false,
  "violations": [
    {
      "ruleId": "web-cannot-import-ledger",
      "fromFile": "packages/web/src/accountPage.ts",
      "importedPath": "packages/ledger/src/postTransaction.ts",
      "reason": "Browser-facing code must not depend on ledger internals."
    }
  ]
}
```

### MCP Non-Goals

The MCP server should not:

- design features
- generate architecture
- decide whether a semantic change is safe
- replace presubmit
- become the source of truth
- contain policy logic separate from the CLI verifier

## Demo Repository Design

The demo repository should be synthetic and intentionally small.

Recommended shape:

```text
demo-repo/
  packages/
    web/
      src/
        accountPage.ts
        accountPage.bad.ts
    api/
      src/
        accountClient.ts
        accountRoutes.ts
    ledger/
      src/
        postTransaction.ts
        balance.ts
    auth/
      src/
        session.ts
    contracts/
      src/
        account.ts
        transaction.ts
```

### Good Example

```ts
// packages/web/src/accountPage.ts
import { getAccount } from "../../api/src/accountClient";
import type { Account } from "../../contracts/src/account";
```

### Bad Example

```ts
// packages/web/src/accountPage.bad.ts
import { postTransaction } from "../../ledger/src/postTransaction";
```

The bad example should fail because browser-facing code depends directly on ledger internals.

## Testing Strategy

Test the core evaluator, not the demo theatrics.

### Unit Test Layers

1. Policy loading.
2. Import extraction.
3. Import resolution.
4. Rule matching.
5. CLI exit behavior.
6. MCP tool response shape.

### Design for Testability

Keep the evaluator pure where possible.

Recommended separation:

```text
filesystem scan → import facts
policy + import facts → violations
violations → output formatting
```

The critical evaluator function should be testable without filesystem access:

```ts
evaluatePolicy(policy, facts): Violation[]
```

## Expected User Experience

A developer should be able to clone the repo and run:

```bash
npm install
make presubmit
```

They should see an architectural violation from the canned bad example.

They should then be able to inspect the rule:

```bash
npm run archlint -- explain packages/web/src/accountPage.bad.ts
```

If using an MCP-capable client, the same policy can be queried through MCP.

## Harness Interpretation

This project does not need to implement a full agent harness.

However, the README should make the harness relationship explicit:

```text
A coding-agent harness should require make presubmit before accepting a task as complete.
The MCP server helps the agent understand constraints earlier, but the verifier is the non-optional enforcement point.
```

## Design Constraints

- Prefer boring implementation.
- Prefer explicit canned examples over complex real repositories.
- Avoid dependency graph rabbit holes.
- Avoid language-server complexity.
- Avoid symbol-level analysis in the initial design.
- Do not depend on GitHub authentication.
- Do not require Docker.
- Keep setup local and fast.
- Make behavior obvious from source files and policy.

## Suggested Technology Stack

- TypeScript
- Node.js
- MCP TypeScript SDK
- YAML parser
- glob matcher
- Vitest or Jest
- simple regex or parser-based import extraction

## Design Decisions

The following decisions are fixed for the initial design:

1. The default repository state should pass `make presubmit`.
2. Failing examples should live under explicit fixtures or demo commands.
3. The demo domain should be a fake bank/payments system.
4. The policy schema should include escalation metadata, even if the first implementation only preserves and displays it.
5. The shared evaluator should be stabilized before MCP is implemented.

## Remaining Open Design Questions

These still need owner decisions before implementation:

1. Should `archlint check` default to checking the whole demo repo, or should the repo path be explicit?
2. Should rules be path-only initially, or include package-level aliases?
3. Should the CLI support `--changed-only` in the first version, or defer it?
4. Should the demo article emphasize MCP, architectural linting, or coding-agent harnesses?
5. Should failing examples live under `fixtures/failing`, `examples/failing`, or a second demo repo such as `demo-repo-failing`?

## Success Criteria

## Implementation Ordering Constraint

Although this PRD focuses on design, one sequencing constraint is part of the design:

> Stabilize the shared evaluator before implementing the MCP server.

The MCP server must be an adapter over a working evaluator, not a parallel implementation path.

## Success Criteria

The project succeeds if it clearly demonstrates:

- architectural rules exist outside prompts
- the same rules are visible through MCP and enforced by CLI
- invalid dependencies fail deterministically
- the system is easy to run locally
- the demo can be understood in under five minutes
- the implementation is small enough to inspect
- the design connects naturally to agent governance and architectural linting
