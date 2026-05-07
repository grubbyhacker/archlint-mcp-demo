import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeRepo, extractImportSpecifiers, resolveRelativeImport } from "../src/analyzer.js";

describe("analyzer", () => {
  it("extracts static import and export specifiers", () => {
    expect(
      extractImportSpecifiers(`
import { a } from "./a";
import type { B } from "./b";
import "./sideEffect";
export { c } from "./c";
export type { D } from "./d";
`)
    ).toEqual(["./a", "./b", "./sideEffect", "./c", "./d"]);
  });

  it("resolves relative imports to repo-relative paths", () => {
    const repoRoot = path.resolve("demo-repo");
    const fromFile = path.resolve("demo-repo/packages/web/src/accountPage.ts");

    expect(resolveRelativeImport(repoRoot, fromFile, "../../api/src/accountClient")).toBe(
      "packages/api/src/accountClient.ts"
    );
  });

  it("analyzes the default demo repo imports", () => {
    const facts = analyzeRepo("demo-repo");

    expect(facts).toContainEqual({
      fromFile: "packages/web/src/accountPage.ts",
      importedPath: "packages/api/src/accountClient.ts",
      rawImport: "../../api/src/accountClient"
    });
  });
});
