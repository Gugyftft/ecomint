import {
  Leaf, Recycle, Newspaper, Wine, Wrench, Desktop, Plant, Question,
  Fire, Trophy as PhTrophy, TrendUp as PhTrending,
  CurrencyInr as PhCurrency,
  Package as PhPackage, Camera as PhCamera, SignOut, CaretRight,
  Sun as PhSun, Moon as PhMoon, ArrowUpRight as PhArrow,
} from '@phosphor-icons/react';
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createClient } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

const supabase = createClient(
  "https://apwbevlglcxdeduwnvsu.supabase.co",
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface UserProfile {
  id: string; name: string; username: string; email: string;
  city: string; state: string; wallet_balance: number;
  total_weight_disposed: number; total_disposals: number;
  current_streak: number; longest_streak: number;
  last_disposal_date: string; milestones_achieved: string[];
}
interface Transaction {
  id: string; material_type: string; weight_grams: number;
  reward_amount: number; payment_status: string; created_at: string;
}
interface DisposalLimit {
  material_type: string; disposed_in_window: number; window_resets_at: string;
}
interface MaterialRate {
  material_name: string; current_rate: number; base_rate: number; is_suppressed: boolean;
}

const MATERIAL_COLORS: Record<string, string> = {
  Plastic: "#3b82f6", Paper: "#f59e0b", Glass: "#06b6d4",
  Metal: "#8b5cf6", "E-Waste": "#ef4444", Organic: "#22c55e", Miscellaneous: "#9ca3af",
};

function MaterialIcon({ type, size = 18 }: { type: string; size?: number }) {
  const props = { size, weight: "duotone" as const, color: "#16a34a" };
  const normalized = type?.toLowerCase();
  switch (normalized) {
    case "plastic": return <Recycle {...props} />;
    case "paper": return <Newspaper {...props} />;
    case "glass": return <Wine {...props} />;
    case "metal": return <Wrench {...props} />;
    case "e-waste": return <Desktop {...props} />;
    case "organic": return <Plant {...props} />;
    case "miscellaneous": return <Question {...props} />;
    default: return <Recycle {...props} />;
  }
}

const MILESTONES = [
  { weight: 1000, label: "Sprout", icon: "🌱" },
  { weight: 5000, label: "Sapling", icon: "🌿" },
  { weight: 10000, label: "Tree", icon: "🌳" },
  { weight: 25000, label: "Earth Guardian", icon: "🌍" },
  { weight: 50000, label: "EcoWarrior", icon: "⭐" },
  { weight: 100000, label: "EcoLegend", icon: "👑" },
];

const LEADERBOARD_DATA = {
  weight: [
    { rank: 1, username: "green_rahul", city: "Mumbai", value: "48.2 kg" },
    { rank: 2, username: "eco_priya", city: "Pune", value: "41.7 kg" },
    { rank: 3, username: "wastehero99", city: "Nashik", value: "38.1 kg" },
    { rank: 4, username: "cleanearth", city: "Mumbai", value: "31.4 kg" },
    { rank: 5, username: "you", city: "Nashik", value: "12.3 kg", isYou: true },
  ],
  earnings: [
    { rank: 1, username: "eco_priya", city: "Pune", value: "₹5,820" },
    { rank: 2, username: "green_rahul", city: "Mumbai", value: "₹4,960" },
    { rank: 3, username: "cleanearth", city: "Mumbai", value: "₹3,740" },
    { rank: 4, username: "wastehero99", city: "Nashik", value: "₹3,210" },
    { rank: 5, username: "you", city: "Nashik", value: "₹342", isYou: true },
  ],
  disposals: [
    { rank: 1, username: "wastehero99", city: "Nashik", value: "312 drops" },
    { rank: 2, username: "green_rahul", city: "Mumbai", value: "287 drops" },
    { rank: 3, username: "eco_priya", city: "Pune", value: "241 drops" },
    { rank: 4, username: "cleanearth", city: "Mumbai", value: "198 drops" },
    { rank: 5, username: "you", city: "Nashik", value: "23 drops", isYou: true },
  ],
  streak: [
    { rank: 1, username: "cleanearth", city: "Mumbai", value: "62 days" },
    { rank: 2, username: "eco_priya", city: "Pune", value: "48 days" },
    { rank: 3, username: "green_rahul", city: "Mumbai", value: "31 days" },
    { rank: 4, username: "wastehero99", city: "Nashik", value: "19 days" },
    { rank: 5, username: "you", city: "Nashik", value: "7 days", isYou: true },
  ],
};

function getLimitColor(grams: number) {
  if (grams >= 4500) return "#ef4444";
  if (grams >= 3000) return "#f59e0b";
  return "#22c55e";
}
function formatTimeLeft(resetAt: string) {
  const diff = new Date(resetAt).getTime() - Date.now();
  if (diff <= 0) return "Resetting...";
  return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
}
function formatAmount(n: number) { return `₹${n.toFixed(2)}`; }
function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}
function groupTransactionsByDate(transactions: Transaction[]) {
  const groups: Record<string, Transaction[]> = {};
  transactions.forEach((t) => {
    const date = new Date(t.created_at);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    let label = date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    if (date.toDateString() === today.toDateString()) label = "Today";
    else if (date.toDateString() === yesterday.toDateString()) label = "Yesterday";
    if (!groups[label]) groups[label] = [];
    groups[label].push(t);
  });
  return groups;
}


