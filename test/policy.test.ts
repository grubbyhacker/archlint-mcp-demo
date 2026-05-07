import { describe, expect, it } from "vitest";
import { getApplicableRules, parsePolicy } from "../src/policy.js";

describe("policy", () => {
  it("loads rules with optional metadata preserved", () => {
    const policy = parsePolicy(`
rules:
  - id: web-cannot-import-ledger
    from: "packages/web/**"
    disallowImports:
      - "packages/ledger/**"
    reason: "Browser-facing code must not depend on ledger internals."
    suggestedFixes:
      - "Call packages/api instead."
    severity: error
    requiredChecks:
      - "npm test"
    escalation:
      required: true
      reviewGroups:
        - platform
      reason: "Needs review."
`);

    expect(policy.rules[0]).toMatchObject({
      id: "web-cannot-import-ledger",
      requiredChecks: ["npm test"],
      escalation: {
        required: true,
        reviewGroups: ["platform"],
        reason: "Needs review."
      }
    });
  });

  it("rejects invalid policy shape", () => {
    expect(() => parsePolicy("rules: []")).toThrow();
  });

  it("returns applicable rules for a file", () => {
    const policy = parsePolicy(`
rules:
  - id: web-cannot-import-ledger
    from: "packages/web/**"
    disallowImports:
      - "packages/ledger/**"
    reason: "Browser-facing code must not depend on ledger internals."
    severity: error
`);

    expect(getApplicableRules(policy, "packages/web/src/accountPage.ts")).toHaveLength(1);
    expect(getApplicableRules(policy, "packages/api/src/accountRoutes.ts")).toHaveLength(0);
  });
});
