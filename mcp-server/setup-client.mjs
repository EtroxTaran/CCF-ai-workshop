#!/usr/bin/env node
/**
 * Zero-dependency MCP client configuration helper for the virtual7 CCF KI-Workshop.
 * Generates or safely merges absolute-path MCP server entries for local stdio usage.
 *
 * Usage:
 *   node mcp-server/setup-client.mjs --client <claude|claude-desktop|opencode|gemini|antigravity|codex|vscode|cursor|windsurf|all> [--scope user|project] [--module <slug>] [--node-bin <path>] [--force] [--dry-run] [--print] [--help]
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
export const ABS_SERVER_PATH = path.resolve(__dirname, "server.mjs");
export const ABS_SERVER_TOML = ABS_SERVER_PATH.replace(/\\/g, "/");

const DEFAULT_MODULE_ID = "prompt-werkstatt-tierwelt";
const SAFE_SLUG_RE = /^[a-z0-9-]+$/;
export const VALID_CLIENTS = [
  "claude",
  "claude-desktop",
  "opencode",
  "gemini",
  "antigravity",
  "codex",
  "vscode",
  "cursor",
  "windsurf",
];
export const USER_ONLY_CLIENTS = new Set(["antigravity", "claude-desktop", "windsurf"]);
export const VALID_SCOPES = ["user", "project"];
export const TRACKED_PROJECT_FILES = new Set([
  path.join(REPO_ROOT, ".mcp.json"),
  path.join(REPO_ROOT, "opencode.json"),
  path.join(REPO_ROOT, ".gemini", "settings.json"),
  path.join(REPO_ROOT, ".codex", "config.toml"),
  path.join(REPO_ROOT, ".vscode", "mcp.json"),
  path.join(REPO_ROOT, ".cursor", "mcp.json"),
  path.join(REPO_ROOT, "stufe-3-obsidian-vault", ".mcp.json"),
  path.join(REPO_ROOT, "stufe-3-obsidian-vault", "opencode.json"),
  path.join(REPO_ROOT, "stufe-3-obsidian-vault", ".gemini", "settings.json"),
  path.join(REPO_ROOT, "stufe-3-obsidian-vault", ".codex", "config.toml"),
  path.join(REPO_ROOT, "stufe-3-obsidian-vault", ".vscode", "mcp.json"),
  path.join(REPO_ROOT, "stufe-3-obsidian-vault", ".cursor", "mcp.json"),
]);

export function serverKeyForModule(moduleSlug = "") {
  const clean = String(moduleSlug || "").trim();
  if (!clean || clean === DEFAULT_MODULE_ID) return "workshop-wildlife";
  return `workshop-${clean}`;
}

export function printHelp() {
  console.log(`
Workshop MCP Setup Helper (workshop-wildlife)
Verwendung:
  node mcp-server/setup-client.mjs --client <${VALID_CLIENTS.join("|")}|all> [Optionen]

Optionen:
  --client <name>    Ziel-Client: ${VALID_CLIENTS.join(", ")} oder all
  --scope <scope>    Konfigurations-Ebene: user (Standard – gilt global ohne Git-Änderung) oder project
                     Hinweis: antigravity, claude-desktop und windsurf unterstützen nur --scope user
  --module <slug>    Optional: Themen-Modul (z. B. context-engineering-projekt)
  --node-bin <path>  Optional: Node.js-Binary (Standard: node; ohne Wert oder 'execPath' nutzt aktuelles Node-Binary)
  --force            Erlaubt das Überschreiben bereits eingecheckter Projekt-Konfigurationen
  --dry-run          Zeigt Zielpfad und erzeugte Konfiguration ohne Schreiben
  --print            Gibt nur die Konfigurationen aus (kein Dateizugriff)
  --help, -h         Zeigt diese Hilfe

Client-Hinweise:
  - Google Antigravity: ~/.gemini/config/mcp_config.json (UI: Additional Options (...) > MCP Servers)
  - Cloud-SaaS (Langdock, ChatGPT Web, Claude.ai Web, M365 Copilot): kein lokales stdio-MCP; nutze Knowledge Folder / Remote MCP

Absoluter Server-Pfad:
  ${ABS_SERVER_PATH}
`);
}

export function parseArgs(argv) {
  const opts = {
    client: "",
    scope: "user",
    module: "",
    nodeBin: "node",
    force: false,
    dryRun: false,
    printOnly: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
    } else if (arg === "--force") {
      opts.force = true;
    } else if (arg === "--dry-run") {
      opts.dryRun = true;
    } else if (arg === "--print") {
      opts.printOnly = true;
    } else if (arg === "--client" && i + 1 < argv.length) {
      opts.client = argv[++i].toLowerCase();
    } else if (arg.startsWith("--client=")) {
      opts.client = arg.slice("--client=".length).toLowerCase();
    } else if (arg === "--scope" && i + 1 < argv.length) {
      opts.scope = argv[++i].toLowerCase();
    } else if (arg.startsWith("--scope=")) {
      opts.scope = arg.slice("--scope=".length).toLowerCase();
    } else if (arg === "--module" && i + 1 < argv.length) {
      opts.module = argv[++i].toLowerCase();
    } else if (arg.startsWith("--module=")) {
      opts.module = arg.slice("--module=".length).toLowerCase();
    } else if (arg === "--node-bin") {
      if (i + 1 < argv.length && !argv[i + 1].startsWith("-")) {
        const val = argv[++i].trim();
        opts.nodeBin = !val || val === "execPath" ? process.execPath : val;
      } else {
        opts.nodeBin = process.execPath;
      }
    } else if (arg.startsWith("--node-bin=")) {
      const val = arg.slice("--node-bin=".length).trim();
      opts.nodeBin = !val || val === "execPath" ? process.execPath : val;
    } else {
      throw new Error(`Unbekanntes Argument: ${arg}`);
    }
  }
  return opts;
}

function resolvePathEnv(options = {}) {
  const platform = options.platform || process.platform;
  const home = options.homeDir || os.homedir();
  const env = options.env || process.env;
  const repoRoot = options.repoRoot || REPO_ROOT;
  const p = platform === "win32" ? path.win32 : path.posix;
  return { platform, home, env, repoRoot, p };
}

export function getUserVscodeConfigPath(options = {}) {
  const { platform, home, env, p } = resolvePathEnv(options);
  if (platform === "win32") {
    const appData = env.APPDATA || p.join(home, "AppData", "Roaming");
    return p.join(appData, "Code", "User", "mcp.json");
  }
  if (platform === "darwin") {
    return p.join(home, "Library", "Application Support", "Code", "User", "mcp.json");
  }
  const xdg = env.XDG_CONFIG_HOME || p.join(home, ".config");
  return p.join(xdg, "Code", "User", "mcp.json");
}

export function getUserClaudeDesktopConfigPath(options = {}) {
  const { platform, home, env, p } = resolvePathEnv(options);
  if (platform === "win32") {
    const appData = env.APPDATA || p.join(home, "AppData", "Roaming");
    return p.join(appData, "Claude", "claude_desktop_config.json");
  }
  if (platform === "darwin") {
    return p.join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json");
  }
  const xdg = env.XDG_CONFIG_HOME || p.join(home, ".config");
  return p.join(xdg, "Claude", "claude_desktop_config.json");
}

export function getUserAntigravityConfigPath(options = {}) {
  const { home, p } = resolvePathEnv(options);
  return p.join(home, ".gemini", "config", "mcp_config.json");
}

export function getUserWindsurfConfigPath(options = {}) {
  const { home, p } = resolvePathEnv(options);
  return p.join(home, ".codeium", "windsurf", "mcp_config.json");
}

export function getUserOpencodeConfigPath(options = {}) {
  const { platform, home, env, p } = resolvePathEnv(options);
  const baseConfig =
    platform === "linux" && env.XDG_CONFIG_HOME
      ? env.XDG_CONFIG_HOME
      : p.join(home, ".config");
  return p.join(baseConfig, "opencode", "opencode.json");
}

export function getTargetPath(client, scope = "user", options = {}) {
  const { home, repoRoot, p } = resolvePathEnv(options);
  if (scope === "project" && USER_ONLY_CLIENTS.has(client)) {
    throw new Error(`Client '${client}' unterstützt nur --scope user (kein Projekt-Config-Format).`);
  }
  if (client === "claude") {
    return scope === "user"
      ? p.join(home, ".claude.json")
      : p.join(repoRoot, ".mcp.json");
  }
  if (client === "claude-desktop") {
    return getUserClaudeDesktopConfigPath(options);
  }
  if (client === "opencode") {
    return scope === "user"
      ? getUserOpencodeConfigPath(options)
      : p.join(repoRoot, "opencode.json");
  }
  if (client === "gemini") {
    return scope === "user"
      ? p.join(home, ".gemini", "settings.json")
      : p.join(repoRoot, ".gemini", "settings.json");
  }
  if (client === "antigravity") {
    return getUserAntigravityConfigPath(options);
  }
  if (client === "codex") {
    return scope === "user"
      ? p.join(home, ".codex", "config.toml")
      : p.join(repoRoot, ".codex", "config.toml");
  }
  if (client === "vscode") {
    return scope === "user"
      ? getUserVscodeConfigPath(options)
      : p.join(repoRoot, ".vscode", "mcp.json");
  }
  if (client === "cursor") {
    return scope === "user"
      ? p.join(home, ".cursor", "mcp.json")
      : p.join(repoRoot, ".cursor", "mcp.json");
  }
  if (client === "windsurf") {
    return getUserWindsurfConfigPath(options);
  }
  throw new Error(`Unbekannter Client: ${client}`);
}

export function mergeJsonConfig(existingText, rootKey, entryKey, entryValue, extraTop = {}) {
  let obj = {};
  if (existingText && existingText.trim()) {
    obj = JSON.parse(existingText);
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
      throw new Error("Bestehende JSON-Konfiguration ist kein JSON-Objekt.");
    }
  }
  for (const [k, v] of Object.entries(extraTop)) {
    if (obj[k] === undefined) obj[k] = v;
  }
  const existingSection =
    obj[rootKey] && typeof obj[rootKey] === "object" && !Array.isArray(obj[rootKey])
      ? obj[rootKey]
      : {};
  obj[rootKey] = {
    ...existingSection,
    [entryKey]: entryValue,
  };
  return JSON.stringify(obj, null, 2) + "\n";
}

function advanceTomlMultilineState(line, initialDelim) {
  let multilineDelim = initialDelim;
  let inSingleLine = null;

  for (let i = 0; i < line.length; i++) {
    if (multilineDelim === '"""') {
      if (line[i] === "\\") {
        i += 1;
        continue;
      }
      if (line.startsWith('"""', i)) {
        let runLen = 3;
        while (runLen < 5 && line[i + runLen] === '"') {
          runLen += 1;
        }
        multilineDelim = null;
        i += runLen - 1;
      }
      continue;
    }

    if (multilineDelim === "'''") {
      if (line.startsWith("'''", i)) {
        let runLen = 3;
        while (runLen < 5 && line[i + runLen] === "'") {
          runLen += 1;
        }
        multilineDelim = null;
        i += runLen - 1;
      }
      continue;
    }

    if (inSingleLine === '"') {
      if (line[i] === "\\") {
        i += 1;
        continue;
      }
      if (line[i] === '"') {
        inSingleLine = null;
      }
      continue;
    }

    if (inSingleLine === "'") {
      if (line[i] === "'") {
        inSingleLine = null;
      }
      continue;
    }

    if (line[i] === "#") {
      break;
    }
    if (line.startsWith('"""', i)) {
      multilineDelim = '"""';
      i += 2;
    } else if (line.startsWith("'''", i)) {
      multilineDelim = "'''";
      i += 2;
    } else if (line[i] === '"') {
      inSingleLine = '"';
    } else if (line[i] === "'") {
      inSingleLine = "'";
    }
  }

  return multilineDelim;
}

export function mergeCodexToml(existingText, moduleSlug = "", nodeBin = "node") {
  const srvKey = serverKeyForModule(moduleSlug);
  const argsArr =
    moduleSlug && moduleSlug !== DEFAULT_MODULE_ID
      ? [ABS_SERVER_TOML, "--module", moduleSlug]
      : [ABS_SERVER_TOML];
  const tomlArgs = `args = ${JSON.stringify(argsArr)}`;
  const sectionBlock = [
    `[mcp_servers.${srvKey}]`,
    `command = ${JSON.stringify(nodeBin || "node")}`,
    tomlArgs,
  ].join("\n");

  if (!existingText || !existingText.trim()) {
    return sectionBlock + "\n";
  }

  // Remove existing [mcp_servers.<srvKey>] and legacy [mcp_servers.<srvKey>.env] sections cleanly
  const lines = existingText.split(/\r?\n/);
  const kept = [];
  let skipping = false;
  let multilineDelim = null;
  for (const line of lines) {
    const startedInMultiline = multilineDelim !== null;
    if (!startedInMultiline) {
      const trimmed = line.trim();
      const headerMatch = trimmed.match(/^(\[{1,2})\s*([^\[\]]+?)\s*(\]{1,2})\s*(?:#.*)?$/);
      if (headerMatch && headerMatch[1].length === headerMatch[3].length) {
        const isArrayTable = headerMatch[1] === "[[";
        const secName = headerMatch[2].trim();
        if (
          !isArrayTable &&
          (secName === `mcp_servers.${srvKey}` ||
            secName === `mcp_servers.${srvKey}.env`)
        ) {
          skipping = true;
          multilineDelim = advanceTomlMultilineState(line, multilineDelim);
          continue;
        }
        skipping = false;
      }
    }
    if (!skipping) {
      kept.push(line);
    }
    multilineDelim = advanceTomlMultilineState(line, multilineDelim);
  }

  const base = kept.join("\n").trimEnd();
  return (base ? base + "\n\n" : "") + sectionBlock + "\n";
}

export function buildConfigForClient(client, existingText = "", moduleSlug = "", options = {}) {
  const nodeBin = (typeof options === "string" ? options : options?.nodeBin) || "node";
  const srvKey = serverKeyForModule(moduleSlug);
  const serverArgs =
    moduleSlug && moduleSlug !== DEFAULT_MODULE_ID
      ? [ABS_SERVER_PATH, "--module", moduleSlug]
      : [ABS_SERVER_PATH];
  if (client === "opencode") {
    return mergeJsonConfig(
      existingText,
      "mcp",
      srvKey,
      {
        type: "local",
        command: [nodeBin, ...serverArgs],
        enabled: true,
      },
      { $schema: "https://opencode.ai/config.json" }
    );
  }
  if (client === "vscode") {
    return mergeJsonConfig(existingText, "servers", srvKey, {
      type: "stdio",
      command: nodeBin,
      args: serverArgs,
    });
  }
  if (client === "codex") {
    return mergeCodexToml(existingText, moduleSlug, nodeBin);
  }
  // claude, claude-desktop, gemini, antigravity, cursor, windsurf share mcpServers schema
  return mergeJsonConfig(existingText, "mcpServers", srvKey, {
    command: nodeBin,
    args: serverArgs,
  });
}

export function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`Fehler: ${err.message}`);
    printHelp();
    process.exit(1);
  }

  if (opts.help || !opts.client) {
    printHelp();
    process.exit(opts.help ? 0 : 1);
  }

  if (!VALID_SCOPES.includes(opts.scope)) {
    console.error(`Ungültiger --scope '${opts.scope}'. Erlaubt: ${VALID_SCOPES.join(", ")}`);
    process.exit(1);
  }

  if (opts.module) {
    if (!SAFE_SLUG_RE.test(opts.module)) {
      console.error(`Ungültiger --module Slug '${opts.module}'.`);
      process.exit(1);
    }
    const modManifest = path.join(REPO_ROOT, "modules", opts.module, "module.json");
    if (!fs.existsSync(modManifest)) {
      console.error(`Modul '${opts.module}' nicht gefunden unter modules/${opts.module}/module.json.`);
      process.exit(1);
    }
  }

  const clients =
    opts.client === "all"
      ? VALID_CLIENTS
      : VALID_CLIENTS.includes(opts.client)
        ? [opts.client]
        : null;

  if (!clients) {
    console.error(`Ungültiger --client '${opts.client}'. Erlaubt: ${VALID_CLIENTS.join(", ")}, all`);
    process.exit(1);
  }

  if (opts.scope === "project" && opts.client !== "all" && USER_ONLY_CLIENTS.has(opts.client)) {
    console.error(
      `Fehler: Client '${opts.client}' unterstützt nur --scope user (kein Projekt-Config-Format).`
    );
    process.exit(1);
  }

  for (const client of clients) {
    if (opts.scope === "project" && USER_ONLY_CLIENTS.has(client)) {
      console.log(`=== ${client.toUpperCase()} (${opts.scope}) ===`);
      console.log(
        `Status: Übersprungen — '${client}' unterstützt nur --scope user (kein Projekt-Config-Format).\n`
      );
      continue;
    }

    const targetPath = getTargetPath(client, opts.scope);
    const existingText =
      !opts.printOnly && fs.existsSync(targetPath)
        ? fs.readFileSync(targetPath, "utf8")
        : "";
    const nextText = buildConfigForClient(client, existingText, opts.module, {
      nodeBin: opts.nodeBin,
    });

    console.log(`=== ${client.toUpperCase()} (${opts.scope}) ===`);
    console.log(`Pfad: ${targetPath}`);
    if (client === "antigravity") {
      console.log("UI-Hinweis: Additional Options (...) > MCP Servers");
    }

    if (opts.dryRun || opts.printOnly) {
      console.log(nextText.trimEnd());
      console.log("");
      continue;
    }

    if (
      opts.scope === "project" &&
      TRACKED_PROJECT_FILES.has(targetPath) &&
      !opts.force
    ) {
      console.log(
        "Status: Übersprungen — Projekt-Konfiguration ist bereits im Repo vorkonfiguriert. Nutze --scope user (empfohlen) oder --force.\n"
      );
      continue;
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, nextText, "utf8");
    console.log("Status: Gespeichert (bestehende Einträge erhalten).\n");
  }
}

const isDirectRun = (() => {
  if (!process.argv[1]) return false;
  try {
    return import.meta.url === pathToFileURL(fs.realpathSync(path.resolve(process.argv[1]))).href;
  } catch {
    return import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
  }
})();

if (isDirectRun) {
  main();
}
