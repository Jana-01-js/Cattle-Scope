import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { ArrowRight, ScanLine, Stethoscope, Activity, MapPin, ShieldCheck, Sparkles } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-stone-50">
      <Header/>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grain"></div>
        <div className="max-w-7xl mx-auto px-6 md:px-8 pt-16 pb-24 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <span className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
              <Sparkles className="w-3 h-3"/> AI diagnostics for modern farms
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl tracking-tighter font-semibold text-emerald-950 font-display leading-[1.05]">
              Know every cow.<br/>
              <span className="text-amber-600">Catch every disease.</span>
            </h1>
            <p className="mt-6 text-lg text-stone-600 max-w-lg leading-relaxed">
              Cattle Scope uses Gemini vision to identify 12 cattle breeds and detect 9 common diseases from a single photo — with confidence scores, treatment guidance and downloadable clinical reports.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register"><Button size="lg" className="bg-emerald-900 hover:bg-emerald-800 text-white rounded-lg px-6" data-testid="hero-cta-signup">
                Start free trial <ArrowRight className="w-4 h-4 ml-1"/>
              </Button></Link>
              <Link to="/login"><Button size="lg" variant="outline" className="rounded-lg" data-testid="hero-cta-signin">Sign in</Button></Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-stone-500">
              <div><span className="font-semibold text-emerald-900">12</span> breeds</div>
              <div><span className="font-semibold text-emerald-900">9</span> diseases</div>
              <div><span className="font-semibold text-emerald-900">95%+</span> target accuracy</div>
            </div>
          </div>
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-2xl overflow-hidden border border-stone-200 shadow-2xl">
              <img src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1200&q=80" alt="cattle" className="w-full h-[420px] object-cover"/>
              <div className="absolute top-4 left-4 backdrop-blur-md bg-white/85 border border-white rounded-lg px-3 py-2 text-xs">
                <div className="text-stone-500 uppercase tracking-[0.2em]">Breed</div>
                <div className="font-semibold text-emerald-900">Holstein Friesian · 97%</div>
              </div>
              <div className="absolute bottom-4 right-4 backdrop-blur-md bg-white/85 border border-white rounded-lg px-3 py-2 text-xs">
                <div className="text-stone-500 uppercase tracking-[0.2em]">Diagnosis</div>
                <div className="font-semibold text-emerald-700">Healthy · 94%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-8 lg:grid-cols-12 gap-6">
          <FeatureCard className="md:col-span-8 lg:col-span-7" title="Instant breed recognition"
            body="From Holstein to Hallikar — identify 12 indigenous & exotic breeds in seconds." icon={<ScanLine className="w-5 h-5"/>} img="https://images.pexels.com/photos/69170/pexels-photo-69170.jpeg"/>
          <FeatureCard className="md:col-span-4 lg:col-span-5" title="Disease detection"
            body="Lumpy skin, FMD, mastitis, ringworm & 5 more — with heatmap explanations."
            icon={<Stethoscope className="w-5 h-5"/>}/>
          <FeatureCard className="md:col-span-4 lg:col-span-4" title="Analytics & trends"
            body="Track herd health across days & breeds with rich Recharts dashboards."
            icon={<Activity className="w-5 h-5"/>}/>
          <FeatureCard className="md:col-span-4 lg:col-span-4" title="Vaccination reminders"
            body="Schedule and track vaccines per animal tag."
            icon={<ShieldCheck className="w-5 h-5"/>}/>
          <FeatureCard className="md:col-span-4 lg:col-span-4" title="Vet-ready PDF reports"
            body="Downloadable clinical reports with image, breed, diagnosis & treatment."
            icon={<MapPin className="w-5 h-5"/>}/>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-16">
        <div className="rounded-2xl bg-emerald-900 text-white p-10 lg:p-16 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl lg:text-4xl font-display font-semibold tracking-tight">Ready to transform your herd's health?</h2>
            <p className="mt-3 text-emerald-100 max-w-xl">Sign up in 30 seconds. Upload a photo. Get an instant diagnostic report.</p>
          </div>
          <Link to="/register"><Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-emerald-950 rounded-lg" data-testid="footer-cta-signup">Get started free</Button></Link>
        </div>
      </section>

      <footer className="border-t border-stone-200 py-8 text-center text-stone-500 text-sm">
        © 2026 Cattle Scope · Built with AI for farmers, vets & researchers.
      </footer>
    </div>
  );
}

function FeatureCard({className="", title, body, icon, img}) {
  return (
    <div className={`bg-white border border-stone-200 rounded-2xl p-6 hover:shadow-lg transition animate-fade-up ${className}`}>
      {img && <div className="rounded-xl overflow-hidden mb-4 h-40"><img src={img} className="w-full h-full object-cover" alt=""/></div>}
      <div className="flex items-center gap-2 text-emerald-900">{icon}<span className="text-xs tracking-[0.2em] uppercase text-stone-500">Feature</span></div>
      <h3 className="mt-2 text-xl font-display font-medium text-stone-900">{title}</h3>
      <p className="mt-2 text-stone-600 leading-relaxed">{body}</p>
    </div>
  );
}
