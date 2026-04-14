# ForeAI 🏌️ — AI Golf Swing Coach

> Upload your swing. Get frame-by-frame AI coaching. Improve faster.

**Live at:** [foreai.app](https://foreai.app)

---

## What it does

ForeAI lets golfers upload a swing video, extract key frames, and receive detailed AI-powered coaching via Claude's vision model. Results are saved to a personal dashboard so users can track improvement over time.

**Features:**
- Video upload + automatic frame extraction (8 key frames)
- Manual frame capture by scrubbing the video
- AI analysis covering: setup, backswing, top position, downswing, impact, follow-through
- Overall swing score + per-phase scores
- Prioritized drills with YouTube links
- Pros to study based on your specific issues
- Full history dashboard — revisit any past session
- 3 free analyses per user per day (abuse protection)
- Secure JWT auth with bcrypt password hashing

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite, hosted on Railway |
| Backend | Node.js + Express, hosted on Railway |
| Database | PostgreSQL, hosted on Railway |
| AI | Anthropic Claude (vision model) |
| Auth | JWT + bcrypt |
| Domain | foreai.app (GoDaddy → Railway CNAME) |

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL running locally (or use Railway's DB)
- Anthropic API key

### 1. Clone and install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Set up environment variables

**Backend** — copy `.env.example` to `.env` and fill in:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/foreai
JWT_SECRET=some-long-random-string-at-least-32-chars
ANTHROPIC_API_KEY=sk-ant-...
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
PORT=3001
```

**Frontend** — copy `.env.example` to `.env`:
```
VITE_API_URL=http://localhost:3001/api
```

### 3. Create the local database

```bash
psql -U postgres -c "CREATE DATABASE foreai;"
```

The tables are created automatically when the backend starts.

### 4. Run locally

```bash
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — frontend
cd frontend
npm run dev
```

Visit `http://localhost:5173`

---

## Deploying to Railway

### Step 1: Create a Railway project

1. Go to [railway.app](https://railway.app) and create a new project
2. You'll create **3 services**: PostgreSQL, Backend, Frontend

### Step 2: Add PostgreSQL

1. In your Railway project, click **+ New Service → Database → PostgreSQL**
2. Railway provisions it instantly — copy the `DATABASE_URL` from the service's Variables tab

### Step 3: Deploy the Backend

1. Click **+ New Service → GitHub Repo**
2. Connect your GitHub repo, set the **root directory** to `/backend`
3. Add these environment variables in Railway's Variables tab:

```
DATABASE_URL        = (paste from PostgreSQL service — use the internal URL)
JWT_SECRET          = (generate: openssl rand -base64 32)
ANTHROPIC_API_KEY   = sk-ant-your-key-here
FRONTEND_URL        = https://foreai.app
NODE_ENV            = production
```

4. Railway will auto-detect Node and deploy. Check the deploy logs.
5. Copy your backend's Railway URL (e.g. `https://foreai-backend.up.railway.app`)

### Step 4: Deploy the Frontend

1. Click **+ New Service → GitHub Repo**
2. Connect same repo, set **root directory** to `/frontend`
3. Add this environment variable:

```
VITE_API_URL = https://your-backend-name.up.railway.app/api
```

4. Deploy and copy your frontend Railway URL

### Step 5: Connect your GoDaddy domain

1. In GoDaddy DNS settings, add a **CNAME record**:
   - Name: `@` (or `www`)
   - Value: your Railway frontend URL (without https://)
2. In Railway, go to your frontend service → Settings → **Custom Domain**
3. Add `foreai.app` — Railway will handle SSL automatically

⚠️ DNS propagation can take up to 48 hours but is usually under 30 minutes.

---

## Project Structure

```
foreai/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express server entry
│   │   ├── db/index.js           # PostgreSQL pool + schema init
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT verification
│   │   │   └── quota.js          # Daily usage limiter
│   │   ├── routes/
│   │   │   ├── auth.js           # /api/auth (register, login, me)
│   │   │   ├── analyze.js        # /api/analyze (swing analysis)
│   │   │   └── history.js        # /api/history (sessions + quota)
│   │   └── services/
│   │       └── claude.js         # Anthropic API integration
│   ├── .env.example
│   ├── railway.toml
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx               # Router + protected routes
    │   ├── api/index.js          # Fetch helpers
    │   ├── components/
    │   │   ├── AuthContext.jsx   # Global auth state
    │   │   └── AnalysisReport.jsx# Full coaching report UI
    │   └── pages/
    │       ├── AuthPage.jsx      # Login + register
    │       ├── AnalyzePage.jsx   # Main analyzer
    │       └── HistoryPage.jsx   # Past sessions
    ├── index.html
    ├── vite.config.js
    ├── .env.example
    ├── railway.toml
    └── package.json
```

---

## Adjusting the Daily Limit

In `backend/src/middleware/quota.js`, change:
```js
const DAILY_LIMIT = 3;  // ← change this
```

---

## Cost Estimate

| Service | Cost |
|---------|------|
| Railway (2 services + Postgres) | ~$10/month |
| Anthropic API | ~$0.02–0.05 per analysis |
| GoDaddy domain (foreai.app) | ~$15/year |
| **Total for 100 analyses/month** | **~$12–15/month** |

---

## Security Notes

- Passwords hashed with bcrypt (12 rounds)
- JWTs expire after 30 days
- Rate limiting: 100 req/15min globally, 20 req/15min on auth routes
- Per-user daily quota enforced server-side (not bypassable client-side)
- Video frames processed in memory — nothing stored on server
- CORS locked to your frontend URL in production

---

Built with ❤️ and a healthy obsession with better ball striking.
