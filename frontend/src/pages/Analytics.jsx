import { useEffect, useState } from "react";
import Header from "@/components/Header";
import api from "@/lib/api";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#065f46","#0d9488","#d97706","#e11d48","#7c3aed","#0369a1","#84cc16","#f43f5e","#f59e0b","#14b8a6","#6366f1","#22c55e"];

export default function Analytics() {
  const [s,setS]=useState(null);
  useEffect(()=>{ api.get("/analytics/summary").then(r=>setS(r.data)); },[]);
  return (
    <div className="min-h-screen bg-stone-50">
      <Header/>
      <main className="max-w-7xl mx-auto px-6 md:px-8 py-8">
        <p className="text-xs tracking-[0.2em] uppercase text-stone-500">Analytics</p>
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-emerald-950 mt-2">Herd analytics</h1>

        {!s ? <Skeleton className="mt-8 h-96"/> :
        <div className="mt-8 grid lg:grid-cols-2 gap-6">
          <Card title="Breed distribution">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={s.breeds} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={(e)=>e.name}>
                  {s.breeds.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>
                <Tooltip/>
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Disease occurrences">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={s.diseases}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4"/>
                <XAxis dataKey="name" stroke="#78716c" tick={{fontSize:10}} interval={0} angle={-20} textAnchor="end" height={70}/>
                <YAxis stroke="#78716c" tick={{fontSize:10}}/>
                <Tooltip/><Bar dataKey="count" fill="#065f46" radius={[8,8,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Daily trend (30 days)" wide>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={s.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4"/>
                <XAxis dataKey="date" stroke="#78716c" tick={{fontSize:10}}/>
                <YAxis stroke="#78716c" tick={{fontSize:10}}/><Tooltip/><Legend/>
                <Bar dataKey="healthy" stackId="a" fill="#059669"/>
                <Bar dataKey="diseased" stackId="a" fill="#e11d48"/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>}
      </main>
    </div>
  );
}
function Card({title, children, wide}) {
  return (
    <div className={`bg-white border border-stone-200 rounded-2xl p-6 ${wide?"lg:col-span-2":""}`}>
      <h3 className="font-display text-xl text-stone-900 mb-2">{title}</h3>
      {children}
    </div>
  );
}
