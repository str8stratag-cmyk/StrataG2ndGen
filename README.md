# StrataG2ndGen — AI Emergency Dispatch System

**A complete rebuild of the StrataG Dispatch app** with proper architecture, real API integration, and the services you wanted: **Google Gemini 2.5** for audio transcription + AI analysis, and **Vonage** for SMS/WhatsApp messaging.

---

## 🏗️ What Gemini Broke (And What We Fixed)

| Issue | Original (Gemini's mess) | StrataG2ndGen (Fixed) |
|-------|---------------------------|----------------------|
| **Folder structure** | Backend folder had React/Vite files mixed with Express server | Clean separation: `backend/` and `frontend/` |
| **Missing routes** | `index.js` imported 6 routes but only 2 existed | All 7 routes implemented (incidents, drivers, radio-calls, auth, analytics, vonage, transcription) |
| **Broken Vonage** | Fake URL `https://api-us.://vonage.com` + hardcoded secrets | Proper `@vonage/server-sdk` with env vars |
| **No real DB** | `localStorage` only, no backend persistence | PostgreSQL with proper schema, migrations, real driver data |
| **No transcription** | Simulated fake radio calls only | Real Gemini 2.5 audio transcription + AI analysis in ONE call |
| **Missing logger** | `../utils/logger.js` imported but didn't exist | Working Winston logger with console + file output |
| **Hardcoded DB credentials** | Plaintext connection string in `db.js` | Environment variable based |
| **Orphaned Python** | 5 Python files that did nothing | Removed — clean Node.js stack only |
| **762-line App.tsx** | Single massive component | Modular React components with proper state management |
| **Twilio references everywhere** | Functions named `handleSendTwilioAlert` | All references properly say Vonage/SMS |
| **No real-time** | WebSocket setup but not connected to data | Full Socket.io with rooms for dispatchers, drivers, incidents |
| **Groq wasted** | Paid Groq API for analysis (not needed) | **Gemini 2.5 does both transcription AND analysis for FREE** |
| **No real drivers** | Hardcoded "driver1" mock data | **4 real tow drivers** with actual phone numbers in the database |
| **No geolocation** | Simulated static dispatch | **Nominatim geocoding** + proximity-based auto-dispatch |
| **Rangecast confusion** | Referenced Rangecast streaming service | **V8s audio interface + BM800 mic** on designated device |

---

## 🚀 Quick Start

### 1. Clone / Navigate

```bash
cd ~/Documents/kimi/workspace/StrataG2ndGen
```

### 2. Set up PostgreSQL

**Option A — Docker (easiest for local dev):**
```bash
docker-compose up -d postgres
```

**Option B — Railway (production hosting):**
Railway automatically provisions PostgreSQL. Set `DATABASE_URL` in your Railway project settings.

**Option C — Neon / Supabase:**
```bash
# Copy your PostgreSQL connection string
```

### 3. Configure Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your real API keys
```

Required env vars:
- `DATABASE_URL` — PostgreSQL connection string (Railway provides this automatically)
- `VONAGE_API_KEY` + `VONAGE_API_SECRET` — from [developer.vonage.com](https://developer.vonage.com)
- `GEMINI_API_KEY` — from [aistudio.google.com](https://aistudio.google.com/app/apikey) (FREE tier — 1500 requests/day!)

**No Groq API key needed.** Gemini 2.5 handles transcription AND analysis in a single API call.

### 4. Install & Run Backend

```bash
cd backend
npm install
npm run migrate    # Creates database tables
npm run seed       # Adds your 4 real drivers
npm run dev        # Starts on port 4000
```

### 5. Install & Run Frontend

```bash
cd ../frontend
npm install
npm run dev        # Starts on port 5173
```

Open `http://localhost:5173` in your browser.

---

## 📁 Architecture

```
StrataG2ndGen/
├── backend/                    # Express + Socket.io API
│   ├── index.js               # Main server entry
│   ├── database.js            # PostgreSQL connection pool
│   ├── websocket.js           # Real-time Socket.io events
│   ├── config.js              # Environment configuration
│   ├── routes/                # API endpoints
│   │   ├── incidents.js       # CRUD + dispatch + proximity auto-dispatch
│   │   ├── drivers.js         # Driver fleet management (4 real drivers seeded)
│   │   ├── radio-calls.js     # Radio call logging + search
│   │   ├── vonage.js          # SMS + WhatsApp endpoints
│   │   ├── transcription.js   # Gemini 2.5 audio upload + auto-incident creation
│   │   ├── auth.js            # JWT login
│   │   └── analytics.js       # Dashboard stats + KPIs
│   ├── services/              # External API integrations
│   │   ├── vonage.js          # Vonage SDK (SMS/WhatsApp)
│   │   └── gemini.js          # Gemini 2.5 (transcription + AI analysis — FREE)
│   ├── utils/
│   │   └── logger.js          # Winston logging
│   └── .env.example           # Template for env vars (NO GROQ needed!)
├── frontend/                  # React + Vite + Tailwind
│   ├── src/
│   │   ├── App.tsx            # Main app (connects to real API)
│   │   ├── services/
│   │   │   ├── api.ts         # Axios backend client
│   │   │   └── socket.ts      # Socket.io real-time
│   │   ├── components/        # UI components
│   │   ├── types/dispatch.ts  # TypeScript interfaces
│   │   └── utils/             # Geo math, keyword detection
│   └── index.html
├── database/
│   ├── schema.sql             # PostgreSQL tables + indexes
│   ├── migrate.js             # Run schema
│   └── seed.js                # 4 REAL drivers (PJ, Zach, Ted, Jay)
└── docker-compose.yml         # One-command PostgreSQL setup
```

---

## 🔑 Key Features

### Audio Pipeline (V8s + BM800 Microphone)
```
Live Law Enforcement Radio → V8s Audio Interface → BM800 Mic →
Designated Capture Device → Base64 Upload → POST /api/transcription/audio
```

A designated device (computer/tablet) with the V8s audio interface and BM800 microphone captures live radio audio. The device uploads base64-encoded audio to the backend. **No Rangecast subscription needed.**

### Transcription + AI Analysis (Gemini 2.5 — FREE!)
```
Audio Upload → Gemini 2.5 transcribes + analyzes in ONE call →
Signal 4 detected? → Nominatim geocoding → Auto-create incident →
Haversine distance calc → Dispatch closest driver → Vonage SMS →
Socket.io broadcast to all dispatchers
```

**Gemini 2.5 Flash** (`gemini-2.5-flash-preview-05-20`) handles everything:
- **Audio transcription** from WAV/MP3
- **Incident analysis** — extracts type, severity, location, unit numbers, keywords
- **Confidence scoring** for each field
- **FREE tier**: 1500 requests/day — more than enough for your operation

**No Groq needed.** No Whisper needed. One API, one call, zero cost.

### Vonage Messaging
- **SMS** — Standard text dispatch to tow drivers
- **WhatsApp** — Rich message dispatch (same API, different channel)
- **Inbound webhooks** — Handle driver replies (confirmations, ETAs)
- **Delivery status** — Track message delivery in real-time

### Auto-Dispatch by Proximity
When a Signal 4 is detected from radio transcription:
1. **Geocode** the incident location using Nominatim (OpenStreetMap)
2. **Calculate** Haversine distance between all available drivers and the incident
3. **Assign** the closest available driver
4. **Send** Vonage SMS dispatch with location and ETA
5. **Update** driver status to `EN_ROUTE`
6. **Broadcast** to all dispatchers via Socket.io

### Real Driver Fleet (Seeded)
Your database is seeded with 4 real tow drivers:
- **PJ** — Phone: 16562151523
- **Zach** — Phone: 18133594168
- **Ted** — Phone: 17277177054
- **Jay** — Phone: 18138186108

Each has a static location in the Tampa area for proximity dispatch calculations.

### Real-Time Dashboard
- Socket.io broadcasts for: new incidents, driver status changes, Signal 4 alerts
- Live map with OpenStreetMap + Leaflet
- Driver locations update in real-time
- Auto-dispatch mode (toggle on/off)

---

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Server + DB status |
| `/api/radio-calls` | GET | List all radio calls |
| `/api/radio-calls` | POST | Log new radio call |
| `/api/radio-calls/transcribe` | POST | Upload audio, get Gemini transcription + analysis |
| `/api/transcription/audio` | POST | Audio → Gemini 2.5 → auto-incident → auto-dispatch |
| `/api/transcription/analyze-text` | POST | Text → Gemini analysis (no audio needed) |
| `/api/incidents` | GET/POST | List / create incidents |
| `/api/incidents/:id/dispatch` | POST | Dispatch incident to driver |
| `/api/incidents/:id/status` | PATCH | Update incident status |
| `/api/drivers` | GET/POST | List / create drivers |
| `/api/drivers/:id/status` | PATCH | Update driver status |
| `/api/vonage/sms` | POST | Send SMS |
| `/api/vonage/whatsapp` | POST | Send WhatsApp |
| `/api/vonage/dispatch` | POST | Send dispatch alert |
| `/api/vonage/balance` | GET | Check Vonage account balance |
| `/api/analytics/dashboard` | GET | Dashboard KPIs |
| `/api/analytics/performance` | GET | Shift performance metrics |
| `/api/auth/login` | POST | JWT login |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Tailwind CSS, Leaflet Maps, Socket.io-client |
| **Backend** | Express, Socket.io, PostgreSQL (pg), Winston |
| **Transcription + AI** | Google Gemini 2.5 (`@google/genai`) — **FREE, handles both** |
| **Messaging** | Vonage Server SDK (`@vonage/server-sdk`) |
| **Geocoding** | Nominatim (OpenStreetMap) — free, no API key needed |
| **Auth** | JWT (`jsonwebtoken`) + bcrypt |
| **DevOps** | Docker Compose, Railway, Nodemon |

---

## 🚀 Deploy to Railway + GitHub

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "StrataG2ndGen — AI Dispatch System"
git remote add origin https://github.com/YOUR_USERNAME/StrataG2ndGen.git
git push -u origin main
```

### 2. Deploy to Railway
1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `StrataG2ndGen` repository
4. Railway will auto-detect the Node.js backend
5. Add a **PostgreSQL** database: Click **New** → **Database** → **Add PostgreSQL**
6. Railway automatically sets `DATABASE_URL` — no manual config needed!
7. Add your environment variables:
   - `VONAGE_API_KEY`
   - `VONAGE_API_SECRET`
   - `GEMINI_API_KEY` (FREE — get at [aistudio.google.com](https://aistudio.google.com/app/apikey))
   - `JWT_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
8. Click **Deploy** — Railway builds and deploys automatically

### 3. Frontend Deploy
Option A: Railway can also serve the frontend (build `frontend/` and serve static files)
Option B: Deploy frontend to Vercel/Netlify and point `FRONTEND_URL` env var to it

### Railway Free Tier
- **Compute**: 500 hours/month (plenty for your app)
- **PostgreSQL**: Included free with your project
- **Custom domains**: Add your `StrataG.site` domain in Railway settings
- **No credit card needed** for starter projects

---

## 📞 Contact

**Zach Daniels | StrataG Tech**  
Office: 813-540-2469  
Cell: 813-259-4168  
Email: Zach@StrataG.site  
Website: StrataG.site / StrataG.info

---

*StrataG2ndGen — Strategy Meets Technology, Rebuilt Right.*
