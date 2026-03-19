// Local dev proxy server — run with: node server.js
// Mimics the Vercel /api/proxy function for local testing
// Serves the Vite dev build AND proxies AI API calls

const http = require("http");
const https = require("https");
const { execSync, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const PROXY_PORT = 3001; // proxy runs here
const VITE_PORT  = 5173; // vite dev server

// ── Proxy server ─────────────────────────────────────────────
const proxyServer = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.writeHead(200); res.end(); return; }

  if (req.method !== "POST" || req.url !== "/api/proxy") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  let body = "";
  req.on("data", chunk => { body += chunk; });
  req.on("end", async () => {
    try {
      const { provider, apiKey, payload } = JSON.parse(body);

      let hostname, path_, headers;

      if (provider === "openai") {
        hostname = "api.openai.com";
        path_ = "/v1/chat/completions";
        headers = { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` };
      } else if (provider === "grok") {
        hostname = "api.x.ai";
        path_ = "/v1/chat/completions";
        headers = { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` };
      } else if (provider === "gemini") {
        hostname = "generativelanguage.googleapis.com";
        path_ = `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        headers = { "Content-Type": "application/json" };
      } else {
        res.writeHead(400); res.end(JSON.stringify({ error: "Unsupported provider" })); return;
      }

      const bodyStr = JSON.stringify(payload);
      const options = {
        hostname, path: path_, method: "POST",
        headers: { ...headers, "Content-Length": Buffer.byteLength(bodyStr) },
      };

      const proxyReq = https.request(options, proxyRes => {
        let data = "";
        proxyRes.on("data", chunk => { data += chunk; });
        proxyRes.on("end", () => {
          res.writeHead(proxyRes.statusCode, { "Content-Type": "application/json" });
          res.end(data);
        });
      });

      proxyReq.on("error", err => {
        res.writeHead(500); res.end(JSON.stringify({ error: err.message }));
      });

      proxyReq.write(bodyStr);
      proxyReq.end();
    } catch (err) {
      res.writeHead(500); res.end(JSON.stringify({ error: err.message }));
    }
  });
});

proxyServer.listen(PROXY_PORT, () => {
  console.log(`✓ Proxy server running at http://localhost:${PROXY_PORT}/api/proxy`);
});

// ── Start Vite ────────────────────────────────────────────────
console.log("Starting Vite dev server...");
const vite = spawn("npx", ["vite", "--port", String(VITE_PORT)], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

vite.on("error", err => console.error("Vite error:", err));
vite.on("close", code => { console.log("Vite exited", code); process.exit(code); });

process.on("SIGINT", () => { vite.kill(); process.exit(0); });