function getTheme(dark: boolean) {
  return dark ? {
    root: "#080f0a", sidebar: "rgba(255,255,255,0.02)", sidebarBorder: "rgba(255,255,255,0.06)",
    card: "rgba(255,255,255,0.03)", cardBorder: "rgba(255,255,255,0.06)",
    text: "#fff", textMuted: "rgba(255,255,255,0.35)", textFaint: "rgba(255,255,255,0.25)",
    navText: "rgba(255,255,255,0.4)", navActive: "rgba(74,222,128,0.1)",
    progressBg: "rgba(255,255,255,0.08)", rateBg: "rgba(255,255,255,0.04)",
    txBg: "rgba(255,255,255,0.04)", leaderBg: "rgba(255,255,255,0.04)",
    leaderYouBg: "rgba(74,222,128,0.08)", leaderYouBorder: "rgba(74,222,128,0.2)",
    toggleBg: "rgba(255,255,255,0.05)", themeBtnBg: "rgba(255,255,255,0.08)",
    themeBtnBorder: "rgba(255,255,255,0.12)", avatarBg: "linear-gradient(135deg, #16a34a, #15803d)",
    logoutBg: "rgba(255,255,255,0.05)", logoutBorder: "rgba(255,255,255,0.08)",
    desktopNoteBg: "rgba(255,255,255,0.03)", desktopNoteBorder: "rgba(255,255,255,0.08)",
    sectionDivider: "rgba(255,255,255,0.06)",
  } : {
    root: "#f0fdf4", sidebar: "#fff", sidebarBorder: "rgba(0,0,0,0.08)",
    card: "#fff", cardBorder: "rgba(0,0,0,0.08)",
    text: "#111", textMuted: "rgba(0,0,0,0.45)", textFaint: "rgba(0,0,0,0.3)",
    navText: "rgba(0,0,0,0.45)", navActive: "rgba(22,163,74,0.08)",
    progressBg: "rgba(0,0,0,0.08)", rateBg: "rgba(0,0,0,0.06)",
    txBg: "rgba(0,0,0,0.06)", leaderBg: "rgba(0,0,0,0.06)",
    leaderYouBg: "rgba(22,163,74,0.06)", leaderYouBorder: "rgba(22,163,74,0.2)",
    toggleBg: "rgba(0,0,0,0.05)", themeBtnBg: "rgba(0,0,0,0.05)",
    themeBtnBorder: "rgba(0,0,0,0.1)", avatarBg: "linear-gradient(135deg, #16a34a, #15803d)",
    logoutBg: "rgba(0,0,0,0.04)", logoutBorder: "rgba(0,0,0,0.08)",
    desktopNoteBg: "rgba(0,0,0,0.03)", desktopNoteBorder: "rgba(0,0,0,0.08)",
    sectionDivider: "rgba(0,0,0,0.06)",
  };
}

const MOCK_RATES: MaterialRate[] = [
  { material_name: "Plastic", current_rate: 0.08, base_rate: 0.08, is_suppressed: false },
  { material_name: "Paper", current_rate: 0.04, base_rate: 0.05, is_suppressed: true },
  { material_name: "Glass", current_rate: 0.06, base_rate: 0.06, is_suppressed: false },
  { material_name: "Metal", current_rate: 0.12, base_rate: 0.12, is_suppressed: false },
  { material_name: "E-Waste", current_rate: 0.20, base_rate: 0.20, is_suppressed: false },
  { material_name: "Organic", current_rate: 0.03, base_rate: 0.03, is_suppressed: false },
  { material_name: "Miscellaneous", current_rate: 0.02, base_rate: 0.02, is_suppressed: false },
];

