import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const STEPS = [
  { step: "1", label: "Create your free account" },
  { step: "2", label: "Set your calorie goal" },
  { step: "3", label: "Start logging meals" },
];

export default function SignupPage() {
  const { signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard");
  }, [loading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(email, password, username);
    setSubmitting(false);
    if (error) {
      toast.error(
        error.includes("already registered")
          ? "This email is already registered. Try logging in."
          : error
      );
    } else {
      toast.success("Account created! Welcome to NutriGuide.");
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden flex-col justify-between p-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Leaf className="h-5 w-5 text-white" />
          </span>
          <span className="text-xl font-bold text-white tracking-tight">NutriGuide</span>
        </div>

        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm text-white font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Free forever. No credit card needed.
          </span>
          <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight mb-4">
            Start your nutrition<br />journey today.
          </h2>
          <p className="text-white/70 text-lg mb-10 leading-relaxed">
            Join thousands of people making smarter food choices every day.
          </p>
          <div className="space-y-4">
            {STEPS.map(({ step, label }) => (
              <div key={step} className="flex items-center gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white text-sm font-bold shrink-0">
                  {step}
                </span>
                <p className="text-white/90 text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
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
            <h1 className="text-2xl font-extrabold tracking-tight">Create your account</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Start your nutrition journey today. It's free.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">Username</Label>
              <Input
                id="username"
                required
                placeholder="janedoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-10"
              />
            </div>
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
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="At least 6 characters"
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
              {submitting ? "Creating account…" : "Create free account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
