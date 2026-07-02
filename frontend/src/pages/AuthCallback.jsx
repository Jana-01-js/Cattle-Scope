import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallback() {
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const hash = window.location.hash;
    const sid = new URLSearchParams(hash.replace(/^#/, "")).get("session_id");
    if (!sid) { navigate("/login"); return; }
    (async () => {
      try {
        const r = await api.post("/auth/google/session", { session_id: sid });
        localStorage.setItem("cs_token", r.data.token);
        setUser(r.data.user);
        window.history.replaceState({}, document.title, "/dashboard");
        navigate("/dashboard", { replace: true, state: { user: r.data.user } });
      } catch (e) {
        navigate("/login?error=oauth");
      }
    })();
  }, [navigate, setUser]);

  return <div className="min-h-screen grid place-items-center text-stone-500">Signing you in…</div>;
}
