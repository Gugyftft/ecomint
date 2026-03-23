import { useState, useMemo } from "react";
import {
  CurrencyInr, Users, Warning, ChartBar,
  CheckCircle, XCircle, Clock, Eye,
  ArrowUp, ArrowDown, MagnifyingGlass,
  ShieldWarning, Trash, Sun, Moon, Bell,
  Recycle, UserCircle, ArrowsClockwise,
  SealWarning, Lock, LockOpen,
} from "@phosphor-icons/react";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = "user" | "worker" | "moderator";
type UserStatus = "active" | "suspended";
type TxStatus = "confirmed" | "pending" | "flagged" | "rejected";
type FlagType = "ai_mismatch" | "fraud" | "weight_anomaly" | "duplicate";

interface AppUser {
  id: string; name: string; email: string; role: UserRole;
  status: UserStatus; joined: string; deposits: number; earnings: string;
}

interface Transaction {
  id: string; user: string; category: string; weight: string;
  amount: string; bin: string; time: string; status: TxStatus;
}

interface Flag {
  id: string; type: FlagType; user: string; bin: string;
  detail: string; time: string; resolved: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_USERS: AppUser[] = [
  { id: "u1", name: "Priya Sharma",   email: "priya@test.com",   role: "user",      status: "active",    joined: "Jan 2025", deposits: 142, earnings: "₹1,840" },
  { id: "u2", name: "Rahul Mehta",    email: "rahul@test.com",   role: "user",      status: "active",    joined: "Feb 2025", deposits: 89,  earnings: "₹1,120" },
  { id: "u3", name: "Raju Patil",     email: "raju@test.com",    role: "worker",    status: "active",    joined: "Dec 2024", deposits: 0,   earnings: "₹8,400" },
  { id: "u4", name: "Sneha Kulkarni", email: "sneha@test.com",   role: "user",      status: "suspended", joined: "Mar 2025", deposits: 12,  earnings: "₹140"   },
  { id: "u5", name: "Dev Joshi",      email: "dev@test.com",     role: "moderator", status: "active",    joined: "Nov 2024", deposits: 0,   earnings: "—"      },
  { id: "u6", name: "Anita Desai",    email: "anita@test.com",   role: "user",      status: "active",    joined: "Mar 2025", deposits: 55,  earnings: "₹620"   },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "tx001", user: "Priya Sharma",   category: "Plastic",  weight: "1.2 kg", amount: "₹96",  bin: "BIN-112", time: "10:24 AM", status: "confirmed" },
  { id: "tx002", user: "Rahul Mehta",    category: "Organic",  weight: "0.8 kg", amount: "₹24",  bin: "BIN-117", time: "10:18 AM", status: "confirmed" },
  { id: "tx003", user: "Anita Desai",    category: "E-Waste",  weight: "0.5 kg", amount: "₹100", bin: "BIN-112", time: "09:55 AM", status: "flagged"   },
  { id: "tx004", user: "Sneha Kulkarni", category: "Glass",    weight: "2.1 kg", amount: "₹126", bin: "BIN-117", time: "09:40 AM", status: "rejected"  },
  { id: "tx005", user: "Priya Sharma",   category: "Paper",    weight: "1.5 kg", amount: "₹75",  bin: "BIN-112", time: "09:22 AM", status: "confirmed" },
  { id: "tx006", user: "Rahul Mehta",    category: "Metal",    weight: "0.3 kg", amount: "₹36",  bin: "BIN-117", time: "09:10 AM", status: "pending"   },
  { id: "tx007", user: "Anita Desai",    category: "Plastic",  weight: "0.9 kg", amount: "₹72",  bin: "BIN-112", time: "08:58 AM", status: "confirmed" },
  { id: "tx008", user: "Priya Sharma",   category: "Organic",  weight: "1.1 kg", amount: "₹33",  bin: "BIN-117", time: "08:45 AM", status: "confirmed" },
];

