import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);

  const onSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await login(email,password); toast.success("Welcome back"); nav("/dashboard"); }
    catch(err){ toast.error(err.response?.data?.detail || "Login failed"); }
    finally { setLoading(false); }
  };

  const google = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirect = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirect)}`;
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-stone-50">
      <div className="hidden lg:block relative">
        <img src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1200&q=80" className="absolute inset-0 w-full h-full object-cover" alt=""/>
        <div className="absolute inset-0 bg-emerald-950/40"></div>
        <div className="relative p-12 text-white h-full flex flex-col justify-end">
          <h2 className="text-4xl font-display font-semibold">Welcome back.</h2>
          <p className="mt-3 text-emerald-100 max-w-md">Sign in to analyze cattle images, review history, and manage your herd.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
          <Link to="/" className="text-sm text-stone-500 hover:text-emerald-900">← Back</Link>
          <h1 className="mt-4 text-3xl font-display font-semibold text-emerald-950">Sign in</h1>
          <p className="text-stone-500 mt-1">Access your Cattle Scope account</p>

          <Button variant="outline" onClick={google} className="w-full mt-6 rounded-lg" data-testid="google-signin-btn">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.4-.2-2H12v3.8h5.9c-.1.9-.8 2.4-2.3 3.4l-.02.15 3.35 2.6.2.02c2.13-1.97 3.4-4.87 3.4-8.3z"/><path fill="#34A853" d="M12 23c3 0 5.6-1 7.4-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7l-.13.01-3.5 2.7-.05.13C3.8 20.5 7.6 23 12 23z"/><path fill="#FBBC05" d="M5.6 14c-.2-.6-.4-1.3-.4-2s.1-1.4.4-2l-.01-.13L2 7.15l-.11.05C1.3 8.7 1 10.3 1 12s.3 3.3.9 4.8L5.6 14z"/><path fill="#EA4335" d="M12 5c2.1 0 3.6.9 4.4 1.7l3.2-3.1C17.5 1.9 14.9 1 12 1 7.6 1 3.8 3.5 1.9 7.2L5.6 10c1-2.6 3.4-4.7 6.4-4.7z"/></svg>
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-stone-400 uppercase tracking-[0.2em]">
            <div className="flex-1 h-px bg-stone-200"/>or<div className="flex-1 h-px bg-stone-200"/>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input data-testid="login-email-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@farm.com"/>
            </div>
            <div>
              <Label>Password</Label>
              <Input data-testid="login-password-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••"/>
            </div>
            <Button data-testid="login-submit-btn" disabled={loading} type="submit" className="w-full bg-emerald-900 hover:bg-emerald-800 text-white rounded-lg">
              {loading? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-stone-500 text-center">
            No account? <Link to="/register" className="text-emerald-900 font-medium hover:underline" data-testid="link-to-register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
