/**
 * src/pages/Dashboard.tsx
 *
 * Dashboard: calorie goal progress, weekly chart, today's meals.
 *
 * Data source: Express REST API (L21-24) instead of Supabase.
 * Real-time updates via socket.io meal:update (L45-48).
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Flame, TrendingUp, Activity, Plus,
} from "lucide-react";
import { format, subDays } from "date-fns";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from "recharts";
import { useAuth } from "@/lib/auth-context";
import { useMeals } from "@/hooks/use-meals";
import { profile as profileApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Profile {
  username: string;
  daily_calorie_goal: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { meals, loading } = useMeals();
  const [prof, setProf] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) return;
    profileApi
      .get()
      .then(({ profile }) => setProf(profile as Profile))
      .catch(() => {});
  }, [user]);

  const today = format(new Date(), "yyyy-MM-dd"); // local date, matches what we send to backend
  const todayMeals = meals.filter((m) => m.eaten_on === today);
  const todayCalories = todayMeals.reduce((s, m) => s + m.calories, 0);
  const goal = prof?.daily_calorie_goal ?? 2000;
  const progressPct = Math.min(100, Math.round((todayCalories / goal) * 100));

  const weekData = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const key = format(d, "yyyy-MM-dd"); // local date, consistent with backend storage
    const cals = meals
      .filter((m) => m.eaten_on === key)
      .reduce((s, m) => s + m.calories, 0);
    return { day: format(d, "EEE"), calories: cals };
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Hi, {prof?.username || "there"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Here's how you're doing today.</p>
        </div>
        <Button asChild className="bg-gradient-hero text-primary-foreground shadow-soft">
          <Link to="/meals">
            <Plus className="h-4 w-4 mr-1" /> Log a meal
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <StatCard
          icon={<Flame className="h-5 w-5" />}
          label="Calories today"
          value={`${todayCalories} / ${goal}`}
          accent="primary"
          extra={
            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-hero transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          }
        />
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label="Meals logged today"
          value={String(todayMeals.length)}
          accent="accent"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="7-day avg calories"
          value={String(
            Math.round(
              weekData.reduce((s, d) => s + d.calories, 0) / 7
            )
          )}
          accent="primary"
        />
      </div>

      {/* Weekly chart + today's list */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Weekly progress
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="calories" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold mb-4">Today's meals</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : todayMeals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">No meals logged yet today.</p>
              <Button asChild size="sm" variant="outline">
                <Link to="/meals">Add your first meal</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {todayMeals.slice(0, 5).map((m) => (
                <li
                  key={m._id || m.id}
                  className="flex items-center justify-between rounded-lg border bg-background/40 p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{m.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{m.meal_type}</p>
                  </div>
                  <span className="text-sm font-semibold text-primary">{m.calories} kcal</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({
  icon, label, value, accent, extra,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "primary" | "accent";
  extra?: React.ReactNode;
}) {
  const accentClass =
    accent === "primary"
      ? "bg-primary/10 text-primary"
      : "bg-accent/10 text-accent";
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accentClass}`}>
          {icon}
        </div>
      </div>
      {extra}
    </div>
  );
}
