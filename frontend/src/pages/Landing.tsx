import { Link } from "react-router-dom";
import { Leaf, MessageCircle, TrendingUp, BarChart3, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden relative bg-gradient-soft">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-48 -right-48 h-[500px] w-[500px] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute top-1/2 -left-48 h-96 w-96 rounded-full bg-accent/8 blur-3xl" />
        <div className="absolute bottom-32 right-1/3 h-80 w-80 rounded-full bg-primary/6 blur-3xl" />
      </div>

      {/* Nav */}
      <header className="relative z-10 container mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero shadow-glow">
            <Leaf className="h-4 w-4 text-white" />
          </span>
          <span className="text-lg font-bold tracking-tight">NutriGuide</span>
        </div>
        <nav className="flex items-center gap-3">
          <Button variant="ghost" asChild className="font-medium">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild className="bg-gradient-hero text-white shadow-soft hover:shadow-glow transition-shadow font-medium">
            <Link to="/signup">Get started free</Link>
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 container mx-auto px-6 py-20 text-center max-w-4xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-xs font-semibold text-primary mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Your personalized nutrition companion
        </span>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6">
          Eat smarter,{" "}
          <span className="bg-gradient-to-r from-primary via-emerald-500 to-accent bg-clip-text text-transparent">
            live better
          </span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
          NutriGuide helps you track every meal, hit your calorie goals, and understand your eating patterns — all in one beautiful, easy-to-use app.
        </p>

        <div className="flex gap-4 justify-center flex-wrap mb-12">
          <Button
            size="lg"
            asChild
            className="bg-gradient-hero text-white shadow-glow hover:shadow-[0_12px_40px_-8px_color-mix(in_oklab,var(--color-primary)_50%,transparent)] transition-all hover:-translate-y-0.5 px-8 font-semibold"
          >
            <Link to="/signup">
              Start tracking free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="hover:-translate-y-0.5 transition-transform px-8 font-medium"
          >
            <Link to="/login">Sign in</Link>
          </Button>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap gap-3 justify-center">
          {["No credit card required", "Free forever", "Works on all devices"].map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-full bg-card border px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft"
            >
              <CheckCircle2 className="h-3 w-3 text-primary" />
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 container mx-auto px-6 pb-16">
        <div className="grid grid-cols-3 max-w-xl mx-auto gap-6 text-center">
          {[
            { value: "10k+", label: "Meals tracked" },
            { value: "98%", label: "User satisfaction" },
            { value: "500+", label: "Active users" },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-2xl border bg-card/70 backdrop-blur-sm p-5 shadow-soft">
              <p className="text-3xl font-extrabold text-gradient-hero">{value}</p>
              <p className="text-sm text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 container mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight">
            Everything you need to eat well
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Simple tools that make healthy eating less daunting and more enjoyable.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              icon: BarChart3,
              title: "Smart meal tracking",
              desc: "Log breakfast, lunch, dinner, and snacks in seconds. Track calories, protein, carbs, and fats effortlessly.",
              iconBg: "bg-primary/10 text-primary",
            },
            {
              icon: MessageCircle,
              title: "Live nutrition chat",
              desc: "Get instant answers to your nutrition questions and stay accountable with real-time guidance.",
              iconBg: "bg-accent/10 text-accent",
            },
            {
              icon: TrendingUp,
              title: "Weekly insights",
              desc: "Beautiful charts show your weekly trends so you always know how you're progressing toward your goals.",
              iconBg: "bg-emerald-500/10 text-emerald-600",
            },
          ].map(({ icon: Icon, title, desc, iconBg }) => (
            <div
              key={title}
              className="rounded-2xl border bg-card p-7 shadow-soft hover:shadow-glow transition-all duration-300 hover:-translate-y-1.5 group"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg} mb-5 group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2 tracking-tight">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA banner */}
      <section className="relative z-10 container mx-auto px-6 pb-24">
        <div className="rounded-3xl bg-gradient-hero p-12 text-center relative overflow-hidden shadow-glow">
          {/* Inner glow blobs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-white tracking-tight">
              Ready to transform your diet?
            </h2>
            <p className="text-white/75 mb-8 max-w-md mx-auto text-lg">
              Join thousands of people who've taken control of their nutrition.
            </p>
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="hover:-translate-y-0.5 transition-transform shadow-lg px-10 font-semibold"
            >
              <Link to="/signup">
                Get started for free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
