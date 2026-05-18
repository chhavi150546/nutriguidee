import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, TrendingUp, Activity, Plus, UtensilsCrossed, ArrowRight } from "lucide-react";
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

const MEAL_TYPE_COLORS: Record<string, string> = {
  breakfast: "bg-amber-100 text-amber-700",
  lunch:     "bg-emerald-100 text-emerald-700",
  dinner:    "bg-indigo-100 text-indigo-700",
  snack:     "bg-rose-100 text-rose-700",
};

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

  const today = format(new Date(), "yyyy-MM-dd");
  const todayMeals = meals.filter((m) => m.eaten_on === today);
  const todayCalories = todayMeals.reduce((s, m) => s + m.calories, 0);
  const goal = prof?.daily_calorie_goal ?? 2000;
  const progressPct = Math.min(100, Math.round((todayCalories / goal) * 100));

  const weekData = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const key = format(d, "yyyy-MM-dd");
    const cals = meals
      .filter((m) => m.eaten_on === key)
      .reduce((s, m) => s + m.calories, 0);
    return { day: format(d, "EEE"), calories: cals };
  });

  const weekAvg = Math.round(weekData.reduce((s, d) => s + d.calories, 0) / 7);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-0.5">{greeting}</p>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {prof?.username || user?.email?.split("@")[0] || "there"} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Here's your nutrition overview for today.</p>
        </div>
        <Button
          asChild
          className="bg-gradient-hero text-white shadow-soft hover:shadow-glow transition-shadow font-medium"
        >
          <Link to="/meals">
            <Plus className="h-4 w-4 mr-1.5" />
            Log a meal
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {/* Calories card */}
        <div className="rounded-2xl border bg-card p-5 shadow-soft hover:-translate-y-0.5 hover:shadow-glow transition-all duration-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Calories today</p>
              <p className="text-2xl font-extrabold mt-1 tracking-tight">
                {todayCalories}
                <span className="text-base font-medium text-muted-foreground ml-1">/ {goal}</span>
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary shrink-0">
              <Flame className="h-5 w-5" />
            </div>
          </div>
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-hero transition-all duration-500 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{progressPct}% of daily goal</p>
          </div>
        </div>

        {/* Meals logged card */}
        <div className="rounded-2xl border bg-card p-5 shadow-soft hover:-translate-y-0.5 hover:shadow-glow transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Meals today</p>
              <p className="text-2xl font-extrabold mt-1 tracking-tight">{todayMeals.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {todayMeals.length === 0 ? "No meals yet" : `${todayMeals.length} meal${todayMeals.length !== 1 ? "s" : ""} logged`}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/12 text-accent shrink-0">
              <Activity className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* 7-day avg card */}
        <div className="rounded-2xl border bg-card p-5 shadow-soft hover:-translate-y-0.5 hover:shadow-glow transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">7-day average</p>
              <p className="text-2xl font-extrabold mt-1 tracking-tight">
                {weekAvg}
                <span className="text-sm font-medium text-muted-foreground ml-1">kcal</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {weekAvg < goal ? `${goal - weekAvg} below goal` : `${weekAvg - goal} above goal`}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-600 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Chart + Today's meals */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly chart */}
        <div className="lg:col-span-2 rounded-2xl border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold flex items-center gap-2 tracking-tight">
              <TrendingUp className="h-4 w-4 text-primary" />
              Weekly progress
            </h2>
            <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">
              Last 7 days
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)", opacity: 0.4, radius: 6 }}
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 10,
                    fontSize: 13,
                    boxShadow: "var(--shadow-soft)",
                  }}
                  formatter={(v: number) => [`${v} kcal`, "Calories"]}
                />
                <Bar
                  dataKey="calories"
                  fill="var(--color-primary)"
                  radius={[6, 6, 0, 0]}
                  opacity={0.9}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's meals */}
        <div className="rounded-2xl border bg-card p-6 shadow-soft flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold tracking-tight">Today's meals</h2>
            {todayMeals.length > 0 && (
              <Link
                to="/meals"
                className="text-xs text-primary hover:underline flex items-center gap-0.5 font-medium"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : todayMeals.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
                <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">No meals yet today</p>
              <p className="text-xs text-muted-foreground mb-5">Start logging to track your nutrition</p>
              <Button asChild size="sm" className="bg-gradient-hero text-white shadow-soft font-medium">
                <Link to="/meals">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add first meal
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {todayMeals.slice(0, 5).map((m) => (
                <li
                  key={m._id || m.id}
                  className="flex items-center justify-between rounded-xl border bg-background/50 px-3 py-2.5 gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{m.name}</p>
                    <span
                      className={`inline-block text-[10px] font-semibold capitalize px-2 py-0.5 rounded-full mt-0.5 ${
                        MEAL_TYPE_COLORS[m.meal_type] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {m.meal_type}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-primary shrink-0">{m.calories} kcal</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
