import path from "node:path";
import { analyzeRepo } from "./analyzer.js";
import { getApplicableRules, loadPolicy } from "./policy.js";
import { evaluatePolicy, hasErrorViolations } from "./verifier.js";
import type { PolicyRule, Violation } from "./types.js";

export type CheckResult = {
  ok: boolean;
  violations: Violation[];
};

export function checkRepository(options: { repo?: string; files?: string[] } = {}): CheckResult {
  const repo = options.repo ?? "demo-repo";
  const repoRoot = path.resolve(repo);
  const policy = loadPolicy();
  const facts = analyzeRepo(repoRoot, options.files);
  const violations = evaluatePolicy(policy, facts);
  return {
    ok: !hasErrorViolations(violations),
    violations
  };
}

export function listRules(): PolicyRule[] {
  return loadPolicy().rules;
}

export function explainFile(filePath: string): PolicyRule[] {
  const policy = loadPolicy();
  return getApplicableRules(policy, filePath);
}
