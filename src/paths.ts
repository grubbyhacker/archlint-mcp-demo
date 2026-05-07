import path from "node:path";

export function toPosixPath(value: string): string {
  return value.replace(/\\/g, "/");
}

export function normalizeRepoPath(value: string): string {
  return toPosixPath(path.normalize(value)).replace(/^\.\//, "");
}

export function relativeRepoPath(repoRoot: string, absolutePath: string): string {
  return normalizeRepoPath(path.relative(repoRoot, absolutePath));
}
