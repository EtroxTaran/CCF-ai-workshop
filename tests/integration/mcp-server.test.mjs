import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import readline from "node:readline";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const MCP_SERVER = path.join(ROOT, "mcp-server", "server.mjs");

class McpClient {
  constructor(extraArgs = [], extraEnv = undefined) {
    this.proc = spawn(process.execPath, [MCP_SERVER, ...extraArgs], {
      cwd: ROOT,
      env: extraEnv ? { ...process.env, ...extraEnv } : process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    this.nextId = 1;
    this.pending = new Map();
    this.stderr = "";
    this.proc.stderr.on("data", (d) => {
      this.stderr += d.toString("utf8");
    });
    this.rl = readline.createInterface({ input: this.proc.stdout, crlfDelay: Infinity });
    this.rl.on("line", (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      let msg;
      try {
        msg = JSON.parse(trimmed);
      } catch {
        return;
      }
      if (msg.id !== undefined && this.pending.has(msg.id)) {
        const { resolve, timer } = this.pending.get(msg.id);
        clearTimeout(timer);
        this.pending.delete(msg.id);
        resolve(msg);
      }
    });
  }

  request(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timeout waiting for ${method} (stderr: ${this.stderr})`));
      }, 6000);
      this.pending.set(id, { resolve, timer });
      this.proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    });
  }

  async close() {
    this.rl.close();
    this.proc.stdin.end();
    this.proc.kill("SIGTERM");
    await new Promise((r) => this.proc.once("exit", r));
  }
}

test("mcp-server L1 supports initialize, tools/list, search, verify (incl. widerspruch), read, resources, and traversal block", async () => {
  const client = new McpClient();
  try {
    const init = await client.request("initialize", { protocolVersion: "2024-11-05", capabilities: {} });
    assert.ok(init.result?.serverInfo?.name);
    assert.equal(init.result?.serverInfo?.version, "1.3.0");

    const tools = await client.request("tools/list");
    const toolList = tools.result?.tools || [];
    const names = toolList.map((t) => t.name);
    assert.equal(toolList.length, 7);
    assert.ok(names.includes("search_vault"));
    assert.ok(names.includes("verify_claim"));
    assert.ok(names.includes("read_article"));
    assert.ok(names.includes("list_modules"));
    assert.ok(names.includes("search_wildlife_vault"));
    assert.ok(names.includes("verify_claim_against_corpus"));
    assert.ok(names.includes("read_vault_article"));

    for (const tool of toolList) {
      assert.deepEqual(tool.annotations, {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      });
    }
    const searchVaultTool = toolList.find((t) => t.name === "search_vault");
    assert.equal(searchVaultTool?.inputSchema?.properties?.category?.enum, undefined);

    // list_modules returns categories per module
    const modListRes = await client.request("tools/call", {
      name: "list_modules",
      arguments: {},
    });
    const modListParsed = JSON.parse(modListRes.result.content[0].text);
    const l1Mod = (modListParsed.modules || []).find((m) => m.id === "prompt-werkstatt-tierwelt");
    const l2Mod = (modListParsed.modules || []).find((m) => m.id === "context-engineering-projekt");
    assert.ok(Array.isArray(l1Mod?.categories) && l1Mod.categories.length >= 3);
    assert.ok(Array.isArray(l2Mod?.categories) && l2Mod.categories.includes("runbook"));

    // Cross-module search_vault with L2 category filter works on L1 server instance
    const sepaRes = await client.request("tools/call", {
      name: "search_vault",
      arguments: {
        query: "SEPA",
        module: "context-engineering-projekt",
        category: "runbook",
      },
    });
    const sepaParsed = JSON.parse(sepaRes.result.content[0].text);
    assert.equal(sepaParsed.module, "context-engineering-projekt");
    assert.equal(sepaParsed.matches?.[0]?.slug, "runbook-zahlungslauf");

    // Unknown category returns available_categories
    const unknownCatRes = await client.request("tools/call", {
      name: "search_vault",
      arguments: {
        query: "SEPA",
        module: "context-engineering-projekt",
        category: "nonexistent-cat",
      },
    });
    const unknownCatParsed = JSON.parse(unknownCatRes.result.content[0].text);
    assert.deepEqual(unknownCatParsed.matches, []);
    assert.ok(Array.isArray(unknownCatParsed.available_categories));
    assert.ok(unknownCatParsed.available_categories.includes("runbook"));

    const resList = await client.request("resources/list");
    const uris = (resList.result?.resources || []).map((r) => r.uri);
    assert.ok(uris.includes("vault://_index.md"));
    assert.ok(uris.some((u) => u.includes("eisbaer.md")));

    const idxRes = await client.request("resources/read", { uri: "vault://_index.md" });
    assert.ok(idxRes.result?.contents?.[0]?.text?.length > 100);

    const travRes = await client.request("resources/read", { uri: "vault://../package.json" });
    assert.equal(travRes.error?.code, -32002);

    const verifyContra = await client.request("tools/call", {
      name: "verify_claim_against_corpus",
      arguments: { claim: "Der Eisbär hat 38 Zähne." },
    });
    const parsedContra = JSON.parse(verifyContra.result.content[0].text);
    assert.equal(parsedContra.status, "widerspruch");

    // Dynamic per-call switch to L2 without restarting server
    const l2Switch = await client.request("tools/call", {
      name: "search_wildlife_vault",
      arguments: { query: "Kernbank RTO Tier-1", module: "context-engineering-projekt" },
    });
    const parsedL2 = JSON.parse(l2Switch.result.content[0].text);
    assert.equal(parsedL2.module, "context-engineering-projekt");
    assert.equal(parsedL2.total_articles, 10);
    assert.ok((parsedL2.matches || []).length > 0);
  } finally {
    await client.close();
  }
});

test("mcp-server supports --module context-engineering-projekt and rejects nonexistent modules", async () => {
  const bad = spawnSync(process.execPath, [MCP_SERVER, "--module", "nonexistent-module-xyz"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  assert.equal(bad.status, 1);

  const l2Client = new McpClient(["--module", "context-engineering-projekt"]);
  try {
    const l2Tools = await l2Client.request("tools/list");
    const l2ToolNames = (l2Tools.result?.tools || []).map((t) => t.name);
    assert.deepEqual(l2ToolNames, ["search_vault", "verify_claim", "read_article", "list_modules"]);

    const resList = await l2Client.request("resources/list");
    const uris = (resList.result?.resources || []).map((r) => r.uri);
    assert.equal(uris.length, 11);
    assert.ok(uris.includes("vault://_index.md"));
    assert.ok(uris.some((u) => u.startsWith("vault://corpus/")));
    assert.equal(
      uris.some((u) => /(?:AGENTS|CLAUDE|GEMINI)\.md$/i.test(u)),
      false,
      "Instruction files must be excluded from corpus resources"
    );

    const readL2 = await l2Client.request("resources/read", { uri: "vault://_index.md" });
    assert.match(readL2.result.contents[0].text, /Kernbank/i);

    const searchL2 = await l2Client.request("tools/call", {
      name: "search_vault",
      arguments: { query: "SEPA", category: "runbook" },
    });
    const parsedSearchL2 = JSON.parse(searchL2.result.content[0].text);
    assert.equal(parsedSearchL2.total_articles, 10);
    assert.equal(parsedSearchL2.matches?.[0]?.slug, "runbook-zahlungslauf");

    // Defensive exclusion: reading AGENTS.md as article must return isError: true
    const agentsArticle = await l2Client.request("tools/call", {
      name: "read_article",
      arguments: { slug: "AGENTS", module: "context-engineering-projekt" },
    });
    assert.equal(agentsArticle.result?.isError, true);

    // Legacy alias names remain callable even when tools/list only exposes 4 canonical tools
    const aliasRead = await l2Client.request("tools/call", {
      name: "read_vault_article",
      arguments: { slug: "runbook-zahlungslauf" },
    });
    assert.equal(aliasRead.result?.isError, undefined);
    assert.match(aliasRead.result.content[0].text, /SEPA/i);
  } finally {
    await l2Client.close();
  }
});

test("mcp-server --canonical-only flag and WORKSHOP_MCP_CANONICAL_ONLY=1 expose 4 canonical tools while keeping all 7 callable", async () => {
  for (const [args, env] of [
    [["--canonical-only"], undefined],
    [[], { WORKSHOP_MCP_CANONICAL_ONLY: "1" }],
  ]) {
    const client = new McpClient(args, env);
    try {
      const tools = await client.request("tools/list");
      const names = (tools.result?.tools || []).map((t) => t.name);
      assert.deepEqual(names, ["search_vault", "verify_claim", "read_article", "list_modules"]);

      const aliasSearch = await client.request("tools/call", {
        name: "search_wildlife_vault",
        arguments: { query: "Eisbär" },
      });
      const parsedSearch = JSON.parse(aliasSearch.result.content[0].text);
      assert.equal(parsedSearch.matches?.[0]?.slug, "eisbaer");

      const aliasVerify = await client.request("tools/call", {
        name: "verify_claim_against_corpus",
        arguments: { claim: "Der Eisbär hat 38 Zähne." },
      });
      const parsedVerify = JSON.parse(aliasVerify.result.content[0].text);
      assert.equal(parsedVerify.status, "widerspruch");

      const aliasRead = await client.request("tools/call", {
        name: "read_vault_article",
        arguments: { slug: "eisbaer" },
      });
      assert.match(aliasRead.result.content[0].text, /Eisbär/i);
    } finally {
      await client.close();
    }
  }
});
