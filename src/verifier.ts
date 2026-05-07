import { matchesGlob } from "./policy.js";
import type { ImportFact, Policy, Violation } from "./types.js";

export function evaluatePolicy(policy: Policy, facts: ImportFact[]): Violation[] {
  const violations: Violation[] = [];

  for (const fact of facts) {
    for (const rule of policy.rules) {
      if (!matchesGlob(fact.fromFile, rule.from)) {
        continue;
      }

      const violatesRule = rule.disallowImports.some((pattern) => matchesGlob(fact.importedPath, pattern));
      if (!violatesRule) {
        continue;
      }

      violations.push({
        ruleId: rule.id,
        severity: rule.severity,
        fromFile: fact.fromFile,
        importedPath: fact.importedPath,
        reason: rule.reason,
        suggestedFixes: [...rule.suggestedFixes]
      });
    }
  }

  return violations;
}

export function hasErrorViolations(violations: Violation[]): boolean {
  return violations.some((violation) => violation.severity === "error");
}
