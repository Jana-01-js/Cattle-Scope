"""Cattle Scope backend - FastAPI + MongoDB."""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta
import os, uuid, base64, io, logging, json, httpx, bcrypt, jwt as pyjwt

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Cattle Scope API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("cattlescope")

# ---------- Constants ----------
BREEDS = [
    "Holstein Friesian","Jersey","Gir","Sahiwal","Ongole","Brown Swiss",
    "Red Sindhi","Hallikar","Kankrej","Tharparkar","Hariana","Rathi"
]
DISEASES = [
    "Lumpy Skin Disease","Foot and Mouth Disease","Mastitis","Pink Eye",
    "Ringworm","Foot Rot","Tick Infestation","Dermatitis","Healthy"
]

# ---------- Models ----------
class User(BaseModel):
    user_id: str
    email: str
    name: str
    role: Literal["admin","veterinarian","farmer","researcher"] = "farmer"
    picture: Optional[str] = None
    provider: Literal["email","google"] = "email"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RegisterInput(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Literal["veterinarian","farmer","researcher"] = "farmer"

class LoginInput(BaseModel):
    email: EmailStr
    password: str

class Prediction(BaseModel):
    prediction_id: str
    user_id: str
    image_base64: str
    breed: str
    breed_confidence: float
    disease: str
    disease_confidence: float
    is_healthy: bool
    age_estimate: Optional[str] = None
    weight_estimate: Optional[str] = None
    body_condition_score: Optional[float] = None
    milk_yield_estimate: Optional[str] = None
    treatment: Optional[str] = None
    heatmap_region: Optional[dict] = None
    notes: Optional[str] = None
    created_at: datetime

# ---------- Auth helpers ----------
def create_jwt(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return pyjwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def get_user_from_token(token: str) -> Optional[dict]:
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        uid = payload.get("sub")
        return await db.users.find_one({"user_id": uid}, {"_id": 0})
    except Exception:
        return None

async def get_user_from_session(session_token: str) -> Optional[dict]:
    doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not doc: return None
    exp = doc["expires_at"]
    if isinstance(exp, str): exp = datetime.fromisoformat(exp)
    if exp.tzinfo is None: exp = exp.replace(tzinfo=timezone.utc)
    if exp < datetime.now(timezone.utc): return None
    return await db.users.find_one({"user_id": doc["user_id"]}, {"_id": 0})

async def current_user(request: Request) -> dict:
    # Try Authorization Bearer JWT
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
        user = await get_user_from_token(token)
        if user: return user
        user = await get_user_from_session(token)
        if user: return user
    # Try cookie session_token (Emergent Google)
    st = request.cookies.get("session_token")
    if st:
        user = await get_user_from_session(st)
        if user: return user
    raise HTTPException(401, "Not authenticated")

async def require_admin(user=Depends(current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    return user

# ---------- Health ----------
@api.get("/")
async def root(): return {"message":"Cattle Scope API"}

# ---------- Auth: email/password ----------
@api.post("/auth/register")
async def register(inp: RegisterInput):
    existing = await db.users.find_one({"email": inp.email}, {"_id": 0})
    if existing: raise HTTPException(400, "Email already registered")
    uid = f"user_{uuid.uuid4().hex[:12]}"
    pw_hash = bcrypt.hashpw(inp.password.encode(), bcrypt.gensalt()).decode()
    doc = {
        "user_id": uid, "email": inp.email, "name": inp.name,
        "role": inp.role, "provider": "email",
        "password_hash": pw_hash, "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_jwt(uid)
    return {"token": token, "user": {k:v for k,v in doc.items() if k not in ("password_hash","_id")}}

@api.post("/auth/login")
async def login(inp: LoginInput):
    u = await db.users.find_one({"email": inp.email})
    if not u or not u.get("password_hash"):
        raise HTTPException(401, "Invalid credentials")
    if not bcrypt.checkpw(inp.password.encode(), u["password_hash"].encode()):
        raise HTTPException(401, "Invalid credentials")
    token = create_jwt(u["user_id"])
    u.pop("_id", None); u.pop("password_hash", None)
    return {"token": token, "user": u}

@api.get("/auth/me")
async def me(user=Depends(current_user)):
    user.pop("password_hash", None)
    return user

# ---------- Auth: Emergent Google OAuth ----------
@api.post("/auth/google/session")
async def google_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id: raise HTTPException(400, "session_id required")
    async with httpx.AsyncClient() as hc:
        r = await hc.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}, timeout=15
        )
        if r.status_code != 200:
            raise HTTPException(401, "Invalid session")
        data = r.json()
    email = data["email"]; name = data["name"]; picture = data.get("picture")
    session_token = data["session_token"]
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        uid = existing["user_id"]
        await db.users.update_one({"user_id": uid}, {"$set": {"name": name, "picture": picture}})
    else:
        uid = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": uid, "email": email, "name": name, "role": "farmer",
            "provider": "google", "picture": picture,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    exp = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": uid, "session_token": session_token,
        "expires_at": exp.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response.set_cookie("session_token", session_token, max_age=7*24*3600,
                        httponly=True, secure=True, samesite="none", path="/")
    user = await db.users.find_one({"user_id": uid}, {"_id":0, "password_hash":0})
    return {"user": user, "token": session_token}

@api.post("/auth/logout")
async def logout(request: Request, response: Response):
    st = request.cookies.get("session_token")
    if st: await db.user_sessions.delete_one({"session_token": st})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}

# ---------- ML Prediction (Gemini Vision) ----------
async def gemini_analyze(image_b64: str) -> dict:
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    system = (
        "You are a world-class bovine veterinarian and cattle breed expert. "
        f"Recognize the breed from this list ONLY: {BREEDS}. "
        f"Detect disease from this list ONLY: {DISEASES}. "
        "Return STRICT JSON only, no markdown, no commentary, matching this schema: "
        '{"breed":"<one of list>","breed_confidence":0-100,'
        '"disease":"<one of list>","disease_confidence":0-100,'
        '"is_healthy":true|false,'
        '"age_estimate":"<e.g. 2-3 years>","weight_estimate":"<e.g. 350-400 kg>",'
        '"body_condition_score":1-5,"milk_yield_estimate":"<e.g. 12-15 L/day or N/A>",'
        '"treatment":"<treatment recommendation or preventive care>",'
        '"heatmap_region":{"x":0-1,"y":0-1,"r":0-1,"label":"<affected area>"},'
        '"notes":"<short observation>"}'
    )
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=uuid.uuid4().hex,
                   system_message=system).with_model("gemini","gemini-2.5-flash")
    img = ImageContent(image_base64=image_b64)
    try:
        resp = await chat.send_message(UserMessage(
            text="Analyze this cattle photo. Respond with strict JSON only.",
            file_contents=[img]
        ))
    except Exception as e:
        log.error(f"gemini call failed: {e}")
        return _fallback_prediction()
    text = resp if isinstance(resp, str) else str(resp)
    # strip code fences
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"): text = text[4:]
    try:
        start = text.find("{"); end = text.rfind("}")
        return json.loads(text[start:end+1])
    except Exception as e:
        log.error(f"gemini parse failed: {e}: {text[:200]}")
        return _fallback_prediction()

def _fallback_prediction():
    return {
        "breed":"Holstein Friesian","breed_confidence":50,
        "disease":"Healthy","disease_confidence":50,"is_healthy":True,
        "age_estimate":"unknown","weight_estimate":"unknown",
        "body_condition_score":3.0,"milk_yield_estimate":"N/A",
        "treatment":"Unable to analyze accurately. Please retake image.",
        "heatmap_region":{"x":0.5,"y":0.5,"r":0.2,"label":"n/a"},
        "notes":"Analysis fallback."
    }

@api.post("/predict")
async def predict(request: Request, user=Depends(current_user)):
    body = await request.json()
    b64 = body.get("image_base64","")
    if "," in b64: b64 = b64.split(",",1)[1]
    if not b64: raise HTTPException(400,"image_base64 required")
    result = await gemini_analyze(b64)
    pid = f"pred_{uuid.uuid4().hex[:12]}"
    doc = {
        "prediction_id": pid, "user_id": user["user_id"],
        "image_base64": b64,
        "breed": result.get("breed","Unknown"),
        "breed_confidence": float(result.get("breed_confidence",0)),
        "disease": result.get("disease","Healthy"),
        "disease_confidence": float(result.get("disease_confidence",0)),
        "is_healthy": bool(result.get("is_healthy",True)),
        "age_estimate": result.get("age_estimate"),
        "weight_estimate": result.get("weight_estimate"),
        "body_condition_score": float(result.get("body_condition_score") or 0) or None,
        "milk_yield_estimate": result.get("milk_yield_estimate"),
        "treatment": result.get("treatment"),
        "heatmap_region": result.get("heatmap_region"),
        "notes": result.get("notes"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.predictions.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.get("/predictions")
async def list_predictions(user=Depends(current_user),
                            search: Optional[str]=None,
                            breed: Optional[str]=None,
                            disease: Optional[str]=None,
                            limit: int=Query(50, le=200),
                            skip: int=0):
    q = {"user_id": user["user_id"]}
    if user.get("role")=="admin": q = {}
    if breed: q["breed"] = breed
    if disease: q["disease"] = disease
    if search:
        q["$or"] = [{"breed":{"$regex":search,"$options":"i"}},
                    {"disease":{"$regex":search,"$options":"i"}},
                    {"notes":{"$regex":search,"$options":"i"}}]
    cur = db.predictions.find(q, {"_id":0,"image_base64":0}).sort("created_at",-1).skip(skip).limit(limit)
    return await cur.to_list(limit)

@api.get("/predictions/{pid}")
async def get_prediction(pid: str, user=Depends(current_user)):
    doc = await db.predictions.find_one({"prediction_id": pid}, {"_id":0})
    if not doc: raise HTTPException(404,"Not found")
    if doc["user_id"]!=user["user_id"] and user.get("role")!="admin":
        raise HTTPException(403,"Forbidden")
    return doc

@api.delete("/predictions/{pid}")
async def delete_prediction(pid: str, user=Depends(current_user)):
    doc = await db.predictions.find_one({"prediction_id": pid}, {"_id":0})
    if not doc: raise HTTPException(404,"Not found")
    if doc["user_id"]!=user["user_id"] and user.get("role")!="admin":
        raise HTTPException(403,"Forbidden")
    await db.predictions.delete_one({"prediction_id": pid})
    return {"ok": True}

# ---------- Analytics ----------
@api.get("/analytics/summary")
async def analytics_summary(user=Depends(current_user)):
    q = {} if user.get("role")=="admin" else {"user_id": user["user_id"]}
    total = await db.predictions.count_documents(q)
    healthy = await db.predictions.count_documents({**q, "is_healthy": True})
    diseased = total - healthy
    # Breed distribution
    breed_pipe = [{"$match": q},{"$group":{"_id":"$breed","count":{"$sum":1}}}]
    breeds = await db.predictions.aggregate(breed_pipe).to_list(50)
    disease_pipe = [{"$match": q},{"$group":{"_id":"$disease","count":{"$sum":1}}}]
    diseases = await db.predictions.aggregate(disease_pipe).to_list(50)
    # Trend by day (last 30)
    since = (datetime.now(timezone.utc)-timedelta(days=30)).isoformat()
    trend_cur = db.predictions.find({**q,"created_at":{"$gte":since}}, {"_id":0,"created_at":1,"is_healthy":1})
    trend_map = {}
    async for d in trend_cur:
        day = d["created_at"][:10]
        t = trend_map.setdefault(day, {"date":day,"total":0,"healthy":0,"diseased":0})
        t["total"] += 1
        if d.get("is_healthy"): t["healthy"] += 1
        else: t["diseased"] += 1
    trend = sorted(trend_map.values(), key=lambda x: x["date"])
    return {
        "total": total, "healthy": healthy, "diseased": diseased,
        "breeds": [{"name": b["_id"], "count": b["count"]} for b in breeds],
        "diseases": [{"name": d["_id"], "count": d["count"]} for d in diseases],
        "trend": trend,
    }

# ---------- Chatbot (Gemini text) ----------
@api.post("/chat")
async def chat(request: Request, user=Depends(current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    body = await request.json()
    msg = body.get("message","")
    session_id = body.get("session_id") or user["user_id"]
    if not msg: raise HTTPException(400,"message required")
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=session_id,
                   system_message=("You are Cattle Scope AI Assistant. Help farmers and vets "
                                   "about cattle breeds, diseases, treatment, vaccination, milk yield and general husbandry. "
                                   "Be concise, actionable and clinical. Reply in the user's language.")
                   ).with_model("gemini","gemini-3-flash-preview")
    resp = await chat.send_message(UserMessage(text=msg))
    return {"reply": resp if isinstance(resp,str) else str(resp)}

# ---------- Vaccination Reminders ----------
class VaccinationInput(BaseModel):
    animal_tag: str
    vaccine: str
    due_date: str  # ISO
    notes: Optional[str] = None

@api.post("/vaccinations")
async def create_vax(inp: VaccinationInput, user=Depends(current_user)):
    doc = {"vax_id": f"vax_{uuid.uuid4().hex[:10]}", "user_id": user["user_id"],
           **inp.model_dump(), "completed": False,
           "created_at": datetime.now(timezone.utc).isoformat()}
    await db.vaccinations.insert_one(doc)
    doc.pop("_id",None)
    return doc

@api.get("/vaccinations")
async def list_vax(user=Depends(current_user)):
    cur = db.vaccinations.find({"user_id": user["user_id"]}, {"_id":0}).sort("due_date",1)
    return await cur.to_list(200)

@api.patch("/vaccinations/{vid}")
async def toggle_vax(vid: str, user=Depends(current_user)):
    doc = await db.vaccinations.find_one({"vax_id": vid, "user_id": user["user_id"]}, {"_id":0})
    if not doc: raise HTTPException(404,"Not found")
    await db.vaccinations.update_one({"vax_id": vid}, {"$set":{"completed": not doc.get("completed", False)}})
    return {"ok": True}

@api.delete("/vaccinations/{vid}")
async def del_vax(vid: str, user=Depends(current_user)):
    await db.vaccinations.delete_one({"vax_id": vid, "user_id": user["user_id"]})
    return {"ok": True}

# ---------- PDF Report ----------
@api.get("/predictions/{pid}/pdf")
async def pdf_report(pid: str, user=Depends(current_user)):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle
    from reportlab.lib import colors
    doc = await db.predictions.find_one({"prediction_id": pid}, {"_id":0})
    if not doc: raise HTTPException(404,"Not found")
    if doc["user_id"]!=user["user_id"] and user.get("role")!="admin":
        raise HTTPException(403,"Forbidden")
    buf = io.BytesIO()
    pdf = SimpleDocTemplate(buf, pagesize=A4)
    styles = getSampleStyleSheet()
    story = [Paragraph("<b>Cattle Scope – Diagnostic Report</b>", styles["Title"]), Spacer(1,12)]
    try:
        img_bytes = base64.b64decode(doc["image_base64"])
        story.append(RLImage(io.BytesIO(img_bytes), width=300, height=200))
    except Exception: pass
    story.append(Spacer(1,12))
    rows = [
        ["Prediction ID", doc["prediction_id"]],
        ["Date", doc["created_at"][:19]],
        ["Breed", f'{doc["breed"]} ({doc["breed_confidence"]:.0f}%)'],
        ["Diagnosis", f'{doc["disease"]} ({doc["disease_confidence"]:.0f}%)'],
        ["Healthy", "Yes" if doc.get("is_healthy") else "No"],
        ["Age Estimate", doc.get("age_estimate") or "-"],
        ["Weight Estimate", doc.get("weight_estimate") or "-"],
        ["Body Condition Score", str(doc.get("body_condition_score") or "-")],
        ["Milk Yield Estimate", doc.get("milk_yield_estimate") or "-"],
    ]
    t = Table(rows, colWidths=[150,300])
    t.setStyle(TableStyle([("GRID",(0,0),(-1,-1),0.5,colors.grey),
                           ("BACKGROUND",(0,0),(0,-1),colors.HexColor("#064e3b")),
                           ("TEXTCOLOR",(0,0),(0,-1),colors.white),
                           ("FONTSIZE",(0,0),(-1,-1),10)]))
    story.append(t); story.append(Spacer(1,12))
    story.append(Paragraph("<b>Treatment / Recommendation</b>", styles["Heading3"]))
    story.append(Paragraph(doc.get("treatment") or "-", styles["BodyText"]))
    story.append(Spacer(1,12))
    story.append(Paragraph("<b>Notes</b>", styles["Heading3"]))
    story.append(Paragraph(doc.get("notes") or "-", styles["BodyText"]))
    pdf.build(story)
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf",
                             headers={"Content-Disposition": f'attachment; filename="cattle_report_{pid}.pdf"'})

# ---------- Admin ----------
@api.get("/admin/users")
async def admin_users(user=Depends(require_admin)):
    cur = db.users.find({}, {"_id":0,"password_hash":0}).sort("created_at",-1)
    return await cur.to_list(500)

@api.patch("/admin/users/{uid}/role")
async def admin_set_role(uid: str, request: Request, user=Depends(require_admin)):
    body = await request.json()
    role = body.get("role")
    if role not in ("admin","veterinarian","farmer","researcher"):
        raise HTTPException(400,"invalid role")
    await db.users.update_one({"user_id": uid}, {"$set": {"role": role}})
    return {"ok": True}

@api.delete("/admin/users/{uid}")
async def admin_delete_user(uid: str, user=Depends(require_admin)):
    if uid == user["user_id"]: raise HTTPException(400,"Cannot delete self")
    await db.users.delete_one({"user_id": uid})
    await db.predictions.delete_many({"user_id": uid})
    await db.vaccinations.delete_many({"user_id": uid})
    return {"ok": True}

@api.get("/admin/audit")
async def admin_audit(user=Depends(require_admin)):
    total_users = await db.users.count_documents({})
    total_preds = await db.predictions.count_documents({})
    total_vax = await db.vaccinations.count_documents({})
    recent = await db.predictions.find({}, {"_id":0,"image_base64":0}).sort("created_at",-1).limit(20).to_list(20)
    return {"total_users": total_users, "total_predictions": total_preds,
            "total_vaccinations": total_vax, "recent": recent}

# ---------- Reference lists ----------
@api.get("/reference/breeds")
async def ref_breeds(): return BREEDS

@api.get("/reference/diseases")
async def ref_diseases(): return DISEASES

# ---------- Seed admin ----------
@app.on_event("startup")
async def seed():
    admin_email = "admin@cattlescope.ai"
    exists = await db.users.find_one({"email": admin_email})
    if not exists:
        pw = bcrypt.hashpw(b"Admin@123", bcrypt.gensalt()).decode()
        await db.users.insert_one({
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": admin_email, "name": "Cattle Scope Admin",
            "role": "admin", "provider": "email", "password_hash": pw,
            "picture": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        log.info("Seeded admin account")

app.include_router(api)
app.add_middleware(CORSMiddleware, allow_credentials=True,
                   allow_origins=os.environ.get("CORS_ORIGINS","*").split(","),
                   allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown(): client.close()