export default function UserDashboard() {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const LANGS = [
    { code: "en", label: "EN" },
    { code: "hi", label: "हि" },
    { code: "mr", label: "म" },
  ];
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [limits, setLimits] = useState<DisposalLimit[]>([]);
  const [rates, setRates] = useState<MaterialRate[]>([]);
  const [leaderboardScope, setLeaderboardScope] = useState<"region" | "state" | "nation">("region");
  const [leaderboardMetric, setLeaderboardMetric] = useState<"weight" | "earnings" | "disposals" | "streak">("weight");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "leaderboard">("overview");
  const [dark, setDark] = useState(() => localStorage.getItem("theme") !== "light");
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

useEffect(() => {
  const handler = () => setIsMobileView(window.innerWidth < 768);
  window.addEventListener("resize", handler);
  return () => window.removeEventListener("resize", handler);
}, []);

  const th = getTheme(dark);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { navigate("/auth"); return; }
    const { data: profile } = await supabase.from("users").select("*").eq("id", authUser.id).single();
    if (profile) setUser(profile);
    const { data: txns } = await supabase.from("transactions").select("*")
      .eq("user_id", authUser.id).order("created_at", { ascending: false }).limit(50);
    if (txns) setTransactions(txns);
    const { data: limitsData } = await supabase.from("disposal_limits").select("*").eq("user_id", authUser.id);
    if (limitsData) setLimits(limitsData);
    if (profile?.city) {
      const { data: ratesData } = await supabase.from("regional_material_rates").select("*").eq("region", profile.city);
      if (ratesData) setRates(ratesData);
    }
    setLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/auth"); };

  if (loading) return <LoadingScreen dark={dark} message={t('user.loading')} />;

  const totalWeight = user?.total_weight_disposed ?? 0;
  const nextMilestone = MILESTONES.find(m => m.weight > totalWeight);
  const lastMilestone = [...MILESTONES].reverse().find(m => m.weight <= totalWeight);
  const milestoneProgress = nextMilestone
    ? ((totalWeight - (lastMilestone?.weight ?? 0)) / (nextMilestone.weight - (lastMilestone?.weight ?? 0))) * 100 : 100;
  const disposedToday = user?.last_disposal_date
    ? new Date(user.last_disposal_date).toDateString() === new Date().toDateString() : false;
  const leaderboardEntries = LEADERBOARD_DATA[leaderboardMetric];
  const groupedTransactions = groupTransactionsByDate(transactions);

  return (
    <div style={{ ...s.root, background: th.root, color: th.text }}>
      <div style={{ ...s.blob1, opacity: dark ? 1 : 0.4 }} />
      <div style={{ ...s.blob2, opacity: dark ? 1 : 0.4 }} />
      <div style={{ ...s.blob3, opacity: dark ? 1 : 0.4 }} />

      {/* Theme toggle */}
      {/* Language switcher */}

      <button onClick={() => setDark(!dark)} style={{ ...s.themeBtn, background: th.themeBtnBg, border: `1px solid ${th.themeBtnBorder}`, color: th.text }}>
        {dark ? <PhSun size={15} weight="duotone" /> : <PhMoon size={15} weight="duotone" />}
      </button>
      <div style={{ position: "fixed", top: 60, right: 20, zIndex: 100 }}>
        <button onClick={() => setLangOpen(o => !o)}
          style={{ background: th.themeBtnBg, border: `1px solid ${th.themeBtnBorder}`, color: th.text, fontSize: 12, fontWeight: 700, padding: "8px 10px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit" }}>
          {LANGS.find(l => l.code === i18n.language)?.label ?? "EN"} {langOpen ? "▲" : "▼"}
        </button>
        {langOpen && (
          <div style={{ position: "absolute", top: "110%", right: 0, background: th.card, border: `1px solid ${th.cardBorder}`, borderRadius: 10, overflow: "hidden", minWidth: 80, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", zIndex: 100 }}>
            {LANGS.map(l => (
              <button key={l.code} onClick={() => { i18n.changeLanguage(l.code); localStorage.setItem('ecomint_lang', l.code); setLangOpen(false); }}
                style={{ display: "block", width: "100%", padding: "9px 14px", background: i18n.language === l.code ? "#16a34a" : "transparent", color: i18n.language === l.code ? "#fff" : th.text, border: "none", fontFamily: "inherit", fontWeight: 600, fontSize: 13, cursor: "pointer", textAlign: "left" }}>
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside style={{ ...s.sidebar, display: isMobileView ? "none" : "flex", background: dark ? "#111827" : th.sidebar, borderColor: th.sidebarBorder }}>
        <div style={{ ...s.sidebarBrand, justifyContent: "space-between" }}>
          <span style={{ ...s.brandText, color: "#16a34a" }}>EcoMint</span>
          <div style={{ position: "relative" }}>
            <button onClick={() => setLangOpen(o => !o)}
              style={{ background: th.themeBtnBg, border: `1px solid ${th.themeBtnBorder}`, color: th.text, fontSize: 12, fontWeight: 700, padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>
              {LANGS.find(l => l.code === i18n.language)?.label ?? "EN"} {langOpen ? "▲" : "▼"}
            </button>
            {langOpen && (
              <div style={{ position: "absolute", top: "110%", right: 0, background: th.card, border: `1px solid ${th.cardBorder}`, borderRadius: 10, overflow: "hidden", minWidth: 80, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", zIndex: 50 }}>
                {LANGS.map(l => (
                  <button key={l.code} onClick={() => { i18n.changeLanguage(l.code); localStorage.setItem('ecomint_lang', l.code); setLangOpen(false); }}
                    style={{ display: "block", width: "100%", padding: "9px 14px", background: i18n.language === l.code ? "#16a34a" : "transparent", color: i18n.language === l.code ? "#fff" : th.text, border: "none", fontFamily: "inherit", fontWeight: 600, fontSize: 13, cursor: "pointer", textAlign: "left" }}>
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <nav style={s.nav}>
          {[
            { id: "overview", icon: <Leaf size={18} weight="duotone" />, label: t('user.tabs.overview') },
            { id: "transactions", icon: <PhTrending size={18} weight="duotone" />, label: t('user.tabs.transactions') },
            { id: "leaderboard", icon: <PhTrophy size={18} weight="duotone" />, label: t('user.tabs.leaderboard') },
          ].map((item) => (
            <button key={item.id}
              style={{ ...s.navItem, color: activeTab === item.id ? "#16a34a" : th.navText, background: activeTab === item.id ? th.navActive : "transparent", borderLeft: activeTab === item.id ? "2px solid #16a34a" : "2px solid transparent" }}
              onClick={() => setActiveTab(item.id as typeof activeTab)}>
              {item.icon}<span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div style={{ ...s.sidebarBottom, borderColor: th.sectionDivider }}>
          <div style={s.userMeta}>
            <div style={{ ...s.avatarCircle, background: th.avatarBg }}>
              {user?.username?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <p style={{ ...s.sidebarUsername, color: th.text }}>@{user?.username ?? "user"}</p>
              <p style={{ ...s.sidebarCity, color: th.textMuted }}>{user?.city}, {user?.state}</p>
            </div>
          </div>
          <button style={{ ...s.logoutBtn, background: th.logoutBg, border: `1px solid ${th.logoutBorder}`, color: th.textMuted }} onClick={handleLogout}>
            <SignOut size={16} weight="duotone" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={s.main}>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div style={s.tabContent}>
            <div style={s.pageHeader}>
              <div>
                <h1 style={{ ...s.pageTitle, color: th.text, fontSize: isMobileView ? 20 : 26 }}>
                  {t(`user.greeting.${getGreeting()}`) ? `${t('user.greetingPrefix')} ${t(`user.greeting.${getGreeting()}`)}` : `Good ${getGreeting()}`}, <span style={{ color: "#16a34a" }}>{user?.name?.split(" ")[0] ?? "there"}</span> 👋
                </h1>
                <p style={{ ...s.pageSubtitle, color: th.textMuted }}>{t('user.subtitle')}</p>
              </div>
            </div>

            <div style={s.statsGrid}>
              <StatCard icon={<PhCurrency size={20} weight="duotone" />} label={t('user.stats.totalEarnings')} value={formatAmount(transactions.reduce((s, tx) => s + tx.reward_amount, 0))} accent="#16a34a" th={th} />
              <StatCard icon={<PhPackage size={20} weight="duotone" />} label={t('user.stats.totalDisposed')} value={`${((user?.total_weight_disposed ?? 0) / 1000).toFixed(2)} kg`} accent="#16a34a" th={th} />
              <StatCard icon={<PhTrending size={20} weight="duotone" />} label={t('user.stats.totalDisposals')} value={`${user?.total_disposals ?? 0}`} accent="#16a34a" th={th} />
              <StatCard
                icon={<Fire size={20} weight="duotone" color={disposedToday ? "#fbbf24" : th.textMuted} />}
                label={t('user.stats.currentStreak')} value={`${user?.current_streak ?? 0} ${t('user.stats.days')}`}
                accent={disposedToday ? "#fbbf24" : "#6b7280"} th={th}
                sub={`${t('user.stats.longestStreak')}: ${user?.longest_streak ?? 0} ${t('user.stats.days')}`} />
            </div>

            <div style={s.midGrid}>
              {/* Daily Limits */}
              <div style={{ ...s.card, background: th.card, borderColor: th.cardBorder }}>
                <div style={s.cardHeader}>
                  <h3 style={{ ...s.cardTitle, color: th.text }}>{t('user.dailyLimits.title')}</h3>
                  <span style={{ ...s.cardSubtle, color: th.textFaint }}>{t('user.dailyLimits.subtitle')}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {["Plastic", "Paper", "Glass", "Metal", "E-Waste", "Organic", "Miscellaneous"].map((mat) => {
                    const limit = limits.find(l => l.material_type === mat);
                    const disposed = limit?.disposed_in_window ?? 0;
                    const pct = Math.min((disposed / 5000) * 100, 100);
                    const color = getLimitColor(disposed);
                    const maxed = disposed >= 5000;
                    return (
                      <div key={mat}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ ...s.limitLabel, color: th.text }}>
                            <MaterialIcon type={mat} size={16} /> {mat}
                          </span>
                          <span style={{ ...s.limitValue, color: maxed ? th.textFaint : color }}>
                            {maxed ? `${t('user.dailyLimits.maxed')} ${limit ? formatTimeLeft(limit.window_resets_at) : "—"}` : `${(disposed / 1000).toFixed(1)}${t('user.dailyLimits.kg')} / 5${t('user.dailyLimits.kg')}`}
                          </span>
                        </div>
                        <div style={{ ...s.progressBg, background: th.progressBg }}>
                          <div style={{ ...s.progressFill, width: `${pct}%`, background: maxed ? (dark ? "#4b5563" : "#d1d5db") : color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Live Rates */}
                <div style={{ ...s.card, background: th.card, borderColor: th.cardBorder }}>
                  <div style={s.cardHeader}>
                    <h3 style={{ ...s.cardTitle, color: th.text }}>{t('user.liveRates.title')}</h3>
                    <span style={{ ...s.cardSubtle, color: th.textFaint }}>{user?.city ?? "Your city"}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {(rates.length > 0 ? rates : MOCK_RATES).map((r) => (
                      <div key={r.material_name} style={{ ...s.rateRow, background: th.rateBg }}>
                        <span style={{ ...s.rateName, color: th.text }}>
                          <MaterialIcon type={r.material_name} size={15} /> {r.material_name.charAt(0).toUpperCase() + r.material_name.slice(1)}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ ...s.rateValue, color: th.text }}>₹{r.current_rate}/g</span>
                          <span style={{ ...s.rateBadge, background: r.is_suppressed ? "rgba(251,146,60,0.15)" : "rgba(22,163,74,0.12)", color: r.is_suppressed ? "#fb923c" : "#16a34a" }}>
                            {r.is_suppressed ? t('user.liveRates.adjusted') : t('user.liveRates.normal')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Milestone */}
                <div style={{ ...s.card, background: th.card, borderColor: th.cardBorder }}>
                  <div style={s.cardHeader}>
                    <h3 style={{ ...s.cardTitle, color: th.text }}>{t('user.milestone.title')}</h3>
                    <span style={{ ...s.cardSubtle, color: th.textFaint }}>{lastMilestone?.icon} {lastMilestone?.label ?? t('user.milestone.justStarted')}</span>
                  </div>
                  {nextMilestone ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ ...s.limitLabel, color: th.text }}>{t('user.milestone.next')}: {nextMilestone.icon} {nextMilestone.label}</span>
                        <span style={{ ...s.limitValue, color: th.textMuted }}>{(totalWeight / 1000).toFixed(2)}kg / {nextMilestone.weight / 1000}kg</span>
                      </div>
                      <div style={{ ...s.progressBg, background: th.progressBg }}>
                        <div style={{ ...s.progressFill, width: `${milestoneProgress}%`, background: "linear-gradient(90deg, #16a34a, #22c55e)" }} />
                      </div>
                    </>
                  ) : (
                    <p style={{ color: "#16a34a", fontSize: 13, marginTop: 8 }}>{t('user.milestone.legend')}</p>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                    {MILESTONES.map((m) => (
                      <div key={m.label} style={{ ...s.badge, opacity: totalWeight >= m.weight ? 1 : 0.25 }} title={m.label}>
                        {m.icon}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{ ...s.card, background: th.card, borderColor: th.cardBorder }}>
              <div style={{ ...s.cardHeader, marginBottom: 14 }}>
                <h3 style={{ ...s.cardTitle, color: th.text }}>{t('user.recentActivity.title')}</h3>
                <button style={s.viewAllBtn} onClick={() => setActiveTab("transactions")}>
                  {t('user.recentActivity.viewAll')} <CaretRight size={14} weight="bold" />
                </button>
              </div>
              {transactions.length === 0 ? <EmptyState message={t('user.noDisposals')} th={th} /> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {transactions.slice(0, 5).map((t) => <TransactionRow key={t.id} transaction={t} th={th} />)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div style={s.tabContent}>
            <div style={s.pageHeader}>
              <div>
                <h1 style={{ ...s.pageTitle, color: th.text }}>{t('user.transactions.title')}</h1>
                <p style={{ ...s.pageSubtitle, color: th.textMuted }}>{t('user.transactions.subtitle')}</p>
              </div>
            </div>
            <div style={{ ...s.card, background: th.card, borderColor: th.cardBorder }}>
              {transactions.length === 0 ? <EmptyState message={t('user.transactions.none')} th={th} /> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {Object.entries(groupedTransactions).map(([date, txns]) => (
                    <div key={date}>
                      <p style={{ ...s.txDateLabel, color: th.textFaint }}>{date}</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {txns.map((t) => <TransactionRow key={t.id} transaction={t} detailed th={th} />)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === "leaderboard" && (
          <div style={s.tabContent}>
            <div style={s.pageHeader}>
              <div>
                <h1 style={{ ...s.pageTitle, color: th.text }}>{t('user.leaderboard.title')}</h1>
                <p style={{ ...s.pageSubtitle, color: th.textMuted }}>{t('user.leaderboard.subtitle')}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
              <ToggleGroup options={[{ value: "region", label: t('user.leaderboard.region') }, { value: "state", label: t('user.leaderboard.state') }, { value: "nation", label: t('user.leaderboard.nation') }]} value={leaderboardScope} onChange={(v) => setLeaderboardScope(v as typeof leaderboardScope)} th={th} />
              <ToggleGroup options={[{ value: "weight", label: t('user.leaderboard.weight') }, { value: "earnings", label: t('user.leaderboard.earnings') }, { value: "disposals", label: t('user.leaderboard.disposals') }, { value: "streak", label: t('user.leaderboard.streak') }]} value={leaderboardMetric} onChange={(v) => setLeaderboardMetric(v as typeof leaderboardMetric)} th={th} />
            </div>
            <div style={{ ...s.card, background: th.card, borderColor: th.cardBorder }}>
              <div style={s.podium}>
                {leaderboardEntries.slice(0, 3).map((entry, i) => (
                  <div key={entry.rank} style={{ ...s.podiumItem, order: i === 0 ? 1 : i === 1 ? 0 : 2, marginTop: i === 0 ? 0 : 20 }}>
                    <div style={s.podiumBadge}>{["🥇", "🥈", "🥉"][i]}</div>
                    <div style={{ ...s.podiumAvatar, background: dark ? "rgba(74,222,128,0.15)" : "rgba(22,163,74,0.1)", border: `2px solid ${dark ? "rgba(74,222,128,0.3)" : "rgba(22,163,74,0.3)"}` }}>
                      {entry.username[0].toUpperCase()}
                    </div>
                    <p style={{ ...s.podiumName, color: th.text }}>@{entry.username}</p>
                    <p style={{ ...s.podiumValue, color: th.textMuted }}>{entry.value}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 20 }}>
                {leaderboardEntries.slice(3).map((entry) => (
                  <div key={entry.rank} style={{ ...s.leaderRow, background: entry.isYou ? th.leaderYouBg : th.leaderBg, border: entry.isYou ? `1px solid ${th.leaderYouBorder}` : "1px solid transparent" }}>
                    <span style={{ ...s.leaderRank, color: th.textFaint }}>#{entry.rank}</span>
                    <div style={{ ...s.leaderAvatar, background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", color: th.text }}>
                      {entry.username[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ ...s.leaderName, color: th.text }}>@{entry.username} {entry.isYou && <span style={{ color: "#16a34a", fontSize: 11 }}>({t('user.leaderboard.you')})</span>}</p>
                      <p style={{ ...s.leaderCity, color: th.textMuted }}>{entry.city}</p>
                    </div>
                    <span style={{ ...s.leaderValue, color: "#16a34a" }}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile bottom nav */}
      {isMobileView && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: dark ? "#111827" : th.sidebar, borderTop: `1px solid ${th.sidebarBorder}`, padding: "10px 20px 20px", display: "flex", justifyContent: "space-around", zIndex: 50 }}>
          {[
            { id: "overview",     icon: <Leaf size={22} weight={activeTab === "overview" ? "fill" : "regular"} />,     label: t('user.tabs.overview') },
            { id: "scan",         icon: <PhCamera size={22} weight="fill" />,                                           label: t('user.scanBtn')       },
            { id: "transactions", icon: <PhTrending size={22} weight={activeTab === "transactions" ? "fill" : "regular"} />, label: t('user.tabs.transactions') },
            { id: "leaderboard",  icon: <PhTrophy size={22} weight={activeTab === "leaderboard" ? "fill" : "regular"} />,  label: t('user.tabs.leaderboard')  },
          ].map((tab) => (
            <button key={tab.id} onClick={() => tab.id === "scan" ? navigate("/scan") : setActiveTab(tab.id as typeof activeTab)} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: activeTab === tab.id ? "#16a34a" : th.navText, fontFamily: "inherit" }}>
              {tab.icon}
              <span style={{ fontSize: 10, fontWeight: activeTab === tab.id ? 700 : 500 }}>{tab.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, accent, th, action, sub }: {
  icon: React.ReactNode; label: string; value: string; accent: string;
  th: ReturnType<typeof getTheme>; action?: { label: string; onClick: () => void }; sub?: string;
}) {
  return (
    <div style={{ ...s.statCard, background: th.card, borderColor: th.cardBorder }}>
      <div style={{ ...s.statIcon, background: `${accent}18`, color: accent }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{ ...s.statLabel, color: th.textMuted }}>{label}</p>
        <p style={{ ...s.statValue, color: accent }}>{value}</p>
        {sub && <p style={{ ...s.statSub, color: th.textFaint }}>{sub}</p>}
      </div>
      {action && (
        <button style={{ ...s.statAction, borderColor: `${accent}40`, color: accent }} onClick={action.onClick}>
          {action.label} <PhArrow size={13} weight="bold" />
        </button>
      )}
    </div>
  );
}

function TransactionRow({ transaction: t, detailed, th }: { transaction: Transaction; detailed?: boolean; th: ReturnType<typeof getTheme> }) {
  const color = MATERIAL_COLORS[t.material_type] ?? "#16a34a";
  return (
    <div style={{ ...s.txRow, background: th.txBg }}>
      <div style={{ ...s.txDot, background: color }} />
      <div style={{ flex: 1 }}>
        <p style={{ ...s.txMaterial, color: th.text }}>
          <MaterialIcon type={t.material_type} size={14} /> {t.material_type.charAt(0).toUpperCase() + t.material_type.slice(1)}
        </p>
        {detailed && <p style={{ ...s.txDate, color: th.textMuted }}>{new Date(t.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>}
      </div>
      <div style={{ textAlign: "right" }}>
        <p style={s.txAmount}>+{formatAmount(t.reward_amount)}</p>
        <p style={{ ...s.txWeight, color: th.textMuted }}>{(t.weight_grams / 1000).toFixed(3)} kg</p>
      </div>
      <span style={{ ...s.txStatus, background: t.payment_status === "paid" ? "rgba(22,163,74,0.12)" : "rgba(251,191,36,0.12)", color: t.payment_status === "paid" ? "#16a34a" : "#fbbf24" }}>
        {t.payment_status}
      </span>
    </div>
  );
}

function ToggleGroup({ options, value, onChange, th }: {
  options: { value: string; label: string }[]; value: string;
  onChange: (v: string) => void; th: ReturnType<typeof getTheme>;
}) {
  return (
    <div style={{ ...s.toggleGroup, background: th.toggleBg }}>
      {options.map((o) => (
        <button key={o.value}
          style={{ ...s.toggleOpt, color: value === o.value ? "#fff" : th.navText, ...(value === o.value ? s.toggleOptActive : {}) }}
          onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function EmptyState({ message, th }: { message: string; th: ReturnType<typeof getTheme> }) {
  return (
    <div style={{ textAlign: "center", padding: "32px 0", color: th.textMuted }}>
      <p style={{ fontSize: 14 }}>{message}</p>
    </div>
  );
}

function LoadingScreen({ dark, message }: { dark: boolean; message?: string }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: dark ? "#080f0a" : "#f0fdf4" }}>
      <p style={{ color: "#16a34a", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>{message ?? "Loading..."}</p>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: { minHeight: "100vh", display: "flex", fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden", transition: "background 0.3s" },
  blob1: { position: "fixed", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)", top: -200, left: -200, pointerEvents: "none", zIndex: 0 },
  blob2: { position: "fixed", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)", bottom: -100, right: 200, pointerEvents: "none", zIndex: 0 },
  blob3: { position: "fixed", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(74,222,128,0.04) 0%, transparent 70%)", top: "40%", right: -100, pointerEvents: "none", zIndex: 0 },
  themeBtn: { position: "fixed", top: 20, right: 20, zIndex: 100, borderRadius: 10, padding: "8px 10px", cursor: "pointer", display: "flex", alignItems: "center" },
  sidebar: { width: 220, minHeight: "100vh", display: "flex", flexDirection: "column", padding: "24px 16px", position: "sticky", top: 0, zIndex: 10, flexShrink: 0, borderRight: "1px solid", transition: "background 0.3s", ["@media (max-width: 768px)" as any]: { display: "none" } },
  sidebarBrand: { display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 36 },
  brandText: { fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px" },
  nav: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  navItem: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", textAlign: "left" },
  sidebarBottom: { display: "flex", alignItems: "center", gap: 10, paddingTop: 16, borderTop: "1px solid" },
  userMeta: { display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 },
  avatarCircle: { width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0, color: "#fff" },
  sidebarUsername: { fontSize: 13, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  sidebarCity: { fontSize: 11, margin: 0 },
  logoutBtn: { borderRadius: 8, padding: "6px 8px", cursor: "pointer", flexShrink: 0 },
  main: { flex: 1, overflowY: "auto", position: "relative", zIndex: 1 },
  tabContent: { padding: "20px 16px 100px", maxWidth: 1100, margin: "0 auto" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  pageTitle: { fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" },
  pageSubtitle: { fontSize: 13, marginTop: 4, marginBottom: 0 },
  scanBtn: { display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none", color: "#fff", padding: "10px 18px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(22,163,74,0.3)" },
  desktopScanNote: { display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 12, fontSize: 12, fontWeight: 500 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 20 },
  statCard: { border: "1px solid", borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, transition: "background 0.3s" },
  statIcon: { width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  statLabel: { fontSize: 11, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" },
  statValue: { fontSize: 20, fontWeight: 700, margin: "2px 0 0", letterSpacing: "-0.5px" },
  statSub: { fontSize: 11, margin: "2px 0 0" },
  statAction: { display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "1px solid", borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" },
  midGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 20 },
  card: { border: "1px solid", borderRadius: 18, padding: "22px 24px", transition: "background 0.3s" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  cardTitle: { fontSize: 15, fontWeight: 700, margin: 0 },
  cardSubtle: { fontSize: 12 },
  limitLabel: { fontSize: 13, display: "flex", alignItems: "center", gap: 6 },
  limitValue: { fontSize: 12, fontWeight: 600 },
  progressBg: { height: 6, borderRadius: 99, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 99, transition: "width 0.5s ease" },
  rateRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 10 },
  rateName: { fontSize: 13, display: "flex", alignItems: "center", gap: 6 },
  rateValue: { fontSize: 13, fontWeight: 700 },
  rateBadge: { fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99 },
  badge: { fontSize: 22, transition: "all 0.2s", cursor: "default" },
  viewAllBtn: { display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "#16a34a", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  txDateLabel: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8, marginTop: 0 },
  txRow: { display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10 },
  txDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  txMaterial: { fontSize: 14, fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: 6 },
  txDate: { fontSize: 11, margin: "2px 0 0" },
  txAmount: { fontSize: 14, fontWeight: 700, color: "#16a34a", margin: 0 },
  txWeight: { fontSize: 11, margin: "2px 0 0" },
  txStatus: { fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 99, textTransform: "capitalize" },
  toggleGroup: { display: "flex", borderRadius: 10, padding: 3, gap: 2 },
  toggleOpt: { padding: "7px 14px", borderRadius: 8, border: "none", background: "transparent", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  toggleOptActive: { background: "#16a34a", color: "#fff" },
  podium: { display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 20, padding: "20px 0 10px" },
  podiumItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
  podiumBadge: { fontSize: 24 },
  podiumAvatar: { width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#16a34a" },
  podiumName: { fontSize: 13, fontWeight: 600, margin: 0 },
  podiumValue: { fontSize: 12, margin: 0 },
  leaderRow: { display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12 },
  leaderRank: { fontSize: 13, fontWeight: 700, width: 28 },
  leaderAvatar: { width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 },
  leaderName: { fontSize: 13, fontWeight: 600, margin: 0 },
  leaderCity: { fontSize: 11, margin: "2px 0 0" },
  leaderValue: { fontSize: 13, fontWeight: 700, marginLeft: "auto" },
};