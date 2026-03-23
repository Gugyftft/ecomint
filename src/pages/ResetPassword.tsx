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

export default function ResetPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dark, setDark] = useState(() => localStorage.getItem("theme") !== "light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const handleReset = async () => {
    setError(""); setSuccess("");
    if (!password || !confirm) { setError("Both fields are required."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else {
      setSuccess("Password updated! Redirecting to login...");
      setTimeout(() => navigate("/auth"), 2000);
    }
    setLoading(false);
  };

  const th = {
    root:           dark ? "#0a1a0f"                  : "#f0fdf4",
    cardBg:         dark ? "rgba(255,255,255,0.04)"   : "rgba(255,255,255,0.9)",
    cardBorder:     dark ? "rgba(255,255,255,0.08)"   : "rgba(0,0,0,0.08)",
    text:           dark ? "#fff"                     : "#111",
    textMuted:      dark ? "rgba(255,255,255,0.4)"    : "rgba(0,0,0,0.45)",
    inputBg:        dark ? "rgba(255,255,255,0.05)"   : "rgba(0,0,0,0.04)",
    inputBorder:    dark ? "rgba(255,255,255,0.1)"    : "rgba(0,0,0,0.12)",
    labelColor:     dark ? "rgba(255,255,255,0.5)"    : "rgba(0,0,0,0.5)",
    themeBtnBg:     dark ? "rgba(255,255,255,0.08)"   : "rgba(0,0,0,0.06)",
    themeBtnBorder: dark ? "rgba(255,255,255,0.12)"   : "rgba(0,0,0,0.1)",
    themeBtnColor:  dark ? "#fff"                     : "#555",
  };

  return (
    <div style={{ ...s.root, background: th.root }}>
      <div style={{ ...s.blob1, opacity: dark ? 1 : 0.5 }} />
      <div style={{ ...s.blob2, opacity: dark ? 1 : 0.5 }} />

      {/* Theme toggle */}
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

        <h2 style={{ ...s.heading, color: th.text }}>{t("auth.setNewPassword")}</h2>
        <p style={{ ...s.subtext, color: th.textMuted }}>{t("auth.setNewPasswordSubtitle")}</p>

        <div style={s.form}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: th.labelColor }}>
              {t("auth.newPassword")}
            </label>
            <input
              style={{ ...s.input, background: th.inputBg, borderColor: th.inputBorder, color: th.text }}
              type="password" placeholder="Min. 8 characters"
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: th.labelColor }}>
              {t("auth.confirmPassword")}
            </label>
            <input
              style={{ ...s.input, background: th.inputBg, borderColor: th.inputBorder, color: th.text }}
              type="password" placeholder="Repeat password"
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReset()} />
          </div>

          {error && <p style={s.errorMsg}>{error}</p>}
          {success && <p style={s.successMsg}>{success}</p>}

          <button
            style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}
            onClick={handleReset} disabled={loading}>
            {loading ? t("auth.updating") : t("auth.updatePassword")}
          </button>

          <button style={s.backBtn} onClick={() => navigate("/auth")}>
            {t("auth.backToLogin")}
          </button>
        </div>
      </div>
    </div>
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
  heading: { margin: 0, fontSize: 22, fontWeight: 700, textAlign: "center" },
  subtext: { marginTop: 6, marginBottom: 24, fontSize: 13, textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  input: {
    padding: "12px 14px", borderRadius: 10, border: "1px solid",
    fontSize: 14, fontFamily: "inherit", outline: "none",
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
  backBtn: {
    background: "none", border: "none", color: "#4ade80",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
    fontFamily: "inherit", textAlign: "center", padding: 0,
  },
};
