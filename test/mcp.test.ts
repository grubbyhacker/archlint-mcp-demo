import { describe, expect, it } from "vitest";
import { createArchlintMcpServer } from "../src/mcp.js";

describe("mcp", () => {
  it("creates the MCP server adapter", () => {
    expect(createArchlintMcpServer()).toBeTruthy();
  });
});
