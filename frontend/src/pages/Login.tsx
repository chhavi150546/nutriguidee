import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const BENEFITS = [
  "Track meals and calories effortlessly",
  "Visualize your weekly nutrition trends",
  "Set and hit your daily calorie goals",
  "Real-time nutrition chat support",
];

export default function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard");
  }, [loading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast.error(error.includes("Invalid") ? "Invalid email or password" : error);
    } else {
      toast.success("Welcome back!");
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden flex-col justify-between p-12">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        </div>

        {/* Brand mark */}
        <div className="relative z-10 flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Leaf className="h-5 w-5 text-white" />
          </span>
          <span className="text-xl font-bold text-white tracking-tight">NutriGuide</span>
        </div>

        {/* Tagline + benefits */}
        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight mb-4">
            Your nutrition,<br />your goals.
          </h2>
          <p className="text-white/70 text-lg mb-8 leading-relaxed">
            Everything you need to eat better and feel great.
          </p>
          <ul className="space-y-3">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-3 text-white/90 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-white/70 shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-white/40 text-xs">
          © {new Date().getFullYear()} NutriGuide. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center justify-center gap-2 mb-10">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero shadow-glow">
              <Leaf className="h-4 w-4 text-white" />
            </span>
            <span className="text-xl font-bold tracking-tight">NutriGuide</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Sign in to continue your journey.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-10 bg-gradient-hero text-white shadow-soft hover:shadow-glow transition-shadow font-semibold"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-semibold text-primary hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
