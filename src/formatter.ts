import type { PolicyRule, Violation } from "./types.js";

export function formatViolations(violations: Violation[]): string {
  if (violations.length === 0) {
    return "PASS no architectural violations found";
  }

  return violations.map(formatViolation).join("\n\n");
}

export function formatViolation(violation: Violation): string {
  const lines = [
    `FAIL ${violation.ruleId}`,
    "",
    `${violation.fromFile}`,
    `  imports ${violation.importedPath}`,
    "",
    violation.reason
  ];

  if (violation.suggestedFixes.length) {
    lines.push("", "Suggested fixes:", ...violation.suggestedFixes.map((fix) => `  - ${fix}`));
  }

  return lines.join("\n");
}

export function formatRules(rules: PolicyRule[]): string {
  return rules
    .map((rule) => {
      const checks = rule.requiredChecks.length ? `\n  Required checks: ${rule.requiredChecks.join(", ")}` : "";
      const escalation = rule.escalation?.required
        ? `\n  Escalation: ${rule.escalation.reviewGroups.join(", ")}`
        : "";
      return `${rule.id} (${rule.severity})\n  From: ${rule.from}\n  Disallows: ${rule.disallowImports.join(", ")}\n  Reason: ${rule.reason}${checks}${escalation}`;
    })
    .join("\n\n");
}

export function formatExplanation(filePath: string, rules: PolicyRule[]): string {
  if (rules.length === 0) {
    return `No architecture rules apply to ${filePath}`;
  }

  const body = rules
    .map((rule) => {
      const fixes = rule.suggestedFixes.length
        ? `\n  Suggested fixes:\n${rule.suggestedFixes.map((fix) => `    - ${fix}`).join("\n")}`
        : "";
      return `${rule.id}\n  Disallowed imports:\n${rule.disallowImports.map((pattern) => `    - ${pattern}`).join("\n")}\n  Reason:\n    ${rule.reason}${fixes}`;
    })
    .join("\n\n");

  return `Applicable rules for ${filePath}:\n\n${body}`;
}
