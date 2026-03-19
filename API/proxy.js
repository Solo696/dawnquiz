// Vercel serverless function — proxies AI API requests to bypass CORS
// Auto-detected by Vercel at /api/proxy

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;

  // Vercel may not auto-parse if Content-Type isn't set correctly
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Invalid JSON body" }); }
  }

  const { provider, apiKey, payload } = body || {};

  if (!provider || !apiKey || !payload) {
    return res.status(400).json({ error: "Missing provider, apiKey, or payload" });
  }

  let url, headers;

  if (provider === "anthropic") {
    url = "https://api.anthropic.com/v1/messages";
    headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    };
  } else if (provider === "openai") {
    url = "https://api.openai.com/v1/chat/completions";
    headers = { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` };
  } else if (provider === "grok") {
    url = "https://api.x.ai/v1/chat/completions";
    headers = { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` };
  } else if (provider === "groq") {
    url = "https://api.groq.com/openai/v1/chat/completions";
    headers = { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` };
  } else if (provider === "gemini") {
    url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    headers = { "Content-Type": "application/json" };
  } else {
    return res.status(400).json({ error: "Unsupported provider: " + provider });
  }

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await upstream.json();
    return res.status(upstream.ok ? 200 : upstream.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Proxy fetch failed" });
  }
}
