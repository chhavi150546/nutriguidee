/**
 * src/pages/Profile.tsx
 *
 * User profile settings — includes avatar upload via Multer + Cloudinary.
 *
 * Avatar upload flow (frontend side):
 *   1. User picks a file with <input type="file">
 *   2. We show a local preview with URL.createObjectURL()
 *   3. On "Upload", we build a FormData and POST to /api/profile/avatar
 *   4. The server parses it with Multer, uploads to Cloudinary, returns avatar_url
 *   5. We update the displayed avatar with the permanent Cloudinary URL
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Save, Mail, Camera, Loader2, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { profile as profileApi, getToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { disconnectSocket } from "@/hooks/use-socket";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    username: "",
    avatar_url: "",
    dietary_preference: "none",
    daily_calorie_goal: 2000,
  });
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [preview, setPreview]     = useState<string | null>(null);  // local blob URL
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;
    profileApi
      .get()
      .then(({ profile }) => {
        setForm({
          username:           profile.username ?? "",
          avatar_url:         profile.avatar_url ?? "",
          dietary_preference: profile.dietary_preference ?? "none",
          daily_calorie_goal: profile.daily_calorie_goal ?? 2000,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  // ── File picker ─────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }

    setSelectedFile(file);
    // Show a local preview immediately — no upload yet
    setPreview(URL.createObjectURL(file));
  };

  // ── Upload to Cloudinary via backend ────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);

    try {
      // multipart/form-data — DO NOT set Content-Type header manually;
      // the browser sets it automatically with the correct boundary string.
      const formData = new FormData();
      formData.append("avatar", selectedFile);   // must match multer field name

      const res = await fetch(`${BASE}/api/profile/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,   // FormData, NOT JSON.stringify
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.error || "Upload failed");
      }

      const { avatar_url } = await res.json();
      setForm((f) => ({ ...f, avatar_url }));
      setPreview(null);          // switch from local blob to the Cloudinary URL
      setSelectedFile(null);
      toast.success("Avatar updated!");
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Cancel preview ───────────────────────────────────────────────────────────
  const cancelPreview = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Save profile fields ──────────────────────────────────────────────────────
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

  const displayAvatar = preview ?? form.avatar_url;

  if (loading)
    return (
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground">Loading profile…</p>
      </main>
    );

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Profile</h1>
      <p className="text-muted-foreground mb-6">Customize your NutriGuide experience.</p>

      {/* ── Avatar upload card ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border bg-card p-6 shadow-soft mb-6">
        <p className="text-sm font-semibold mb-4">Profile picture</p>

        <div className="flex items-center gap-5">
          {/* Avatar preview */}
          <div className="relative shrink-0">
            <div className="h-20 w-20 rounded-full border-2 border-border overflow-hidden bg-muted flex items-center justify-center">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt="avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            {/* Camera button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow hover:opacity-90 transition-opacity"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* File info + actions */}
          <div className="flex-1 min-w-0">
            {selectedFile ? (
              <div className="space-y-2">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(0)} KB
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="bg-gradient-hero text-white h-8 px-3 text-xs font-semibold"
                  >
                    {uploading
                      ? <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" />Uploading…</>
                      : "Upload"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={cancelPreview}
                    disabled={uploading}
                    className="h-8 px-3 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">
                  Click the camera icon to pick a photo.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPEG, PNG, or WebP — max 2MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Hidden file input — triggered by the camera button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* ── Email (read-only) ──────────────────────────────────────────────── */}
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

      {/* ── Settings form ──────────────────────────────────────────────────── */}
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

      {/* ── Logout ─────────────────────────────────────────────────────────── */}
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
