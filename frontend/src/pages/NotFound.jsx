import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center bg-stone-50 text-center p-6">
      <div>
        <div className="text-8xl font-display font-semibold text-emerald-950">404</div>
        <p className="mt-3 text-stone-500">This pasture is empty.</p>
        <Link to="/"><Button className="mt-6 bg-emerald-900 hover:bg-emerald-800 text-white" data-testid="notfound-home-btn">Take me home</Button></Link>
      </div>
    </div>
  );
}
