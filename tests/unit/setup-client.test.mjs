import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  USER_ONLY_CLIENTS,
  VALID_CLIENTS,
  buildConfigForClient,
  getTargetPath,
  getUserAntigravityConfigPath,
  getUserClaudeDesktopConfigPath,
  getUserOpencodeConfigPath,
  getUserVscodeConfigPath,
  getUserWindsurfConfigPath,
  mergeCodexToml,
  mergeJsonConfig,
} from "../../mcp-server/setup-client.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SETUP_SCRIPT = path.join(ROOT, "mcp-server", "setup-client.mjs");

test("setup-client --dry-run supports all 9 clients for default L1 and explicit --module L2", () => {
  assert.deepEqual(VALID_CLIENTS, [
    "claude",
    "claude-desktop",
    "opencode",
    "gemini",
    "antigravity",
    "codex",
    "vscode",
    "cursor",
    "windsurf",
  ]);

  const outL1 = execFileSync(
    process.execPath,
    [SETUP_SCRIPT, "--client", "all", "--scope", "user", "--dry-run"],
    { cwd: ROOT, encoding: "utf8" }
  );
  assert.match(outL1, /workshop-wildlife/);
  for (const clientHeader of [
    "=== CLAUDE (user) ===",
    "=== CLAUDE-DESKTOP (user) ===",
    "=== OPENCODE (user) ===",
    "=== GEMINI (user) ===",
    "=== ANTIGRAVITY (user) ===",
    "=== CODEX (user) ===",
    "=== VSCODE (user) ===",
    "=== CURSOR (user) ===",
    "=== WINDSURF (user) ===",
  ]) {
    assert.ok(outL1.includes(clientHeader), `Missing dry-run section: ${clientHeader}`);
  }
  assert.match(outL1, /Additional Options \(\.\.\.\) > MCP Servers/);
  assert.match(outL1, /mcp_config\.json/);
  assert.match(outL1, /claude_desktop_config\.json/);
  assert.match(outL1, /windsurf[/\\]mcp_config\.json/);

  const outL2 = execFileSync(
    process.execPath,
    [
      SETUP_SCRIPT,
      "--client",
      "all",
      "--module",
      "context-engineering-projekt",
      "--scope",
      "user",
      "--dry-run",
    ],
    { cwd: ROOT, encoding: "utf8" }
  );
  assert.match(outL2, /workshop-context-engineering-projekt/);
  assert.match(outL2, /"--module"/);
  assert.match(outL2, /"context-engineering-projekt"/);
});

test("setup-client OS path helpers resolve win32 (APPDATA), darwin, and linux (XDG_CONFIG_HOME & fallback)", () => {
  const winOpts = {
    platform: "win32",
    homeDir: "C:\\Users\\demo",
    env: { APPDATA: "C:\\Users\\demo\\AppData\\Roaming" },
    repoRoot: "C:\\repo",
  };
  assert.equal(
    getUserAntigravityConfigPath(winOpts),
    "C:\\Users\\demo\\.gemini\\config\\mcp_config.json"
  );
  assert.equal(
    getUserClaudeDesktopConfigPath(winOpts),
    "C:\\Users\\demo\\AppData\\Roaming\\Claude\\claude_desktop_config.json"
  );
  assert.equal(
    getUserWindsurfConfigPath(winOpts),
    "C:\\Users\\demo\\.codeium\\windsurf\\mcp_config.json"
  );
  assert.equal(
    getUserVscodeConfigPath(winOpts),
    "C:\\Users\\demo\\AppData\\Roaming\\Code\\User\\mcp.json"
  );
  assert.equal(
    getTargetPath("antigravity", "user", winOpts),
    "C:\\Users\\demo\\.gemini\\config\\mcp_config.json"
  );

  const macOpts = {
    platform: "darwin",
    homeDir: "/Users/demo",
    env: {},
    repoRoot: "/repo",
  };
  assert.equal(
    getUserClaudeDesktopConfigPath(macOpts),
    "/Users/demo/Library/Application Support/Claude/claude_desktop_config.json"
  );
  assert.equal(
    getUserVscodeConfigPath(macOpts),
    "/Users/demo/Library/Application Support/Code/User/mcp.json"
  );
  assert.equal(
    getUserAntigravityConfigPath(macOpts),
    "/Users/demo/.gemini/config/mcp_config.json"
  );

  const linuxXdgOpts = {
    platform: "linux",
    homeDir: "/home/demo",
    env: { XDG_CONFIG_HOME: "/home/demo/.xdg" },
    repoRoot: "/repo",
  };
  assert.equal(
    getUserClaudeDesktopConfigPath(linuxXdgOpts),
    "/home/demo/.xdg/Claude/claude_desktop_config.json"
  );
  assert.equal(
    getUserOpencodeConfigPath(linuxXdgOpts),
    "/home/demo/.xdg/opencode/opencode.json"
  );
  assert.equal(
    getUserVscodeConfigPath(linuxXdgOpts),
    "/home/demo/.xdg/Code/User/mcp.json"
  );

  const linuxDefaultOpts = {
    platform: "linux",
    homeDir: "/home/demo",
    env: {},
    repoRoot: "/repo",
  };
  assert.equal(
    getUserClaudeDesktopConfigPath(linuxDefaultOpts),
    "/home/demo/.config/Claude/claude_desktop_config.json"
  );
  assert.equal(
    getUserOpencodeConfigPath(linuxDefaultOpts),
    "/home/demo/.config/opencode/opencode.json"
  );
});