const MOCK_FLAGS: Flag[] = [
  { id: "f1", type: "ai_mismatch",    user: "Anita Desai",    bin: "BIN-112", detail: "Deposited item classified as Plastic, AI detected Glass (94% confidence)", time: "09:55 AM", resolved: false },
  { id: "f2", type: "weight_anomaly", user: "Sneha Kulkarni", bin: "BIN-117", detail: "Weight reading 2.1kg inconsistent with Glass slot capacity limit (1.5kg)", time: "09:40 AM", resolved: false },
  { id: "f3", type: "fraud",          user: "Sneha Kulkarni", bin: "BIN-117", detail: "3 deposits within 4 minutes from same user — possible rate abuse", time: "09:38 AM", resolved: true  },
  { id: "f4", type: "duplicate",      user: "Rahul Mehta",    bin: "BIN-112", detail: "QR token reused — session already marked complete", time: "08:20 AM", resolved: true  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Plastic: "#3b82f6", Paper: "#8b5cf6", Glass: "#06b6d4",
  Metal: "#ef4444", "E-Waste": "#f59e0b", Organic: "#16a34a", Misc: "#6b7280",
};

const FLAG_COLORS: Record<FlagType, string> = {
  ai_mismatch: "#f59e0b", fraud: "#ef4444",
  weight_anomaly: "#3b82f6", duplicate: "#8b5cf6",
};

const FLAG_LABELS: Record<FlagType, string> = {
  ai_mismatch: "AI Mismatch", fraud: "Fraud Alert",
  weight_anomaly: "Weight Anomaly", duplicate: "Duplicate QR",
};

const ROLE_COLORS: Record<UserRole, string> = {
  user: "#16a34a", worker: "#3b82f6", moderator: "#8b5cf6",
};

const TX_COLORS: Record<TxStatus, string> = {
  confirmed: "#16a34a", pending: "#f59e0b", flagged: "#ef4444", rejected: "#6b7280",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [dark, setDark] = useState(true);
  const [activeTab, setActiveTab] = useState<"transactions" | "users" | "flags" | "stats">("transactions");
  const [search, setSearch] = useState("");
  const [txFilter, setTxFilter] = useState<TxStatus | "all">("all");
  const [users, setUsers] = useState<AppUser[]>(MOCK_USERS);
  const [flags, setFlags] = useState<Flag[]>(MOCK_FLAGS);

  const bg         = dark ? "#030712" : "#f3f4f6";
  const card       = dark ? "#111827" : "#ffffff";
  const cardBorder = dark ? "#1f2937" : "#e5e7eb";
  const surface    = dark ? "#1f2937" : "#f9fafb";
  const text       = dark ? "#f9fafb" : "#111827";
  const sub        = dark ? "#9ca3af" : "#6b7280";
  const divider    = dark ? "#1f2937" : "#e5e7eb";

  // Stats
  const totalRevenue   = "₹12,840";
  const todayDeposits  = MOCK_TRANSACTIONS.filter((t) => t.status === "confirmed").length;
  const pendingFlags   = flags.filter((f) => !f.resolved).length;
  const activeUsers    = users.filter((u) => u.status === "active").length;

  // Filtered transactions
  const filteredTx = useMemo(() => {
    return MOCK_TRANSACTIONS.filter((tx) => {
      const matchSearch = tx.user.toLowerCase().includes(search.toLowerCase()) || tx.bin.toLowerCase().includes(search.toLowerCase());
      const matchFilter = txFilter === "all" || tx.status === txFilter;
      return matchSearch && matchFilter;
    });
  }, [search, txFilter]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  }, [search, users]);

  const toggleSuspend = (id: string) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u));
  };

  const resolveFlag = (id: string) => {
    setFlags((prev) => prev.map((f) => f.id === id ? { ...f, resolved: true } : f));
  };

  const tabs = [
    { id: "transactions", label: "Transactions", icon: CurrencyInr },
    { id: "users",        label: "Users",        icon: Users        },
    { id: "flags",        label: `Flags${pendingFlags > 0 ? ` (${pendingFlags})` : ""}`, icon: Warning },
    { id: "stats",        label: "Stats",        icon: ChartBar     },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "DM Sans, sans-serif" }}>

      {/* Header */}
      <div style={{ background: card, borderBottom: `1px solid ${cardBorder}`, padding: "16px 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Recycle size={22} color="#fff" weight="bold" />
            </div>
            <div>
              <div style={{ color: text, fontWeight: 700, fontSize: "16px", lineHeight: 1.2 }}>EcoMint Admin</div>
              <div style={{ color: "#16a34a", fontSize: "11px", fontWeight: 600 }}>Full access · admin@ecomint.com</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={() => setDark(!dark)} style={{ background: surface, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "8px", cursor: "pointer", display: "flex", color: sub }}>
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button style={{ background: surface, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "8px", cursor: "pointer", display: "flex", color: sub, position: "relative" }}>
              <Bell size={16} />
              {pendingFlags > 0 && <div style={{ position: "absolute", top: "5px", right: "5px", width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444" }} />}
            </button>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#16a34a22", border: "1.5px solid #16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserCircle size={18} color="#16a34a" />
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px 20px 80px" }}>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
          {[
            { label: "Total Payouts",    value: totalRevenue,          color: "#16a34a", icon: <CurrencyInr size={18} color="#16a34a" weight="bold" /> },
            { label: "Today's Deposits", value: `${todayDeposits}`,    color: "#3b82f6", icon: <ArrowsClockwise size={18} color="#3b82f6" weight="fill" /> },
            { label: "Active Users",     value: `${activeUsers}`,      color: "#8b5cf6", icon: <Users size={18} color="#8b5cf6" weight="fill" /> },
            { label: "Pending Flags",    value: `${pendingFlags}`,     color: pendingFlags > 0 ? "#ef4444" : "#16a34a", icon: <ShieldWarning size={18} color={pendingFlags > 0 ? "#ef4444" : "#16a34a"} weight="fill" /> },
          ].map((s, i) => (
            <div key={i} style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "14px 16px", display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ color: text, fontWeight: 700, fontSize: "20px", lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ color: sub, fontSize: "11px" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", background: surface, borderRadius: "12px", padding: "4px", marginBottom: "16px" }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            const isFlagTab = tab.id === "flags" && pendingFlags > 0;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: "9px 8px", borderRadius: "9px", border: "none", background: active ? card : "transparent", color: active ? (isFlagTab ? "#ef4444" : "#16a34a") : isFlagTab ? "#ef4444" : sub, fontFamily: "DM Sans, sans-serif", fontWeight: active ? 700 : 500, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", boxShadow: active ? `0 1px 3px rgba(0,0,0,${dark ? "0.4" : "0.1"})` : "none", transition: "all 0.15s ease" }}>
                <Icon size={14} weight={active ? "fill" : "regular"} />{tab.label}
              </button>
            );
          })}
        </div>

        {/* Search bar — shown on tx and users tabs */}
        {(activeTab === "transactions" || activeTab === "users") && (
          <div style={{ position: "relative", marginBottom: "12px" }}>
            <MagnifyingGlass size={15} color={sub} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === "transactions" ? "Search by user or bin…" : "Search by name or email…"}
              style={{ width: "100%", padding: "10px 12px 10px 34px", borderRadius: "10px", border: `1px solid ${cardBorder}`, background: card, color: text, fontFamily: "DM Sans, sans-serif", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        )}

        {/* ── Transactions ── */}
        {activeTab === "transactions" && (
          <div>
            {/* Filter pills */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
              {(["all", "confirmed", "pending", "flagged", "rejected"] as const).map((f) => (
                <button key={f} onClick={() => setTxFilter(f)} style={{ padding: "4px 12px", borderRadius: "99px", border: `1.5px solid ${txFilter === f ? (f === "all" ? "#16a34a" : TX_COLORS[f as TxStatus]) : cardBorder}`, background: txFilter === f ? `${f === "all" ? "#16a34a" : TX_COLORS[f as TxStatus]}18` : "transparent", color: txFilter === f ? (f === "all" ? "#16a34a" : TX_COLORS[f as TxStatus]) : sub, fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: txFilter === f ? 700 : 500, cursor: "pointer" }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "12px", overflow: "hidden" }}>
              {/* Table header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 70px 80px 80px 90px", gap: "8px", padding: "10px 16px", background: surface, borderBottom: `1px solid ${divider}` }}>
                {["User", "Category", "Weight", "Amount", "Bin", "Time", "Status"].map((h) => (
                  <span key={h} style={{ color: sub, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
                ))}
              </div>
              {filteredTx.map((tx, i) => (
                <div key={tx.id}>
                  {i > 0 && <div style={{ height: "1px", background: divider, margin: "0 16px" }} />}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 70px 80px 80px 90px", gap: "8px", padding: "12px 16px", alignItems: "center" }}>
                    <span style={{ color: text, fontWeight: 600, fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.user}</span>
                    <span style={{ fontSize: "11px", color: CATEGORY_COLORS[tx.category] ?? sub, fontWeight: 700 }}>{tx.category}</span>
                    <span style={{ color: sub, fontSize: "12px" }}>{tx.weight}</span>
                    <span style={{ color: text, fontWeight: 700, fontSize: "13px" }}>{tx.amount}</span>
                    <span style={{ color: sub, fontSize: "11px" }}>{tx.bin}</span>
                    <span style={{ color: sub, fontSize: "11px" }}>{tx.time}</span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: TX_COLORS[tx.status], background: `${TX_COLORS[tx.status]}18`, padding: "2px 8px", borderRadius: "99px", display: "inline-block", textAlign: "center" }}>
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
              {filteredTx.length === 0 && (
                <div style={{ padding: "32px", textAlign: "center", color: sub, fontSize: "13px" }}>No transactions found</div>
              )}
            </div>
          </div>
        )}

        {/* ── Users ── */}
        {activeTab === "users" && (
          <div style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 80px 70px 80px 100px", gap: "8px", padding: "10px 16px", background: surface, borderBottom: `1px solid ${divider}` }}>
              {["User", "Role", "Status", "Deposits", "Earnings", "Action"].map((h) => (
                <span key={h} style={{ color: sub, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
              ))}
            </div>
            {filteredUsers.map((u, i) => (
              <div key={u.id}>
                {i > 0 && <div style={{ height: "1px", background: divider, margin: "0 16px" }} />}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 80px 70px 80px 100px", gap: "8px", padding: "12px 16px", alignItems: "center" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: text, fontWeight: 600, fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                    <div style={{ color: sub, fontSize: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: ROLE_COLORS[u.role], background: `${ROLE_COLORS[u.role]}18`, padding: "2px 8px", borderRadius: "99px", display: "inline-block" }}>
                    {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: u.status === "active" ? "#16a34a" : "#ef4444" }}>
                    {u.status === "active" ? "Active" : "Suspended"}
                  </span>
                  <span style={{ color: sub, fontSize: "12px" }}>{u.deposits}</span>
                  <span style={{ color: text, fontWeight: 600, fontSize: "12px" }}>{u.earnings}</span>
                  <button
                    onClick={() => toggleSuspend(u.id)}
                    style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "8px", border: `1px solid ${u.status === "active" ? "#ef444444" : "#16a34a44"}`, background: u.status === "active" ? "#ef444412" : "#16a34a12", color: u.status === "active" ? "#ef4444" : "#16a34a", fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: "11px", cursor: "pointer" }}
                  >
                    {u.status === "active" ? <><Lock size={11} />Suspend</> : <><LockOpen size={11} />Restore</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Flags ── */}
        {activeTab === "flags" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* Unresolved first */}
            {[...flags].sort((a, b) => Number(a.resolved) - Number(b.resolved)).map((flag) => (
              <div key={flag.id} style={{ background: card, border: `1px solid ${flag.resolved ? cardBorder : FLAG_COLORS[flag.type] + "44"}`, borderRadius: "12px", padding: "16px", opacity: flag.resolved ? 0.6 : 1, transition: "opacity 0.2s" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                  <div style={{ display: "flex", gap: "12px", flex: 1, minWidth: 0 }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${FLAG_COLORS[flag.type]}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <SealWarning size={20} color={FLAG_COLORS[flag.type]} weight="fill" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: FLAG_COLORS[flag.type], background: `${FLAG_COLORS[flag.type]}18`, padding: "1px 8px", borderRadius: "99px" }}>{FLAG_LABELS[flag.type]}</span>
                        <span style={{ color: sub, fontSize: "11px" }}>{flag.bin} · {flag.time}</span>
                        {flag.resolved && <span style={{ fontSize: "10px", color: "#16a34a", fontWeight: 700 }}>✓ Resolved</span>}
                      </div>
                      <div style={{ color: text, fontWeight: 600, fontSize: "13px", marginBottom: "3px" }}>{flag.user}</div>
                      <div style={{ color: sub, fontSize: "12px", lineHeight: 1.5 }}>{flag.detail}</div>
                    </div>
                  </div>
                  {!flag.resolved && (
                    <button onClick={() => resolveFlag(flag.id)} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "7px 12px", borderRadius: "9px", border: "none", background: "#16a34a", color: "#fff", fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "12px", cursor: "pointer", flexShrink: 0 }}>
                      <CheckCircle size={13} weight="fill" />Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Stats ── */}
        {activeTab === "stats" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Role breakdown */}
            <div style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "18px" }}>
              <div style={{ color: text, fontWeight: 700, fontSize: "14px", marginBottom: "14px" }}>User Role Breakdown</div>
              {(["user", "worker", "moderator"] as UserRole[]).map((role) => {
                const count = users.filter((u) => u.role === role).length;
                const pct = Math.round((count / users.length) * 100);
                return (
                  <div key={role} style={{ marginBottom: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ color: ROLE_COLORS[role], fontWeight: 700, fontSize: "12px", textTransform: "capitalize" }}>{role}</span>
                      <span style={{ color: sub, fontSize: "12px" }}>{count} users · {pct}%</span>
                    </div>
                    <div style={{ height: "8px", borderRadius: "99px", background: dark ? "#1f2937" : "#e5e7eb", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: ROLE_COLORS[role], borderRadius: "99px", transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Transaction status breakdown */}
            <div style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "18px" }}>
              <div style={{ color: text, fontWeight: 700, fontSize: "14px", marginBottom: "14px" }}>Transaction Status Breakdown</div>
              {(["confirmed", "pending", "flagged", "rejected"] as TxStatus[]).map((status) => {
                const count = MOCK_TRANSACTIONS.filter((t) => t.status === status).length;
                const pct = Math.round((count / MOCK_TRANSACTIONS.length) * 100);
                return (
                  <div key={status} style={{ marginBottom: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ color: TX_COLORS[status], fontWeight: 700, fontSize: "12px", textTransform: "capitalize" }}>{status}</span>
                      <span style={{ color: sub, fontSize: "12px" }}>{count} · {pct}%</span>
                    </div>
                    <div style={{ height: "8px", borderRadius: "99px", background: dark ? "#1f2937" : "#e5e7eb", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: TX_COLORS[status], borderRadius: "99px", transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary numbers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
              {[
                { label: "Total Users",        value: users.length,                                          color: "#16a34a" },
                { label: "Suspended Users",    value: users.filter((u) => u.status === "suspended").length,  color: "#ef4444" },
                { label: "Total Transactions", value: MOCK_TRANSACTIONS.length,                              color: "#3b82f6" },
                { label: "Flagged Today",      value: MOCK_TRANSACTIONS.filter((t) => t.status === "flagged").length, color: "#f59e0b" },
              ].map((s, i) => (
                <div key={i} style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "14px 16px" }}>
                  <div style={{ color: s.color, fontWeight: 700, fontSize: "24px" }}>{s.value}</div>
                  <div style={{ color: sub, fontSize: "11px", marginTop: "2px" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: card, borderTop: `1px solid ${cardBorder}`, padding: "10px 20px 20px", display: "flex", justifyContent: "space-around" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          const isFlagTab = tab.id === "flags" && pendingFlags > 0;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", color: active ? (isFlagTab ? "#ef4444" : "#16a34a") : isFlagTab ? "#ef4444" : sub }}>
              <Icon size={22} weight={active ? "fill" : "regular"} />
              <span style={{ fontSize: "10px", fontFamily: "DM Sans, sans-serif", fontWeight: active ? 700 : 500 }}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}