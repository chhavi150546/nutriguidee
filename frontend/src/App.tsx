/**
 * src/App.tsx
 *
 * React Router v6 route tree.
 * Replaces TanStack Router's createFileRoute / routeTree pattern.
 *
 * L21-24: Route paths, route parameters, protected routes.
 */

import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuth } from "./lib/auth-context";

// Public pages
import LandingPage from "./pages/Landing";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";

// Protected layout + pages
import AppLayout from "./pages/AppLayout";
import DashboardPage from "./pages/Dashboard";
import MealsPage from "./pages/Meals";
import ProfilePage from "./pages/Profile";
import ChatPage from "./pages/Chat";
import ReportPage from "./pages/Report";

/** Wrap routes that require a logged-in user */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <Toaster richColors position="top-right" />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected — all wrapped in AppLayout (sidebar/header) */}
        <Route
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/meals" element={<MealsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/report" element={<ReportPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
