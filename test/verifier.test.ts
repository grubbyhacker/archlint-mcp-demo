import { describe, expect, it } from "vitest";
import type { Policy } from "../src/types.js";
import { evaluatePolicy, hasErrorViolations } from "../src/verifier.js";

const policy: Policy = {
  rules: [
    {
      id: "web-cannot-import-ledger",
      from: "packages/web/**",
      disallowImports: ["packages/ledger/**"],
      reason: "Browser-facing code must not depend on ledger internals.",
      suggestedFixes: ["Call packages/api instead."],
      severity: "error",
      requiredChecks: []
    },
    {
      id: "contracts-cannot-import-runtime",
      from: "packages/contracts/**",
      disallowImports: ["packages/web/**", "packages/api/**", "packages/auth/**", "packages/ledger/**"],
      reason: "Contracts must remain pure shared schema/types.",
      suggestedFixes: ["Keep contracts limited to types and schemas."],
      severity: "error",
      requiredChecks: []
    }
  ]
};

describe("evaluatePolicy", () => {
  it("reports web importing ledger as an error", () => {
    const violations = evaluatePolicy(policy, [
      {
        fromFile: "packages/web/src/accountPage.bad.ts",
        importedPath: "packages/ledger/src/postTransaction.ts",
        rawImport: "../../ledger/src/postTransaction"
      }
    ]);

    expect(violations).toEqual([
      {
        ruleId: "web-cannot-import-ledger",
        severity: "error",
        fromFile: "packages/web/src/accountPage.bad.ts",
        importedPath: "packages/ledger/src/postTransaction.ts",
        reason: "Browser-facing code must not depend on ledger internals.",
        suggestedFixes: ["Call packages/api instead."]
      }
    ]);
    expect(hasErrorViolations(violations)).toBe(true);
  });

  it("allows web importing api", () => {
    const violations = evaluatePolicy(policy, [
      {
        fromFile: "packages/web/src/accountPage.ts",
        importedPath: "packages/api/src/accountClient.ts",
        rawImport: "../../api/src/accountClient"
      }
    ]);

    expect(violations).toEqual([]);
    expect(hasErrorViolations(violations)).toBe(false);
  });

  it("reports contracts importing runtime code", () => {
    const violations = evaluatePolicy(policy, [
      {
        fromFile: "packages/contracts/src/runtimeImport.bad.ts",
        importedPath: "packages/auth/src/session.ts",
        rawImport: "../../auth/src/session"
      }
    ]);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.ruleId).toBe("contracts-cannot-import-runtime");
  });
});
