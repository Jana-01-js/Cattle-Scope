import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-stone-50">
      <Header/>
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-display font-semibold text-emerald-950">Profile</h1>
        <div className="mt-6 bg-white border border-stone-200 rounded-2xl p-8">
          <div className="flex items-center gap-4">
            {user?.picture ? <img src={user.picture} className="w-16 h-16 rounded-full"/> :
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-900 grid place-items-center font-display text-2xl">{user?.name?.[0]}</div>}
            <div>
              <div className="text-xl font-medium text-stone-900" data-testid="profile-name">{user?.name}</div>
              <div className="text-stone-500" data-testid="profile-email">{user?.email}</div>
              <div className="mt-1 text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 inline-block">{user?.role}</div>
            </div>
          </div>
          <div className="mt-8 flex gap-2">
            <Button variant="outline" onClick={async()=>{ await logout(); nav("/"); }} data-testid="profile-logout-btn">Logout</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
