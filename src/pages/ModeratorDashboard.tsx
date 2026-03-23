import { useState, useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Legend,
} from "recharts";
import {
  ChartPie, ChartLine, ChartBar, Trash,
  Users, ArrowLeft, ArrowRight, Sun, Moon, Bell,
  TrendUp, Recycle, Database,
} from "@phosphor-icons/react";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Plastic:  "#3b82f6",
  Paper:    "#8b5cf6",
  Glass:    "#06b6d4",
  Metal:    "#ef4444",
  "E-Waste":"#f59e0b",
  Organic:  "#16a34a",
  Misc:     "#6b7280",
};

const CATEGORIES = Object.keys(CATEGORY_COLORS);

const BINS = [
  { id: "BIN-112", location: "Gangapur Road, Near Hotel Panchavati", zone: "Zone A" },
  { id: "BIN-117", location: "CBS Corner, Sharanpur Road",           zone: "Zone A" },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── Mock Data ────────────────────────────────────────────────────────────────

function seed(binIdx: number, monthIdx: number, catIdx: number) {
  return Math.abs(Math.sin(binIdx * 31 + monthIdx * 17 + catIdx * 7) * 1000) % 100;
}

function generateMonthlyData(binIdx: number, months: number) {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const mIdx = (now.getMonth() - months + 1 + i + 12) % 12;
    const row: Record<string, number | string> = { month: MONTHS[mIdx] };
    CATEGORIES.forEach((cat, ci) => { row[cat] = Math.round(20 + seed(binIdx, i, ci) * 4.8); });
    return row;
  });
}

function generateFillLevels(binIdx: number) {
  return CATEGORIES.map((cat, ci) => ({
    category: cat, fill: Math.round(10 + seed(binIdx, 99, ci) * 0.9), color: CATEGORY_COLORS[cat],
  }));
}

