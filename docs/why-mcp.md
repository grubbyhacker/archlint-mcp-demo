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

## What the MCP Server Is Here

In this repository, the MCP "server" is not a web server and does not listen on a port. It is a Node.js process that speaks the MCP protocol over standard input and standard output.

```text
MCP client / coding-agent harness
        |
        | starts a child process
        v
node dist/src/mcp.js
        |
        | JSON-RPC messages over stdin/stdout
        v
Archlint MCP tool handlers
        |
        v
shared policy/evaluator code
```

The TypeScript source is `src/mcp.ts`. After build, it becomes `dist/src/mcp.js`. Running `npm run mcp` builds the project and starts that JavaScript file with Node.

The process registers three MCP tools:

- `list_architecture_rules`
- `explain_policy_for_file`
- `check_files`

Then it connects those tools to a stdio transport. In practical terms, the MCP client writes protocol messages to the process's stdin, and the process writes protocol responses to stdout.

That makes it a server in the protocol sense: it serves tool capabilities to an MCP client. It is not a server in the traditional web-service sense. A more literal name would be "MCP tool provider process", but the ecosystem calls this a server.

## Process Lifetime

The local stdio MCP server is session-scoped.

Compared with a CLI:

```text
CLI:
  process starts per command
  does one thing
  exits

stdio MCP:
  process starts per MCP session
  handles many tool calls
  exits when the client closes the session
```

So the local MCP process is longer-lived than one CLI invocation, but shorter-lived than a daemon or hosted service. The client usually starts it when the agent session begins, keeps it available for repeated tool calls, and tears it down when the session ends.

That lifespan matches this repo's use case. The MCP server is just an adapter over local files and local TypeScript code. It does not need to be reachable by other users, coordinate across repositories, or retain state across agent sessions.

## How the Bits Flow

For `explain_policy_for_file`, the flow is:

```text
Agent
  -> MCP client
    -> stdin request to node dist/src/mcp.js
      -> src/mcp.ts tool handler
        -> src/service.ts
          -> src/policy.ts
            -> policies/architecture.yaml
      <- JSON response over stdout
  <- Agent sees tool result
```

For `check_files`, the handler does more work:

```text
MCP request
  -> src/mcp.ts
    -> checkRepository({ repo, files })
      -> loadPolicy()
      -> analyzeRepo()
      -> evaluatePolicy()
  -> JSON result returned through MCP
```

This is the same underlying path used by the CLI. MCP changes the interface, not the authority.

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

## When a Long-Lived Service Makes Sense

For this demo, a session-scoped stdio server is enough. A long-lived MCP service starts to make sense when the policy interface is no longer just a thin wrapper around files already present in the agent's workspace.

That usually happens in enterprise environments.

Use a long-lived service when you want centralized control:

- the authoritative policy implementation should not live in every repo
- policy versions should be managed centrally
- agents should not be able to modify or bypass the linter implementation
- multiple repositories should share organizational rules

Use a long-lived service when checks need privileged context:

- private dependency graphs
- ownership systems
- service catalogs
- package registries
- code review systems
- historical violation data

Use a long-lived service when analysis is expensive enough to benefit from caching:

- repository indexes
- dependency graphs
- package boundary maps
- known generated-code regions
- baseline violations

And, importantly, use a long-lived service when observability matters.

A central architecture service can record:

- which agent or harness asked for policy
- which user, repo, branch, or pull request was involved
- which files were checked
- what violations were returned
- whether the agent checked before editing, after editing, or only at the end
- which rules are frequently queried
- which rules are frequently violated
- which agents or workflows ignore guidance until presubmit fails

That data is valuable because it turns architectural guidance into an observable system. You can see whether agents are using policy early, where policy is unclear, and which boundaries generate repeated friction.

In that design, the MCP server looks more like a conventional service:

```text
Agent client
  -> remote MCP endpoint over HTTP
    -> authenticated enterprise MCP service
      -> policy service / evaluator
      -> controlled repo checkout, PR diff, or submitted patch
      -> audited result
```

Authentication and reachability become normal enterprise platform concerns: identity, network access, authorization, and audit. They matter, but they should be handled by the client, gateway, and service infrastructure rather than by giving durable credentials to the model.

## Local vs Remote Inputs

A local stdio server can accept local repo paths:

```json
{
  "repo": "demo-repo",
  "files": ["packages/web/src/accountPage.ts"]
}
```

A remote enterprise service usually needs enterprise identifiers instead:

```json
{
  "repo": "payments-app",
  "ref": "feature/account-summary",
  "files": ["packages/web/src/accountPage.ts"]
}
```

Or it may check a pull request:

```json
{
  "repo": "payments-app",
  "pullRequest": 1842
}
```

Or it may evaluate submitted file contents or a patch, letting the agent get early feedback without direct access to the server-side policy implementation.

The underlying principle remains the same: the service controls the policy and evaluator, while the agent receives structured guidance and check results.

## The Practical Rule

Do not build an MCP-only architecture system. Build a deterministic policy engine first, expose it through a CLI, enforce it through Make/CI, and then add MCP as the agent-native interface.

In short:

> MCP helps agents comply early. The CLI proves whether they complied.