test("setup-client performs idempotent JSON and TOML merging in isolated temp dir and supports --node-bin", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ccf-setup-client-"));
  try {
    // JSON merge idempotency preserving existing unrelated server
    const jsonPath = path.join(tmpDir, "mcp_config.json");
    const initialJson = JSON.stringify(
      { mcpServers: { "existing-tool": { command: "python", args: ["tool.py"] } } },
      null,
      2
    );
    fs.writeFileSync(jsonPath, initialJson, "utf8");

    const pass1 = buildConfigForClient("antigravity", fs.readFileSync(jsonPath, "utf8"), "", {
      nodeBin: "/opt/node/bin/node",
    });
    fs.writeFileSync(jsonPath, pass1, "utf8");
    const pass2 = buildConfigForClient("antigravity", fs.readFileSync(jsonPath, "utf8"), "", {
      nodeBin: "/opt/node/bin/node",
    });
    assert.equal(pass2, pass1, "Repeated JSON merge must be idempotent");
    const parsedJson = JSON.parse(pass2);
    assert.deepEqual(parsedJson.mcpServers["existing-tool"], {
      command: "python",
      args: ["tool.py"],
    });
    assert.equal(parsedJson.mcpServers["workshop-wildlife"].command, "/opt/node/bin/node");

    // TOML merge idempotency preserving existing unrelated sections
    const tomlPath = path.join(tmpDir, "config.toml");
    const initialToml = [
      'model = "gpt-5"',
      "",
      "[mcp_servers.other_tool]",
      'command = "uvx"',
      'args = ["other"]',
      "",
    ].join("\n");
    fs.writeFileSync(tomlPath, initialToml, "utf8");

    const tomlPass1 = mergeCodexToml(fs.readFileSync(tomlPath, "utf8"), "", "/opt/node/bin/node");
    fs.writeFileSync(tomlPath, tomlPass1, "utf8");
    const tomlPass2 = mergeCodexToml(fs.readFileSync(tomlPath, "utf8"), "", "/opt/node/bin/node");
    assert.equal(tomlPass2, tomlPass1, "Repeated TOML merge must be idempotent");
    assert.match(tomlPass2, /\[mcp_servers\.other_tool\]/);
    assert.match(tomlPass2, /\[mcp_servers\.workshop-wildlife\]/);
    assert.equal((tomlPass2.match(/\[mcp_servers\.workshop-wildlife\]/g) || []).length, 1);

    // mergeJsonConfig extraTop preserves existing top-level keys
    const mergedOpenCode = mergeJsonConfig('{"theme":"dark"}', "mcp", "workshop-wildlife", { type: "local" }, {
      $schema: "https://opencode.ai/config.json",
    });
    const parsedOC = JSON.parse(mergedOpenCode);
    assert.equal(parsedOC.theme, "dark");
    assert.equal(parsedOC.$schema, "https://opencode.ai/config.json");

    // CLI --node-bin override (custom path & execPath)
    const customBinOut = execFileSync(
      process.execPath,
      [SETUP_SCRIPT, "--client", "antigravity", "--scope", "user", "--node-bin", "/custom/node", "--dry-run"],
      { cwd: ROOT, encoding: "utf8" }
    );
    assert.match(customBinOut, /"command": "\/custom\/node"/);

    const execPathOut = execFileSync(
      process.execPath,
      [SETUP_SCRIPT, "--client", "antigravity", "--scope", "user", "--node-bin=execPath", "--dry-run"],
      { cwd: ROOT, encoding: "utf8" }
    );
    assert.ok(execPathOut.includes(JSON.stringify(process.execPath)));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("setup-client USER_ONLY_CLIENTS skip cleanly under --client all --scope project and fail singly under --scope project", () => {
  assert.deepEqual([...USER_ONLY_CLIENTS].sort(), ["antigravity", "claude-desktop", "windsurf"]);

  // --client all --scope project --dry-run skips user-only clients cleanly with exit 0
  const allProject = spawnSync(
    process.execPath,
    [SETUP_SCRIPT, "--client", "all", "--scope", "project", "--dry-run"],
    { cwd: ROOT, encoding: "utf8" }
  );
  assert.equal(allProject.status, 0);
  for (const userOnly of USER_ONLY_CLIENTS) {
    assert.match(
      allProject.stdout,
      new RegExp(`Übersprungen — '${userOnly}' unterstützt nur --scope user`)
    );
  }

  // Single user-only client with --scope project exits with 1
  for (const userOnly of USER_ONLY_CLIENTS) {
    const single = spawnSync(
      process.execPath,
      [SETUP_SCRIPT, "--client", userOnly, "--scope", "project"],
      { cwd: ROOT, encoding: "utf8" }
    );
    assert.equal(single.status, 1, `${userOnly} --scope project must exit 1`);
    assert.match(single.stderr, /nur --scope user/);
  }
});

test("setup-client rejects invalid module slugs and safely skips tracked vault config", () => {
  const badMod = spawnSync(
    process.execPath,
    [SETUP_SCRIPT, "--client", "claude", "--module", "../evil", "--scope", "user", "--dry-run"],
    { cwd: ROOT, encoding: "utf8" }
  );
  assert.notEqual(badMod.status, 0);

  const vaultMcpPath = path.join(ROOT, "stufe-3-obsidian-vault", ".mcp.json");
  const before = fs.readFileSync(vaultMcpPath, "utf8");
  const trackedGuard = spawnSync(
    process.execPath,
    [SETUP_SCRIPT, "--client", "claude", "--scope", "project"],
    { cwd: path.join(ROOT, "stufe-3-obsidian-vault"), encoding: "utf8" }
  );
  assert.equal(trackedGuard.status, 0);
  assert.match(trackedGuard.stdout, /Übersprungen/);
  assert.equal(fs.readFileSync(vaultMcpPath, "utf8"), before);
});
