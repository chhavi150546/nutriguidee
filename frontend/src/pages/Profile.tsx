/**
 * src/pages/Profile.tsx
 *
 * User profile settings.
 * Fetches/updates via Express REST API (L21-24).
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Save, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { profile as profileApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { disconnectSocket } from "@/hooks/use-socket";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    avatar_url: "",
    dietary_preference: "none",
    daily_calorie_goal: 2000,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    profileApi
      .get()
      .then(({ profile }) => {
        setForm({
          username: profile.username ?? "",
          avatar_url: profile.avatar_url ?? "",
          dietary_preference: profile.dietary_preference ?? "none",
          daily_calorie_goal: profile.daily_calorie_goal ?? 2000,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await profileApi.update({
        ...form,
        daily_calorie_goal: Number(form.daily_calorie_goal),
      });
      toast.success("Profile updated");
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await signOut();
    disconnectSocket();
    toast.success("Logged out");
    navigate("/login");
  };

  if (loading)
    return (
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground">Loading profile…</p>
      </main>
    );

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Profile </h1>
      <p className="text-muted-foreground mb-6">Customize your NutriGuide experience.</p>

      {/* Email (read-only) */}
      <div className="rounded-2xl border bg-card p-6 shadow-soft mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Email</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Settings form */}
      <form onSubmit={save} className="rounded-2xl border bg-card p-6 shadow-soft space-y-5">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dietary">Dietary preference</Label>
          <Select
            value={form.dietary_preference}
            onValueChange={(v) => setForm({ ...form, dietary_preference: v })}
          >
            <SelectTrigger id="dietary"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No preference</SelectItem>
              <SelectItem value="vegetarian">Vegetarian</SelectItem>
              <SelectItem value="vegan">Vegan</SelectItem>
              <SelectItem value="keto">Keto</SelectItem>
              <SelectItem value="paleo">Paleo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="goal">Daily calorie goal</Label>
          <Input
            id="goal"
            type="number"
            min="500"
            max="10000"
            value={form.daily_calorie_goal}
            onChange={(e) =>
              setForm({ ...form, daily_calorie_goal: Number(e.target.value) })
            }
          />
        </div>

        <Button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-hero text-primary-foreground shadow-soft"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </form>

      {/* Logout */}
      <Button
        variant="outline"
        onClick={handleLogout}
        className="w-full mt-4 text-destructive border-destructive/30 hover:bg-destructive/5"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Log out
      </Button>
    </main>
  );
}
