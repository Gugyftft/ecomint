import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MapPin, QrCode, CheckCircle, Circle, CurrencyInr,
  Bell, Sun, Moon, User, WarningCircle, Clock, Trophy,
  SealCheck, Bicycle, Recycle, ChartBar, Confetti,
  CaretDown, List,
} from "@phosphor-icons/react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Compartment { category: string; fillLevel: number; }
interface BinTask {
  id: string; binId: string; location: string; zone: string;
  status: "pending" | "collected" | "skipped";
  compartments: Compartment[]; scheduledTime: string; distance: string;
}
interface EarningsDay { label: string; amount: number; }
interface DayDetail { bins: number; distance: string; hours: string; bonus: number; }

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_CATEGORIES = ["Plastic", "Paper", "Glass", "Metal", "E-Waste", "Organic", "Misc."];
const CATEGORY_COLORS: Record<string, string> = {
  Plastic: "#3b82f6", Paper: "#8b5cf6", Glass: "#06b6d4",
  Metal: "#ef4444", "E-Waste": "#f59e0b", Organic: "#16a34a",
  Misc: "#6b7280",
};
const LANGUAGES = [
  { code: "en", label: "EN", full: "English" },
  { code: "hi", label: "HI", full: "हिंदी" },
  { code: "mr", label: "MR", full: "मराठी" },
];

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_WORKER = { name: "Raju Patil", workerId: "SW-0042", zone: "Nashik East – Sector 4B", rating: 4.8, totalCollections: 1248, streak: 12 };

function makeBin(id: string, binId: string, location: string, zone: string, scheduledTime: string, distance: string, levels: number[]): BinTask {
  return { id, binId, location, zone, status: "pending", scheduledTime, distance, compartments: ALL_CATEGORIES.map((cat, i) => ({ category: cat, fillLevel: levels[i] ?? 0 })) };
}

const MOCK_TASKS: BinTask[] = [
  makeBin("t1","BIN-112","Gangapur Road, Near Hotel Panchavati","Zone A","07:30 AM","0.2 km",[40,60,20,10,15,95,30]),
  makeBin("t2","BIN-117","CBS Corner, Sharanpur Road","Zone A","08:00 AM","0.5 km",[80,30,55,5,25,45,20]),
  makeBin("t3","BIN-123","Datta Mandir, Mhasrul","Zone B","09:00 AM","1.1 km",[35,20,15,45,70,30,55]),
  makeBin("t4","BIN-130","Old Agra Road, Near Petrol Pump","Zone B","09:45 AM","1.8 km",[75,60,10,20,30,50,10]),
  makeBin("t5","BIN-138","Indira Nagar, Block C","Zone C","10:30 AM","2.4 km",[50,35,88,15,40,50,65]),
  makeBin("t6","BIN-145","Nashik Road Station Area","Zone C","11:15 AM","3.0 km",[40,25,10,5,20,55,35]),
];

const MOCK_EARNINGS: EarningsDay[] = [
  { label: "Mon", amount: 180 }, { label: "Tue", amount: 220 },
  { label: "Wed", amount: 195 }, { label: "Thu", amount: 240 },
  { label: "Fri", amount: 210 }, { label: "Sat", amount: 260 },
  { label: "Today", amount: 145 },
];

