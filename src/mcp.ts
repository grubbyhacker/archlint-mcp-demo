#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { checkRepository, explainFile, listRules } from "./service.js";

export function createArchlintMcpServer(): McpServer {
  const server = new McpServer({
    name: "archlint-mcp-demo",
    version: "0.1.0"
  });

  server.tool("list_architecture_rules", "List configured architecture rules.", {}, async () => ({
    content: [{ type: "text", text: JSON.stringify({ rules: listRules() }, null, 2) }]
  }));

  server.tool(
    "explain_policy_for_file",
    "Return architecture rules that apply to a repo-relative file path.",
    { filePath: z.string() },
    async ({ filePath }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify({ file: filePath, applicableRules: explainFile(filePath) }, null, 2)
        }
      ]
    })
  );

  server.tool(
    "check_files",
    "Check selected repo-relative files using the shared architecture evaluator.",
    { repo: z.string().default("demo-repo"), files: z.array(z.string()) },
    async ({ repo, files }) => ({
      content: [{ type: "text", text: JSON.stringify(checkRepository({ repo, files }), null, 2) }]
    })
  );

  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createArchlintMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
