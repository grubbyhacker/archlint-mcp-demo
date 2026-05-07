import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { parseTextPayload } from "./mcpClient.js";

const execFileAsync = promisify(execFile);
const codexBin = await findCodex();

describe.skipIf(!codexBin)("codex CLI MCP integration", () => {
  it("registers archlint as a Codex MCP server and launches the configured command", async () => {
    if (!codexBin) {
      throw new Error("codex executable was not found");
    }

    const codexHome = await fs.mkdtemp(path.join(os.tmpdir(), "archlint-codex-home-"));
    try {
      const env = { ...process.env, CODEX_HOME: codexHome };

      await execFileAsync(codexBin, ["mcp", "add", "archlint", "--", process.execPath, "dist/src/mcp.js"], {
        cwd: process.cwd(),
        env
      });

      const { stdout } = await execFileAsync(codexBin, ["mcp", "list"], {
        cwd: process.cwd(),
        env
      });

      expect(stdout).toContain("archlint");
      expect(stdout).toContain("dist/src/mcp.js");
      expect(stdout).toContain("enabled");

      const config = await fs.readFile(path.join(codexHome, "config.toml"), "utf8");
      const registeredServer = parseArchlintServerConfig(config);

      expect(registeredServer.command).toBe(process.execPath);
      expect(registeredServer.args).toEqual(["dist/src/mcp.js"]);

      const client = new Client({ name: "archlint-codex-config-test", version: "0.1.0" });
      const transport = new StdioClientTransport({
        command: registeredServer.command,
        args: registeredServer.args,
        cwd: process.cwd(),
        stderr: "pipe"
      });

      try {
        await client.connect(transport);
        const result = await client.callTool({ name: "list_architecture_rules", arguments: {} });
        const payload = parseTextPayload<{ rules: Array<{ id: string }> }>(result);

        expect(payload.rules.map((rule) => rule.id)).toContain("web-cannot-import-ledger");
      } finally {
        await client.close();
      }
    } finally {
      await fs.rm(codexHome, { recursive: true, force: true });
    }
  });
});

async function findCodex(): Promise<string | undefined> {
  try {
    await execFileAsync("codex", ["--version"]);
    return "codex";
  } catch {
    return undefined;
  }
}

function parseArchlintServerConfig(config: string): { command: string; args: string[] } {
  const sectionMatch = config.match(/\[mcp_servers\.archlint\]([\s\S]*?)(?:\n\[|$)/);
  if (!sectionMatch) {
    throw new Error("Expected [mcp_servers.archlint] in Codex config");
  }

  const section = sectionMatch[1] ?? "";
  const commandMatch = section.match(/^command = "([^"]+)"$/m);
  const argsMatch = section.match(/^args = \[(.*)\]$/m);

  if (!commandMatch || !argsMatch) {
    throw new Error("Expected command and args in Codex MCP config");
  }

  const args = [...argsMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);

  return {
    command: commandMatch[1],
    args
  };
}