function generateUserActivity(months: number) {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const mIdx = (now.getMonth() - months + 1 + i + 12) % 12;
    return {
      month: MONTHS[mIdx],
      activeUsers: Math.round(80 + Math.abs(Math.sin(i * 1.3)) * 120),
      deposits:    Math.round(200 + Math.abs(Math.sin(i * 0.9 + 1)) * 300),
      newUsers:    Math.round(10 + Math.abs(Math.sin(i * 2.1)) * 40),
    };
  });
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, color, dark, card, border }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string;
  dark: boolean; card: string; border: string;
}) {
  const text = dark ? "#f9fafb" : "#111827";
  const subC = dark ? "#9ca3af" : "#6b7280";
  return (
    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "14px", padding: "16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
      <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ color: text, fontWeight: 700, fontSize: "22px", lineHeight: 1.1 }}>{value}</div>
        <div style={{ color: subC, fontSize: "11px", marginTop: "2px" }}>{label}</div>
        {sub && <div style={{ color: color, fontSize: "11px", fontWeight: 600, marginTop: "2px" }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── BinSlideshow ─────────────────────────────────────────────────────────────

type GraphType = "pie" | "line" | "bar";

function BinSlideshow({ months, dark, card, border }: {
  months: number; dark: boolean; card: string; border: string;
}) {
  const [binIdx, setBinIdx] = useState(0);
  const [graphType, setGraphType] = useState<GraphType>("bar");
  const [selectedCats, setSelectedCats] = useState<string[]>(CATEGORIES);

  const toggleCat = (cat: string) => {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const text    = dark ? "#f9fafb" : "#111827";
  const sub     = dark ? "#9ca3af" : "#6b7280";
  const grid    = dark ? "#1f2937" : "#e5e7eb";
  const surface = dark ? "#1f2937" : "#f3f4f6";

  const bin  = BINS[binIdx];
  const data = useMemo(() => generateMonthlyData(binIdx, months), [binIdx, months]);

  const pieData = useMemo(() =>
    CATEGORIES
      .filter((cat) => selectedCats.includes(cat))
      .map((cat) => ({
        name: cat,
        value: data.reduce((s, row) => s + (row[cat] as number), 0),
        color: CATEGORY_COLORS[cat],
      })),
    [data, selectedCats]
  );

  const tooltipStyle = {
    backgroundColor: dark ? "#1f2937" : "#ffffff",
    border: `1px solid ${border}`,
    borderRadius: "8px",
    fontFamily: "DM Sans, sans-serif",
    fontSize: "12px",
    color: text,
  };

  const GRAPH_TYPES: { id: GraphType; icon: React.ReactNode; label: string }[] = [
    { id: "bar",  icon: <ChartBar  size={14} />, label: "Bar"  },
    { id: "line", icon: <ChartLine size={14} />, label: "Line" },
    { id: "pie",  icon: <ChartPie  size={14} />, label: "Pie"  },
  ];

  return (
    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "16px", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={{ color: text, fontWeight: 700, fontSize: "15px" }}>Bin Analysis</div>
          <div style={{ color: "#16a34a", fontSize: "11px", fontWeight: 600, marginTop: "2px" }}>{bin.id} · {bin.location}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Graph type toggle */}
          <div style={{ display: "flex", background: surface, borderRadius: "8px", padding: "3px", gap: "2px" }}>
            {GRAPH_TYPES.map((g) => (
              <button key={g.id} onClick={() => setGraphType(g.id)} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "6px", border: "none", background: graphType === g.id ? card : "transparent", color: graphType === g.id ? "#16a34a" : sub, fontFamily: "DM Sans, sans-serif", fontWeight: graphType === g.id ? 700 : 500, fontSize: "12px", cursor: "pointer", boxShadow: graphType === g.id ? "0 1px 3px rgba(0,0,0,0.15)" : "none" }}>
                {g.icon}{g.label}
              </button>
            ))}
          </div>
          {/* Bin nav */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button onClick={() => setBinIdx((prev) => (prev - 1 + BINS.length) % BINS.length)} style={{ width: "30px", height: "30px", borderRadius: "8px", border: `1px solid ${border}`, background: surface, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: sub }}>
              <ArrowLeft size={14} weight="bold" />
            </button>
            <span style={{ color: text, fontWeight: 700, fontSize: "12px", minWidth: "40px", textAlign: "center" }}>{binIdx + 1} / {BINS.length}</span>
            <button onClick={() => setBinIdx((prev) => (prev + 1) % BINS.length)} style={{ width: "30px", height: "30px", borderRadius: "8px", border: `1px solid ${border}`, background: surface, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: sub }}>
              <ArrowRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* Chart area */}
      <div style={{ padding: "20px" }}>
        {/* Category filter pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px", alignItems: "center" }}>
          {CATEGORIES.map((cat) => {
            const active = selectedCats.includes(cat);
            return (
              <button key={cat} onClick={() => toggleCat(cat)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "99px", border: `1.5px solid ${active ? CATEGORY_COLORS[cat] : border}`, background: active ? `${CATEGORY_COLORS[cat]}18` : "transparent", cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: active ? 700 : 500, color: active ? CATEGORY_COLORS[cat] : sub, transition: "all 0.15s ease" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: active ? CATEGORY_COLORS[cat] : sub }} />
                {cat}
              </button>
            );
          })}
          <span style={{ marginLeft: "auto", fontSize: "10px", color: sub, fontWeight: 500, whiteSpace: "nowrap" }}>select wastes to compare</span>
        </div>

        {/* Bar chart */}
        {graphType === "bar" && (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis dataKey="month" tick={{ fill: sub, fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: sub, fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontFamily: "DM Sans", fontSize: "11px", paddingTop: "8px" }} />
              {CATEGORIES.filter((cat) => selectedCats.includes(cat)).map((cat) => (
                <Bar key={cat} dataKey={cat} fill={CATEGORY_COLORS[cat]} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Line chart */}
        {graphType === "line" && (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis dataKey="month" tick={{ fill: sub, fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: sub, fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontFamily: "DM Sans", fontSize: "11px", paddingTop: "8px" }} />
              {CATEGORIES.filter((cat) => selectedCats.includes(cat)).map((cat) => (
                <Line key={cat} type="monotone" dataKey={cat} stroke={CATEGORY_COLORS[cat]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* Pie chart */}
        {graphType === "pie" && (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(val: unknown) => [`${Number(val)} kg`, ""]} />
              <Legend formatter={(value) => <span style={{ fontFamily: "DM Sans", fontSize: "11px", color: text }}>{value}</span>} wrapperStyle={{ paddingTop: "8px" }} />
            </PieChart>
          </ResponsiveContainer>
        )}

        {/* Dot indicators */}
        <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "8px" }}>
          {BINS.map((_, i) => (
            <button key={i} onClick={() => setBinIdx(i)} style={{ width: i === binIdx ? "20px" : "8px", height: "8px", borderRadius: "99px", border: "none", background: i === binIdx ? "#16a34a" : grid, cursor: "pointer", transition: "all 0.2s ease", padding: 0 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FillLevelPanel ───────────────────────────────────────────────────────────

function FillLevelPanel({ dark, card, border }: { dark: boolean; card: string; border: string }) {
  const text = dark ? "#f9fafb" : "#111827";
  const sub  = dark ? "#9ca3af" : "#6b7280";

  return (
    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "16px", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}` }}>
        <div style={{ color: text, fontWeight: 700, fontSize: "15px" }}>Real-Time Bin Fill Levels</div>
        <div style={{ color: sub, fontSize: "11px", marginTop: "2px" }}>Live compartment status across all monitored bins</div>
      </div>
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {BINS.map((bin, binIdx) => {
          const levels = generateFillLevels(binIdx);
          const avg = Math.round(levels.reduce((s, l) => s + l.fill, 0) / levels.length);
          return (
            <div key={bin.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div>
                  <span style={{ color: text, fontWeight: 700, fontSize: "13px" }}>{bin.id}</span>
                  <span style={{ color: sub, fontSize: "11px", marginLeft: "8px" }}>{bin.location}</span>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: avg >= 75 ? "#ef4444" : avg >= 60 ? "#f59e0b" : "#16a34a", background: avg >= 75 ? "#ef444418" : avg >= 60 ? "#f59e0b18" : "#16a34a18", padding: "2px 8px", borderRadius: "99px" }}>{avg}% avg</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {levels.map((l) => (
                  <div key={l.category} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: l.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "11px", color: l.color, fontWeight: 700, width: "56px", flexShrink: 0 }}>{l.category}</span>
                    <div style={{ flex: 1, height: "6px", borderRadius: "99px", background: dark ? "#1f2937" : "#e5e7eb", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${l.fill}%`, background: l.color, borderRadius: "99px", transition: "width 0.6s ease" }} />
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: l.fill >= 80 ? "#ef4444" : l.fill >= 60 ? "#f59e0b" : "#16a34a", width: "28px", textAlign: "right", flexShrink: 0 }}>{l.fill}%</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── UserActivityPanel ────────────────────────────────────────────────────────

function UserActivityPanel({ months, dark, card, border }: { months: number; dark: boolean; card: string; border: string }) {
  const text = dark ? "#f9fafb" : "#111827";
  const sub  = dark ? "#9ca3af" : "#6b7280";
  const grid = dark ? "#1f2937" : "#e5e7eb";
  const data = useMemo(() => generateUserActivity(months), [months]);

  const tooltipStyle = { backgroundColor: dark ? "#1f2937" : "#ffffff", border: `1px solid ${border}`, borderRadius: "8px", fontFamily: "DM Sans, sans-serif", fontSize: "12px", color: text };

  return (
    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "16px", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}` }}>
        <div style={{ color: text, fontWeight: 700, fontSize: "15px" }}>User Activity Trends</div>
        <div style={{ color: sub, fontSize: "11px", marginTop: "2px" }}>Active users, deposits & new signups over time</div>
      </div>
      <div style={{ padding: "20px" }}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} />
            <XAxis dataKey="month" tick={{ fill: sub, fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: sub, fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontFamily: "DM Sans", fontSize: "11px", paddingTop: "8px" }} />
            <Line type="monotone" dataKey="activeUsers" stroke="#16a34a" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Active Users" />
            <Line type="monotone" dataKey="deposits"    stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Deposits" />
            <Line type="monotone" dataKey="newUsers"    stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="New Users" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── CategoryBreakdown ────────────────────────────────────────────────────────

function CategoryBreakdown({ months, dark, card, border }: { months: number; dark: boolean; card: string; border: string }) {
  const text = dark ? "#f9fafb" : "#111827";
  const sub  = dark ? "#9ca3af" : "#6b7280";

  const data = useMemo(() => {
    const combined: Record<string, number> = {};
    CATEGORIES.forEach((cat) => { combined[cat] = 0; });
    BINS.forEach((_, binIdx) => {
      generateMonthlyData(binIdx, months).forEach((row) => {
        CATEGORIES.forEach((cat) => { combined[cat] += row[cat] as number; });
      });
    });
    return CATEGORIES.map((cat) => ({ name: cat, value: Math.round(combined[cat]), color: CATEGORY_COLORS[cat] }));
  }, [months]);

  const total = data.reduce((s, d) => s + d.value, 0);
  const tooltipStyle = { backgroundColor: dark ? "#1f2937" : "#ffffff", border: `1px solid ${border}`, borderRadius: "8px", fontFamily: "DM Sans, sans-serif", fontSize: "12px", color: text };

  return (
    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "16px", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}` }}>
        <div style={{ color: text, fontWeight: 700, fontSize: "15px" }}>Disposal Category Breakdown</div>
        <div style={{ color: sub, fontSize: "11px", marginTop: "2px" }}>All bins combined · last {months} month{months > 1 ? "s" : ""}</div>
      </div>
      <div style={{ padding: "20px", display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: "1 1 180px" }}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value">
                {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(val: unknown) => [`${Number(val)} kg`, ""]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: "1 1 140px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {data.map((d) => (
            <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: d.color, flexShrink: 0 }} />
              <span style={{ fontSize: "11px", color: text, fontWeight: 600, flex: 1 }}>{d.name}</span>
              <span style={{ fontSize: "11px", color: sub }}>{d.value} kg</span>
              <span style={{ fontSize: "10px", color: d.color, fontWeight: 700, width: "32px", textAlign: "right" }}>{Math.round(d.value / total * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ModeratorDashboard() {
  const [dark, setDark]     = useState(true);
  const [months, setMonths] = useState(6);

  const bg         = dark ? "#030712" : "#f3f4f6";
  const card       = dark ? "#111827" : "#ffffff";
  const cardBorder = dark ? "#1f2937" : "#e5e7eb";
  const surface    = dark ? "#1f2937" : "#f9fafb";
  const text       = dark ? "#f9fafb" : "#111827";
  const sub        = dark ? "#9ca3af" : "#6b7280";

  const totalCollections = useMemo(() => {
    let t = 0;
    BINS.forEach((_, bi) => { generateMonthlyData(bi, months).forEach((row) => { CATEGORIES.forEach((cat) => { t += row[cat] as number; }); }); });
    return Math.round(t);
  }, [months]);

  const activity      = useMemo(() => generateUserActivity(months), [months]);
  const totalUsers    = activity[activity.length - 1]?.activeUsers ?? 0;
  const totalDeposits = activity.reduce((s, r) => s + r.deposits, 0);

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "DM Sans, sans-serif", transition: "background 0.3s ease" }}>

      {/* Header */}
      <div style={{ background: card, borderBottom: `1px solid ${cardBorder}`, padding: "16px 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Recycle size={22} color="#fff" weight="bold" />
            </div>
            <div>
              <div style={{ color: text, fontWeight: 700, fontSize: "16px", lineHeight: 1.2 }}>EcoMint Developer</div>
              <div style={{ color: "#16a34a", fontSize: "11px", fontWeight: 600 }}>Read-only · Aggregated Stats</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: surface, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "6px 12px" }}>
              <span style={{ color: sub, fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap" }}>Last</span>
              <input type="range" min={1} max={12} value={months} onChange={(e) => setMonths(Number(e.target.value))} style={{ width: "80px", accentColor: "#16a34a", cursor: "pointer" }} />
              <span style={{ color: "#16a34a", fontWeight: 700, fontSize: "13px", minWidth: "60px" }}>{months} month{months > 1 ? "s" : ""}</span>
            </div>
            <button onClick={() => setDark(!dark)} style={{ background: surface, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "8px", cursor: "pointer", display: "flex", color: sub }}>
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button style={{ background: surface, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "8px", cursor: "pointer", display: "flex", color: sub }}>
              <Bell size={16} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 20px 60px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "24px" }}>
          <StatCard label="Total Waste Collected" value={`${totalCollections} kg`} sub={`Last ${months} months`} icon={<Trash size={20} color="#16a34a" weight="fill" />} color="#16a34a" dark={dark} card={card} border={cardBorder} />
          <StatCard label="Active Bins" value={BINS.length} sub="Monitored regions" icon={<Database size={20} color="#3b82f6" weight="fill" />} color="#3b82f6" dark={dark} card={card} border={cardBorder} />
          <StatCard label="Active Users" value={totalUsers} sub="This month" icon={<Users size={20} color="#8b5cf6" weight="fill" />} color="#8b5cf6" dark={dark} card={card} border={cardBorder} />
          <StatCard label="Total Deposits" value={totalDeposits} sub={`Last ${months} months`} icon={<TrendUp size={20} color="#f59e0b" weight="fill" />} color="#f59e0b" dark={dark} card={card} border={cardBorder} />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <BinSlideshow months={months} dark={dark} card={card} border={cardBorder} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "20px" }}>
          <CategoryBreakdown months={months} dark={dark} card={card} border={cardBorder} />
          <UserActivityPanel months={months} dark={dark} card={card} border={cardBorder} />
        </div>

        <FillLevelPanel dark={dark} card={card} border={cardBorder} />
      </div>
    </div>
  );
}