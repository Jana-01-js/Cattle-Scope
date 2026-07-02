# Cattle Scope — PRD

## Original problem statement
Build "Cattle Scope" — an AI-powered cattle breed recognition & disease detection full-stack system with landing, auth (JWT + Google), image upload with AI diagnosis, dashboard, history, analytics, admin panel, PDF reports, vaccination reminders, chatbot assistant.

## Stack (adapted to Emergent env)
- React 19 + Tailwind + Shadcn UI + Recharts + Framer Motion (Outfit/IBM Plex Sans fonts)
- FastAPI + Motor (MongoDB) + JWT (bcrypt) + Emergent Google OAuth
- Gemini 2.5 Flash (vision) via Emergent LLM key
- ReportLab (PDF export)

## User personas
- **Farmer** — quick image scan + vaccination reminders + treatment guidance
- **Veterinarian** — clinical PDF reports, history, herd analytics
- **Researcher** — breed/disease analytics + downloadable data
- **Administrator** — user/role management, audit stats
- **Guest** — landing/marketing pages

## Core requirements (v1 shipped)
- Landing (bento grid + hero) ✅
- JWT register/login + Emergent Google OAuth ✅
- Image upload (drag-drop, camera, file) ✅
- AI predict (Gemini vision → breed, disease, confidence, vitals, treatment, heatmap region) ✅
- Prediction detail with Grad-CAM style heatmap overlay ✅
- History (search + breed/disease filter) ✅
- Analytics (pie + bar + stacked daily trend) ✅
- Admin panel (users list, role change, delete) ✅
- Vaccination CRUD ✅
- AI chatbot assistant ✅
- PDF diagnostic report export ✅
- 404 page ✅
- Seeded admin: admin@cattlescope.ai / Admin@123

## Backlog (P1)
- Multi-image batch upload
- CSV / Excel export
- Vaccination email reminders (SendGrid)
- Nearby veterinary clinics (Maps API)
- Multi-language: Tamil / Hindi / English

## Backlog (P2)
- SMS / WhatsApp notifications (Twilio)
- Weather API + disease outbreak heatmap
- Multi-farm collaboration
- QR / RFID animal identification
- PWA + offline mode

## What's implemented — 2026-02-XX
All P0 requirements above; 100% backend + 100% frontend testing pass (iteration_2.json).
