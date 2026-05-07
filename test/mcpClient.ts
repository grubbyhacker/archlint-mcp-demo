import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export async function connectMcpClient(args: string[], cwd = process.cwd()): Promise<{ client: Client }> {
  const client = new Client({ name: "archlint-test-client", version: "0.1.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args,
    cwd,
    stderr: "pipe"
  });

  await client.connect(transport);
  return { client };
}

export function parseTextPayload<T>(result: unknown): T {
  if (!isObject(result) || !("content" in result) || !Array.isArray(result.content)) {
    throw new Error("Expected MCP tool result content");
  }

  const textContent = result.content.find(
    (content): content is { type: "text"; text: string } =>
      isObject(content) && content.type === "text" && typeof content.text === "string"
  );
  if (!textContent) {
    throw new Error("Expected MCP text content");
  }

  return JSON.parse(textContent.text) as T;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
