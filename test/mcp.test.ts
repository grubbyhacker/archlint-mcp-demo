import { describe, expect, it } from "vitest";
import { createArchlintMcpServer } from "../src/mcp.js";
import { connectMcpClient, parseTextPayload } from "./mcpClient.js";

describe("mcp", () => {
  it("creates the MCP server adapter", () => {
    expect(createArchlintMcpServer()).toBeTruthy();
  });
});

describe("mcp stdio protocol", () => {
  it("exposes the expected narrow architecture tools", async () => {
    const { client } = await connectMcpClient(["dist/src/mcp.js"]);
    try {
      const tools = await client.listTools();

      expect(tools.tools.map((tool) => tool.name).sort()).toEqual([
        "check_files",
        "explain_policy_for_file",
        "list_architecture_rules"
      ]);
    } finally {
      await client.close();
    }
  });

  it("lists architecture rules through the protocol", async () => {
    const { client } = await connectMcpClient(["dist/src/mcp.js"]);
    try {
      const result = await client.callTool({ name: "list_architecture_rules", arguments: {} });
      const payload = parseTextPayload<{ rules: Array<{ id: string }> }>(result);

      expect(payload.rules.map((rule) => rule.id)).toContain("web-cannot-import-ledger");
      expect(payload.rules.map((rule) => rule.id)).toContain("contracts-cannot-import-runtime");
    } finally {
      await client.close();
    }
  });

  it("explains policy for a repo-relative file through the protocol", async () => {
    const { client } = await connectMcpClient(["dist/src/mcp.js"]);
    try {
      const result = await client.callTool({
        name: "explain_policy_for_file",
        arguments: { filePath: "packages/web/src/accountPage.ts" }
      });
      const payload = parseTextPayload<{ file: string; applicableRules: Array<{ id: string }> }>(result);

      expect(payload.file).toBe("packages/web/src/accountPage.ts");
      expect(payload.applicableRules.map((rule) => rule.id)).toContain("web-cannot-import-ledger");
    } finally {
      await client.close();
    }
  });

  it("checks passing and failing files through the shared evaluator", async () => {
    const { client } = await connectMcpClient(["dist/src/mcp.js"]);
    try {
      const passingResult = await client.callTool({
        name: "check_files",
        arguments: { repo: "demo-repo", files: ["packages/web/src/accountPage.ts"] }
      });
      const passingPayload = parseTextPayload<{ ok: boolean; violations: unknown[] }>(passingResult);

      expect(passingPayload).toEqual({ ok: true, violations: [] });

      const failingResult = await client.callTool({
        name: "check_files",
        arguments: { repo: "fixtures/failing", files: ["packages/web/src/accountPage.bad.ts"] }
      });
      const failingPayload = parseTextPayload<{
        ok: boolean;
        violations: Array<{ ruleId: string; severity: string; fromFile: string }>;
      }>(failingResult);

      expect(failingPayload.ok).toBe(false);
      expect(failingPayload.violations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId: "web-cannot-import-ledger",
            severity: "error",
            fromFile: "packages/web/src/accountPage.bad.ts"
          })
        ])
      );
    } finally {
      await client.close();
    }
  });
});
