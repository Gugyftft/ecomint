import { CurrencyInr, ShieldCheck } from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { Leaf } from "@phosphor-icons/react";
import { Sun, Moon } from "lucide-react";

const supabase = createClient(
  "https://apwbevlglcxdeduwnvsu.supabase.co",
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function UpiSetup() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem("theme") !== "light");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "success">("form");
  const [name, setName] = useState("");
  const [upiId, setUpiId] = useState("");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
    checkIfAlreadySetup();
  }, [dark]);

  const checkIfAlreadySetup = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }
    const { data } = await supabase
      .from("user_bank_details")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (data) navigate("/dashboard");

    // Pre-fill name from auth metadata
    const fullName = user.user_metadata?.full_name;
    if (fullName) setName(fullName);
  };

  const validateUPI = (upi: string) => /^[\w.\-]+@[\w]+$/.test(upi);

  const handleSubmit = async () => {
    setError("");
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!upiId.trim()) { setError("Please enter your UPI ID."); return; }
    if (!validateUPI(upiId)) { setError("Invalid UPI ID. Format: name@upi"); return; }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }

    const { error } = await supabase.from("user_bank_details").insert({
      user_id: user.id,
      account_holder_name: name.trim(),
      bank_name: "UPI",
      account_number: upiId.trim(),
      ifsc_code: "UPI",
      upi_id: upiId.trim(),
      is_verified: true,
    });

    if (error) { setError(error.message); setLoading(false); return; }

    setStep("success");
    setLoading(false);
    setTimeout(() => navigate("/dashboard"), 2000);
  };

  const th = {
    root:           dark ? "#0a1a0f"                : "#f0fdf4",
    cardBg:         dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)",
    cardBorder:     dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    text:           dark ? "#fff"                   : "#111",
    textMuted:      dark ? "rgba(255,255,255,0.4)"  : "rgba(0,0,0,0.45)",
    inputBg:        dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    inputBorder:    dark ? "rgba(255,255,255,0.1)"  : "rgba(0,0,0,0.12)",
    labelColor:     dark ? "rgba(255,255,255,0.5)"  : "rgba(0,0,0,0.5)",
    themeBtnBg:     dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    themeBtnBorder: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
    themeBtnColor:  dark ? "#fff"                   : "#555",
    noteBg:         dark ? "rgba(74,222,128,0.06)"  : "rgba(22,163,74,0.06)",
    noteBorder:     dark ? "rgba(74,222,128,0.15)"  : "rgba(22,163,74,0.15)",
  };

  if (step === "success") {
    return (
      <div style={{ ...s.root, background: th.root, alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ color: "#4ade80", fontSize: 24, fontWeight: 700, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
            You're all set!
          </h2>
          <p style={{ color: th.textMuted, fontSize: 14, marginTop: 8, fontFamily: "'DM Sans', sans-serif" }}>
            Taking you to your dashboard...
          </p>
        </div>
      </div>
    );
  }

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
          <Leaf size={24} weight="duotone" color="#4ade80" />
          <span style={s.brandName}>EcoMint</span>
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <CurrencyInr size={40} weight="duotone" color="#4ade80" style={{ marginBottom: 12 }} />
          <h2 style={{ ...s.heading, color: th.text }}>Connect your UPI</h2>
          <p style={{ ...s.subtext, color: th.textMuted }}>
            Payments for your waste deposits will be sent here
          </p>
        </div>

        {/* Note */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px", borderRadius: 10,
          background: th.noteBg, border: `1px solid ${th.noteBorder}`,
          marginBottom: 24,
        }}>
          <ShieldCheck size={14} weight="duotone" color="#4ade80" />
          <span style={{ fontSize: 12, color: th.textMuted }}>
            Your UPI details are encrypted and never shared
          </span>
        </div>

        {/* Form */}
        <div style={s.form}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: th.labelColor }}>
              Full Name
            </label>
            <input
              style={{ ...s.input, background: th.inputBg, borderColor: th.inputBorder, color: th.text }}
              type="text" placeholder="As per bank records"
              value={name} onChange={(e) => { setName(e.target.value); setError(""); }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: th.labelColor }}>
              UPI ID
            </label>
            <input
              style={{
                ...s.input,
                background: th.inputBg,
                borderColor: upiId && !validateUPI(upiId) ? "#ef4444"
                  : upiId && validateUPI(upiId) ? "#4ade80"
                  : th.inputBorder,
                color: th.text,
              }}
              type="text" placeholder="yourname@upi"
              value={upiId}
              onChange={(e) => { setUpiId(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <p style={{ fontSize: 11, color: th.textMuted, margin: 0 }}>
              e.g. rahul@okaxis, priya@ybl, name@paytm
            </p>
          </div>

          {error && <p style={s.errorMsg}>{error}</p>}

          <button
            style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}
            onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save & Go to Dashboard →"}
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
    overflow: "hidden", padding: "40px 20px",
    transition: "background 0.3s",
  },
  blob1: {
    position: "fixed", width: 500, height: 500, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)",
    top: -100, left: -100, pointerEvents: "none",
  },
  blob2: {
    position: "fixed", width: 400, height: 400, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)",
    bottom: -80, right: -80, pointerEvents: "none",
  },
  card: {
    position: "relative", zIndex: 1, border: "1px solid",
    backdropFilter: "blur(20px)", borderRadius: 24,
    padding: "40px 40px", width: "100%", maxWidth: 420,
    boxShadow: "0 32px 80px rgba(0,0,0,0.15)",
    transition: "background 0.3s, border-color 0.3s",
  },
  brand: { display: "flex", alignItems: "center", gap: 8, marginBottom: 28 },
  brandName: { fontSize: 20, fontWeight: 700, color: "#16a34a", letterSpacing: "-0.5px" },
  heading: { margin: 0, fontSize: 22, fontWeight: 700 },
  subtext: { marginTop: 6, fontSize: 13 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  input: {
    padding: "12px 14px", borderRadius: 10, border: "1px solid",
    fontSize: 14, fontFamily: "inherit", outline: "none",
    transition: "border-color 0.2s",
  },
  errorMsg: { color: "#f87171", fontSize: 13, margin: 0, textAlign: "center" },
  submitBtn: {
    marginTop: 4, padding: 14, borderRadius: 12, border: "none",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff", fontSize: 15, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
    boxShadow: "0 4px 20px rgba(22,163,74,0.35)",
  },
};
