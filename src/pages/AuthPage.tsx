import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { Leaf } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

const supabase = createClient(
  "https://apwbevlglcxdeduwnvsu.supabase.co",
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function AuthPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [moderatorCode, setModeratorCode] = useState("");
  const [showIdField, setShowIdField] = useState(false);
  const [showWorkerField, setShowWorkerField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dark, setDark] = useState(() => localStorage.getItem("theme") !== "light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const reset = () => { setError(""); setSuccess(""); };

  const handleForgotPassword = async () => {
    reset();
    if (!email) { setError("Enter your email first, then click Forgot password."); return; }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else setSuccess(t("auth.resetEmailSent"));
    setForgotLoading(false);
  };

  const handleGoogleLogin = async () => {
    reset();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) setError(error.message);
  };

  const redirectByRole = (userRole: string) => {
    switch (userRole) {
      case "admin":             navigate("/admin-dashboard"); break;
      case "developer":         navigate("/developer-dashboard"); break;
      case "moderator":         navigate("/moderator-dashboard"); break;
      case "sanitation_worker": navigate("/worker-dashboard"); break;
      default:                  navigate("/dashboard"); break;
    }
  };

  const handleEmailAuth = async () => {
    reset();
    if (!email || !password) { setError("Email and password are required."); return; }
    if (mode === "signup" && !name) { setError("Please enter your name."); return; }
    setLoading(true);
    try {
      if (mode === "login") {
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;

        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", authData.user.id)
          .single();

        let userRole = userData?.role || "user";

        if (workerId.trim()) {
          const { data: workerData } = await supabase
            .from("valid_worker_ids")
            .select("id")
            .eq("id", workerId.trim())
            .single();
          if (!workerData) { setError("Invalid Worker ID."); setLoading(false); return; }
          userRole = "sanitation_worker";
        }

        if (moderatorCode.trim()) {
          const { data: modData } = await supabase
            .from("valid_moderator_codes")
            .select("code")
            .eq("code", moderatorCode.trim())
            .single();
          if (!modData) { setError("Invalid Moderator Code."); setLoading(false); return; }
          userRole = "moderator";
        }

        redirectByRole(userRole);

      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (signUpError) throw signUpError;

        const { error: insertError } = await supabase.from("users").insert({
          id: signUpData.user!.id,
          email,
          full_name: name,
          role: "user",
        });
        if (insertError) throw insertError;

        setSuccess("Account created! Redirecting to bank setup...");
        setTimeout(() => navigate("/setup-upi"), 2000);
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const th = {
    root:           dark ? "#0a1a0f"                  : "#f0fdf4",
    cardBg:         dark ? "rgba(255,255,255,0.04)"   : "rgba(255,255,255,0.9)",
    cardBorder:     dark ? "rgba(255,255,255,0.08)"   : "rgba(0,0,0,0.08)",
    text:           dark ? "#fff"                     : "#111",
    textMuted:      dark ? "rgba(255,255,255,0.4)"    : "rgba(0,0,0,0.45)",
    textFaint:      dark ? "rgba(255,255,255,0.35)"   : "rgba(0,0,0,0.35)",
    inputBg:        dark ? "rgba(255,255,255,0.05)"   : "rgba(0,0,0,0.04)",
    inputBorder:    dark ? "rgba(255,255,255,0.1)"    : "rgba(0,0,0,0.12)",
    toggleBg:       dark ? "rgba(255,255,255,0.06)"   : "rgba(0,0,0,0.06)",
    toggleText:     dark ? "rgba(255,255,255,0.45)"   : "rgba(0,0,0,0.4)",
    googleBg:       dark ? "rgba(255,255,255,0.06)"   : "rgba(0,0,0,0.04)",
    googleBorder:   dark ? "rgba(255,255,255,0.12)"   : "rgba(0,0,0,0.1)",
    googleText:     dark ? "#fff"                     : "#333",
    divLine:        dark ? "rgba(255,255,255,0.08)"   : "rgba(0,0,0,0.1)",
    divText:        dark ? "rgba(255,255,255,0.3)"    : "rgba(0,0,0,0.3)",
    labelColor:     dark ? "rgba(255,255,255,0.5)"    : "rgba(0,0,0,0.5)",
    themeBtnBg:     dark ? "rgba(255,255,255,0.08)"   : "rgba(0,0,0,0.06)",
    themeBtnBorder: dark ? "rgba(255,255,255,0.12)"   : "rgba(0,0,0,0.1)",
    themeBtnColor:  dark ? "#fff"                     : "#555",
    idFieldBg:      dark ? "rgba(255,255,255,0.03)"   : "rgba(0,0,0,0.02)",
    idFieldBorder:  dark ? "rgba(255,255,255,0.06)"   : "rgba(0,0,0,0.06)",
  };

  return (
    <div style={{ ...s.root, background: th.root }}>
      <div style={{ ...s.blob1, opacity: dark ? 1 : 0.5 }} />
      <div style={{ ...s.blob2, opacity: dark ? 1 : 0.5 }} />

      <button
        onClick={() => setDark(!dark)}
        style={{
          position: "fixed", top: 20, right: 20, zIndex: 100,
          background: th.themeBtnBg, border: `1px solid ${th.themeBtnBorder}`,
          borderRadius: 10, padding: "8px 10px", cursor: "pointer",
          color: th.themeBtnColor, display: "flex", alignItems: "center",
        }}
      >
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div style={{ ...s.card, background: th.cardBg, borderColor: th.cardBorder }}>
        {/* Brand */}
        <div style={{ ...s.brand, cursor: "pointer" }} onClick={() => navigate("/")}>
          <Leaf size={28} weight="duotone" color="#4ade80" />
          <span style={s.brandName}>EcoMint</span>
        </div>

        {/* Login/Signup toggle */}
        <div style={{ ...s.toggle, background: th.toggleBg }}>
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              style={{ ...s.toggleBtn, color: mode === m ? "#fff" : th.toggleText, ...(mode === m ? s.toggleActive : {}) }}
              onClick={() => { setMode(m); reset(); setShowIdField(false); setShowWorkerField(false); }}
            >
              {m === "login" ? t("auth.login") : t("auth.signUp")}
            </button>
          ))}
        </div>

        <h2 style={{ ...s.heading, color: th.text }}>
          {mode === "login" ? t("auth.welcomeBack") : t("auth.createAccount")}
        </h2>
        <p style={{ ...s.subtext, color: th.textMuted }}>
          {mode === "login" ? t("auth.signInSubtitle") : t("auth.signUpSubtitle")}
        </p>

        {/* Google */}
        <button
          style={{ ...s.googleBtn, background: th.googleBg, borderColor: th.googleBorder, color: th.googleText }}
          onClick={handleGoogleLogin}
        >
          <GoogleIcon />
          {t("auth.continueGoogle")}
        </button>

        <div style={s.divider}>
          <span style={{ ...s.divLine, background: th.divLine }} />
          <span style={{ ...s.divText, color: th.divText }}>{t("auth.orUseEmail")}</span>
          <span style={{ ...s.divLine, background: th.divLine }} />
        </div>

        {/* Form */}
        <div style={s.form}>
          {mode === "signup" && (
            <Field label={t("auth.fullName")} labelColor={th.labelColor}>
              <input
                style={{ ...s.input, background: th.inputBg, borderColor: th.inputBorder, color: th.text }}
                type="text" placeholder="Rahul Sharma"
                value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
          )}

          <Field label={t("auth.email")} labelColor={th.labelColor}>
            <input
              style={{ ...s.input, background: th.inputBg, borderColor: th.inputBorder, color: th.text }}
              type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>

          <Field label={t("auth.password")} labelColor={th.labelColor}>
            <input
              style={{ ...s.input, background: th.inputBg, borderColor: th.inputBorder, color: th.text }}
              type="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEmailAuth()} />
          </Field>

          {/* Worker / Moderator ID — login only */}
          {mode === "login" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Worker toggle */}
              <div>
                <button
                  onClick={() => { setShowIdField(false); setWorkerId(""); setModeratorCode(""); setShowWorkerField(!showWorkerField); }}
                  style={{ background: "none", border: "none", color: "#16a34a", fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: 0 }}
                >
                  {showWorkerField ? t("auth.areSanitationWorkerHide") : t("auth.areSanitationWorker")}
                </button>
                {showWorkerField && (
                  <div style={{ marginTop: 8, padding: "12px 14px", borderRadius: 10, background: th.idFieldBg, border: `1px solid ${th.idFieldBorder}` }}>
                    <Field label={t("auth.workerIdLabel")} labelColor={th.labelColor}>
                      <input
                        style={{ ...s.input, background: th.inputBg, borderColor: th.inputBorder, color: th.text }}
                        type="text" placeholder="WRK-DEMO-001"
                        value={workerId} onChange={(e) => setWorkerId(e.target.value)} />
                    </Field>
                  </div>
                )}
              </div>
              {/* Moderator toggle */}
              <div>
                <button
                  onClick={() => { setShowWorkerField(false); setWorkerId(""); setModeratorCode(""); setShowIdField(!showIdField); }}
                  style={{ background: "none", border: "none", color: "#16a34a", fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: 0 }}
                >
                  {showIdField ? t("auth.areModeratorHide") : t("auth.areModerator")}
                </button>
                {showIdField && (
                  <div style={{ marginTop: 8, padding: "12px 14px", borderRadius: 10, background: th.idFieldBg, border: `1px solid ${th.idFieldBorder}` }}>
                    <Field label={t("auth.moderatorCodeLabel")} labelColor={th.labelColor}>
                      <input
                        style={{ ...s.input, background: th.inputBg, borderColor: th.inputBorder, color: th.text }}
                        type="text" placeholder="MOD-DEMO-001"
                        value={moderatorCode} onChange={(e) => setModeratorCode(e.target.value)} />
                    </Field>
                  </div>
                )}
              </div>
            </div>
          )}

          {mode === "login" && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button style={{ ...s.forgotBtn, color: "#16a34a" }} onClick={handleForgotPassword}>
                {forgotLoading ? t("auth.sending") : t("auth.forgotPassword")}
              </button>
            </div>
          )}

          {error && <p style={s.errorMsg}>{error}</p>}
          {success && <p style={s.successMsg}>{success}</p>}

          <button
            style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}
            onClick={handleEmailAuth} disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? t("auth.login") : t("auth.createBtn")}
          </button>
        </div>

        <p style={{ ...s.footerText, color: th.textFaint }}>
          {mode === "login" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
          <button style={{ ...s.switchBtn, color: "#16a34a" }}
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); reset(); setShowIdField(false); setShowWorkerField(false); }}>
            {mode === "login" ? t("auth.signUp") : t("auth.login")}
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({ label, children, labelColor }: { label: string; children: React.ReactNode; labelColor: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: labelColor }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 10, flexShrink: 0 }}>
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19.1 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.5 26.8 36 24 36c-5.2 0-9.5-3.3-11.2-8H6.3C9.7 35.6 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C37 38.1 44 33 44 24c0-1.3-.1-2.6-.4-3.9z"/>
    </svg>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh", display: "flex",
    alignItems: "center", justifyContent: "center",
    fontFamily: "'DM Sans', sans-serif", position: "relative",
    overflow: "hidden", padding: 20, transition: "background 0.3s",
  },
  blob1: {
    position: "absolute", width: 500, height: 500, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(34,197,94,0.18) 0%, transparent 70%)",
    top: -100, left: -100, pointerEvents: "none",
  },
  blob2: {
    position: "absolute", width: 400, height: 400, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)",
    bottom: -80, right: -80, pointerEvents: "none",
  },
  card: {
    position: "relative", zIndex: 1, border: "1px solid",
    backdropFilter: "blur(20px)", borderRadius: 24,
    padding: "44px 40px", width: "100%", maxWidth: 420,
    boxShadow: "0 32px 80px rgba(0,0,0,0.15)",
    transition: "background 0.3s, border-color 0.3s",
  },
  brand: { display: "flex", alignItems: "center", gap: 10, marginBottom: 28, justifyContent: "center" },
  brandName: { fontSize: 26, fontWeight: 700, color: "#16a34a", letterSpacing: "-0.5px" },
  toggle: { display: "flex", borderRadius: 12, padding: 4, marginBottom: 28 },
  toggleBtn: {
    flex: 1, padding: "9px 0", border: "none", borderRadius: 9,
    background: "transparent", fontSize: 14, fontWeight: 600,
    cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit",
  },
  toggleActive: { background: "#16a34a", color: "#fff", boxShadow: "0 2px 12px rgba(22,163,74,0.4)" },
  heading: { margin: 0, fontSize: 22, fontWeight: 700, textAlign: "center" },
  subtext: { marginTop: 6, marginBottom: 24, fontSize: 13, textAlign: "center" },
  googleBtn: {
    width: "100%", display: "flex", alignItems: "center",
    justifyContent: "center", padding: "12px 16px",
    border: "1px solid", borderRadius: 12, fontSize: 14,
    fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 20,
  },
  divider: { display: "flex", alignItems: "center", gap: 10, marginBottom: 20 },
  divLine: { flex: 1, height: 1 },
  divText: { fontSize: 12, whiteSpace: "nowrap" },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  input: {
    padding: "12px 14px", borderRadius: 10, border: "1px solid",
    fontSize: 14, fontFamily: "inherit", outline: "none",
  },
  forgotBtn: {
    background: "none", border: "none", color: "#16a34a",
    fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: 0,
  },
  errorMsg: { color: "#f87171", fontSize: 13, margin: 0, textAlign: "center" },
  successMsg: { color: "#4ade80", fontSize: 13, margin: 0, textAlign: "center" },
  submitBtn: {
    marginTop: 6, padding: 13, borderRadius: 12, border: "none",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff", fontSize: 15, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
    boxShadow: "0 4px 20px rgba(22,163,74,0.35)",
  },
  footerText: { marginTop: 22, fontSize: 13, textAlign: "center" },
  switchBtn: {
    background: "none", border: "none", color: "#16a34a",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
    fontFamily: "inherit", padding: 0,
  },
};