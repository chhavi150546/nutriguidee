import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Leaf, LayoutDashboard, UtensilsCrossed, User,
  MessageCircle, FileText, LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { disconnectSocket } from "@/hooks/use-socket";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/meals",     icon: UtensilsCrossed, label: "Meals" },
  { to: "/chat",      icon: MessageCircle,   label: "Live Chat" },
  { to: "/report",    icon: FileText,        label: "Report" },
  { to: "/profile",   icon: User,            label: "Profile" },
];

export default function AppLayout() {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    disconnectSocket();
    toast.success("Logged out");
    navigate("/login");
  };

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "NG";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero shadow-glow shrink-0">
            <Leaf className="h-4 w-4 text-white" />
          </span>
          <Link to="/dashboard" className="text-lg font-bold tracking-tight hover:opacity-80 transition-opacity">
            NutriGuide
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-gradient-hero text-white shadow-soft"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User area */}
        <div className="px-3 pb-4 pt-3 border-t space-y-1">
          {user?.email && (
            <div className="flex items-center gap-3 px-3 py-2 mb-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                {initials}
              </span>
              <p className="text-xs text-muted-foreground truncate leading-tight">
                {user.email}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/8 hover:text-destructive transition-all duration-150"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-card/90 backdrop-blur-sm border-b shadow-soft">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-hero shadow-soft">
            <Leaf className="h-3.5 w-3.5 text-white" />
          </span>
          <Link to="/dashboard" className="text-base font-bold tracking-tight hover:opacity-80 transition-opacity">
            NutriGuide
          </Link>
        </div>
        <nav className="flex gap-0.5">
          {NAV.map(({ to, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`p-2 rounded-lg transition-all ${
                  active
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 md:overflow-auto">
        <div className="md:hidden h-[57px]" />
        <Outlet />
      </main>
    </div>
  );
}
