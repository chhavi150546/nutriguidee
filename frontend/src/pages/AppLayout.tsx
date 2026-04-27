/**
 * src/pages/AppLayout.tsx
 *
 * Shared layout for all protected pages.
 * Uses React Router's <Outlet /> to render child routes.
 * Replaces TanStack's _app.tsx layout route.
 */

import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Leaf, LayoutDashboard, UtensilsCrossed, User, MessageCircle, FileText, LogOut } from "lucide-react";
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
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    disconnectSocket();
    toast.success("Logged out");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card shadow-soft">
        <div className="flex items-center gap-2 px-6 py-5 border-b">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero shadow-soft">
            <Leaf className="h-4 w-4 text-primary-foreground" />
          </span>
          <Link to="/landing" className="text-lg font-bold hover:opacity-80 transition">
  NutriGuide
</Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-card border-b shadow-soft">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-hero">
            <Leaf className="h-4 w-4 text-primary-foreground" />
          </span>
          <Link to="/dashboard" className="text-lg font-bold hover:opacity-80 transition">
  NutriGuide
</Link>
        </div>
        <nav className="flex gap-1">
          {NAV.map(({ to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`p-2 rounded-lg transition-colors ${
                location.pathname === to
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
            </Link>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 md:overflow-auto pt-0 md:pt-0">
        <div className="md:hidden h-16" />
        <Outlet />
      </main>
    </div>
  );
}
