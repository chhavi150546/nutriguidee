/**
 * src/lib/auth-context.tsx
 *
 * JWT-based authentication context.
 * Replaces Supabase Auth with our Express backend (L41-44).
 *
 * On login/register → store JWT in localStorage → attach to all API calls.
 * On page reload   → verify token via GET /auth/me.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { auth, setToken, clearToken, type AuthUser } from "./api";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string; unverified?: boolean; email?: string }>;
  signUp: (
    email: string,
    password: string,
    username: string
  ) => Promise<{ error?: string; email?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: rehydrate from stored JWT (L41-44)
  useEffect(() => {
    auth
      .me()
      .then(({ user }) => {
        // normalize _id → id
        setUser({ ...user, id: user._id });
        setLoading(false);
      })
      .catch(() => {
        clearToken();
        setLoading(false);
      });
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { token, user } = await auth.login(email, password);
      setToken(token);
      setUser({ ...user, id: user._id });
      return {};
    } catch (err: unknown) {
      const message = (err as Error).message;
      // Server sets unverified:true in the 403 body; the fetch wrapper turns it
      // into an Error whose message is the error string. We detect it by text.
      if (message.includes("verify your email")) {
        return { error: message, unverified: true, email };
      }
      return { error: message };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    username: string
  ) => {
    try {
      const { email: registeredEmail } = await auth.register(email, password, username);
      return { email: registeredEmail };
    } catch (err: unknown) {
      return { error: (err as Error).message };
    }
  };

  const signOut = async () => {
    await auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
