import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle } from "lucide-react";

export default function Assistant() {
  const [messages,setMessages]=useState([{role:"bot", text:"Hi! I'm your Cattle Scope assistant. Ask me anything about breeds, diseases, treatment or feeding."}]);
  const [msg,setMsg]=useState("");
  const [loading,setLoading]=useState(false);
  const scRef = useRef(null);
  useEffect(()=>{ scRef.current?.scrollTo({top:scRef.current.scrollHeight, behavior:"smooth"}); },[messages]);

  const send = async () => {
    if (!msg.trim()) return;
    const q = msg.trim(); setMsg(""); setMessages(m=>[...m,{role:"user",text:q}]);
    setLoading(true);
    try {
      const r = await api.post("/chat", { message: q });
      setMessages(m=>[...m,{role:"bot",text:r.data.reply}]);
    } catch { setMessages(m=>[...m,{role:"bot",text:"Sorry, something went wrong."}]); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Header/>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-900 text-white grid place-items-center"><MessageCircle className="w-5 h-5"/></div>
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-stone-500">Assistant</p>
            <h1 className="text-2xl md:text-3xl font-display font-semibold text-emerald-950">Ask Cattle Scope AI</h1>
          </div>
        </div>

        <div className="mt-6 bg-white border border-stone-200 rounded-2xl flex flex-col h-[65vh]">
          <div ref={scRef} className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="chat-messages">
            {messages.map((m,i)=>(
              <div key={i} className={`flex ${m.role==="user"?"justify-end":"justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role==="user"?"bg-emerald-900 text-white":"bg-stone-100 text-stone-900"}`}>{m.text}</div>
              </div>
            ))}
            {loading && <div className="text-stone-400 text-sm">Thinking…</div>}
          </div>
          <div className="p-4 border-t border-stone-100 flex gap-2">
            <Input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask about breeds, diseases, feed…" data-testid="chat-input"/>
            <Button onClick={send} disabled={loading} className="bg-emerald-900 hover:bg-emerald-800 text-white" data-testid="chat-send-btn"><Send className="w-4 h-4"/></Button>
          </div>
        </div>
      </main>
    </div>
  );
}
