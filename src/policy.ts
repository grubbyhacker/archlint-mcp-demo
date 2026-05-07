import fs from "node:fs";
import path from "node:path";
import { minimatch } from "minimatch";
import YAML from "yaml";
import { z } from "zod";
import type { Policy, PolicyRule } from "./types.js";

const severitySchema = z.enum(["error", "warning"]);

const escalationSchema = z.object({
  required: z.boolean(),
  reviewGroups: z.array(z.string()).default([]),
  reason: z.string()
});

const ruleSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  disallowImports: z.array(z.string().min(1)).min(1),
  reason: z.string().min(1),
  suggestedFixes: z.array(z.string()).default([]),
  severity: severitySchema,
  requiredChecks: z.array(z.string()).default([]),
  escalation: escalationSchema.optional()
});

const policySchema = z.object({
  rules: z.array(ruleSchema).min(1)
});

export function parsePolicy(source: string): Policy {
  const raw = YAML.parse(source);
  const parsed = policySchema.parse(raw);

  return {
    rules: parsed.rules.map((rule): PolicyRule => ({
      ...rule,
      suggestedFixes: [...rule.suggestedFixes],
      requiredChecks: [...rule.requiredChecks],
      escalation: rule.escalation
        ? {
            ...rule.escalation,
            reviewGroups: [...rule.escalation.reviewGroups]
          }
        : undefined
    }))
  };
}

export function loadPolicy(policyPath = path.resolve("policies/architecture.yaml")): Policy {
  return parsePolicy(fs.readFileSync(policyPath, "utf8"));
}

export function getApplicableRules(policy: Policy, filePath: string): PolicyRule[] {
  return policy.rules.filter((rule) => matchesGlob(filePath, rule.from));
}

export function matchesGlob(filePath: string, pattern: string): boolean {
  return minimatch(filePath, pattern, { dot: true });
}
