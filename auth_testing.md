# Auth Testing Playbook
Test seeded admin via /api/auth/login with `admin@cattlescope.ai` / `Admin@123`. JWT is returned; use it as `Authorization: Bearer <token>` for protected endpoints.
For Emergent Google auth flow: /api/auth/google/session accepts `{"session_id": ...}` from browser fragment. Session token stored in DB and set as `session_token` httpOnly cookie.
