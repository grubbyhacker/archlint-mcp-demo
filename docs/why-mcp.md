# Why MCP Instead of Just a CLI?

The strongest version of this debate is not about enforcement. In this repository, enforcement belongs to the CLI, Makefile, and CI path. The question is narrower:

> Why is MCP a useful way to give coding agents early and frequent architectural guidance if a CLI can expose the same checks?

The answer is that MCP is not more authoritative than a CLI. It is a better interface fit for tool-mediated model workflows.

```text
CLI: optimized for humans, terminals, scripts, and hard gates.
MCP: optimized for agents, typed tool calls, discovery, and repeated context lookup.
```

The architectural rule remains the same either way. The difference is how naturally the agent can find, call, and use the guidance while it is still planning and editing.

## The Position

Use the CLI for enforcement and human reproducibility. Use MCP for agent-native, frequent, structured policy lookup.

Another way to say it:

> The CLI is the executable contract. MCP is the agent-facing affordance over that contract.

This is why the repo exposes both. The CLI must be sufficient. MCP is useful because it makes the same policy engine easier for agents and harnesses to use early.

## 1. Tool Discovery

An MCP client can discover available tools, descriptions, and input schemas. The agent can see that this repo exposes:

- `list_architecture_rules`
- `explain_policy_for_file`
- `check_files`

With a CLI, the agent has to discover or remember command names, npm script conventions, flags, repo path defaults, and JSON modes. That is workable, but it is more accidental.

MCP turns architecture lookup into an advertised capability instead of a command recipe hidden in documentation.

## 2. Structured Invocation

MCP tools have typed inputs:

```json
{
  "filePath": "packages/web/src/accountPage.ts"
}
```

The equivalent CLI call is stringly command construction:

```bash
npm run archlint -- explain demo-repo/packages/web/src/accountPage.ts --repo demo-repo
```

Agents can handle shell commands, but typed tool calls remove incidental syntax. The model does not need to choose flag order, quote paths, remember `--repo`, or decide whether the input path should be repo-relative or workspace-relative.

## 3. Structured Outputs

MCP responses are naturally machine-consumable. CLI output has to balance readable terminal diagnostics with parseable JSON.

This project already supports JSON output for checks, which is good. But if a CLI becomes the agent API, it tends to grow more flags and output modes. MCP gives the agent-facing interface a first-class structure without compromising the human CLI.

## 4. Lower Friction for Frequent Calls

Early architectural guidance is most valuable when it is frequent:

- before planning a change
- after choosing files
- after writing imports
- after modifying a sensitive package
- before final presubmit

CLI calls can support that loop, but they are external process probes. MCP tools are designed to be called repeatedly inside the agent's normal tool loop.

That matters because architectural guidance should not be a one-time preflight. It should be available whenever the agent's local implementation choices change.

## 5. Better Harness Integration

A coding-agent harness can expose MCP tools as native capabilities alongside filesystem, search, GitHub, browser, and other tools. It can also decide when to encourage or automatically trigger policy lookup.

With only a CLI, the harness usually gives the agent shell access and hopes the agent chooses the right command. That may be enough for strong agents, but it is less direct.

MCP lets the harness say, in effect: this workspace has an architecture policy interface, and here are the exact operations it supports.

## 6. Semantic Names Beat Command Recipes

`check_files` is an intent-level operation.

```json
{
  "repo": "demo-repo",
  "files": ["packages/web/src/accountPage.ts"]
}
```

The shell equivalent encodes more implementation detail:

```bash
npm run archlint -- check --repo demo-repo --json
```

That difference is small in a demo. It becomes more important as the surrounding harness grows. Agents work better when tools express the thing to do, not just the command to run.

## 7. Capability Scoping

MCP can expose a narrow, safe architecture interface:

- list rules
- explain rules for a file
- check selected files

That is much narrower than arbitrary shell access. In many coding environments the agent will still have shell access, but MCP lets a harness provide policy guidance even when it wants to restrict command execution.

This repo keeps the tools factual on purpose. There is no `design_feature`, `assess_risk`, or `approve_change` tool. MCP exposes the policy engine; it does not replace engineering judgment or enforcement.

## 8. Cross-Agent Portability

Different agents and IDEs can use the same MCP tools without learning this repo's npm scripts or CLI conventions.

The CLI remains the durable local contract:

```bash
make presubmit
```

MCP provides a standard integration surface for agent-facing guidance. That makes the same architectural policy available across tools without turning every harness integration into a custom shell recipe.

## The Fair Counterargument

If the coding agent already has shell access, strong command-following, and the CLI has JSON output, MCP is not strictly necessary.

That is an important concession. This repo should not claim that MCP is required for correctness. It is not. Correctness comes from the shared evaluator and the hard check path.

The case for MCP is about usefulness and interface quality:

- easier discovery
- cleaner invocation
- structured output
- frequent use inside the agent loop
- better harness integration
- narrower capabilities than shell
- portability across agent clients

## The Practical Rule

Do not build an MCP-only architecture system. Build a deterministic policy engine first, expose it through a CLI, enforce it through Make/CI, and then add MCP as the agent-native interface.

In short:

> MCP helps agents comply early. The CLI proves whether they complied.
