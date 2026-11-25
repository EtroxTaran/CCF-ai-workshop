#!/usr/bin/env node
/**
 * Zero-dependency MCP client configuration helper for the virtual7 CCF KI-Workshop.
 * Generates or safely merges absolute-path MCP server entries for local stdio usage.
 *
 * Usage:
 *   node mcp-server/setup-client.mjs --client <claude|gemini|codex|vscode|cursor|all> [--scope project|user] [--dry-run] [--print] [--help]
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const ABS_SERVER_PATH = path.resolve(__dirname, "server.mjs");
const ABS_SERVER_TOML = ABS_SERVER_PATH.replace(/\\/g, "/");

const VALID_CLIENTS = ["claude", "gemini", "codex", "vscode", "cursor"];
const VALID_SCOPES = ["project", "user"];

function printHelp() {
  console.log(`
Workshop MCP Setup Helper (workshop-wildlife)
Verwendung:
  node mcp-server/setup-client.mjs --client <claude|gemini|codex|vscode|cursor|all> [Optionen]

Optionen:
  --client <name>   Ziel-Client: claude, gemini, codex, vscode, cursor oder all
  --scope <scope>   Konfigurations-Ebene: project (Standard) oder user
  --dry-run         Zeigt Zielpfad und erzeugte Konfiguration ohne Schreiben
  --print           Gibt nur die Konfigurationen aus (kein Dateizugriff)
  --help, -h        Zeigt diese Hilfe

Absoluter Server-Pfad:
  ${ABS_SERVER_PATH}
`);
}

function parseArgs(argv) {
  const opts = {
    client: "",
    scope: "project",
    dryRun: false,
    printOnly: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
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
    } else {
      throw new Error(`Unbekanntes Argument: ${arg}`);
    }
  }
  return opts;
}

function getUserVscodeConfigPath() {
  const home = os.homedir();
  if (process.platform === "win32") {
    const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
    return path.join(appData, "Code", "User", "mcp.json");
  }
  if (process.platform === "darwin") {
    return path.join(home, "Library", "Application Support", "Code", "User", "mcp.json");
  }
  return path.join(home, ".config", "Code", "User", "mcp.json");
}

function getTargetPath(client, scope) {
  const home = os.homedir();
  if (client === "claude") {
    return scope === "user"
      ? path.join(home, ".claude.json")
      : path.join(REPO_ROOT, ".mcp.json");
  }
  if (client === "gemini") {
    return scope === "user"
      ? path.join(home, ".gemini", "settings.json")
      : path.join(REPO_ROOT, ".gemini", "settings.json");
  }
  if (client === "codex") {
    return scope === "user"
      ? path.join(home, ".codex", "config.toml")
      : path.join(REPO_ROOT, ".codex", "config.toml");
  }
  if (client === "vscode") {
    return scope === "user"
      ? getUserVscodeConfigPath()
      : path.join(REPO_ROOT, ".vscode", "mcp.json");
  }
  if (client === "cursor") {
    return scope === "user"
      ? path.join(home, ".cursor", "mcp.json")
      : path.join(REPO_ROOT, ".cursor", "mcp.json");
  }
  throw new Error(`Unbekannter Client: ${client}`);
}

function mergeJsonConfig(existingText, rootKey, entryValue) {
  let obj = {};
  if (existingText && existingText.trim()) {
    obj = JSON.parse(existingText);
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
      throw new Error("Bestehende JSON-Konfiguration ist kein JSON-Objekt.");
    }
  }
  const existingSection =
    obj[rootKey] && typeof obj[rootKey] === "object" && !Array.isArray(obj[rootKey])
      ? obj[rootKey]
      : {};
  obj[rootKey] = {
    ...existingSection,
    "workshop-wildlife": entryValue,
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

function mergeCodexToml(existingText) {
  const sectionBlock = [
    "[mcp_servers.workshop-wildlife]",
    'command = "node"',
    `args = ["${ABS_SERVER_TOML}"]`,
  ].join("\n");

  if (!existingText || !existingText.trim()) {
    return sectionBlock + "\n";
  }

  // Remove existing [mcp_servers.workshop-wildlife] and legacy [mcp_servers.workshop-wildlife.env] sections cleanly
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
          (secName === "mcp_servers.workshop-wildlife" ||
            secName === "mcp_servers.workshop-wildlife.env")
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

function buildConfigForClient(client, existingText = "") {
  if (client === "vscode") {
    return mergeJsonConfig(existingText, "servers", {
      type: "stdio",
      command: "node",
      args: [ABS_SERVER_PATH],
    });
  }
  if (client === "codex") {
    return mergeCodexToml(existingText);
  }
  // claude, gemini, cursor share mcpServers schema
  return mergeJsonConfig(existingText, "mcpServers", {
    command: "node",
    args: [ABS_SERVER_PATH],
  });
}

function main() {
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

  for (const client of clients) {
    const targetPath = getTargetPath(client, opts.scope);
    const existingText =
      !opts.printOnly && fs.existsSync(targetPath)
        ? fs.readFileSync(targetPath, "utf8")
        : "";
    const nextText = buildConfigForClient(client, existingText);

    console.log(`=== ${client.toUpperCase()} (${opts.scope}) ===`);
    console.log(`Pfad: ${targetPath}`);

    if (opts.dryRun || opts.printOnly) {
      console.log(nextText.trimEnd());
      console.log("");
      continue;
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, nextText, "utf8");
    console.log("Status: Gespeichert (bestehende Einträge erhalten).\n");
  }
}

main();
