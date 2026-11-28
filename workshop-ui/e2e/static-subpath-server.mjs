#!/usr/bin/env node
/**
 * Serves workshop-ui/dist at BOTH "/" AND "/CCF-ai-workshop/" for Playwright E2E
 * so both local offline server paths and GitHub Pages subpath builds are exercised.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, "..", "dist");
const PORT = Number(process.env.E2E_PORT || 4177);
const SUBPATH_PREFIX = "/CCF-ai-workshop";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".woff2": "font/woff2",
};

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    return res.end("Method Not Allowed");
  }
  let pathname = "/";
  try {
    pathname = decodeURIComponent(new URL(req.url || "/", `http://127.0.0.1:${PORT}`).pathname);
  } catch {
    res.writeHead(400);
    return res.end("Bad Request");
  }
  if (pathname === SUBPATH_PREFIX || pathname.startsWith(`${SUBPATH_PREFIX}/`)) {
    pathname = pathname.slice(SUBPATH_PREFIX.length) || "/";
  }
  const rel = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  let filePath = path.resolve(DIST_DIR, rel);
  if (path.relative(DIST_DIR, filePath).startsWith("..")) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    if (path.extname(rel)) {
      res.writeHead(404);
      return res.end("Not Found");
    }
    filePath = path.join(DIST_DIR, "index.html");
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`E2E static subpath server listening at http://127.0.0.1:${PORT}/ and ${SUBPATH_PREFIX}/`);
});
