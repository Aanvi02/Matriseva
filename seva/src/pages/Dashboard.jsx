import { useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";

const C = {
  saffron: "#E8621A", saffronPale: "#FDF0E8",
  teal: "#0D6E6E",   tealPale: "#E8F5F5",
  cream: "#F4F0EB",  charcoal: "#1C1C1C",
  muted: "#6B6260",  border: "#E0D8D0",
  white: "#FFFFFF",  green: "#16A34A",  greenPale: "#DCFCE7",
  yellow: "#D97706", yellowPale: "#FEF3C7",
  red: "#DC2626",    redPale: "#FEE2E2",
};

// ── Mock patient data ──────────────────────────────────────────────
const PATIENTS = [
  { id: "MAT-SAH-001", name: "Priya Devi",    age: 26, weeks: 28, village: "Gangoh",   risk: "HIGH",   hb: 8.1,  bp: "148/95", asha: "Sunita Sharma",  date: "2025-02-28" },
  { id: "MAT-SAH-002", name: "Rekha Singh",   age: 22, weeks: 14, village: "Behat",    risk: "LOW",    hb: 11.8, bp: "118/76", asha: "Meena Devi",     date: "2025-02-27" },
  { id: "MAT-SAH-003", name: "Fatima Begum",  age: 19, weeks: 32, village: "Rampur",   risk: "MEDIUM", hb: 9.5,  bp: "132/84", asha: "Sunita Sharma",  date: "2025-02-26" },
  { id: "MAT-SAH-004", name: "Sunita Yadav",  age: 30, weeks: 20, village: "Sarsawa",  risk: "LOW",    hb: 12.2, bp: "116/72", asha: "Kavita Patel",   date: "2025-02-25" },
  { id: "MAT-SAH-005", name: "Anita Kumari",  age: 17, weeks: 10, village: "Nakur",    risk: "HIGH",   hb: 7.2,  bp: "156/100","asha": "Meena Devi",   date: "2025-02-24" },
  { id: "MAT-SAH-006", name: "Geeta Rawat",   age: 34, weeks: 36, village: "Gangoh",   risk: "MEDIUM", hb: 10.1, bp: "138/88", asha: "Kavita Patel",   date: "2025-02-23" },
  { id: "MAT-SAH-007", name: "Rubina Khatun", age: 25, weeks: 22, village: "Deoband",  risk: "LOW",    hb: 11.5, bp: "114/70", asha: "Sunita Sharma",  date: "2025-02-22" },
  { id: "MAT-SAH-008", name: "Pooja Sharma",  age: 28, weeks: 30, village: "Behat",    risk: "HIGH",   hb: 7.8,  bp: "152/98", asha: "Meena Devi",     date: "2025-02-21" },
];

const MONTHLY = [
  { month: "Sep", registered: 18, high: 3,  medium: 5,  low: 10 },
  { month: "Oct", registered: 24, high: 5,  medium: 7,  low: 12 },
  { month: "Nov", registered: 21, high: 4,  medium: 6,  low: 11 },
  { month: "Dec", registered: 29, high: 6,  medium: 8,  low: 15 },
  { month: "Jan", registered: 32, high: 7,  medium: 9,  low: 16 },
  { month: "Feb", registered: 27, high: 5,  medium: 8,  low: 14 },
];

const RISK_META = {
  HIGH:   { label: "High Risk",     color: C.red,    bg: C.redPale,    emoji: "🔴" },
  MEDIUM: { label: "Moderate Risk", color: C.yellow, bg: C.yellowPale, emoji: "🟡" },
  LOW:    { label: "Low Risk",      color: C.green,  bg: C.greenPale,  emoji: "🟢" },
};

// ── Small reusable pieces ──────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, bg }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? bg : C.white, borderRadius: 16, padding: "22px 24px",
        border: `1.5px solid ${hov ? color : C.border}`,
        transition: "all 0.2s", cursor: "default",
        boxShadow: hov ? `0 8px 24px ${color}22` : "0 1px 4px rgba(0,0,0,0.05)",
      }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color, fontFamily: "'Georgia', serif" }}>{value}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function RiskBadge({ risk }) {
  const m = RISK_META[risk];
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
      background: m.bg, color: m.color, whiteSpace: "nowrap",
    }}>{m.emoji} {m.label}</span>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────