const DAY_DETAILS: Record<string, DayDetail> = {
  Mon: { bins: 15, distance: "2.8 km", hours: "4.2 hrs", bonus: 0 },
  Tue: { bins: 18, distance: "3.4 km", hours: "5.1 hrs", bonus: 50 },
  Wed: { bins: 16, distance: "3.0 km", hours: "4.6 hrs", bonus: 0 },
  Thu: { bins: 20, distance: "3.8 km", hours: "5.5 hrs", bonus: 50 },
  Fri: { bins: 17, distance: "3.2 km", hours: "4.8 hrs", bonus: 0 },
  Sat: { bins: 21, distance: "4.1 km", hours: "6.0 hrs", bonus: 100 },
  Today: { bins: 12, distance: "2.1 km", hours: "3.2 hrs", bonus: 0 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maxFill(c: Compartment[]) { return Math.max(...c.map((x) => x.fillLevel)); }
function avgFill(c: Compartment[]) { return Math.round(c.reduce((s, x) => s + x.fillLevel, 0) / c.length); }
function sortedTasks(tasks: BinTask[]) {
  return [...tasks].sort((a, b) => {
    if (a.status === "collected" && b.status !== "collected") return 1;
    if (a.status !== "collected" && b.status === "collected") return -1;
    return 0;
  });
}

// ─── FillBar ──────────────────────────────────────────────────────────────────

function FillBar({ level, color }: { level: number; color: string }) {
  return (
    <div style={{ height: "5px", borderRadius: "99px", background: "#1f2937", overflow: "hidden", flex: 1 } as React.CSSProperties}>
      <div style={{ height: "100%", width: `${level}%`, background: color, borderRadius: "99px", transition: "width 0.6s ease" } as React.CSSProperties} />
    </div>
  );
}

// ─── Language Dropdown ────────────────────────────────────────────────────────

function LangDropdown({ dark, sub, surface, cardBorder, text }: { dark: boolean; sub: string; surface: string; cardBorder: string; text: string }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ background: surface, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", color: text, fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "12px" }}
      >
        {current.label}
        <CaretDown size={10} color={sub} weight="bold" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }} />
      </button>
      {open && (
        <div
          style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: dark ? "#111827" : "#ffffff", border: `1px solid ${cardBorder}`, borderRadius: "10px", overflow: "hidden", zIndex: 3000, minWidth: "110px", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { i18n.changeLanguage(lang.code); localStorage.setItem('ecomint_lang', lang.code); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "10px 14px", background: i18n.language === lang.code ? "#16a34a18" : "transparent", border: "none", cursor: "pointer", color: i18n.language === lang.code ? "#16a34a" : text, fontFamily: "DM Sans, sans-serif", fontWeight: i18n.language === lang.code ? 700 : 500, fontSize: "13px", textAlign: "left" }}
            >
              <span style={{ fontWeight: 700, fontSize: "11px", color: i18n.language === lang.code ? "#16a34a" : sub, width: "22px" }}>{lang.label}</span>
              {lang.full}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Earnings Chart ───────────────────────────────────────────────────────────

function EarningsChart({ data, dark }: { data: EarningsDay[]; dark: boolean }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const selectedDay = selected ? DAY_DETAILS[selected] : null;
  const selectedEarning = selected ? data.find((d) => d.label === selected) : null;

  const sub = dark ? "#9ca3af" : "#6b7280";
  const panelBg = dark ? "#0f172a" : "#f1f5f9";
  const innerCard = dark ? "#1e293b" : "#ffffff";
  const text = dark ? "#f9fafb" : "#111827";
  const border = dark ? "#334155" : "#e2e8f0";
  const CHART_H = 140;
  const Y_MAX = 400;

  return (
    <div>
      <div style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: "12px", padding: "16px", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: `${CHART_H}px` }}>
          {data.map((d, i) => {
            const isToday = d.label === "Today";
            const isSelected = selected === d.label;
            const h = Math.max(8, Math.round((d.amount / Y_MAX) * CHART_H));
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0px", cursor: "pointer", height: "100%", justifyContent: "flex-end" }} onClick={() => setSelected(isSelected ? null : d.label)}>
                <div style={{ width: "100%", height: `${h}px`, background: isSelected ? "linear-gradient(180deg,#22c55e,#16a34a)" : isToday ? "#16a34a66" : dark ? "#1e3a2f" : "#d1fae5", borderRadius: "5px 5px 0 0", border: isSelected ? "1.5px solid #22c55e" : `1px solid ${dark ? "#1e3a2f" : "#a7f3d0"}`, transition: "all 0.2s ease", transform: isSelected ? "scaleY(1.03)" : "scaleY(1)", transformOrigin: "bottom", flexShrink: 0 }} />
                <span style={{ fontSize: "8px", color: isSelected ? "#4ade80" : sub, fontWeight: isSelected ? 700 : 400, lineHeight: 1, marginTop: "3px" }}>₹{d.amount}</span>
                <span style={{ fontSize: "8px", color: isSelected ? "#4ade80" : isToday ? "#16a34a" : sub, fontWeight: isSelected || isToday ? 700 : 400, lineHeight: 1, marginTop: "2px", whiteSpace: "nowrap" }}>{d.label}</span>
              </div>
            );
          })}
        </div>

        {selected && selectedDay && selectedEarning && (
          <div style={{ marginTop: "14px", background: innerCard, border: `1px solid ${border}`, borderRadius: "10px", padding: "14px", animation: "fadeIn 0.2s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ color: text, fontWeight: 700, fontSize: "13px" }}>{selected === "Today" ? "Today" : selected} — {t("worker.summary")}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ color: "#16a34a", fontWeight: 700, fontSize: "15px" }}>₹{selectedEarning.amount}</span>
                <button onClick={() => setSelected(null)} style={{ background: "transparent", border: `1px solid ${border}`, cursor: "pointer", color: sub, fontSize: "11px", fontFamily: "DM Sans, sans-serif", fontWeight: 600, padding: "3px 10px", borderRadius: "6px", lineHeight: 1.6 }}>{t("worker.close")}</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { label: t("worker.binsCollected"), value: `${selectedDay.bins} ${t("worker.progressBins")}` },
                { label: t("worker.distanceCovered"), value: selectedDay.distance },
                { label: t("worker.hoursWorked"), value: selectedDay.hours },
                { label: t("worker.bonusEarned"), value: selectedDay.bonus > 0 ? `₹${selectedDay.bonus}` : t("worker.none"), highlight: selectedDay.bonus > 0 },
              ].map((s, i) => (
                <div key={i} style={{ background: panelBg, borderRadius: "8px", padding: "10px 12px", border: `1px solid ${border}` }}>
                  <div style={{ color: sub, fontSize: "10px", marginBottom: "3px" }}>{s.label}</div>
                  <div style={{ color: s.highlight ? "#16a34a" : text, fontWeight: 700, fontSize: "13px" }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

// ─── QR Modal ─────────────────────────────────────────────────────────────────

function QRModal({ task, dark, onClose, onConfirm }: { task: BinTask; dark: boolean; onClose: () => void; onConfirm: () => void }) {
  const { t } = useTranslation();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  const bg = dark ? "#111827" : "#ffffff";
  const card = dark ? "#1f2937" : "#f9fafb";
  const border = dark ? "#374151" : "#e5e7eb";
  const text = dark ? "#f9fafb" : "#111827";
  const sub = dark ? "#9ca3af" : "#6b7280";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }} onClick={onClose}>
      <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "400px", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ marginBottom: "14px" }}>
          <h3 style={{ color: text, fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "17px", margin: 0 }}>{t("worker.scanBinQr")}</h3>
          <p style={{ color: sub, fontSize: "12px", margin: "3px 0 0" }}>{task.binId} · {task.location}</p>
        </div>
        <div style={{ background: card, borderRadius: "10px", padding: "12px", marginBottom: "14px", border: `1px solid ${border}` }}>
          <div style={{ color: sub, fontSize: "10px", fontWeight: 700, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("worker.binCompartments")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {task.compartments.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: CATEGORY_COLORS[c.category] ?? "#6b7280", flexShrink: 0 }} />
                <span style={{ fontSize: "11px", color: CATEGORY_COLORS[c.category] ?? sub, fontWeight: 700, width: "54px", flexShrink: 0 }}>{c.category}</span>
                <FillBar level={c.fillLevel} color={CATEGORY_COLORS[c.category] ?? "#6b7280"} />
                <span style={{ fontSize: "10px", fontWeight: 700, color: c.fillLevel >= 80 ? "#ef4444" : c.fillLevel >= 60 ? "#f59e0b" : "#16a34a", width: "30px", textAlign: "right", flexShrink: 0 }}>{c.fillLevel}%</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: `1px solid ${border}`, display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: sub, fontSize: "10px" }}>{t("worker.overallFill")}</span>
            <span style={{ color: avgFill(task.compartments) >= 60 ? "#16a34a" : "#f59e0b", fontWeight: 700, fontSize: "11px" }}>{avgFill(task.compartments)}% {t("worker.avg")}</span>
          </div>
        </div>
        <div style={{ background: card, border: `2px dashed ${scanned ? "#16a34a" : border}`, borderRadius: "12px", height: "140px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "14px", transition: "border-color 0.3s ease" }}>
          {scanned ? (
            <><CheckCircle size={42} color="#16a34a" weight="fill" /><span style={{ color: "#16a34a", fontWeight: 700, fontSize: "15px", fontFamily: "DM Sans, sans-serif" }}>{t("worker.binVerified")}</span></>
          ) : scanning ? (
            <><div style={{ width: "40px", height: "40px", border: "3px solid #16a34a", borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /><span style={{ color: sub, fontSize: "13px" }}>{t("worker.scanning")}</span></>
          ) : (
            <><QrCode size={42} color={sub} /><span style={{ color: sub, fontSize: "13px" }}>{t("worker.pointCamera")}</span></>
          )}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: `1px solid ${border}`, background: "transparent", color: sub, fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>{t("worker.cancel")}</button>
          {scanned ? (
            <button onClick={onConfirm} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "#16a34a", color: "#fff", fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>{t("worker.confirmPickup")}</button>
          ) : (
            <button onClick={() => { setScanning(true); setTimeout(() => { setScanning(false); setScanned(true); }, 1800); }} disabled={scanning} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: scanning ? "#9ca3af" : "#16a34a", color: "#fff", fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "14px", cursor: scanning ? "not-allowed" : "pointer" }}>
              {scanning ? t("worker.scanning") : t("worker.simulateScan")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SanitationWorkerDashboard() {
  const { t } = useTranslation();
  const [dark, setDark] = useState(true);
  const [activeTab, setActiveTab] = useState<"tasks" | "earnings" | "route">("tasks");
  const [tasks, setTasks] = useState<BinTask[]>(MOCK_TASKS);
  const [qrTask, setQrTask] = useState<BinTask | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const bg         = dark ? "#030712" : "#f3f4f6";
  const card       = dark ? "#111827" : "#ffffff";
  const cardBorder = dark ? "#1f2937" : "#e5e7eb";
  const surface    = dark ? "#1f2937" : "#f9fafb";
  const text       = dark ? "#f9fafb" : "#111827";
  const sub        = dark ? "#9ca3af" : "#6b7280";
  const divider    = dark ? "#1f2937" : "#e5e7eb";

  const displayed     = sortedTasks(tasks);
  const collected     = tasks.filter((t) => t.status === "collected").length;
  const pending       = tasks.filter((t) => t.status === "pending").length;
  const allDone       = collected === tasks.length;
  const todayEarnings = MOCK_EARNINGS[MOCK_EARNINGS.length - 1].amount;
  const weekTotal     = MOCK_EARNINGS.reduce((s, d) => s + d.amount, 0);

  const handleConfirmPickup = () => {
    if (!qrTask) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === qrTask.id
          ? { ...t, status: "collected", compartments: t.compartments.map((c) => ({ ...c, fillLevel: 0 })) }
          : t
      )
    );
    setQrTask(null);
  };

  const tabs = [
    { id: "tasks",    label: t("worker.tabs.tasks"),    icon: CheckCircle },
    { id: "route",    label: t("worker.tabs.route"),    icon: MapPin },
    { id: "earnings", label: t("worker.tabs.earnings"), icon: CurrencyInr },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", width: "100%", maxWidth: "100vw", overflowX: "hidden", background: bg, fontFamily: "DM Sans, sans-serif", transition: "background 0.3s ease" }}>

      {/* Header */}
      <div style={{ background: card, borderBottom: `1px solid ${cardBorder}`, padding: "12px 16px", position: "sticky", top: 0, zIndex: 1000 }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Recycle size={18} color="#fff" weight="bold" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: text, fontWeight: 700, fontSize: "15px", lineHeight: 1.2 }}>{t("worker.appTitle")}</div>
              <div style={{ color: "#16a34a", fontSize: "11px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{MOCK_WORKER.zone}</div>
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={() => { setMenuOpen(o => !o); console.log("menu clicked"); }} style={{ background: surface, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", color: sub }}>
              <List size={18} />
            </button>
            {menuOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: dark ? "#111827" : "#ffffff", border: `1px solid ${cardBorder}`, borderRadius: "12px", overflow: "visible", zIndex: 2000, minWidth: "160px", boxShadow: "0 8px 24px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column" }}>
                <button onClick={() => setDark(!dark)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", background: "transparent", border: "none", cursor: "pointer", color: sub, fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 500, textAlign: "left" }}>
                  {dark ? <Sun size={16} /> : <Moon size={16} />}
                  {dark ? "Light Mode" : "Dark Mode"}
                </button>
                <div style={{ height: "1px", background: cardBorder }} />
                <button style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", background: "transparent", border: "none", cursor: "pointer", color: sub, fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 500, textAlign: "left" }}>
                  <Bell size={16} /> Notifications
                </button>
                <div style={{ height: "1px", background: cardBorder }} />
                <button style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", background: "transparent", border: "none", cursor: "pointer", color: "#16a34a", fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 600, textAlign: "left" }}>
                  <User size={16} color="#16a34a" /> {MOCK_WORKER.name}
                </button>
                <div style={{ height: "1px", background: cardBorder }} />
                <div style={{ padding: "8px 12px" }}>
                  <LangDropdown dark={dark} sub={sub} surface={surface} cardBorder={cardBorder} text={text} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "20px 12px 100px" }}>

        {/* Worker Info */}
        <div style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "18px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "12px", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "22px", fontWeight: 700, color: "#fff" }}>R</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: text, fontWeight: 700, fontSize: "16px" }}>{MOCK_WORKER.name}</span>
              <SealCheck size={16} color="#16a34a" weight="fill" />
            </div>
            <div style={{ color: sub, fontSize: "12px" }}>{MOCK_WORKER.workerId} · {t("worker.active")}</div>
          </div>
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#16a34a", fontWeight: 700, fontSize: "18px" }}>{MOCK_WORKER.streak}</div>
              <div style={{ color: sub, fontSize: "10px" }}>{t("worker.dayStreak")}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: text, fontWeight: 700, fontSize: "18px" }}>{MOCK_WORKER.rating}</div>
              <div style={{ color: sub, fontSize: "10px" }}>{t("worker.rating")}</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
          {[
            { label: t("worker.collected"), value: collected, icon: <CheckCircle size={18} color="#16a34a" weight="fill" />, color: "#16a34a" },
            { label: t("worker.pending"),   value: pending,   icon: <Clock size={18} color="#f59e0b" weight="fill" />,        color: "#f59e0b" },
            { label: t("worker.todayEarnings"), value: todayEarnings, icon: <CurrencyInr size={18} color="#3b82f6" weight="bold" />, color: "#3b82f6" },
          ].map((s, i) => (
            <div key={i} style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "14px 12px", textAlign: "center" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>{s.icon}</div>
              <div style={{ color: text, fontWeight: 700, fontSize: "20px" }}>{s.value}</div>
              <div style={{ color: sub, fontSize: "11px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", background: surface, borderRadius: "12px", padding: "4px", marginBottom: "16px" }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: "9px 8px", borderRadius: "9px", border: "none", background: active ? card : "transparent", color: active ? "#16a34a" : sub, fontFamily: "DM Sans, sans-serif", fontWeight: active ? 700 : 500, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", boxShadow: active ? `0 1px 3px rgba(0,0,0,${dark ? "0.4" : "0.1"})` : "none", transition: "all 0.15s ease" }}>
                <Icon size={14} weight={active ? "fill" : "regular"} />{tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Tasks ── */}
        {activeTab === "tasks" && (
          <div>
            <div style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "14px 16px", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: text, fontWeight: 600, fontSize: "13px" }}>{t("worker.progress")}</span>
                <span style={{ color: "#16a34a", fontWeight: 700, fontSize: "13px" }}>{collected}/{tasks.length} {t("worker.progressBins")}</span>
              </div>
              <div style={{ height: "8px", borderRadius: "99px", background: dark ? "#374151" : "#e5e7eb", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(collected / tasks.length) * 100}%`, background: "linear-gradient(90deg,#16a34a,#22c55e)", borderRadius: "99px", transition: "width 0.5s ease" }} />
              </div>
            </div>

            {allDone && (
              <div style={{ background: "linear-gradient(135deg,#14532d,#15803d)", border: "1px solid #16a34a", borderRadius: "14px", padding: "18px 20px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "14px", animation: "fadeIn 0.4s ease" }}>
                <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: "#16a34a44", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Confetti size={26} color="#4ade80" weight="fill" />
                </div>
                <div>
                  <div style={{ color: "#f0fdf4", fontWeight: 700, fontSize: "15px" }}>{t("worker.congrats")}</div>
                  <div style={{ color: "#86efac", fontSize: "12px", marginTop: "3px" }}>
                    {t("worker.progressBins", { count: tasks.length })} {tasks.length} {t("worker.congratsSub")} · ₹{todayEarnings} {t("worker.earnedToday")}
                  </div>
                </div>
              </div>
            )}

            <div style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "12px", overflow: "hidden" }}>
              {displayed.map((task, i) => {
                const high = maxFill(task.compartments);
                const avg  = avgFill(task.compartments);
                return (
                  <div key={task.id} style={{ transition: "all 0.3s ease" }}>
                    {i > 0 && <div style={{ height: "1px", background: divider, margin: "0 16px" }} />}
                    <div style={{ padding: "14px 16px", opacity: task.status === "collected" ? 0.5 : 1, transition: "opacity 0.3s" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
                        <div style={{ flexShrink: 0, paddingTop: "1px" }}>
                          {task.status === "collected" ? <CheckCircle size={20} color="#16a34a" weight="fill" /> : <Circle size={20} color={sub} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <span style={{ color: text, fontWeight: 700, fontSize: "13px", textDecoration: task.status === "collected" ? "line-through" : "none" }}>{task.binId}</span>
                            <span style={{ fontSize: "10px", color: avg >= 60 ? "#16a34a" : "#f59e0b", fontWeight: 700, background: avg >= 60 ? "#16a34a18" : "#f59e0b18", padding: "1px 6px", borderRadius: "99px" }}>{avg}% {t("worker.avgFill")}</span>
                            {high >= 80 && task.status === "pending" && (
                              <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "10px", color: "#ef4444", fontWeight: 700 }}><WarningCircle size={10} weight="fill" />{t("worker.nearFull")}</span>
                            )}
                          </div>
                          <div style={{ color: sub, fontSize: "11px", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.location}</div>
                          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "3px", color: sub, fontSize: "10px" }}><Clock size={10} />{task.scheduledTime}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: "3px", color: sub, fontSize: "10px" }}><MapPin size={10} />{task.distance}</span>
                          </div>
                        </div>
                        {task.status === "pending" && (
                          <button onClick={() => setQrTask(task)} style={{ background: "#16a34a", border: "none", borderRadius: "9px", padding: "8px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", color: "#fff", fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "12px", flexShrink: 0 }}>
                            <QrCode size={14} weight="bold" />{t("worker.scan")}
                          </button>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px", paddingLeft: "30px" }}>
                        {task.compartments.map((c, ci) => (
                          <div key={ci} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: CATEGORY_COLORS[c.category] ?? "#6b7280", flexShrink: 0 }} />
                            <span style={{ fontSize: "10px", color: CATEGORY_COLORS[c.category] ?? sub, fontWeight: 700, width: "50px", flexShrink: 0 }}>{c.category}</span>
                            <FillBar level={c.fillLevel} color={CATEGORY_COLORS[c.category] ?? "#6b7280"} />
                            <span style={{ fontSize: "10px", fontWeight: 700, color: c.fillLevel === 0 ? sub : c.fillLevel >= 80 ? "#ef4444" : c.fillLevel >= 60 ? "#f59e0b" : "#16a34a", width: "28px", textAlign: "right", flexShrink: 0 }}>{c.fillLevel}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Route ── */}
        {activeTab === "route" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <Bicycle size={20} color="#16a34a" weight="fill" />
                <span style={{ color: text, fontWeight: 700, fontSize: "15px" }}>{t("worker.todaysRoute")}</span>
              </div>
              <div style={{ display: "flex", gap: "8px", padding: "10px 12px", background: surface, borderRadius: "10px", marginBottom: "14px" }}>
                {[{ label: t("worker.totalBins"), value: tasks.length }, { label: t("worker.estDistance"), value: "3.0 km" }, { label: t("worker.estTime"), value: "4.5 hrs" }].map((s, i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ color: text, fontWeight: 700, fontSize: "16px" }}>{s.value}</div>
                    <div style={{ color: sub, fontSize: "10px" }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div>
                {displayed.map((task, i) => (
                  <div key={task.id} style={{ display: "flex", gap: "12px" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: task.status === "collected" ? "#16a34a" : dark ? "#1f2937" : "#e5e7eb", border: `2px solid ${task.status === "collected" ? "#16a34a" : cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1 }}>
                        {task.status === "collected" ? <CheckCircle size={14} color="#fff" weight="fill" /> : <span style={{ color: sub, fontSize: "11px", fontWeight: 700 }}>{i + 1}</span>}
                      </div>
                      {i < tasks.length - 1 && <div style={{ width: "2px", flex: 1, minHeight: "24px", background: task.status === "collected" ? "#16a34a44" : dark ? "#374151" : "#e5e7eb" }} />}
                    </div>
                    <div style={{ paddingBottom: "16px", flex: 1, minWidth: 0 }}>
                      <div style={{ color: text, fontWeight: 600, fontSize: "13px" }}>{task.binId}</div>
                      <div style={{ color: sub, fontSize: "11px", marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.location}</div>
                      <div style={{ display: "flex", gap: "5px", marginTop: "5px", flexWrap: "wrap" }}>
                        {task.compartments.filter((c) => c.fillLevel > 0).map((c, ci) => (
                          <span key={ci} style={{ background: `${CATEGORY_COLORS[c.category] ?? "#6b7280"}22`, color: CATEGORY_COLORS[c.category] ?? "#6b7280", fontSize: "9px", fontWeight: 700, padding: "1px 6px", borderRadius: "99px" }}>{c.category} {c.fillLevel}%</span>
                        ))}
                        {maxFill(task.compartments) >= 80 && task.status === "pending" && (
                          <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "10px", color: "#ef4444", fontWeight: 600 }}><WarningCircle size={10} weight="fill" />{t("worker.nearFull")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Earnings ── */}
        {activeTab === "earnings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ background: "linear-gradient(135deg,#15803d,#16a34a)", borderRadius: "14px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "#a7f3d0", fontSize: "12px", fontWeight: 600 }}>{t("worker.thisWeek")}</div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: "28px", lineHeight: 1.1 }}>₹{weekTotal}</div>
                <div style={{ color: "#bbf7d0", fontSize: "12px", marginTop: "4px" }}>{MOCK_WORKER.totalCollections} {t("worker.lifetimeCollections")}</div>
              </div>
              <Trophy size={40} color="#a7f3d0" weight="fill" />
            </div>

            <div style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                <ChartBar size={16} color="#16a34a" weight="fill" />
                <span style={{ color: text, fontWeight: 700, fontSize: "14px" }}>{t("worker.dailyEarnings")}</span>
                <span style={{ color: dark ? "#6b7280" : "#9ca3af", fontSize: "11px" }}>{t("worker.tapBarDetails")}</span>
              </div>
              <EarningsChart data={MOCK_EARNINGS} dark={dark} />
            </div>

            <div style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${divider}` }}>
                <span style={{ color: text, fontWeight: 700, fontSize: "14px" }}>{t("worker.incentives")}</span>
              </div>
              {[
                { label: t("worker.perBin"),         value: "₹12",  desc: t("worker.perBinDesc"),         color: "#16a34a" },
                { label: t("worker.completionBonus"), value: "₹50",  desc: t("worker.completionBonusDesc"), color: "#f59e0b" },
                { label: t("worker.streakBonus"),     value: "₹100", desc: t("worker.streakBonusDesc"),     color: "#3b82f6" },
                { label: t("worker.starBonus"),       value: "₹75",  desc: t("worker.starBonusDesc"),       color: "#8b5cf6" },
              ].map((item, i, arr) => (
                <div key={i}>
                  <div style={{ padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ color: text, fontWeight: 600, fontSize: "13px" }}>{item.label}</div>
                      <div style={{ color: sub, fontSize: "11px" }}>{item.desc}</div>
                    </div>
                    <span style={{ color: item.color, fontWeight: 700, fontSize: "15px" }}>{item.value}</span>
                  </div>
                  {i < arr.length - 1 && <div style={{ height: "1px", background: divider, margin: "0 16px" }} />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }`}</style>
{qrTask && <QRModal task={qrTask} dark={dark} onClose={() => setQrTask(null)} onConfirm={handleConfirmPickup} />}

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: card, borderTop: `1px solid ${cardBorder}`, padding: "10px 20px 20px", display: "flex", justifyContent: "space-around" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", color: active ? "#16a34a" : sub }}>
              <Icon size={22} weight={active ? "fill" : "regular"} />
              <span style={{ fontSize: "10px", fontFamily: "DM Sans, sans-serif", fontWeight: active ? 700 : 500 }}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}