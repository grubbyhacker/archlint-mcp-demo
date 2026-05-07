import { afterEach, describe, expect, it, vi } from "vitest";
import { runCli } from "../src/cli.js";

describe("cli", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exits zero for the default passing demo repo", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);

    await expect(runCli(["check"])).resolves.toBe(0);
  });

  it("exits non-zero for failing fixtures", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);

    await expect(runCli(["check", "--repo", "fixtures/failing"])).resolves.toBe(1);
  });

  it("prints parseable JSON", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await expect(runCli(["check", "--json"])).resolves.toBe(0);

    const output = log.mock.calls[0]?.[0];
    expect(JSON.parse(String(output))).toEqual({ ok: true, violations: [] });
  });

  it("explains applicable rules for a file", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await expect(runCli(["explain", "packages/web/src/accountPage.ts"])).resolves.toBe(0);

    expect(String(log.mock.calls[0]?.[0])).toContain("web-cannot-import-ledger");
  });

  it("normalizes explain paths against an explicit repo", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await expect(runCli(["explain", "demo-repo/packages/web/src/accountPage.ts", "--repo", "demo-repo"])).resolves.toBe(0);

    expect(String(log.mock.calls[0]?.[0])).toContain("Applicable rules for packages/web/src/accountPage.ts");
  });
});
