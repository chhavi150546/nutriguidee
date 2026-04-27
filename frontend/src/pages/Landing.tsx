/**
 * src/pages/Landing.tsx
 *
 * Public landing page.
 */

import { Link } from "react-router-dom";
import { Leaf, Zap, Shield, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Nav */}
      <header className="container mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero shadow-soft">
            <Leaf className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="text-lg font-bold">NutriGuide</span>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" asChild><Link to="/login">Sign in</Link></Button>
          <Button asChild className="bg-gradient-hero text-primary-foreground shadow-soft">
            <Link to="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center max-w-3xl">
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium shadow-soft mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Your personalized diet and meal Guide
        </span>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
          Track your nutrition{" "}
          <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
  Elevate your life
</span>
        </h1>
        <p className="mt-6 text-xl text-muted-foreground max-w-xl mx-auto">
          NutriGuide is your secure, personal nutrition assistant. Track meals, chat with your guide, and get insights to fuel a healthier version of you.
        </p>
        <div className="mt-8 flex gap-4 justify-center flex-wrap">
          <Button size="lg" asChild className="bg-gradient-hero text-primary-foreground shadow-soft">
            <Link to="/signup">Start tracking free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 pb-24">
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              icon: Zap,
              title: "REST API backend",
              desc: "Express.js handles all data with JWT auth, bcrypt passwords, and session management.",
            },
            {
              icon: MessageCircle,
              title: "Real-time chat",
              desc: "Socket.io powers full-duplex communication — messages and meal updates arrive instantly.",
            },
            {
              icon: Shield,
              title: "Secure by design",
              desc: "JWT tokens, bcrypt hashing, Express sessions, and middleware-level route guards.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border bg-card p-6 shadow-soft">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
