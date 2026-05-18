import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Leaf, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { auth, setToken } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Status = "verifying" | "success" | "error";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("verifying");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setErrorMsg("No verification token found in the URL.");
      setStatus("error");
      return;
    }

    auth
      .verifyEmail(token)
      .then(({ token: jwt, user }) => {
        setToken(jwt);
        // Reload auth state then redirect
        setStatus("success");
        setTimeout(() => navigate("/dashboard"), 2500);
      })
      .catch((err: Error) => {
        setErrorMsg(err.message || "Verification failed. The link may have expired.");
        setStatus("error");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-10">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-hero shadow-glow">
          <Leaf className="h-5 w-5 text-white" />
        </span>
        <span className="text-xl font-bold tracking-tight">NutriGuide</span>
      </Link>

      <div className="w-full max-w-sm text-center space-y-5">
        {status === "verifying" && (
          <>
            <Loader2 className="h-14 w-14 animate-spin text-primary mx-auto" />
            <h1 className="text-2xl font-extrabold tracking-tight">Verifying your email…</h1>
            <p className="text-sm text-muted-foreground">Just a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto">
              <CheckCircle className="h-9 w-9 text-green-600" />
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight">Email verified!</h1>
            <p className="text-sm text-muted-foreground">
              Your account is now active. Redirecting you to the dashboard…
            </p>
            <Button
              onClick={() => navigate("/dashboard")}
              className="w-full h-10 bg-gradient-hero text-white font-semibold"
            >
              Go to Dashboard
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mx-auto">
              <XCircle className="h-9 w-9 text-red-500" />
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight">Verification failed</h1>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <div className="flex flex-col gap-3">
              <Button asChild className="w-full h-10 bg-gradient-hero text-white font-semibold">
                <Link to="/signup">Back to Sign up</Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-10">
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
