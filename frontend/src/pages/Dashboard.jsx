import { useEffect, useState } from "react";
import Header from "@/components/Header";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { Camera, Activity, ShieldCheck, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();
  const [summary,setSummary]=useState(null);
  const [recent,setRecent]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    (async()=>{
      try {
        const [s,r] = await Promise.all([api.get("/analytics/summary"), api.get("/predictions?limit=6")]);
        setSummary(s.data); setRecent(r.data);
      } finally { setLoading(false); }
    })();
  },[]);

  const kpis = [
    {label:"Total scans", value: summary?.total ?? 0, icon: <Activity className="w-5 h-5"/>, tid:"kpi-total"},
    {label:"Healthy", value: summary?.healthy ?? 0, icon: <ShieldCheck className="w-5 h-5"/>, tid:"kpi-healthy"},
    {label:"Diseased", value: summary?.diseased ?? 0, icon: <TrendingUp className="w-5 h-5"/>, tid:"kpi-diseased"},
    {label:"Breeds seen", value: summary?.breeds?.length ?? 0, icon: <Camera className="w-5 h-5"/>, tid:"kpi-breeds"},
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <Header/>
      <main className="max-w-7xl mx-auto px-6 md:px-8 py-8 md:py-10">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-stone-500">Dashboard</p>
            <h1 className="text-3xl md:text-4xl font-display font-semibold text-emerald-950 mt-2" data-testid="dashboard-title">Welcome, {user?.name?.split(" ")[0]}</h1>
          </div>
          <Link to="/predict"><Button className="bg-emerald-900 hover:bg-emerald-800 text-white rounded-lg" data-testid="dashboard-new-scan-btn"><Camera className="w-4 h-4 mr-2"/>New scan</Button></Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {kpis.map(k=>(
            <div key={k.label} className="bg-white border border-stone-200 rounded-xl p-5" data-testid={k.tid}>
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs tracking-[0.2em] uppercase">{k.label}</span>
                <span className="text-emerald-900">{k.icon}</span>
              </div>
              <div className="mt-3 text-3xl font-display font-semibold text-emerald-950">{loading? <Skeleton className="h-8 w-16"/> : k.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-stone-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl text-stone-900">Health trend (30 days)</h3>
              <Link to="/analytics" className="text-sm text-emerald-900 hover:underline">See analytics →</Link>
            </div>
            <div className="mt-4 h-72">
              {loading? <Skeleton className="w-full h-full"/> :
                <ResponsiveContainer><LineChart data={summary?.trend||[]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4"/>
                  <XAxis dataKey="date" stroke="#78716c" tick={{fontSize: 11}}/>
                  <YAxis stroke="#78716c" tick={{fontSize: 11}}/>
                  <Tooltip contentStyle={{borderRadius:8, border:"1px solid #e7e5e4"}}/>
                  <Line type="monotone" dataKey="healthy" stroke="#059669" strokeWidth={2} dot={false}/>
                  <Line type="monotone" dataKey="diseased" stroke="#e11d48" strokeWidth={2} dot={false}/>
                </LineChart></ResponsiveContainer>}
            </div>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl text-stone-900">Recent scans</h3>
              <Link to="/history" className="text-sm text-emerald-900 hover:underline">All →</Link>
            </div>
            <div className="mt-4 space-y-3" data-testid="recent-scans-list">
              {loading? [1,2,3].map(i=><Skeleton key={i} className="h-14"/>) :
                recent.length===0 ? <div className="text-stone-500 text-sm py-8 text-center">No scans yet. <Link className="text-emerald-900 underline" to="/predict">Try one now</Link>.</div> :
                recent.map(r=>(
                  <Link to={`/predictions/${r.prediction_id}`} key={r.prediction_id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 border border-stone-100">
                    <div className={`w-2 h-2 rounded-full ${r.is_healthy?"bg-emerald-500":"bg-rose-500"}`}/>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-stone-900 truncate">{r.breed}</div>
                      <div className="text-xs text-stone-500 truncate">{r.disease} · {new Date(r.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-xs font-medium text-emerald-900">{r.breed_confidence.toFixed(0)}%</div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
