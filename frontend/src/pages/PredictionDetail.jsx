import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import api, { API } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function PredictionDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [p,setP] = useState(null);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    (async()=>{
      try { const r = await api.get(`/predictions/${id}`); setP(r.data); }
      catch { toast.error("Not found"); nav("/history"); }
      finally { setLoading(false); }
    })();
  },[id,nav]);

  const downloadPdf = async () => {
    const t = localStorage.getItem("cs_token");
    const res = await fetch(`${API}/predictions/${id}/pdf`, { headers: t?{Authorization:`Bearer ${t}`}:{}, credentials:"include" });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`cattle_report_${id}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  const del = async () => {
    if (!confirm("Delete this scan?")) return;
    await api.delete(`/predictions/${id}`);
    toast.success("Deleted"); nav("/history");
  };

  if (loading) return <div className="min-h-screen bg-stone-50"><Header/><main className="max-w-7xl mx-auto px-6 py-10"><Skeleton className="h-96"/></main></div>;
  if (!p) return null;

  const hm = p.heatmap_region || {x:.5,y:.5,r:.2};
  return (
    <div className="min-h-screen bg-stone-50">
      <Header/>
      <main className="max-w-7xl mx-auto px-6 md:px-8 py-8">
        <Link to="/history" className="text-sm text-stone-500 hover:text-emerald-900 inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4"/>Back to history</Link>
        <div className="flex items-end justify-between mt-2 flex-wrap gap-4">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-stone-500">Diagnostic result</p>
            <h1 className="text-3xl md:text-4xl font-display font-semibold text-emerald-950 mt-1" data-testid="prediction-breed">{p.breed}</h1>
            <p className="text-stone-500 mt-1">{new Date(p.created_at).toLocaleString()}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadPdf} data-testid="export-pdf-btn"><Download className="w-4 h-4 mr-2"/>Export PDF</Button>
            <Button variant="outline" onClick={del} className="text-rose-600 border-rose-200 hover:bg-rose-50" data-testid="delete-prediction-btn"><Trash2 className="w-4 h-4 mr-2"/>Delete</Button>
          </div>
        </div>

        <div className="mt-8 grid lg:grid-cols-2 gap-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-4">
            <div className="relative rounded-xl overflow-hidden">
              <img src={`data:image/jpeg;base64,${p.image_base64}`} alt="cattle" className="w-full h-[420px] object-cover"/>
              {!p.is_healthy && (
                <div className="heat-blob absolute rounded-full pointer-events-none"
                     style={{left:`${hm.x*100}%`, top:`${hm.y*100}%`,
                             width:`${hm.r*100}%`, aspectRatio:"1/1",
                             transform:"translate(-50%,-50%)",
                             background:"radial-gradient(circle, rgba(239,68,68,0.75) 0%, rgba(251,191,36,0.5) 50%, rgba(59,130,246,0.0) 80%)",
                             mixBlendMode:"multiply"}}/>
              )}
              <div className="absolute top-3 left-3 backdrop-blur-md bg-white/85 border rounded-lg px-3 py-2 text-xs">
                <div className="text-stone-500 uppercase tracking-[0.2em]">Focus region</div>
                <div className="font-semibold text-emerald-900">{hm.label || "Overall body"}</div>
              </div>
            </div>
            <p className="text-xs text-stone-400 mt-3">Grad-CAM style overlay — highlights the region most influential to the AI's diagnosis.</p>
          </div>

          <div className="space-y-4">
            <Card>
              <Row label="Breed" value={`${p.breed} · ${p.breed_confidence.toFixed(0)}%`} bar={p.breed_confidence} tid="detail-breed"/>
              <Row label="Diagnosis" value={`${p.disease} · ${p.disease_confidence.toFixed(0)}%`} bar={p.disease_confidence} tone={p.is_healthy?"ok":"bad"} tid="detail-disease"/>
              <div className="mt-3">
                <span className={p.is_healthy?"px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium":"px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-sm font-medium"} data-testid="detail-health-badge">
                  {p.is_healthy ? "Healthy" : "Requires attention"}
                </span>
              </div>
            </Card>

            <Card>
              <h3 className="font-display text-lg text-stone-900 mb-3">Vitals estimate</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Kv k="Age" v={p.age_estimate}/>
                <Kv k="Weight" v={p.weight_estimate}/>
                <Kv k="Body condition" v={p.body_condition_score? `${p.body_condition_score}/5` : "-"}/>
                <Kv k="Milk yield" v={p.milk_yield_estimate}/>
              </div>
            </Card>

            <Card>
              <h3 className="font-display text-lg text-stone-900 mb-2">Treatment recommendation</h3>
              <p className="text-stone-600 leading-relaxed" data-testid="detail-treatment">{p.treatment || "—"}</p>
              {p.notes && <><h4 className="font-medium text-stone-800 mt-4">Notes</h4><p className="text-stone-500 text-sm mt-1">{p.notes}</p></>}
              <div className="mt-4 flex items-center gap-2 text-sm text-emerald-900"><MapPin className="w-4 h-4"/>Find nearby veterinary clinics — coming soon</div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
function Card({children}){ return <div className="bg-white border border-stone-200 rounded-2xl p-6">{children}</div>; }
function Row({label,value,bar,tone,tid}){
  const color = tone==="bad" ? "bg-rose-500" : "bg-emerald-600";
  return (
    <div className="mb-4" data-testid={tid}>
      <div className="flex items-baseline justify-between">
        <div className="text-xs tracking-[0.2em] uppercase text-stone-500">{label}</div>
        <div className="text-stone-900 font-medium">{value}</div>
      </div>
      <div className="mt-2 h-2 rounded-full bg-stone-100 overflow-hidden">
        <div className={`h-full ${color}`} style={{width:`${Math.min(100,bar)}%`}}/>
      </div>
    </div>
  );
}
function Kv({k,v}){ return <div><div className="text-xs text-stone-500 uppercase tracking-[0.2em]">{k}</div><div className="text-stone-900 mt-1">{v || "-"}</div></div>; }
