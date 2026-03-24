import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  QrCode, ArrowLeft, CheckCircle, Recycle,
  Newspaper, Wine, Wrench, Desktop, Plant, Question,
  LockOpen, Warning, ArrowRight, Confetti,
  CurrencyInr, Leaf, Plus, Lock, MapPin, NavigationArrow,
} from "@phosphor-icons/react";
import { MOCK_BINS, type MockBin } from "../data/mockBins";

// ─── Types ────────────────────────────────────────────────────────────────────

type ScanStep = "biometric" | "gps_check" | "bin_list" | "bin_selected" | "scanning" | "verified" | "category" | "instruction" | "deposit" | "closing" | "add_more" | "payment" | "success";
type ConfirmState = "idle" | "waiting" | "stable" | "ai_scanning" | "confirmed";
type BiometricState = "idle" | "scanning" | "success" | "failed" | "locked" | "pin";

interface DepositItem {
  category: string;
  weight: number;
  reward: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "Plastic",       icon: Recycle,   color: "#3b82f6", rate: 0.08, rateLabel: "₹0.08/g", desc: "Bottles, bags, packaging" },
  { id: "Paper",         icon: Newspaper, color: "#8b5cf6", rate: 0.05, rateLabel: "₹0.05/g", desc: "Cardboard, newspapers" },
  { id: "Glass",         icon: Wine,      color: "#06b6d4", rate: 0.06, rateLabel: "₹0.06/g", desc: "Bottles, jars" },
  { id: "Metal",         icon: Wrench,    color: "#ef4444", rate: 0.12, rateLabel: "₹0.12/g", desc: "Cans, foil, scraps" },
  { id: "E-Waste",       icon: Desktop,   color: "#f59e0b", rate: 0.20, rateLabel: "₹0.20/g", desc: "Electronics, batteries" },
  { id: "Organic",       icon: Plant,     color: "#16a34a", rate: 0.03, rateLabel: "₹0.03/g", desc: "Food waste, leaves" },
  { id: "Miscellaneous", icon: Question,  color: "#6b7280", rate: 0.02, rateLabel: "₹0.02/g", desc: "Mixed / unclassified", dailyLimit: 1000 },
];

