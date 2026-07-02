# Cattle Scope

AI-powered cattle breed recognition & disease detection — React + FastAPI + MongoDB + Gemini Vision.

Live demo: https://cattle-scope.emergent.host

## Features

- 12 cattle breeds (Holstein, Jersey, Gir, Sahiwal, Ongole, Brown Swiss, Red Sindhi, Hallikar, Kankrej, Tharparkar, Hariana, Rathi)
- 9 disease classes (Lumpy Skin, FMD, Mastitis, Pink Eye, Ringworm, Foot Rot, Tick Infestation, Dermatitis, Healthy)
- Gemini 2.5 vision analysis with confidence scores + Grad-CAM style heatmap
- JWT + Google OAuth authentication (Emergent-managed)
- Vitals estimation (age / weight / body condition / milk yield)
- Vaccination reminders CRUD
- AI chatbot assistant
- Analytics dashboard (Recharts: pie, bar, stacked trend)
- Admin panel (users, roles, audit stats)
- PDF diagnostic reports (ReportLab)
- Prediction history with search & filters

## Tech stack

- **Frontend**: React 19, Tailwind CSS, Shadcn UI, Recharts, Framer Motion, React Router 7
- **Backend**: FastAPI, Motor (async MongoDB), bcrypt, PyJWT, ReportLab
- **AI**: Gemini 2.5 Flash via `emergentintegrations`
- **DB**: MongoDB

## Local setup

### Prereqs
- Python 3.11+
- Node.js 18+
- Yarn (`npm install -g yarn`)
- MongoDB running locally (or a hosted URI)
- An Emergent LLM key (from https://app.emergent.sh → Profile → Universal Key)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
cp .env.example .env
# edit .env — set EMERGENT_LLM_KEY and (optionally) MONGO_URL / DB_NAME
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Backend now serves at `http://localhost:8001` — Swagger docs at `/docs`.

A default admin is auto-seeded on first run:
- **Email**: `admin@cattlescope.ai`
- **Password**: `Admin@123`

### Frontend

```bash
cd frontend
yarn install
cp .env.example .env
# .env already points to http://localhost:8001
yarn start
```

Frontend opens at `http://localhost:3000`.

## Project structure

```
.
├── backend/
│   ├── server.py           # all FastAPI routes
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.js          # router
│   │   ├── pages/          # Landing, Login, Register, Dashboard, Predict, PredictionDetail, History, Analytics, Admin, Profile, Assistant, NotFound, AuthCallback
│   │   ├── components/     # Header, ProtectedRoute, ui/ (shadcn)
│   │   ├── context/        # AuthContext
│   │   └── lib/            # api.js (axios client)
│   ├── package.json
│   └── .env.example
├── memory/
│   ├── PRD.md
│   └── test_credentials.md
└── README.md
```

## API overview

All routes prefixed with `/api`. Full schema at `/docs` (Swagger).

**Auth**: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/google/session`, `POST /auth/logout`
**Predictions**: `POST /predict`, `GET /predictions`, `GET /predictions/{id}`, `DELETE /predictions/{id}`, `GET /predictions/{id}/pdf`
**Analytics**: `GET /analytics/summary`
**Vaccinations**: `POST /vaccinations`, `GET /vaccinations`, `PATCH /vaccinations/{id}`, `DELETE /vaccinations/{id}`
**Chat**: `POST /chat`
**Admin**: `GET /admin/users`, `PATCH /admin/users/{uid}/role`, `DELETE /admin/users/{uid}`, `GET /admin/audit`
**Reference**: `GET /reference/breeds`, `GET /reference/diseases`

## Environment variables

### Backend `.env`
| Var | Description |
|-----|-------------|
| `MONGO_URL` | MongoDB connection URI |
| `DB_NAME` | Mongo database name |
| `CORS_ORIGINS` | Comma-separated allowed origins (or `*`) |
| `JWT_SECRET` | Random string for signing JWTs |
| `EMERGENT_LLM_KEY` | Emergent Universal LLM key |

### Frontend `.env`
| Var | Description |
|-----|-------------|
| `REACT_APP_BACKEND_URL` | Backend base URL (no trailing slash) |

## License

MIT
