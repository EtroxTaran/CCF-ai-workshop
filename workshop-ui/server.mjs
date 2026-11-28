#!/usr/bin/env node
/**
 * Slim zero-dependency static offline backup server for workshop-ui/dist/.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, "dist");
const parsedPort = Number(process.env.PORT || 3777);
const PORT = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3777;
const HOST = process.env.HOST || "127.0.0.1";

const MIME_TYPES = {
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
  ".mp3": "audio/mpeg",
};

const sendText = (res, status, msg) => {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(msg);
};

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") return sendText(res, 405, "Method Not Allowed");
  if (!fs.existsSync(DIST_DIR)) return sendText(res, 500, "workshop-ui/dist fehlt. Bitte zuerst 'node scripts/build_modules.mjs' und in workshop-ui 'npm run build' ausführen.");

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`).pathname);
  } catch {
    return sendText(res, 400, "Bad Request");
  }
  if (pathname.includes("\0")) return sendText(res, 400, "Bad Request");

  const reqRel = pathname === "/" || pathname === "/beamer" ? "index.html" : pathname.replace(/^\/+/, "");
  let filePath = path.resolve(DIST_DIR, reqRel);
  const rel = path.relative(DIST_DIR, filePath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return sendText(res, 403, "Forbidden");

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    if (path.extname(reqRel)) return sendText(res, 404, "Not Found");
    filePath = path.join(DIST_DIR, "index.html");
  }

  const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
  const stat = fs.statSync(filePath);
  const rangeHeader = req.headers.range;

  if (rangeHeader && /^bytes=\d*-\d*$/i.test(rangeHeader)) {
    const [rawStart, rawEnd] = rangeHeader.replace(/^bytes=/i, "").split("-");
    const start = rawStart ? Number(rawStart) : Math.max(0, stat.size - Number(rawEnd || 0));
    const end = rawStart && rawEnd ? Math.min(stat.size - 1, Number(rawEnd)) : stat.size - 1;
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= stat.size) {
      res.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
      return res.end();
    }
    res.writeHead(206, {
      "Content-Type": contentType,
      "Content-Range": `bytes ${start}-${end}/${stat.size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": String(end - start + 1),
    });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(filePath, { start, end })
      .on("error", () => !res.headersSent && sendText(res, 500, "Read Error"))
      .pipe(res);
    return;
  }

  res.writeHead(200, {
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Content-Length": String(stat.size),
  });
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(filePath).on("error", () => !res.headersSent && sendText(res, 500, "Read Error")).pipe(res);
});

server.on("error", (err) => {
  console.error(`[server] Fehler auf ${HOST}:${PORT}: ${err.message}`);
  process.exit(1);
});

for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => server.close(() => process.exit(0)));

server.listen(PORT, HOST, () => {
  console.log(`\nvirtual7 CCF Prompt-Werkstatt (Offline-Backup)\n  Workshop-App  : http://${HOST}:${PORT}/\n  Workshop-Hub  : http://${HOST}:${PORT}/#/hub\n  Trainer-Bühne : http://${HOST}:${PORT}/#/beamer\n`);
});