const MOCK_ITEM_WEIGHT = 480;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ScanFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState<ScanStep>("biometric");
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>("idle");
  const [weight, setWeight] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [deposits, setDeposits] = useState<DepositItem[]>([]);
  const [upiProgress, setUpiProgress] = useState(0);
  const [dark] = useState(() => localStorage.getItem("theme") !== "light");
  const weightRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [biometricState, setBiometricState] = useState<BiometricState>("idle");
  const [biometricAttempts, setBiometricAttempts] = useState(0);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const MOCK_PIN = "123456";
  const MAX_ATTEMPTS = 3;
  const [_userCoords, _setUserCoords] = useState<{ lat: number; lng: number } | null>(null); // eslint-disable-line
  const [nearbyBin, setNearbyBin] = useState<MockBin | null>(null);
  const [selectedBin, setSelectedBin] = useState<MockBin | null>(null);
  const [binDistances, setBinDistances] = useState<{ bin: MockBin; distance: number }[]>([]);
  const [gpsChecking, setGpsChecking] = useState(false);
  const binActionRef = useRef<HTMLDivElement | null>(null);
  const [detectedCategory, setDetectedCategory] = useState<string | null>(null);
  const categoryBtnRef = useRef<HTMLButtonElement | null>(null);

  const bg      = dark ? "#030712" : "#f3f4f6";
  const card    = dark ? "#111827" : "#ffffff";
  const border  = dark ? "#1f2937" : "#e5e7eb";
  const surface = dark ? "#1f2937" : "#f9fafb";
  const text    = dark ? "#f9fafb" : "#111827";
  const sub     = dark ? "#9ca3af" : "#6b7280";

  const totalReward = deposits.reduce((s, d) => s + d.reward, 0);
  const totalWeight = deposits.reduce((s, d) => s + d.weight, 0);

  // QR scan simulation
  useEffect(() => {
    if (step !== "scanning") return;
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) { clearInterval(interval); setTimeout(() => setStep("verified"), 400); return 100; }
        return prev + 2;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [step]);

  // Biometric handler (simulated for prototype)
  const handleBiometric = () => {
    setBiometricState("scanning");
    setTimeout(() => {
      const fail = biometricAttempts > 0 && Math.random() < 0.25;
      if (fail) {
        const next = biometricAttempts + 1;
        setBiometricAttempts(next);
        if (next >= MAX_ATTEMPTS) {
          setBiometricState("locked");
          setTimeout(() => setBiometricState("pin"), 1200);
        } else {
          setBiometricState("failed");
          setTimeout(() => setBiometricState("idle"), 1200);
        }
      } else {
        setBiometricState("success");
        setTimeout(() => setStep("gps_check"), 800);
      }
    }, 1800);
  };

  const handlePinSubmit = () => {
    if (pin === MOCK_PIN) {
      setBiometricState("success");
      setTimeout(() => setStep("gps_check"), 800);
    } else {
      setPinError(true);
      setPin("");
      setTimeout(() => setPinError(false), 1000);
    }
  };

  const calcDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleGpsCheck = (recheck = false) => {
    setGpsChecking(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const distances = MOCK_BINS.map(bin => ({
          bin,
          distance: calcDistance(latitude, longitude, bin.lat, bin.lng),
        })).sort((a, b) => a.distance - b.distance);
        setBinDistances(distances);
        const within5m = distances[0].distance <= 5;
        setGpsChecking(false);
        if (within5m) {
          setNearbyBin(distances[0].bin);
          setSelectedBin(distances[0].bin);
          setStep("bin_selected");
        } else {
          setStep("bin_list");
        }
      },
      () => {
        const simLat = 20.0045;
        const simLng = 73.7880;
        const distances = MOCK_BINS.map(bin => ({
          bin,
          distance: calcDistance(simLat, simLng, bin.lat, bin.lng),
        })).sort((a, b) => a.distance - b.distance);
        setBinDistances(distances);
        setGpsChecking(false);
        if (recheck && selectedBin) {
          setNearbyBin(selectedBin);
          setStep("bin_selected");
        } else {
          setStep("bin_list");
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Weight simulation for deposit step
  useEffect(() => {
    if (step !== "deposit") { if (weightRef.current) clearInterval(weightRef.current); return; }
    setWeight(0);
    setConfirmState("idle");
    weightRef.current = setInterval(() => {
      setWeight(prev => {
        if (prev >= MOCK_ITEM_WEIGHT) { if (weightRef.current) clearInterval(weightRef.current); return MOCK_ITEM_WEIGHT; }
        return prev + 16;
      });
    }, 30);
    return () => { if (weightRef.current) clearInterval(weightRef.current); };
  }, [step]);

  // Confirm state machine
  const MISC_DETECTED_CATEGORIES = ["Plastic", "Paper", "Glass", "Metal", "E-Waste", "Organic"];
  useEffect(() => {
    if (step !== "deposit") return;
    if (weight < 20) { setConfirmState("idle"); return; }
    if (weight < MOCK_ITEM_WEIGHT) { setConfirmState("waiting"); return; }
    setConfirmState("stable");
    const t1 = setTimeout(() => {
      setConfirmState("ai_scanning");
      if (selected === "Miscellaneous") setDetectedCategory(null);
    }, 600);
    const t2 = setTimeout(() => {
      if (selected === "Miscellaneous") {
        const detected = MISC_DETECTED_CATEGORIES[deposits.length % MISC_DETECTED_CATEGORIES.length];
        setDetectedCategory(detected);
      }
      setConfirmState("confirmed");
    }, 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [weight, step]);

  // UPI animation
  useEffect(() => {
    if (step !== "payment") return;
    setUpiProgress(0);
    const interval = setInterval(() => {
      setUpiProgress(prev => {
        if (prev >= 100) { clearInterval(interval); setTimeout(() => setStep("success"), 600); return 100; }
        return prev + 1.5;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [step]);

  const handleConfirmDeposit = () => {
    if (confirmState !== "confirmed" || !selected) return;
    const isMisc = selected === "Miscellaneous";
    const effectiveCategoryId = isMisc && detectedCategory ? detectedCategory : selected;
    const cat = CATEGORIES.find(c => c.id === effectiveCategoryId) ?? CATEGORIES.find(c => c.id === selected)!;
    const reward = weight * cat.rate;
    setDeposits(prev => [...prev, { category: effectiveCategoryId, weight, reward }]);
    setDetectedCategory(null);
    setStep("closing");
    setTimeout(() => setStep("add_more"), 1800);
  };

  const handleAddMore = () => {
    setSelected(null);
    setWeight(0);
    setConfirmState("idle");
    setStep("category");
  };

  const handlePay = () => setStep("payment");

  const confirmBtnColor = () => {
    if (confirmState === "confirmed")   return { background: "#16a34a", color: "#fff", cursor: "pointer" };
    if (confirmState === "ai_scanning") return { background: "#f59e0b", color: "#fff", cursor: "not-allowed" };
    if (confirmState === "stable")      return { background: "#3b82f6", color: "#fff", cursor: "not-allowed" };
    return { background: surface, color: sub, cursor: "not-allowed" };
  };

  const confirmBtnLabel = () => {
    if (confirmState === "confirmed")   return "✓ Confirm Item";
    if (confirmState === "ai_scanning") return "AI Verifying…";
    if (confirmState === "stable")      return "Weight stable · analysing…";
    if (confirmState === "waiting")     return "Add item · detecting weight…";
    return "Place item in compartment";
  };

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "DM Sans, sans-serif", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ background: card, borderBottom: `1px solid ${border}`, padding: "14px 20px", display: "flex", alignItems: "center", gap: "12px", position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => navigate("/dashboard")} style={{ background: surface, border: `1px solid ${border}`, borderRadius: "8px", padding: "7px", cursor: "pointer", display: "flex", color: sub }}>
          <ArrowLeft size={16} weight="bold" />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Leaf size={16} color="#fff" weight="bold" />
          </div>
          <span style={{ color: text, fontWeight: 700, fontSize: "15px" }}>Scan & Deposit</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "5px", alignItems: "center" }}>
          {["scanning","verified","category","deposit","success"].map((s) => {
            const stepI = ["scanning","verified","category","deposit","success"].indexOf(s);
            const done = stepI <= ["scanning","verified","category","instruction","deposit","closing","add_more","payment","success"].indexOf(step) / 2;
            return <div key={s} style={{ width: s === step ? "16px" : "6px", height: "6px", borderRadius: "99px", background: done ? "#16a34a" : border, transition: "all 0.3s ease" }} />;
          })}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>

        {/* ── Biometric ── */}
        {step === "biometric" && (
          <div style={{ width: "100%", maxWidth: "360px", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", animation: "fadeIn 0.4s ease" }}>
            {biometricState !== "pin" && (
              <>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: text, fontWeight: 700, fontSize: "22px" }}>Verify Identity</div>
                  <div style={{ color: sub, fontSize: "13px", marginTop: "6px" }}>
                    {biometricState === "locked" ? "Too many attempts · switching to PIN…" : "Use your fingerprint or device biometric to continue"}
                  </div>
                </div>
                <div style={{ position: "relative", width: "140px", height: "140px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="140" height="140" style={{ position: "absolute" }}>
                    <circle cx="70" cy="70" r="62" fill="none" stroke={border} strokeWidth="4" />
                    <circle cx="70" cy="70" r="62" fill="none"
                      stroke={biometricState === "success" ? "#16a34a" : biometricState === "failed" || biometricState === "locked" ? "#ef4444" : biometricState === "scanning" ? "#16a34a" : border}
                      strokeWidth="4" strokeLinecap="round" strokeDasharray="390"
                      strokeDashoffset={biometricState === "scanning" ? "0" : biometricState === "success" ? "0" : "390"}
                      style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.3s ease", transformOrigin: "center", transform: "rotate(-90deg)" }}
                    />
                  </svg>
                  <div style={{ width: "100px", height: "100px", borderRadius: "50%",
                    background: biometricState === "success" ? "#16a34a18" : biometricState === "failed" || biometricState === "locked" ? "#ef444418" : "#16a34a10",
                    display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.3s ease" }}>
                    <Fingerprint size={48} weight="thin" color={biometricState === "success" ? "#16a34a" : biometricState === "failed" || biometricState === "locked" ? "#ef4444" : "#16a34a"} />
                  </div>
                </div>
                <div style={{ textAlign: "center", minHeight: "40px" }}>
                  {biometricState === "idle" && <div style={{ color: sub, fontSize: "13px" }}>Tap the button below to begin</div>}
                  {biometricState === "scanning" && <div style={{ color: "#16a34a", fontWeight: 600, fontSize: "13px", animation: "pulse 1s infinite" }}>Waiting for biometric…</div>}
                  {biometricState === "success" && <div style={{ color: "#16a34a", fontWeight: 700, fontSize: "14px" }}>✓ Identity verified</div>}
                  {biometricState === "failed" && (
                    <div style={{ color: "#ef4444", fontWeight: 600, fontSize: "13px" }}>
                      Verification failed · {MAX_ATTEMPTS - biometricAttempts} attempt{MAX_ATTEMPTS - biometricAttempts !== 1 ? "s" : ""} remaining
                    </div>
                  )}
                  {biometricState === "locked" && <div style={{ color: "#ef4444", fontWeight: 600, fontSize: "13px" }}>Switching to PIN…</div>}
                </div>
                {biometricState !== "success" && biometricState !== "locked" && (
                  <button onClick={handleBiometric} disabled={biometricState === "scanning"}
                    style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: biometricState === "scanning" ? surface : "#16a34a", color: biometricState === "scanning" ? sub : "#fff", fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "15px", cursor: biometricState === "scanning" ? "not-allowed" : "pointer", transition: "all 0.2s ease" }}>
                    {biometricState === "scanning" ? "Scanning…" : biometricState === "failed" ? "Try Again" : "Verify with Biometric"}
                  </button>
                )}
              </>
            )}

            {/* PIN fallback */}
            {biometricState === "pin" && (
              <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", animation: "fadeIn 0.4s ease" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: text, fontWeight: 700, fontSize: "20px" }}>Enter PIN</div>
                  <div style={{ color: sub, fontSize: "13px", marginTop: "6px" }}>Enter your 6-digit EcoMint PIN</div>
                  <div style={{ color: sub, fontSize: "11px", marginTop: "4px", opacity: 0.7 }}>Demo PIN: 123456</div>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ width: "14px", height: "14px", borderRadius: "50%", background: i < pin.length ? (pinError ? "#ef4444" : "#16a34a") : border, transition: "background 0.2s ease", transform: pinError ? "scale(1.2)" : "scale(1)" }} />
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", width: "100%", maxWidth: "280px" }}>
                  {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k, i) => (
                    <button key={i} onClick={() => {
                      if (k === "⌫") { setPin(p => p.slice(0, -1)); return; }
                      if (k === "") return;
                      const next = pin + k;
                      setPin(next);
                      if (next.length === 6) { setTimeout(() => { setPin(next); handlePinSubmit(); }, 100); }
                    }}
                    style={{ padding: "16px", borderRadius: "12px", border: `1px solid ${border}`, background: k === "" ? "transparent" : card, color: text, fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: "18px", cursor: k === "" ? "default" : "pointer", transition: "all 0.1s ease" }}>
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── GPS Check ── */}
        {step === "gps_check" && (
          <div style={{ width: "100%", maxWidth: "360px", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", animation: "fadeIn 0.4s ease" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: text, fontWeight: 700, fontSize: "22px" }}>Finding Nearby Bins</div>
              <div style={{ color: sub, fontSize: "13px", marginTop: "6px" }}>Allow location access to find EcoMint bins near you</div>
            </div>
            <div style={{ position: "relative", width: "140px", height: "140px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="140" height="140" style={{ position: "absolute" }}>
                <circle cx="70" cy="70" r="62" fill="none" stroke={border} strokeWidth="4" />
                <circle cx="70" cy="70" r="62" fill="none" stroke={gpsChecking ? "#16a34a" : border}
                  strokeWidth="4" strokeLinecap="round" strokeDasharray="390"
                  strokeDashoffset={gpsChecking ? "0" : "390"}
                  style={{ transition: "stroke-dashoffset 1s ease", transformOrigin: "center", transform: "rotate(-90deg)" }}
                />
              </svg>
              <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "#16a34a10", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MapPin size={48} color="#16a34a" weight="duotone" />
              </div>
            </div>
            {gpsChecking
              ? <div style={{ color: "#16a34a", fontWeight: 600, fontSize: "13px", animation: "pulse 1s infinite" }}>Acquiring location…</div>
              : <button onClick={() => handleGpsCheck(false)} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: "#16a34a", color: "#fff", fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "15px", cursor: "pointer" }}>
                  Find Bins Near Me
                </button>
            }
            {gpsChecking && <div style={{ color: sub, fontSize: "12px" }}>Please allow location access if prompted</div>}
          </div>
        )}

        {/* ── Bin List ── */}
        {step === "bin_list" && (
          <div style={{ width: "100%", maxWidth: "400px", animation: "fadeIn 0.4s ease" }}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ color: text, fontWeight: 700, fontSize: "20px" }}>No Bin Nearby</div>
              <div style={{ color: sub, fontSize: "13px", marginTop: "4px" }}>Select a bin and navigate to it</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
              {binDistances.map(({ bin, distance }, idx) => {
                const isNearest = idx === 0;
                const isSelected = selectedBin?.id === bin.id;
                const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${bin.lat},${bin.lng}`;
                const distLabel = distance < 1000 ? `${Math.round(distance)}m away` : `${(distance / 1000).toFixed(1)}km away`;
                return (
                  <div key={bin.id} onClick={() => { setSelectedBin(bin); setTimeout(() => binActionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100); }}
                    style={{ background: card, border: `1.5px solid ${isSelected ? "#16a34a" : isNearest ? "#16a34a44" : border}`, borderRadius: "14px", padding: "14px 16px", cursor: "pointer", transition: "all 0.15s ease", position: "relative" }}>
                    {isNearest && (
                      <div style={{ position: "absolute", top: "-10px", left: "14px", background: "#16a34a", color: "#fff", fontSize: "10px", fontWeight: 700, padding: "2px 10px", borderRadius: "99px" }}>
                        Nearest to you
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: isNearest ? "#16a34a18" : surface, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <MapPin size={20} color={isNearest ? "#16a34a" : sub} weight="duotone" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: text, fontWeight: 700, fontSize: "13px" }}>{bin.id} · {bin.name}</div>
                        <div style={{ color: sub, fontSize: "11px", marginTop: "2px" }}>{bin.location}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                          <span style={{ color: isNearest ? "#16a34a" : sub, fontWeight: 600, fontSize: "11px" }}>{distLabel}</span>
                          <span style={{ color: border, fontSize: "11px" }}>·</span>
                          <span style={{ fontSize: "10px", fontWeight: 700, color: bin.fillAvg >= 75 ? "#ef4444" : bin.fillAvg >= 60 ? "#f59e0b" : "#16a34a", background: bin.fillAvg >= 75 ? "#ef444418" : bin.fillAvg >= 60 ? "#f59e0b18" : "#16a34a18", padding: "1px 7px", borderRadius: "99px" }}>
                            {bin.fillAvg}% full
                          </span>
                        </div>
                      </div>
                      <a href={mapsUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "34px", height: "34px", borderRadius: "8px", background: "#3b82f618", border: "1px solid #3b82f644", flexShrink: 0, textDecoration: "none" }}>
                        <NavigationArrow size={16} color="#3b82f6" weight="fill" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
            {selectedBin && (
              <div ref={binActionRef} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ background: "#f59e0b12", border: "1px solid #f59e0b44", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <Warning size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: "1px" }} />
                  <span style={{ color: "#f59e0b", fontSize: "11px", lineHeight: 1.5 }}>Navigate to <strong>{selectedBin.name}</strong> using the directions button, then tap "I'm at the bin" to continue.</span>
                </div>
                <button onClick={() => handleGpsCheck(true)}
                  style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: "#16a34a", color: "#fff", fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "15px", cursor: "pointer" }}>
                  I'm at the bin · Verify Location
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Bin Found Nearby ── */}
        {step === "bin_selected" && nearbyBin && (
          <div style={{ width: "100%", maxWidth: "360px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", animation: "fadeIn 0.4s ease" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "20px", background: "#16a34a18", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MapPin size={40} color="#16a34a" weight="fill" />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#16a34a", fontWeight: 700, fontSize: "20px" }}>Bin Found Nearby!</div>
              <div style={{ color: sub, fontSize: "13px", marginTop: "4px" }}>{nearbyBin.name} detected within 5m</div>
            </div>
            <div style={{ width: "100%", background: card, border: `1px solid ${border}`, borderRadius: "14px", padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ color: text, fontWeight: 700, fontSize: "15px" }}>{nearbyBin.id}</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a", background: "#16a34a18", padding: "2px 8px", borderRadius: "99px" }}>Active</span>
              </div>
              <div style={{ color: sub, fontSize: "12px", marginBottom: "10px" }}>{nearbyBin.location}</div>
              <div style={{ height: "1px", background: border, marginBottom: "10px" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: sub, fontSize: "11px" }}>Zone</span>
                <span style={{ color: text, fontWeight: 600, fontSize: "11px" }}>{nearbyBin.zone}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                <span style={{ color: sub, fontSize: "11px" }}>Avg Fill</span>
                <span style={{ color: nearbyBin.fillAvg >= 75 ? "#ef4444" : "#f59e0b", fontWeight: 600, fontSize: "11px" }}>{nearbyBin.fillAvg}%</span>
              </div>
            </div>
            <button onClick={() => setStep("scanning")} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: "#16a34a", color: "#fff", fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              Scan QR Code <ArrowRight size={18} weight="bold" />
            </button>
          </div>
        )}

        {/* ── Scanning ── */}
        {step === "scanning" && (
          <div style={{ width: "100%", maxWidth: "360px", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: text, fontWeight: 700, fontSize: "22px" }}>Scan Bin QR</div>
              <div style={{ color: sub, fontSize: "13px", marginTop: "6px" }}>Point your camera at the QR code on the bin</div>
            </div>
            <div style={{ width: "260px", height: "260px", position: "relative" }}>
              {[
                { top: 0, left: 0, borderTop: "3px solid #16a34a", borderLeft: "3px solid #16a34a" },
                { top: 0, right: 0, borderTop: "3px solid #16a34a", borderRight: "3px solid #16a34a" },
                { bottom: 0, left: 0, borderBottom: "3px solid #16a34a", borderLeft: "3px solid #16a34a" },
                { bottom: 0, right: 0, borderBottom: "3px solid #16a34a", borderRight: "3px solid #16a34a" },
              ].map((style, i) => (
                <div key={i} style={{ position: "absolute", width: "28px", height: "28px", borderRadius: "3px", ...style }} />
              ))}
              <div style={{ position: "absolute", inset: "12px", background: dark ? "#0f172a" : "#f8fafc", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, #16a34a, transparent)", top: `${scanProgress}%`, transition: "top 0.04s linear", boxShadow: "0 0 8px #16a34a" }} />
                <QrCode size={72} color={dark ? "#1f2937" : "#e5e7eb"} />
                <span style={{ color: sub, fontSize: "12px", zIndex: 1 }}>Scanning…</span>
              </div>
            </div>
            <div style={{ width: "100%", background: border, borderRadius: "99px", height: "6px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${scanProgress}%`, background: "linear-gradient(90deg, #16a34a, #22c55e)", borderRadius: "99px", transition: "width 0.04s linear" }} />
            </div>
            <span style={{ color: sub, fontSize: "12px" }}>{scanProgress < 100 ? "Detecting QR code…" : "QR verified!"}</span>
          </div>
        )}

        {/* ── Verified ── */}
        {step === "verified" && (
          <div style={{ width: "100%", maxWidth: "360px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", animation: "fadeIn 0.4s ease" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "20px", background: "#16a34a18", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle size={44} color="#16a34a" weight="fill" />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#16a34a", fontWeight: 700, fontSize: "20px" }}>Bin Verified!</div>
              <div style={{ color: sub, fontSize: "13px", marginTop: "4px" }}>QR authenticated successfully</div>
            </div>
            <div style={{ width: "100%", background: card, border: `1px solid ${border}`, borderRadius: "14px", padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ color: text, fontWeight: 700, fontSize: "15px" }}>{selectedBin?.id ?? "BIN-112"}</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a", background: "#16a34a18", padding: "2px 8px", borderRadius: "99px" }}>Active</span>
              </div>
              <div style={{ color: sub, fontSize: "12px", marginBottom: "10px" }}>{selectedBin?.location ?? "Gangapur Road, Near Hotel Panchavati"}</div>
              <div style={{ height: "1px", background: border, marginBottom: "10px" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: sub, fontSize: "11px" }}>Zone</span>
                <span style={{ color: text, fontWeight: 600, fontSize: "11px" }}>{selectedBin?.zone ?? "Zone A"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                <span style={{ color: sub, fontSize: "11px" }}>Avg Fill</span>
                <span style={{ color: (selectedBin?.fillAvg ?? 52) >= 75 ? "#ef4444" : "#f59e0b", fontWeight: 600, fontSize: "11px" }}>{selectedBin?.fillAvg ?? 52}%</span>
              </div>
            </div>
            <button onClick={() => setStep("category")} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: "#16a34a", color: "#fff", fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              Select Waste Category <ArrowRight size={18} weight="bold" />
            </button>
          </div>
        )}

        {/* ── Category ── */}
        {step === "category" && (
          <div style={{ width: "100%", maxWidth: "400px", animation: "fadeIn 0.3s ease" }}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ color: text, fontWeight: 700, fontSize: "20px" }}>Select Material</div>
              <div style={{ color: sub, fontSize: "13px", marginTop: "4px" }}>Only that compartment lid will unlock</div>
            </div>
            {deposits.length > 0 && (
              <div style={{ background: "#16a34a12", border: "1px solid #16a34a44", borderRadius: "12px", padding: "10px 14px", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#16a34a", fontSize: "13px", fontWeight: 600 }}>{deposits.length} item{deposits.length > 1 ? "s" : ""} deposited</span>
                <span style={{ color: "#16a34a", fontWeight: 700, fontSize: "15px" }}>₹{totalReward.toFixed(2)} so far</span>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selected === cat.id;
                return (
                  <div key={cat.id} style={{ display: "flex", flexDirection: "column" }}>
                    <button onClick={() => { setSelected(cat.id); setTimeout(() => categoryBtnRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100); }} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", borderRadius: isSelected && cat.id === "Miscellaneous" ? "12px 12px 0 0" : "12px", border: `1.5px solid ${isSelected ? cat.color : border}`, borderBottom: isSelected && cat.id === "Miscellaneous" ? "none" : `1.5px solid ${isSelected ? cat.color : border}`, background: isSelected ? `${cat.color}12` : card, cursor: "pointer", fontFamily: "DM Sans, sans-serif", transition: "all 0.15s ease", textAlign: "left" }}>
                      <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: `${cat.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={20} color={cat.color} weight="duotone" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: text, fontWeight: 600, fontSize: "14px" }}>{cat.id}</div>
                        <div style={{ color: sub, fontSize: "11px", marginTop: "1px" }}>{cat.desc}</div>
                      </div>
                      <div style={{ color: "#16a34a", fontWeight: 700, fontSize: "20px" }}>{cat.rateLabel}</div>
                    </button>
                    {isSelected && cat.id === "Miscellaneous" && (
                      <div style={{ background: `${cat.color}18`, border: `1.5px solid ${cat.color}`, borderTop: "none", borderRadius: "0 0 12px 12px", padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: "10px", animation: "fadeIn 0.2s ease" }}>
                        <Warning size={15} color="#f59e0b" weight="fill" style={{ flexShrink: 0, marginTop: "1px" }} />
                        <span style={{ color: sub, fontSize: "12px", lineHeight: 1.6 }}>
                          Miscellaneous means items you're unsure about. Deposit <strong style={{ color: text }}>one item at a time</strong> — our AI will identify each item and credit you at its correct material rate. <strong style={{ color: text }}>If you deposit multiple items together and the AI cannot identify them, you'll receive the standard Miscellaneous rate.</strong>
                          <br /><br />Daily limit: 1kg.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button ref={categoryBtnRef} onClick={() => { if (selected) setStep("instruction"); }} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: selected ? "#16a34a" : surface, color: selected ? "#fff" : sub, fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "15px", cursor: selected ? "pointer" : "not-allowed", transition: "all 0.2s ease" }}>
              {selected ? `Open ${selected} Compartment →` : "Select a category to continue"}
            </button>
          </div>
        )}

        {/* ── Instruction ── */}
        {step === "instruction" && selected && (
          <div style={{ width: "100%", maxWidth: "360px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", animation: "fadeIn 0.3s ease" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "20px", background: "#f59e0b18", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Warning size={40} color="#f59e0b" weight="fill" />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: text, fontWeight: 700, fontSize: "20px" }}>One Item at a Time</div>
              <div style={{ color: sub, fontSize: "13px", marginTop: "6px", lineHeight: 1.6 }}>
                Place <strong style={{ color: text }}>one item</strong> in the {selected} compartment at a time.<br />
                Wait for the AI camera to verify and confirm before adding the next.<br />
                <strong style={{ color: "#ef4444" }}>Stacking items prevents accurate scanning</strong> — mixed or unverified items will be credited at the Miscellaneous rate of ₹0.02/g.
              </div>
            </div>
            <div style={{ width: "100%", background: card, border: `1px solid ${border}`, borderRadius: "12px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                "Place one item → wait for weight to stabilise",
                "AI verifies material automatically",
                "Confirm → add another or proceed to payment",
              ].map((tip, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#16a34a", color: "#fff", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>{i + 1}</div>
                  <span style={{ color: sub, fontSize: "12px", lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setStep("deposit")} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: "#16a34a", color: "#fff", fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "15px", cursor: "pointer" }}>
              I understand · Open Compartment
            </button>
          </div>
        )}

        {/* ── Deposit ── */}
        {step === "deposit" && selected && (
          <div style={{ width: "100%", maxWidth: "360px", display: "flex", flexDirection: "column", gap: "14px", animation: "fadeIn 0.3s ease" }}>
            {/* Compartment open */}
            <div style={{ background: card, border: `1.5px solid ${CATEGORIES.find(c => c.id === selected)?.color}`, borderRadius: "14px", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                {(() => { const cat = CATEGORIES.find(c => c.id === selected)!; const Icon = cat.icon; return <Icon size={20} color={cat.color} weight="duotone" />; })()}
                <span style={{ color: text, fontWeight: 700, fontSize: "14px" }}>{selected} Compartment</span>
                <span style={{ marginLeft: "auto", fontSize: "10px", fontWeight: 700, color: "#16a34a", background: "#16a34a18", padding: "2px 8px", borderRadius: "99px", display: "flex", alignItems: "center", gap: "3px" }}>
                  <LockOpen size={10} weight="fill" /> Open
                </span>
              </div>
              <div style={{ color: sub, fontSize: "12px" }}>Place one item · wait for weight to stabilise</div>
            </div>

            {/* Weight */}
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "14px", padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ color: sub, fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Live Weight</span>
                <span style={{ color: weight >= MOCK_ITEM_WEIGHT ? "#16a34a" : "#f59e0b", fontWeight: 700, fontSize: "20px" }}>{(weight / 1000).toFixed(3)} kg</span>
              </div>
              <div style={{ height: "8px", borderRadius: "99px", background: border, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min((weight / MOCK_ITEM_WEIGHT) * 100, 100)}%`, background: weight >= MOCK_ITEM_WEIGHT ? "#16a34a" : "#f59e0b", borderRadius: "99px", transition: "width 0.1s ease" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px" }}>
                <span style={{ color: weight > 0 && weight < 20 ? "#ef4444" : sub, fontSize: "10px", fontWeight: weight > 0 && weight < 20 ? 700 : 400 }}>
                  Min: 20g {weight > 0 && weight < 20 ? "⚠ too light" : ""}
                </span>
                <span style={{ color: sub, fontSize: "10px" }}>
                  {confirmState === "stable" ? "Stabilising…" : confirmState === "ai_scanning" ? "AI scanning…" : weight >= 20 ? "Weight detected ✓" : "Awaiting item…"}
                </span>
              </div>
            </div>

            {/* AI status */}
            {confirmState === "ai_scanning" && (
              <div style={{ background: "#f59e0b12", border: "1px solid #f59e0b44", borderRadius: "12px", padding: "12px 14px", display: "flex", alignItems: "center", gap: "10px", animation: "fadeIn 0.3s ease" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b", animation: "pulse 1s infinite" }} />
                <span style={{ color: "#f59e0b", fontWeight: 600, fontSize: "13px" }}>AI verifying material…</span>
              </div>
            )}
            {confirmState === "confirmed" && (
              <div style={{ background: "#16a34a12", border: "1px solid #16a34a44", borderRadius: "12px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "6px", animation: "fadeIn 0.3s ease" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <CheckCircle size={16} color="#16a34a" weight="fill" />
                  {selected === "Miscellaneous" && detectedCategory
                    ? <span style={{ color: "#16a34a", fontWeight: 600, fontSize: "13px" }}>Camera detected: <strong>{detectedCategory}</strong></span>
                    : <span style={{ color: "#16a34a", fontWeight: 600, fontSize: "13px" }}>AI verified · {selected} confirmed</span>
                  }
                </div>
                {selected === "Miscellaneous" && detectedCategory && (
                  <span style={{ color: "#16a34a", fontSize: "11px", paddingLeft: "26px" }}>
                    You'll be credited at ₹{CATEGORIES.find(c => c.id === detectedCategory)?.rate}/g · {detectedCategory} rate
                  </span>
                )}
                {selected === "Miscellaneous" && !detectedCategory && (
                  <span style={{ color: "#16a34a", fontSize: "11px", paddingLeft: "26px" }}>
                    Could not identify material · credited at ₹0.02/g (Miscellaneous rate)
                  </span>
                )}
              </div>
            )}

            {/* Estimated reward */}
            {weight >= 20 && (
              <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "12px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: sub, fontSize: "13px" }}>This item</span>
                <span style={{ color: "#16a34a", fontWeight: 700, fontSize: "18px" }}>
                  +₹{(weight * (CATEGORIES.find(c => c.id === (selected === "Miscellaneous" && detectedCategory ? detectedCategory : selected))?.rate ?? 0.02)).toFixed(2)}
                </span>
              </div>
            )}

            <button onClick={handleConfirmDeposit} disabled={confirmState !== "confirmed"} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "14px", transition: "all 0.3s ease", ...confirmBtnColor() }}>
              {confirmBtnLabel()}
            </button>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "10px 12px", borderRadius: "10px", background: surface }}>
              <Warning size={13} color={sub} style={{ flexShrink: 0, marginTop: "1px" }} />
              <span style={{ color: sub, fontSize: "11px", lineHeight: 1.5 }}>Do not remove your item before the lid closes. Session will be cancelled if weight drops to zero.</span>
            </div>
          </div>
        )}

        {/* ── Closing lid ── */}
        {step === "closing" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", animation: "fadeIn 0.3s ease" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", border: "4px solid #16a34a", borderTop: "4px solid transparent", animation: "spin 0.8s linear infinite" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ color: text, fontWeight: 700, fontSize: "18px" }}>Closing lid…</div>
              <div style={{ color: sub, fontSize: "13px", marginTop: "4px" }}>Please wait · securing compartment</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#16a34a12", border: "1px solid #16a34a44", borderRadius: "10px", padding: "10px 14px" }}>
              <Lock size={14} color="#16a34a" weight="fill" />
              <span style={{ color: "#16a34a", fontSize: "12px", fontWeight: 600 }}>Item recorded · compartment locking</span>
            </div>
          </div>
        )}

        {/* ── Add more ── */}
        {step === "add_more" && (
          <div style={{ width: "100%", maxWidth: "360px", display: "flex", flexDirection: "column", gap: "16px", animation: "fadeIn 0.3s ease" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#16a34a", fontWeight: 700, fontSize: "20px" }}>Item Secured ✓</div>
              <div style={{ color: sub, fontSize: "13px", marginTop: "4px" }}>Compartment locked</div>
            </div>
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "14px", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${border}`, background: surface }}>
                <span style={{ color: text, fontWeight: 700, fontSize: "13px" }}>Deposited so far</span>
              </div>
              {deposits.map((d, i) => {
                const cat = CATEGORIES.find(c => c.id === d.category)!;
                const Icon = cat.icon;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderBottom: i < deposits.length - 1 ? `1px solid ${border}` : "none" }}>
                    <Icon size={16} color={cat.color} weight="duotone" />
                    <span style={{ color: text, fontSize: "13px", flex: 1 }}>{d.category}</span>
                    <span style={{ color: sub, fontSize: "12px" }}>{(d.weight / 1000).toFixed(3)} kg</span>
                    <span style={{ color: "#16a34a", fontWeight: 700, fontSize: "13px" }}>+₹{d.reward.toFixed(2)}</span>
                  </div>
                );
              })}
              <div style={{ padding: "12px 16px", background: "#16a34a08", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: text, fontWeight: 700, fontSize: "13px" }}>Total</span>
                <span style={{ color: "#16a34a", fontWeight: 700, fontSize: "16px" }}>₹{totalReward.toFixed(2)}</span>
              </div>
            </div>
            <button onClick={handleAddMore} style={{ width: "100%", padding: "13px", borderRadius: "12px", border: `1px solid ${border}`, background: card, color: text, fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <Plus size={16} weight="bold" /> Add Another Item
            </button>
            <button onClick={handlePay} style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "none", background: "#16a34a", color: "#fff", fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>
              Proceed to Payment · ₹{totalReward.toFixed(2)}
            </button>
          </div>
        )}

        {/* ── Payment (UPI animation) ── */}
        {step === "payment" && (
          <div style={{ width: "100%", maxWidth: "360px", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", animation: "fadeIn 0.3s ease" }}>
            <div style={{ width: "90px", height: "90px", borderRadius: "50%", background: "linear-gradient(135deg, #16a34a, #22c55e)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(22,163,74,0.3)", animation: "pulse 1.5s infinite" }}>
              <CurrencyInr size={44} color="#fff" weight="bold" />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: text, fontWeight: 700, fontSize: "22px" }}>₹{totalReward.toFixed(2)}</div>
              <div style={{ color: sub, fontSize: "13px", marginTop: "4px" }}>Transferring to your UPI…</div>
            </div>
            <div style={{ width: "100%", background: card, border: `1px solid ${border}`, borderRadius: "14px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ color: sub, fontSize: "12px" }}>EcoMint Wallet</span>
                <span style={{ color: sub, fontSize: "12px" }}>Your UPI</span>
              </div>
              <div style={{ height: "8px", borderRadius: "99px", background: border, overflow: "hidden", marginBottom: "8px" }}>
                <div style={{ height: "100%", width: `${upiProgress}%`, background: "linear-gradient(90deg, #16a34a, #22c55e)", borderRadius: "99px", transition: "width 0.1s linear" }} />
              </div>
              <div style={{ textAlign: "center", color: "#16a34a", fontSize: "12px", fontWeight: 600 }}>
                {upiProgress < 30 ? "Initiating transfer…" : upiProgress < 60 ? "Processing with UPI…" : upiProgress < 90 ? "Almost done…" : "Completing…"}
              </div>
            </div>
            <div style={{ color: sub, fontSize: "11px", textAlign: "center" }}>Payment via UPI · usually within 2-3 seconds</div>
          </div>
        )}

        {/* ── Success ── */}
        {step === "success" && (
          <div style={{ width: "100%", maxWidth: "360px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", animation: "fadeIn 0.5s ease" }}>
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="confetti-piece" style={{
                left: `${Math.random() * 100}vw`,
                top: `-${Math.random() * 20 + 10}px`,
                background: ["#16a34a","#22c55e","#f59e0b","#3b82f6","#ef4444","#8b5cf6"][i % 6],
                width: `${Math.random() * 6 + 6}px`,
                height: `${Math.random() * 6 + 6}px`,
                animationDuration: `${Math.random() * 2 + 1.5}s`,
                animationDelay: `${Math.random() * 0.5}s`,
              }} />
            ))}
            <div style={{ position: "relative" }}>
              <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "linear-gradient(135deg, #16a34a, #22c55e)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(22,163,74,0.4)", animation: "pop 0.5s ease" }}>
                <CurrencyInr size={48} color="#fff" weight="bold" />
              </div>
              <div style={{ position: "absolute", top: "-8px", right: "-8px" }}>
                <Confetti size={28} color="#f59e0b" weight="fill" />
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#16a34a", fontWeight: 700, fontSize: "32px", letterSpacing: "-1px" }}>+ ₹{totalReward.toFixed(2)}</div>
              <div style={{ color: text, fontWeight: 700, fontSize: "18px", marginTop: "4px" }}>Payment Successful!</div>
              <div style={{ color: sub, fontSize: "13px", marginTop: "4px" }}>Transferred to your UPI account</div>
            </div>
            <div style={{ width: "100%", background: card, border: `1px solid ${border}`, borderRadius: "14px", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${border}`, background: surface }}>
                <span style={{ color: text, fontWeight: 700, fontSize: "13px" }}>Session Summary</span>
              </div>
              {deposits.map((d, i) => {
                const cat = CATEGORIES.find(c => c.id === d.category)!;
                const Icon = cat.icon;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 16px", borderBottom: i < deposits.length - 1 ? `1px solid ${border}` : "none" }}>
                    <Icon size={14} color={cat.color} weight="duotone" />
                    <span style={{ color: text, fontSize: "12px", flex: 1 }}>{d.category}</span>
                    <span style={{ color: sub, fontSize: "11px" }}>{(d.weight / 1000).toFixed(3)} kg</span>
                    <span style={{ color: "#16a34a", fontWeight: 700, fontSize: "12px" }}>₹{d.reward.toFixed(2)}</span>
                  </div>
                );
              })}
              <div style={{ padding: "12px 16px", background: "#16a34a08", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: text, fontWeight: 700, fontSize: "13px" }}>Total · {(totalWeight / 1000).toFixed(3)} kg</span>
                <span style={{ color: "#16a34a", fontWeight: 700, fontSize: "16px" }}>₹{totalReward.toFixed(2)}</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
              <button onClick={() => { setStep("scanning"); setSelected(null); setConfirmState("idle"); setScanProgress(0); setWeight(0); setDeposits([]); setUpiProgress(0); }} style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "none", background: "#16a34a", color: "#fff", fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>
                Scan Again
              </button>
              <button onClick={() => navigate("/dashboard")} style={{ width: "100%", padding: "13px", borderRadius: "12px", border: `1px solid ${border}`, background: "transparent", color: sub, fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes pulse  { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes pop    { 0% { transform: scale(0.6); opacity: 0; } 70% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes confetti-fall {
          0%   { transform: translateY(-10px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(600px) rotate(720deg); opacity: 0; }
        }
        .confetti-piece {
          position: fixed;
          width: 8px;
          height: 8px;
          border-radius: 2px;
          animation: confetti-fall linear forwards;
          pointer-events: none;
          z-index: 999;
        }
      `}</style>
    </div>
  );
}