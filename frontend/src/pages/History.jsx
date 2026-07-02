import { useEffect, useState } from "react";
import Header from "@/components/Header";
import api from "@/lib/api";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Camera } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function History() {
  const [items,setItems]=useState([]);
  const [q,setQ]=useState("");
  const [breed,setBreed]=useState("all");
  const [disease,setDisease]=useState("all");
  const [loading,setLoading]=useState(true);
  const [breeds,setBreeds]=useState([]);
  const [diseases,setDiseases]=useState([]);

  const load = async () => {
    setLoading(true);
    const params = {};
    if (q) params.search=q;
    if (breed!=="all") params.breed=breed;
    if (disease!=="all") params.disease=disease;
    const r = await api.get("/predictions", { params });
    setItems(r.data); setLoading(false);
  };

  useEffect(()=>{
    (async()=>{
      const [b,d] = await Promise.all([api.get("/reference/breeds"), api.get("/reference/diseases")]);
      setBreeds(b.data); setDiseases(d.data);
    })();
  },[]);
  useEffect(()=>{ const t = setTimeout(load, 250); return ()=>clearTimeout(t); }, [q,breed,disease]);

  return (
    <div className="min-h-screen bg-stone-50">
      <Header/>
      <main className="max-w-7xl mx-auto px-6 md:px-8 py-8">
        <p className="text-xs tracking-[0.2em] uppercase text-stone-500">History</p>
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-emerald-950 mt-2">Prediction history</h1>

        <div className="mt-6 grid md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"/>
            <Input placeholder="Search breed, disease, notes…" value={q} onChange={e=>setQ(e.target.value)} className="pl-9" data-testid="history-search-input"/>
          </div>
          <Select value={breed} onValueChange={setBreed}><SelectTrigger data-testid="history-breed-filter"><SelectValue placeholder="Breed"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All breeds</SelectItem>
              {breeds.map(b=><SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={disease} onValueChange={setDisease}><SelectTrigger data-testid="history-disease-filter"><SelectValue placeholder="Diagnosis"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All diagnoses</SelectItem>
              {diseases.map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6 bg-white border border-stone-200 rounded-2xl overflow-hidden">
          {loading? <div className="p-4 space-y-2">{[1,2,3,4].map(i=><Skeleton key={i} className="h-14"/>)}</div> :
            items.length===0 ? (
              <div className="p-16 text-center">
                <Camera className="w-8 h-8 mx-auto text-stone-400"/>
                <p className="mt-3 text-stone-500">No predictions yet.</p>
                <Link to="/predict" className="mt-3 inline-block text-emerald-900 underline">Run your first scan</Link>
              </div>
            ) : (
              <table className="w-full text-left" data-testid="history-table">
                <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-[0.2em]">
                  <tr><th className="p-4">Date</th><th className="p-4">Breed</th><th className="p-4">Diagnosis</th><th className="p-4">Confidence</th><th className="p-4">Status</th></tr>
                </thead>
                <tbody>
                  {items.map(r=>(
                    <tr key={r.prediction_id} className="border-t border-stone-100 hover:bg-stone-50" data-testid={`history-row-${r.prediction_id}`}>
                      <td className="p-4 text-sm text-stone-600">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="p-4 font-medium text-stone-900"><Link to={`/predictions/${r.prediction_id}`} className="hover:underline">{r.breed}</Link></td>
                      <td className="p-4 text-stone-700">{r.disease}</td>
                      <td className="p-4 text-stone-600">{r.disease_confidence.toFixed(0)}%</td>
                      <td className="p-4"><span className={r.is_healthy?"px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium":"px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-medium"}>{r.is_healthy?"Healthy":"Attention"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </main>
    </div>
  );
}
