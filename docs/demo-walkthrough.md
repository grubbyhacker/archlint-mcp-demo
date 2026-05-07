# Demo Walkthrough

The demo repository is a synthetic bank/payments TypeScript monorepo. It is small enough to understand quickly, but realistic enough to make architectural boundaries intuitive.

```text
demo-repo/
  packages/
    web/
    api/
    ledger/
    auth/
    contracts/
```

The passing repo lives under `demo-repo/`. Intentional violations live under `fixtures/failing/` so the default repository can pass `make presubmit`.

## Architecture Rules

The current policy declares three rules:

```bash
npm run archlint -- list-rules
```

```text
web-cannot-import-ledger (error)
  From: packages/web/**
  Disallows: packages/ledger/**
  Reason: Browser-facing code must not depend on ledger internals.
  Required checks: npm test, npm run archlint:check
  Escalation: platform, security

api-cannot-import-web (error)
  From: packages/api/**
  Disallows: packages/web/**
  Reason: Server API must not depend on browser/UI code.

contracts-cannot-import-runtime (error)
  From: packages/contracts/**
  Disallows: packages/web/**, packages/api/**, packages/auth/**, packages/ledger/**
  Reason: Contracts must remain pure shared schema/types.
```

These are deliberately path-based. The point is not to infer architecture from code. The point is to encode explicit architecture rules and run them deterministically.

## Passing Check

The default check targets `demo-repo/`:

```bash
npm run archlint -- check
```

Expected output:

```text
PASS no architectural violations found
```

The JSON form is useful for tools and agents:

```bash
npm run archlint -- check --json
```

```json
{
  "ok": true,
  "violations": []
}
```

## Explaining a File

Before changing browser-facing code, a developer or agent can ask which rules apply:

```bash
npm run archlint -- explain demo-repo/packages/web/src/accountPage.ts --repo demo-repo
```

```text
Applicable rules for packages/web/src/accountPage.ts:

web-cannot-import-ledger
  Disallowed imports:
    - packages/ledger/**
  Reason:
    Browser-facing code must not depend on ledger internals.
  Suggested fixes:
    - Call packages/api instead.
    - Use packages/contracts for shared types.
```

The important behavior is not the prose. It is that the explanation is produced from the same policy file used by the failing verifier.

## Intentional Failures

The failing fixture demonstrates what happens when code violates the rules:

```bash
npm run archlint -- check --repo fixtures/failing
```

```text
FAIL api-cannot-import-web

packages/api/src/serverImportsWeb.bad.ts
  imports packages/web/src/accountPage.ts

Server API must not depend on browser/UI code.

Suggested fixes:
  - Move shared logic into packages/contracts.
  - Expose behavior through an API boundary.

FAIL contracts-cannot-import-runtime

packages/contracts/src/runtimeImport.bad.ts
  imports packages/auth/src/session.ts

Contracts must remain pure shared schema/types.

Suggested fixes:
  - Move runtime behavior out of contracts.
  - Keep contracts limited to types and schemas.

FAIL web-cannot-import-ledger

packages/web/src/accountPage.bad.ts
  imports packages/ledger/src/postTransaction.ts

Browser-facing code must not depend on ledger internals.

Suggested fixes:
  - Call packages/api instead.
  - Use packages/contracts for shared types.
```

The command exits non-zero because these are error-level violations. That exit code is the enforcement behavior.

## What the Demo Is Showing

The same rule appears in three places without being duplicated:

- As policy in `policies/architecture.yaml`.
- As guidance through `archlint explain` and MCP tools.
- As a blocking check through `archlint check`, `make presubmit`, and CI.

That is the core pattern. Agents get early, structured context. The repository still gets deterministic enforcement.
