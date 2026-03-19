# Who Wants to Be a Deployer 🌅

Dawn Internet Ecosystem — Educational Web3 Quiz Game

## Deploy to Vercel (free, ~3 minutes)

### Option A — GitHub + Vercel (recommended, auto-deploys on every update)

1. **Push to GitHub**
   - Go to github.com → New repository → name it `deployer-quiz` → Public
   - Upload all these files (drag the whole folder)

2. **Deploy on Vercel**
   - Go to vercel.com → Sign up free with GitHub
   - Click "Add New Project" → Import your `deployer-quiz` repo
   - Framework preset will auto-detect as **Vite**
   - Click **Deploy** — done in ~60 seconds
   - You get a URL like `deployer-quiz.vercel.app`

### Option B — Vercel CLI (fastest)

```bash
npm install -g vercel
cd deployer-quiz
npm install
vercel --prod
```

Follow the prompts — it'll give you a live URL immediately.

---

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Music

The anthem streams from Archive.org automatically in a real browser.
Tap the ▶ button (bottom right) on first load to start it.
