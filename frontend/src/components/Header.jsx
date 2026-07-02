import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User, LayoutDashboard, Camera, History, BarChart3, Shield, MessageCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const initials = (user?.name || "?").split(" ").map(s=>s[0]).slice(0,2).join("").toUpperCase();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
        <Link to={user? "/dashboard" : "/"} className="flex items-center gap-2" data-testid="brand-logo">
          <div className="w-9 h-9 rounded-lg bg-emerald-900 text-white grid place-items-center font-display font-semibold">CS</div>
          <span className="font-display font-semibold text-stone-900 text-lg">Cattle Scope</span>
        </Link>

        {user && (
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <NavItem to="/dashboard" icon={<LayoutDashboard className="w-4 h-4"/>} label="Dashboard" tid="nav-dashboard"/>
            <NavItem to="/predict" icon={<Camera className="w-4 h-4"/>} label="Analyze" tid="nav-predict"/>
            <NavItem to="/history" icon={<History className="w-4 h-4"/>} label="History" tid="nav-history"/>
            <NavItem to="/analytics" icon={<BarChart3 className="w-4 h-4"/>} label="Analytics" tid="nav-analytics"/>
            <NavItem to="/assistant" icon={<MessageCircle className="w-4 h-4"/>} label="Assistant" tid="nav-assistant"/>
            {user.role === "admin" && <NavItem to="/admin" icon={<Shield className="w-4 h-4"/>} label="Admin" tid="nav-admin"/>}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Link to="/login"><Button variant="ghost" data-testid="header-login-btn">Sign in</Button></Link>
              <Link to="/register"><Button className="bg-emerald-900 hover:bg-emerald-800 text-white" data-testid="header-register-btn">Get started</Button></Link>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-stone-50 rounded-lg px-2 py-1" data-testid="user-menu-trigger">
                  <Avatar className="w-8 h-8"><AvatarImage src={user.picture}/><AvatarFallback className="bg-emerald-100 text-emerald-900 text-xs">{initials}</AvatarFallback></Avatar>
                  <span className="hidden sm:inline text-sm font-medium text-stone-800">{user.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={()=>nav("/profile")} data-testid="menu-profile"><User className="w-4 h-4 mr-2"/>Profile</DropdownMenuItem>
                <DropdownMenuSeparator/>
                <DropdownMenuItem onClick={async()=>{await logout(); nav("/");}} data-testid="menu-logout"><LogOut className="w-4 h-4 mr-2"/>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}

function NavItem({to, icon, label, tid}) {
  return (
    <NavLink to={to} data-testid={tid} className={({isActive})=>`flex items-center gap-2 px-3 py-2 rounded-lg transition ${isActive?"bg-emerald-50 text-emerald-900":"text-stone-600 hover:text-emerald-900 hover:bg-stone-50"}`}>
      {icon}<span>{label}</span>
    </NavLink>
  );
}
