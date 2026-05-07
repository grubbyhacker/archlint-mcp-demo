#!/usr/bin/env node
import path from "node:path";
import { Command } from "commander";
import { formatExplanation, formatRules, formatViolations } from "./formatter.js";
import { normalizeRepoPath } from "./paths.js";
import { checkRepository, explainFile, listRules } from "./service.js";

export async function runCli(argv: string[]): Promise<number> {
  const program = new Command();
  let exitCode = 0;

  program
    .name("archlint")
    .description("Small architecture policy verifier")
    .exitOverride();

  program
    .command("check")
    .option("--json", "print machine-readable JSON")
    .option("--repo <path>", "repository root to check", "demo-repo")
    .action((options: { json?: boolean; repo: string }) => {
      const result = checkRepository({ repo: options.repo });
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(formatViolations(result.violations));
      }
      exitCode = result.ok ? 0 : 1;
    });

  program
    .command("explain")
    .argument("<file>", "repo-relative file path")
    .option("--repo <path>", "repository root for path normalization", "demo-repo")
    .action((file: string, options: { repo: string }) => {
      const normalizedFile = normalizeExplainPath(file, options.repo);
      console.log(formatExplanation(normalizedFile, explainFile(normalizedFile)));
    });

  program.command("list-rules").action(() => {
    console.log(formatRules(listRules()));
  });

  try {
    await program.parseAsync(argv, { from: "user" });
  } catch (error) {
    if (isCommanderError(error)) {
      return error.exitCode;
    }
    throw error;
  }

  return exitCode;
}

function isCommanderError(error: unknown): error is { exitCode: number } {
  return typeof error === "object" && error !== null && "exitCode" in error;
}

function normalizeExplainPath(file: string, repo: string): string {
  const repoRoot = path.resolve(repo);
  const absoluteFile = path.isAbsolute(file) ? file : path.resolve(file);
  const normalizedInput = normalizeRepoPath(file);

  if (absoluteFile.startsWith(`${repoRoot}${path.sep}`)) {
    return normalizeRepoPath(path.relative(repoRoot, absoluteFile));
  }

  const repoPrefix = `${normalizeRepoPath(repo)}/`;
  if (normalizedInput.startsWith(repoPrefix)) {
    return normalizedInput.slice(repoPrefix.length);
  }

  return normalizedInput;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
