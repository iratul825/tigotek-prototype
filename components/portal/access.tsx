import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import {
  ArrowRight,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Users,
  X,
} from "lucide-react";
type Session = { user: { name: string; email: string }; canManage: boolean };
type Member = { email: string; name: string };
async function api<T = unknown>(path: string, body?: unknown) {
  const response = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await response.json()) as T & {
    error?: string | { message: string };
    message?: string;
    code?: string;
    verificationRequired?: boolean;
    email?: string;
  };
  if (!response.ok)
    throw Object.assign(
      new Error(
        typeof data.error === "object"
          ? data.error.message
          : data.error || data.message || "Please try again.",
      ),
      {
        code: data.code,
        verificationRequired: data.verificationRequired,
        email: data.email,
      },
    );
  return data as T;
}
export function DeploymentGate({ children }: { children: ReactNode }) {
  if (process.env.NEXT_PUBLIC_AUTH_ENABLED !== "true") return <>{children}</>;
  return <WorkspaceAccess>{children}</WorkspaceAccess>;
}
function WorkspaceAccess({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [mode, setMode] = useState<
    "signin" | "signup" | "forgot" | "reset" | "verify"
  >(() =>
    new URLSearchParams(location.search).has("token") ? "reset" : "signin",
  );
  const [busy, setBusy] = useState(false),
    [manage, setManage] = useState(false),
    [email, setEmail] = useState("");
  const refresh = async () => {
    try {
      setSession(await api<Session>("/api/session"));
      setError("");
    } catch (err) {
      setSession(null);
      const failure = err as Error & {
        verificationRequired?: boolean;
        email?: string;
      };
      if (failure.verificationRequired) {
        setEmail(failure.email || "");
        setMode("verify");
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void refresh();
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const form = new FormData(e.currentTarget);
    try {
      if (mode === "forgot") {
        await api("/api/auth/email-otp/request-password-reset", { email });
        setMode("reset");
        setNotice(
          "If this address has an account, a password reset code is on its way. Enter it below.",
        );
      } else if (mode === "verify") {
        await api("/api/auth/email-otp/verify-email", {
          email,
          otp: form.get("otp"),
        });
        try {
          setSession(await api<Session>("/api/session"));
        } catch {
          setMode("signin");
          setNotice("Email verified. Sign in to enter your workspace.");
        }
      } else if (mode === "reset") {
        const token = new URLSearchParams(location.search).get("token");
        await api(
          token
            ? "/api/auth/reset-password"
            : "/api/auth/email-otp/reset-password",
          token
            ? {
                newPassword: form.get("password"),
                token,
              }
            : { email, otp: form.get("otp"), password: form.get("password") },
        );
        history.replaceState(null, "", location.pathname);
        setMode("signin");
        setNotice("Password updated. Sign in to continue.");
      } else {
        await api(
          `/api/auth/${mode === "signup" ? "sign-up" : "sign-in"}/email`,
          {
            email,
            password: form.get("password"),
            ...(mode === "signup" ? { name: form.get("name") } : {}),
            callbackURL: location.origin,
          },
        );
        try {
          setSession(await api<Session>("/api/session"));
        } catch (err) {
          setNotice(
            mode === "signup"
              ? "Account created. Enter the verification code from your email."
              : String((err as Error).message),
          );
          if (
            mode === "signup" ||
            (err as Error & { verificationRequired?: boolean })
              .verificationRequired
          )
            setMode("verify");
        }
      }
    } catch (err) {
      setError((err as Error).message);
      if ((err as Error & { code?: string }).code === "EMAIL_NOT_VERIFIED") {
        setMode("verify");
        setError("");
        setNotice(
          "Verify your email with the code in your inbox, or request a new code below.",
        );
      }
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <div className="access-screen">
        <LoaderCircle className="spin" />
        <p>Opening your workspace…</p>
      </div>
    );
  if (session)
    return (
      <>
        {children}
        <div className="access-toolbar">
          {session.canManage && (
            <button onClick={() => setManage(true)}>
              <Users size={14} />
              Client access
            </button>
          )}
          <button
            aria-label="Sign out"
            onClick={async () => {
              await api("/api/auth/sign-out", {});
              setSession(null);
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
        {manage && <ClientAccess onClose={() => setManage(false)} />}
      </>
    );
  return (
    <main className="access-screen">
      <div className="access-card">
        <a className="access-brand" href="https://www.tigotek.net/">
          Tigotek<span>CLIENT WORKSPACE</span>
        </a>
        <div className="access-emblem">
          <LockKeyhole size={23} />
        </div>
        <p className="access-eyebrow">A SPACE FOR GREAT WORK</p>
        <h1>
          {mode === "signup"
            ? "Make yourself at home."
            : mode === "forgot"
              ? "A fresh start."
              : mode === "reset"
                ? "Choose a new password."
                : mode === "verify"
                  ? "Check your inbox."
                  : "Welcome back."}
        </h1>
        <p className="access-intro">
          {mode === "signup"
            ? "Create an account with the email your agency invited."
            : mode === "verify"
              ? `Enter the verification code sent to ${email}.`
              : "Your project, your team, and every detail in one place."}
        </p>
        <form onSubmit={submit}>
          {mode === "signup" && (
            <label>
              Your name
              <input name="name" autoComplete="name" required maxLength={80} />
            </label>
          )}
          {mode !== "reset" && (
            <label>
              Email address
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
          )}
          {(mode === "verify" ||
            (mode === "reset" &&
              !new URLSearchParams(location.search).has("token"))) && (
            <label>
              Verification code
              <input
                name="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                required
                aria-label="Verification code"
              />
            </label>
          )}
          {mode !== "forgot" && mode !== "verify" && (
            <label>
              Password
              <input
                type="password"
                name="password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                required
                minLength={8}
                maxLength={128}
              />
            </label>
          )}
          {error && (
            <p className="access-error" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="access-notice" role="status">
              {notice}
            </p>
          )}
          <button className="primary-button" disabled={busy}>
            {busy ? (
              <LoaderCircle size={16} className="spin" />
            ) : (
              <>
                {mode === "signup"
                  ? "Create account"
                  : mode === "forgot"
                    ? "Send reset code"
                    : mode === "reset"
                      ? "Update password"
                      : mode === "verify"
                        ? "Verify email"
                        : "Enter workspace"}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
        <div className="access-options">
          {mode === "verify" && (
            <button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  await api("/api/auth/email-otp/send-verification-otp", {
                    email,
                    type: "email-verification",
                  });
                  setNotice("A new verification code is on its way.");
                } catch (err) {
                  setError((err as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Send a new code
            </button>
          )}
          <button
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setError("");
              setNotice("");
            }}
          >
            {mode === "signup"
              ? "Already have an account? Sign in"
              : "First visit? Create your account"}
          </button>
          {mode === "signin" && (
            <button onClick={() => setMode("forgot")}>Forgot password?</button>
          )}
          {(mode === "forgot" || mode === "verify" || mode === "reset") && (
            <button onClick={() => setMode("signin")}>Back to sign in</button>
          )}
        </div>
        <p className="access-footnote">Private, invitation-only access.</p>
      </div>
    </main>
  );
}
function ClientAccess({ onClose }: { onClose: () => void }) {
  const [members, setMembers] = useState<{ email: string; name: string }[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  useEffect(() => {
    api<{ members: Member[] }>("/api/members")
      .then((data) => setMembers(data.members))
      .catch((err) => setError(err.message));
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    try {
      const result = await api<{ members: Member[] }>("/api/members", {
        email: data.get("email"),
        name: data.get("name"),
      });
      setMembers(result.members);
      setNotice(
        "Access added. Share this portal link with your client; they can create their account using this email.",
      );
      form.reset();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="access-modal-backdrop" onClick={onClose}>
      <section
        className="access-card access-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Client access"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="access-close"
          aria-label="Close client access"
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <p className="access-eyebrow">YOUR WORKSPACE</p>
        <h2>Invite your client.</h2>
        <p className="access-intro">
          Add their email, then share the portal link. Everyone invited shares
          this project’s preview discussion.
        </p>
        <form onSubmit={submit}>
          <label>
            Name
            <input name="name" required maxLength={80} />
          </label>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <button className="primary-button" disabled={busy}>
            Add client access
            <ArrowRight size={15} />
          </button>
        </form>
        {error && (
          <p className="access-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="access-notice" role="status">
            {notice}
          </p>
        )}
        <ul className="access-members">
          {members.map((m) => (
            <li key={m.email}>
              <span>
                <b>{m.name}</b>
                <small>{m.email}</small>
              </span>
              <button
                onClick={async () => {
                  try {
                    const d = await api<{ members: Member[] }>("/api/members", {
                      action: "remove",
                      email: m.email,
                    });
                    setMembers(d.members);
                  } catch (err) {
                    setError((err as Error).message);
                  }
                }}
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
