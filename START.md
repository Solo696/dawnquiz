# Local Testing — Who Wants to Be a Deployer

## One-time setup
```
npm install
```

## Run locally (with AI proxy working)
```
node server.js
```

Then open → http://localhost:5173

That's it. The proxy server handles Gemini, Grok, and OpenAI calls.
Claude (Anthropic) calls go direct — no proxy needed.

---

## How it works
- `node server.js` starts TWO things at once:
  - Vite dev server on port 5173 (the app)
  - Proxy server on port 3001 (AI API relay)
- Vite forwards any `/api/proxy` calls → port 3001
- Port 3001 forwards them to the real AI APIs server-side (no CORS)

## Deploy to Vercel
Push to GitHub → import in Vercel → done.
The `api/proxy.js` file is the same proxy, just running as a Vercel function.
