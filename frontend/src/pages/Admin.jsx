import { useEffect, useState } from "react";
import Header from "@/components/Header";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Admin() {
  const [users,setUsers]=useState(null);
  const [audit,setAudit]=useState(null);

  const load = async () => {
    const [u,a] = await Promise.all([api.get("/admin/users"), api.get("/admin/audit")]);
    setUsers(u.data); setAudit(a.data);
  };
  useEffect(()=>{ load(); },[]);

  const changeRole = async (uid, role) => {
    await api.patch(`/admin/users/${uid}/role`, { role });
    toast.success("Role updated"); load();
  };
  const del = async (uid) => {
    if (!confirm("Delete this user and all data?")) return;
    await api.delete(`/admin/users/${uid}`); toast.success("Deleted"); load();
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Header/>
      <main className="max-w-7xl mx-auto px-6 md:px-8 py-8">
        <p className="text-xs tracking-[0.2em] uppercase text-stone-500">Admin</p>
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-emerald-950 mt-2">Admin dashboard</h1>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {!audit ? [1,2,3].map(i=><Skeleton key={i} className="h-24"/>) : (
            <>
              <Kpi label="Total users" value={audit.total_users} tid="admin-kpi-users"/>
              <Kpi label="Total predictions" value={audit.total_predictions} tid="admin-kpi-preds"/>
              <Kpi label="Vaccinations" value={audit.total_vaccinations} tid="admin-kpi-vax"/>
            </>
          )}
        </div>

        <div className="mt-8 bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-stone-100"><h3 className="font-display text-xl">Users</h3></div>
          {!users? <div className="p-4 space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-12"/>)}</div> :
            <table className="w-full text-left" data-testid="admin-users-table">
              <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-[0.2em]">
                <tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4">Provider</th><th className="p-4 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {users.map(u=>(
                  <tr key={u.user_id} className="border-t border-stone-100" data-testid={`admin-row-${u.user_id}`}>
                    <td className="p-4 font-medium text-stone-900">{u.name}</td>
                    <td className="p-4 text-stone-600">{u.email}</td>
                    <td className="p-4">
                      <Select value={u.role} onValueChange={v=>changeRole(u.user_id, v)}>
                        <SelectTrigger className="w-40" data-testid={`role-select-${u.user_id}`}><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="farmer">Farmer</SelectItem>
                          <SelectItem value="veterinarian">Veterinarian</SelectItem>
                          <SelectItem value="researcher">Researcher</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4 text-stone-600">{u.provider}</td>
                    <td className="p-4 text-right">
                      <Button variant="outline" size="sm" className="text-rose-600 border-rose-200 hover:bg-rose-50" onClick={()=>del(u.user_id)} data-testid={`delete-user-${u.user_id}`}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>}
        </div>
      </main>
    </div>
  );
}
function Kpi({label,value,tid}){
  return <div className="bg-white border border-stone-200 rounded-xl p-5" data-testid={tid}>
    <div className="text-xs tracking-[0.2em] uppercase text-stone-500">{label}</div>
    <div className="mt-2 text-3xl font-display font-semibold text-emerald-950">{value}</div>
  </div>;
}
