/**
 * src/pages/Meals.tsx
 *
 * Log meals, view history, save favorites.
 * All data flows through the Express API (L21-24: REST endpoints).
 * Socket.io emits meal:logged for real-time cross-tab updates (L45-48).
 */

import { useEffect, useState } from "react";
import { Plus, Trash2, Bookmark, BookmarkCheck, History } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import { meals as mealsApi, type Meal } from "@/lib/api";
import { useMeals } from "@/hooks/use-meals";
import { useSocket } from "@/hooks/use-socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

// Saved meals stored in backend profile via a simple in-memory array for demo
// In a full project you'd add a /api/saved-meals route
interface SavedMeal extends Omit<Meal, "eaten_on" | "createdAt" | "user_id"> {}

export default function MealsPage() {
  const { user } = useAuth();
  const { meals, loading, refetch } = useMeals();
  const socket = useSocket();
  const [saved, setSaved] = useState<SavedMeal[]>([]);
  const [form, setForm] = useState({
    name: "", calories: "", protein: "", carbs: "", fats: "", meal_type: "breakfast",
  });
  const [submitting, setSubmitting] = useState(false);

  // Load saved meals from localStorage for demo (no backend endpoint needed)
  useEffect(() => {
    const raw = localStorage.getItem("ng_saved_meals");
    if (raw) setSaved(JSON.parse(raw));
  }, []);
  const persistSaved = (list: SavedMeal[]) => {
    localStorage.setItem("ng_saved_meals", JSON.stringify(list));
    setSaved(list);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    // Use local date (not UTC) to match what Dashboard/Report compare against
    const today = format(new Date(), "yyyy-MM-dd");
    try {
      const { meal } = await mealsApi.create({
        name: form.name,
        calories: Number(form.calories) || 0,
        protein: Number(form.protein) || 0,
        carbs: Number(form.carbs) || 0,
        fats: Number(form.fats) || 0,
        meal_type: form.meal_type,
        eaten_on: today,
        notes: null,
      });
      toast.success("Meal logged!");
      setForm({ name: "", calories: "", protein: "", carbs: "", fats: "", meal_type: "breakfast" });
      refetch();
      // L45-48: emit socket event so other tabs/users update
      socket?.emit("meal:logged", { name: meal.name, calories: meal.calories });
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await mealsApi.remove(id);
      toast.success("Meal removed");
      refetch();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  const handleSave = (m: Meal) => {
    const exists = saved.find((s) => s.name === m.name);
    if (exists) { toast.info("Already saved"); return; }
    const entry: SavedMeal = { _id: crypto.randomUUID(), name: m.name, calories: m.calories, protein: m.protein, carbs: m.carbs, fats: m.fats, meal_type: m.meal_type };
    persistSaved([entry, ...saved]);
    toast.success("Saved to favorites");
  };

  const handleUseSaved = async (s: SavedMeal) => {
    const today = format(new Date(), "yyyy-MM-dd");
    try {
      await mealsApi.create({ ...s, eaten_on: today, notes: null });
      toast.success(`Logged ${s.name}`);
      refetch();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  const handleDeleteSaved = (id: string) => {
    persistSaved(saved.filter((s) => s._id !== id));
    toast.success("Removed from favorites");
  };

  const grouped = meals.reduce<Record<string, Meal[]>>((acc, m) => {
    (acc[m.eaten_on] = acc[m.eaten_on] || []).push(m);
    return acc;
  }, {});

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Meals</h1>
        <p className="text-muted-foreground mt-1">
          Log meals and review your history
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Add meal form */}
        <div className="rounded-2xl border bg-card p-6 shadow-soft h-fit">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> Log a meal
          </h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Meal name</Label>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Avocado toast" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="meal_type">Type</Label>
                <Select value={form.meal_type} onValueChange={(v) => setForm({ ...form, meal_type: v })}>
                  <SelectTrigger id="meal_type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="calories">Calories</Label>
                <Input id="calories" type="number" min="0" required value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(["protein", "carbs", "fats"] as const).map((field) => (
                <div key={field} className="space-y-1.5">
                  <Label htmlFor={field}>{field.charAt(0).toUpperCase() + field.slice(1)} (g)</Label>
                  <Input id={field} type="number" min="0" step="0.1" value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
                </div>
              ))}
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-gradient-hero text-primary-foreground">
              {submitting ? "Adding…" : "Add meal"}
            </Button>
          </form>
        </div>

        {/* History + saved */}
        <Tabs defaultValue="history">
          <TabsList className="mb-4">
            <TabsTrigger value="history"><History className="h-4 w-4 mr-1.5" /> History</TabsTrigger>
            <TabsTrigger value="saved"><Bookmark className="h-4 w-4 mr-1.5" /> Saved ({saved.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : meals.length === 0 ? (
              <div className="rounded-2xl border bg-card p-10 text-center shadow-soft">
                <p className="text-muted-foreground">No meals logged yet. Add your first one!</p>
              </div>
            ) : (
              Object.entries(grouped).map(([date, dayMeals]) => {
                const total = dayMeals.reduce((s, m) => s + m.calories, 0);
                return (
                  <div key={date} className="rounded-2xl border bg-card p-5 shadow-soft">
                    <div className="flex justify-between items-center mb-3 pb-3 border-b">
                      <h3 className="font-semibold">{format(new Date(date + "T12:00:00"), "EEEE, MMM d")}</h3>
                      <span className="text-sm font-medium text-primary">{total} kcal</span>
                    </div>
                    <ul className="space-y-2">
                      {dayMeals.map((m) => (
                        <li key={m._id || m.id} className="flex items-center justify-between gap-3 py-1.5">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{m.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {m.meal_type} · {m.calories} kcal · P {m.protein}g · C {m.carbs}g · F {m.fats}g
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon" onClick={() => handleSave(m)} title="Save">
                              <BookmarkCheck className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(m._id || m.id || "")} className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="saved" className="space-y-3">
            {saved.length === 0 ? (
              <div className="rounded-2xl border bg-card p-10 text-center shadow-soft">
                <p className="text-muted-foreground">No saved meals yet.</p>
              </div>
            ) : (
              saved.map((s) => (
                <div key={s._id} className="rounded-xl border bg-card p-4 flex items-center justify-between gap-3 shadow-soft">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{s.meal_type} · {s.calories} kcal</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleUseSaved(s)}>Log again</Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteSaved(s._id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
