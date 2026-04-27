/**
 * src/pages/Report.tsx
 *
 * Printable weekly diet report.
 * Data from Express API via useMeals hook + profile API.
 */

import { useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { Printer, Leaf } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { profile as profileApi } from "@/lib/api";
import { useMeals } from "@/hooks/use-meals";
import { Button } from "@/components/ui/button";

interface ProfileData {
  username: string;
  daily_calorie_goal: number;
  dietary_preference: string;
}

export default function ReportPage() {
  const { user } = useAuth();
  const { meals } = useMeals();
  const [prof, setProf] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (!user) return;
    profileApi.get().then(({ profile }) => setProf(profile as ProfileData)).catch(() => {});
  }, [user]);

  const days = Array.from({ length: 7 }).map((_, i) =>
    format(subDays(new Date(), 6 - i), "yyyy-MM-dd") // local date, matches backend eaten_on
  );

  const weekMeals = meals.filter((m) => days.includes(m.eaten_on));
  const totalCal = weekMeals.reduce((s, m) => s + m.calories, 0);
  const totalProt = weekMeals.reduce((s, m) => s + Number(m.protein), 0);
  const totalCarbs = weekMeals.reduce((s, m) => s + Number(m.carbs), 0);
  const totalFats = weekMeals.reduce((s, m) => s + Number(m.fats), 0);
  const avgCal = Math.round(totalCal / 7);
  const goal = prof?.daily_calorie_goal ?? 2000;

  const grouped = days.reduce<Record<string, typeof weekMeals>>((acc, d) => {
    acc[d] = weekMeals.filter((m) => m.eaten_on === d);
    return acc;
  }, {});

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <div className="no-print mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Weekly Diet Report</h1>
         
        </div>
        <Button
          onClick={() => window.print()}
          className="bg-gradient-hero text-primary-foreground shadow-soft"
        >
          <Printer className="h-4 w-4 mr-2" /> Print / Save PDF
        </Button>
      </div>

      <article className="rounded-2xl border bg-card p-8 shadow-soft space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-hero">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </span>
            <div>
              <h2 className="text-xl font-bold">NutriGuide Weekly Report</h2>
              <p className="text-xs text-muted-foreground">Generated {format(new Date(), "PPpp")}</p>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">{prof?.username || user?.email}</p>
            <p className="text-muted-foreground capitalize">{prof?.dietary_preference || "no preference"}</p>
          </div>
        </header>

        {/* Summary */}
        <section>
          <h3 className="font-semibold mb-3">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryItem label="Avg calories/day" value={`${avgCal}`} sub={`Goal: ${goal}`} />
            <SummaryItem label="Total protein" value={`${totalProt.toFixed(0)} g`} />
            <SummaryItem label="Total carbs" value={`${totalCarbs.toFixed(0)} g`} />
            <SummaryItem label="Total fats" value={`${totalFats.toFixed(0)} g`} />
          </div>
        </section>

        {/* Daily breakdown */}
        <section>
          <h3 className="font-semibold mb-3">Daily breakdown</h3>
          <div className="space-y-4">
            {days.map((d) => {
              const dayMeals = grouped[d] || [];
              const dayTotal = dayMeals.reduce((s, m) => s + m.calories, 0);
              return (
                <div key={d} className="rounded-xl border p-4">
                  <div className="flex justify-between mb-2">
                    <h4 className="font-medium">{format(new Date(d + "T12:00:00"), "EEEE, MMM d")}</h4>
                    <span className="text-sm font-semibold text-primary">{dayTotal} kcal</span>
                  </div>
                  {dayMeals.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No meals logged</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-muted-foreground border-b">
                          <th className="text-left py-1">Meal</th>
                          <th className="text-right py-1">kcal</th>
                          <th className="text-right py-1">P</th>
                          <th className="text-right py-1">C</th>
                          <th className="text-right py-1">F</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dayMeals.map((m) => (
                          <tr key={m._id || m.id} className="border-b last:border-0">
                            <td className="py-1">{m.name}</td>
                            <td className="text-right py-1">{m.calories}</td>
                            <td className="text-right py-1">{m.protein}g</td>
                            <td className="text-right py-1">{m.carbs}g</td>
                            <td className="text-right py-1">{m.fats}g</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </article>
    </main>
  );
}

function SummaryItem({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
