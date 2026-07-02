import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form,setForm] = useState({name:"", email:"", password:"", role:"farmer"});
  const [loading,setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await register(form); toast.success("Account created"); nav("/dashboard"); }
    catch(err) { toast.error(err.response?.data?.detail || "Registration failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-stone-50">
      <div className="flex items-center justify-center p-6 order-2 lg:order-1">
        <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
          <Link to="/" className="text-sm text-stone-500 hover:text-emerald-900">← Back</Link>
          <h1 className="mt-4 text-3xl font-display font-semibold text-emerald-950">Create account</h1>
          <p className="text-stone-500 mt-1">Start diagnosing cattle in seconds</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div><Label>Full name</Label><Input data-testid="register-name-input" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
            <div><Label>Email</Label><Input data-testid="register-email-input" type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
            <div><Label>Password</Label><Input data-testid="register-password-input" type="password" required minLength={6} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div>
            <div>
              <Label>I am a…</Label>
              <Select value={form.role} onValueChange={v=>setForm({...form,role:v})}>
                <SelectTrigger data-testid="register-role-select"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="farmer">Farmer</SelectItem>
                  <SelectItem value="veterinarian">Veterinarian</SelectItem>
                  <SelectItem value="researcher">Researcher</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button data-testid="register-submit-btn" disabled={loading} type="submit" className="w-full bg-emerald-900 hover:bg-emerald-800 text-white rounded-lg">
              {loading? "Creating…" : "Create account"}
            </Button>
          </form>
          <p className="mt-6 text-sm text-stone-500 text-center">
            Already have one? <Link to="/login" className="text-emerald-900 font-medium hover:underline" data-testid="link-to-login">Sign in</Link>
          </p>
        </div>
      </div>
      <div className="hidden lg:block relative order-1 lg:order-2">
        <img src="https://images.pexels.com/photos/69170/pexels-photo-69170.jpeg?w=1200" className="absolute inset-0 w-full h-full object-cover" alt=""/>
        <div className="absolute inset-0 bg-emerald-950/40"></div>
        <div className="relative p-12 text-white h-full flex flex-col justify-end">
          <h2 className="text-4xl font-display font-semibold">Join Cattle Scope.</h2>
          <p className="mt-3 text-emerald-100 max-w-md">Instant AI diagnostics, herd analytics, vaccination reminders and vet-ready reports — all in one place.</p>
        </div>
      </div>
    </div>
  );
}
