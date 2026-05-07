export type Severity = "error" | "warning";

export type Escalation = {
  required: boolean;
  reviewGroups: string[];
  reason: string;
};

export type PolicyRule = {
  id: string;
  from: string;
  disallowImports: string[];
  reason: string;
  suggestedFixes: string[];
  severity: Severity;
  requiredChecks: string[];
  escalation?: Escalation;
};

export type Policy = {
  rules: PolicyRule[];
};

export type ImportFact = {
  fromFile: string;
  importedPath: string;
  rawImport: string;
};

export type Violation = {
  ruleId: string;
  severity: Severity;
  fromFile: string;
  importedPath: string;
  reason: string;
  suggestedFixes: string[];
};
