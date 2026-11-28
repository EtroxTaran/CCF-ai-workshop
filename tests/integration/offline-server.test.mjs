import test from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SERVER_PATH = path.join(ROOT, "workshop-ui", "server.mjs");

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function waitForListening(proc, url, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (proc.exitCode !== null) {
      throw new Error(`server.mjs exited early with code ${proc.exitCode}`);
    }
    try {
      const res = await fetch(url);
      if (res.status > 0) return;
    } catch {
      await new Promise((r) => setTimeout(r, 120));
    }
  }
  throw new Error(`Timed out waiting for ${url}`);
}

test("offline server serves dist, catalog JSON, MIME types, 206 ranges, 403 traversal guard, and 405", async () => {
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const proc = spawn(process.execPath, [SERVER_PATH], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    await waitForListening(proc, `${baseUrl}/`);

    const rootRes = await fetch(`${baseUrl}/`);
    assert.equal(rootRes.status, 200);
    assert.match(rootRes.headers.get("content-type") || "", /text\/html/);
    const html = await rootRes.text();
    assert.match(html, /Prompt-Werkstatt/);

    const catRes = await fetch(`${baseUrl}/modules/catalog.json`);
    assert.equal(catRes.status, 200);
    assert.match(catRes.headers.get("content-type") || "", /application\/json/);
    const catalog = await catRes.json();
    assert.ok(Array.isArray(catalog.modules) && catalog.modules.length >= 2);

    const spaRes = await fetch(`${baseUrl}/beamer`);
    assert.equal(spaRes.status, 200);
    assert.match(spaRes.headers.get("content-type") || "", /text\/html/);

    const missingAssetRes = await fetch(`${baseUrl}/does-not-exist.js`);
    assert.equal(missingAssetRes.status, 404);

    // Path traversal attempt (normalized by URL parser to 404 or blocked at 403 — never 200)
    const http = await import("node:http");
    const traversal = await new Promise((resolve, reject) => {
      const req = http.request(
        { host: "127.0.0.1", port, path: "/%2e%2e/package.json", method: "GET" },
        (res) => {
          let body = "";
          res.on("data", (d) => (body += d));
          res.on("end", () => resolve({ status: res.statusCode, body }));
        }
      );
      req.on("error", reject);
      req.end();
    });
    assert.ok(traversal.status === 403 || traversal.status === 404, `Unexpected traversal status ${traversal.status}`);
    assert.doesNotMatch(traversal.body, /"dependencies"|"devDependencies"/);

    const postRes = await fetch(`${baseUrl}/`, { method: "POST" });
    assert.equal(postRes.status, 405);

    const rangeRes = await fetch(`${baseUrl}/`, { headers: { Range: "bytes=0-31" } });
    assert.equal(rangeRes.status, 206);
    const chunk = await rangeRes.text();
    assert.equal(Buffer.byteLength(chunk, "utf8"), 32);
  } finally {
    proc.kill("SIGTERM");
    await new Promise((resolve) => proc.once("exit", resolve));
  }
});
