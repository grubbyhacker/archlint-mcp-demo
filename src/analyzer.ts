import fs from "node:fs";
import path from "node:path";
import { normalizeRepoPath, relativeRepoPath } from "./paths.js";
import type { ImportFact } from "./types.js";

const IMPORT_PATTERN =
  /\bimport\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?["']([^"']+)["']|\bexport\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)["']([^"']+)["']/g;

export function extractImportSpecifiers(source: string): string[] {
  const imports: string[] = [];
  for (const match of source.matchAll(IMPORT_PATTERN)) {
    const specifier = match[1] ?? match[2];
    if (specifier) {
      imports.push(specifier);
    }
  }
  return imports;
}

export function analyzeRepo(repoRoot: string, files?: string[]): ImportFact[] {
  const absoluteRoot = path.resolve(repoRoot);
  const sourceFiles = files
    ? files.map((file) => path.resolve(absoluteRoot, file))
    : listTypeScriptFiles(absoluteRoot);

  return sourceFiles.flatMap((file) => analyzeFile(absoluteRoot, file));
}

export function analyzeFile(repoRoot: string, absoluteFilePath: string): ImportFact[] {
  const source = fs.readFileSync(absoluteFilePath, "utf8");
  const fromFile = relativeRepoPath(repoRoot, absoluteFilePath);

  return extractImportSpecifiers(source)
    .filter((specifier) => specifier.startsWith("."))
    .map((specifier): ImportFact => {
      const importedPath = resolveRelativeImport(repoRoot, absoluteFilePath, specifier);
      return {
        fromFile,
        importedPath,
        rawImport: specifier
      };
    });
}

export function resolveRelativeImport(repoRoot: string, fromAbsoluteFile: string, specifier: string): string {
  const absoluteImportBase = path.resolve(path.dirname(fromAbsoluteFile), specifier);
  const resolved = resolveTypeScriptPath(absoluteImportBase);
  return normalizeRepoPath(path.relative(repoRoot, resolved));
}

function resolveTypeScriptPath(absoluteImportBase: string): string {
  const candidates = [
    absoluteImportBase,
    `${absoluteImportBase}.ts`,
    `${absoluteImportBase}.tsx`,
    path.join(absoluteImportBase, "index.ts"),
    path.join(absoluteImportBase, "index.tsx")
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? `${absoluteImportBase}.ts`;
}

function listTypeScriptFiles(root: string): string[] {
  const entries = fs.readdirSync(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist") {
      continue;
    }

    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...listTypeScriptFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      files.push(fullPath);
    }
  }

  return files.sort();
}