export default function Dashboard({ onRegister, onViewPatient, onLogout }) {
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("ALL");
  const [sortBy, setSortBy] = useState("date");

  // Read real user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("ms_currentUser") || "{}");
  const userName    = currentUser.name || "User";
  const userRole    = currentUser.role || "asha";
  const userInitial = userName.charAt(0).toUpperCase();
  const ROLE_LABELS = { asha: "ASHA Worker", doctor: "Doctor", admin: "Admin", patient: "Patient" };

  const high   = PATIENTS.filter(p => p.risk === "HIGH").length;
  const medium = PATIENTS.filter(p => p.risk === "MEDIUM").length;
  const low    = PATIENTS.filter(p => p.risk === "LOW").length;

  const pieData = [
    { name: "High Risk",     value: high,   color: C.red    },
    { name: "Moderate Risk", value: medium, color: C.yellow },
    { name: "Low Risk",      value: low,    color: C.green  },
  ];

  const filtered = PATIENTS
    .filter(p => {
      const q = search.toLowerCase();
      const matchSearch = p.name.toLowerCase().includes(q) || p.village.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
      const matchRisk = filterRisk === "ALL" || p.risk === filterRisk;
      return matchSearch && matchRisk;
    })
    .sort((a, b) => {
      if (sortBy === "date") return new Date(b.date) - new Date(a.date);
      if (sortBy === "risk") return ["HIGH","MEDIUM","LOW"].indexOf(a.risk) - ["HIGH","MEDIUM","LOW"].indexOf(b.risk);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  const exportCSV = () => {
    const headers = ["ID", "Name", "Age", "Weeks", "Village", "Risk", "Hb", "BP", "ASHA", "Date"];
    const rows = PATIENTS.map(p => [p.id, p.name, p.age, p.weeks, p.village, p.risk, p.hb, p.bp, p.asha, p.date]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "matriseva_patients.csv"; a.click();
  };

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      {/* ── Topbar ── */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.saffron, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🌸</div>
          <span style={{ fontFamily: "'Georgia',serif", fontSize: 18, fontWeight: 700, color: C.charcoal }}>
            Matri<span style={{ color: C.saffron }}>seva</span>
          </span>
          <span style={{ fontSize: 12, marginLeft: 4, padding: "2px 10px", background: C.tealPale, color: C.teal, borderRadius: 20, fontWeight: 600 }}>{ROLE_LABELS[userRole] || "Dashboard"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>{userName}</div>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "capitalize" }}>{ROLE_LABELS[userRole]}</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.saffron, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 15 }}>{userInitial}</div>
          <button onClick={onLogout} style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid " + C.border, background: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", color: C.muted }}>Logout</button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>

        {/* ── Page header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 26, fontWeight: 700, color: C.charcoal }}>Patient Overview</h1>
            <p style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>Saharanpur Block · February 2025</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={exportCSV} style={{ padding: "10px 18px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.white, fontSize: 13, fontWeight: 600, cursor: "pointer", color: C.charcoal }}>
              ⬇ Export CSV
            </button>
            <button onClick={onRegister} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: C.saffron, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(232,98,26,0.3)" }}>
              + Register Patient
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          <StatCard icon="👥" label="Total Patients"   value={PATIENTS.length} sub="Active registrations" color={C.teal}   bg={C.tealPale}   />
          <StatCard icon="🔴" label="High Risk"        value={high}   sub="Needs immediate care"  color={C.red}    bg={C.redPale}    />
          <StatCard icon="🟡" label="Moderate Risk"    value={medium} sub="Monitor closely"       color={C.yellow} bg={C.yellowPale} />
          <StatCard icon="🟢" label="Low Risk"         value={low}    sub="Routine follow-up"     color={C.green}  bg={C.greenPale}  />
        </div>

        {/* ── Charts row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20, marginBottom: 28 }}>

          {/* Pie chart */}
          <div style={{ background: C.white, borderRadius: 16, padding: "22px", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: C.muted, marginBottom: 16 }}>Risk Distribution</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v + " patients", n]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {pieData.map(d => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                  <span style={{ color: C.muted }}>{d.name}</span>
                  <span style={{ marginLeft: "auto", fontWeight: 700, color: C.charcoal }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar chart */}
          <div style={{ background: C.white, borderRadius: 16, padding: "22px", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: C.muted, marginBottom: 16 }}>Monthly Registrations</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MONTHLY} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE5" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="high"   name="High"     fill={C.red}    radius={[4,4,0,0]} />
                <Bar dataKey="medium" name="Moderate" fill={C.yellow} radius={[4,4,0,0]} />
                <Bar dataKey="low"    name="Low"      fill={C.green}  radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Patient table ── */}
        <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>

          {/* Table header */}
          <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.charcoal, marginRight: "auto" }}>All Patients</div>

            {/* Search */}
            <input
              placeholder="🔍 Search name, village, ID..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, width: 220, outline: "none", fontFamily: "inherit" }}
            />

            {/* Risk filter */}
            {["ALL","HIGH","MEDIUM","LOW"].map(r => (
              <button key={r} onClick={() => setFilterRisk(r)} style={{
                padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${filterRisk === r ? C.saffron : C.border}`,
                background: filterRisk === r ? C.saffronPale : C.white,
                color: filterRisk === r ? C.saffron : C.muted,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>{r === "ALL" ? "All" : RISK_META[r].emoji + " " + r}</button>
            ))}

            {/* Sort */}
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: "7px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: C.charcoal }}>
              <option value="date">Sort: Latest</option>
              <option value="risk">Sort: Risk Level</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.cream }}>
                  {["Patient","ID","Age/Weeks","Village","Vitals","Risk","ASHA","Date","Action"].map(h => (
                    <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: C.muted, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} style={{ borderTop: `1px solid ${C.border}`, transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = C.cream}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: C.charcoal }}>{p.name}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 11, background: C.cream, padding: "2px 8px", borderRadius: 5, color: C.muted }}>{p.id}</span>
                    </td>
                    <td style={{ padding: "12px 16px", color: C.muted }}>{p.age}y · {p.weeks}w</td>
                    <td style={{ padding: "12px 16px", color: C.muted }}>📍 {p.village}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 12 }}>Hb <b style={{ color: Number(p.hb) < 9 ? C.red : C.green }}>{p.hb}</b></div>
                      <div style={{ fontSize: 12 }}>BP <b style={{ color: Number(p.bp.split("/")[0]) >= 140 ? C.red : C.green }}>{p.bp}</b></div>
                    </td>
                    <td style={{ padding: "12px 16px" }}><RiskBadge risk={p.risk} /></td>
                    <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>{p.asha}</td>
                    <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>{p.date}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <button onClick={() => onViewPatient?.(p)} style={{
                        padding: "5px 14px", borderRadius: 7,
                        border: `1.5px solid ${C.teal}`, background: "white",
                        color: C.teal, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      }}>View →</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: "center", padding: "36px", color: C.muted }}>No patients found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: "12px 22px", borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.muted }}>
            Showing {filtered.length} of {PATIENTS.length} patients
          </div>
        </div>

        {/* High risk alert */}
        {high > 0 && (
          <div style={{
            marginTop: 20, background: C.redPale,
            border: `2px solid ${C.red}`, borderRadius: 14,
            padding: "16px 22px", display: "flex", alignItems: "center", gap: 14,
          }}>
            <span style={{ fontSize: 22, animation: "pulse 1.5s infinite" }}>🚨</span>
            <div>
              <div style={{ fontWeight: 700, color: C.red, fontSize: 14 }}>{high} patients need immediate attention</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Contact PHC doctor and arrange referral for all High Risk patients.</div>
            </div>
            <button style={{ marginLeft: "auto", background: C.red, color: "white", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              View All High Risk
            </button>
          </div>
        )}

      </div>
      <style>{`@keyframes pulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.15)} }`}</style>
    </div>
  );
}