import { useRef, useState } from "react";
import Header from "@/components/Header";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { UploadCloud, Camera, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Predict() {
  const inputRef = useRef(null);
  const [file,setFile]=useState(null);
  const [preview,setPreview]=useState(null);
  const [loading,setLoading]=useState(false);
  const nav = useNavigate();

  const onFile = (f) => {
    if (!f) return;
    if (!["image/jpeg","image/png","image/webp"].includes(f.type)) {
      toast.error("Only JPG/PNG/WEBP images are supported."); return;
    }
    if (f.size > 8*1024*1024) { toast.error("Image too large (max 8MB)."); return; }
    setFile(f);
    const r = new FileReader();
    r.onload = () => setPreview(r.result);
    r.readAsDataURL(f);
  };

  const onDrop = (e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); };

  const analyze = async () => {
    if (!file || !preview) return;
    setLoading(true);
    try {
      const r = await api.post("/predict", { image_base64: preview });
      toast.success("Analysis complete");
      nav(`/predictions/${r.data.prediction_id}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Analysis failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Header/>
      <main className="max-w-5xl mx-auto px-6 md:px-8 py-8 md:py-10">
        <p className="text-xs tracking-[0.2em] uppercase text-stone-500">Analyze</p>
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-emerald-950 mt-2">New cattle scan</h1>
        <p className="text-stone-500 mt-2">Upload a clear photo of the animal. We'll identify breed & detect diseases in seconds.</p>

        <div className="mt-8 bg-white border border-stone-200 rounded-2xl p-6">
          {!preview ? (
            <div
              onClick={()=>inputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={e=>e.preventDefault()}
              data-testid="upload-dropzone"
              className="border-2 border-dashed border-stone-300 rounded-xl p-12 text-center hover:bg-emerald-50 hover:border-emerald-500 transition cursor-pointer flex flex-col items-center gap-3">
              <UploadCloud className="w-10 h-10 text-emerald-800"/>
              <div className="font-display text-lg text-stone-900">Drag & drop an image</div>
              <div className="text-sm text-stone-500">or click to browse (JPG/PNG/WEBP, up to 8MB)</div>
              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e=>onFile(e.target.files?.[0])} data-testid="upload-file-input"/>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={(e)=>{e.stopPropagation(); inputRef.current?.click();}} data-testid="browse-btn"><UploadCloud className="w-4 h-4 mr-2"/>Browse</Button>
                <Button variant="outline" onClick={(e)=>{e.stopPropagation(); inputRef.current?.setAttribute("capture","environment"); inputRef.current?.click();}} data-testid="camera-btn"><Camera className="w-4 h-4 mr-2"/>Camera</Button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="relative rounded-xl overflow-hidden border border-stone-200 group">
                <img src={preview} alt="preview" className="w-full h-80 object-cover"/>
                <button onClick={()=>{setFile(null); setPreview(null);}} className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white shadow" data-testid="clear-image-btn"><X className="w-4 h-4"/></button>
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="font-display text-2xl text-stone-900">Ready to analyze</h3>
                <p className="text-stone-500 mt-2">The AI will identify breed, detect diseases, estimate age/weight, and suggest treatment.</p>
                <Button disabled={loading} onClick={analyze} className="mt-6 bg-emerald-900 hover:bg-emerald-800 text-white rounded-lg" data-testid="analyze-btn">
                  {loading? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Analyzing…</> : "Run AI diagnosis"}
                </Button>
                <div className="mt-6 text-xs text-stone-400">By continuing you agree that images are processed by Gemini vision for diagnostic assistance only.</div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
