import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

const C = {
  saffron:"#E8621A", saffronPale:"#FDF0E8", teal:"#0D6E6E", tealPale:"#E8F5F5",
  cream:"#F4F0EB", charcoal:"#1C1C1C", muted:"#6B6260", border:"#E0D8D0",
  red:"#DC2626", redPale:"#FEE2E2", yellow:"#D97706", yellowPale:"#FEF3C7",
  green:"#16A34A", greenPale:"#DCFCE7", white:"#FFFFFF",
};

const ALL_PATIENTS = [
  { id:"MAT-001", name:"Priya Devi",    age:26, weeks:28, village:"Gangoh",  risk:"HIGH",   asha:"Sunita Sharma",  block:"Behat",    date:"2025-02-28" },
  { id:"MAT-002", name:"Rekha Singh",   age:22, weeks:14, village:"Behat",   risk:"LOW",    asha:"Meena Devi",     block:"Nakur",    date:"2025-02-27" },
  { id:"MAT-003", name:"Fatima Begum",  age:19, weeks:32, village:"Rampur",  risk:"MEDIUM", asha:"Sunita Sharma",  block:"Behat",    date:"2025-02-26" },
  { id:"MAT-004", name:"Anita Kumari",  age:17, weeks:10, village:"Nakur",   risk:"HIGH",   asha:"Meena Devi",     block:"Nakur",    date:"2025-02-24" },
  { id:"MAT-005", name:"Geeta Rawat",   age:34, weeks:36, village:"Gangoh",  risk:"MEDIUM", asha:"Kavita Patel",   block:"Sarsawa",  date:"2025-02-23" },
  { id:"MAT-006", name:"Rubina Khatun", age:25, weeks:22, village:"Deoband", risk:"LOW",    asha:"Sunita Sharma",  block:"Deoband",  date:"2025-02-22" },
  { id:"MAT-007", name:"Pooja Sharma",  age:28, weeks:30, village:"Behat",   risk:"HIGH",   asha:"Meena Devi",     block:"Nakur",    date:"2025-02-21" },
  { id:"MAT-008", name:"Sunita Yadav",  age:30, weeks:20, village:"Sarsawa", risk:"LOW",    asha:"Kavita Patel",   block:"Sarsawa",  date:"2025-02-20" },
];

const ASHA_WORKERS = [
  { name:"Sunita Sharma", block:"Behat",   patients:3, high:1, active:true,  phone:"9876543210" },
  { name:"Meena Devi",    block:"Nakur",   patients:3, high:2, active:true,  phone:"9876543211" },
  { name:"Kavita Patel",  block:"Sarsawa", patients:2, high:0, active:false, phone:"9876543212" },
];

const MONTHLY = [
  { month:"Sep", registered:18, high:3, medium:5, low:10 },
  { month:"Oct", registered:24, high:5, medium:7, low:12 },
  { month:"Nov", registered:21, high:4, medium:6, low:11 },
  { month:"Dec", registered:29, high:6, medium:8, low:15 },
  { month:"Jan", registered:32, high:7, medium:9, low:16 },
  { month:"Feb", registered:27, high:5, medium:8, low:14 },
];

const RISK = { HIGH:{color:C.red,bg:C.redPale,emoji:"🔴"}, MEDIUM:{color:C.yellow,bg:C.yellowPale,emoji:"🟡"}, LOW:{color:C.green,bg:C.greenPale,emoji:"🟢"} };

export default function AdminDashboard({ onLogout }) {
  const user = JSON.parse(localStorage.getItem("ms_currentUser") || "{}");
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");

  const pieData = [
    { name:"High Risk",     value:ALL_PATIENTS.filter(p=>p.risk==="HIGH").length,   color:C.red },
    { name:"Moderate Risk", value:ALL_PATIENTS.filter(p=>p.risk==="MEDIUM").length, color:C.yellow },
    { name:"Low Risk",      value:ALL_PATIENTS.filter(p=>p.risk==="LOW").length,    color:C.green },
  ];

  const exportCSV = () => {
    const rows = ALL_PATIENTS.map(p => [p.id,p.name,p.age,p.weeks,p.village,p.risk,p.asha,p.block,p.date].join(","));
    const csv = ["ID,Name,Age,Weeks,Village,Risk,ASHA,Block,Date",...rows].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download="matriseva_all.csv"; a.click();
  };

  const filtered = ALL_PATIENTS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.village.toLowerCase().includes(search.toLowerCase()) || p.asha.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ minHeight:"100vh", background:C.cream, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>

      {/* Topbar */}
      <div style={{ background:C.charcoal, padding:"0 32px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:22 }}>🌸</span>
          <span style={{ fontFamily:"'Georgia',serif", fontSize:18, fontWeight:700, color:"white" }}>Matri<span style={{ color:"#F4894A" }}>seva</span></span>
          <span style={{ background:"rgba(232,98,26,0.3)", color:"#F4894A", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20 }}>ADMIN</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <button onClick={exportCSV} style={{ background:"rgba(255,255,255,0.1)", color:"white", border:"none", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>⬇ Export CSV</button>
          <span style={{ fontSize:13, color:"white", fontWeight:600 }}>🏛️ {user.name}</span>
          <button onClick={onLogout} style={{ background:"rgba(255,255,255,0.1)", color:"white", border:"none", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>Logout</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:C.white, borderBottom:"1px solid "+C.border, padding:"0 32px", display:"flex", gap:4 }}>
        {[["overview","📊 Overview"],["patients","👥 All Patients"],["workers","🏃‍♀️ ASHA Workers"]].map(([id,label]) => (
          <button key={id} onClick={()=>setActiveTab(id)} style={{ padding:"14px 20px", border:"none", borderBottom:"3px solid "+(activeTab===id?C.saffron:"transparent"), background:"transparent", color:activeTab===id?C.saffron:C.muted, fontSize:14, fontWeight:activeTab===id?700:500, cursor:"pointer" }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:1200, margin:"0 auto", padding:"28px 20px" }}>

        {/* OVERVIEW TAB */}
        {activeTab==="overview" && (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
              {[
                { icon:"👥", label:"Total Patients",   value:ALL_PATIENTS.length,                                       color:C.teal,   bg:C.tealPale },
                { icon:"🔴", label:"High Risk",        value:ALL_PATIENTS.filter(p=>p.risk==="HIGH").length,            color:C.red,    bg:C.redPale },
                { icon:"🏃‍♀️", label:"ASHA Workers",  value:ASHA_WORKERS.length,                                       color:C.saffron,bg:C.saffronPale },
                { icon:"📈", label:"This Month",       value:27,                                                        color:C.green,  bg:C.greenPale },
              ].map(s => (
                <div key={s.label} style={{ background:C.white, borderRadius:14, padding:"20px", border:"1.5px solid "+C.border }}
                  onMouseEnter={e=>{ e.currentTarget.style.background=s.bg; e.currentTarget.style.borderColor=s.color; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background=C.white; e.currentTarget.style.borderColor=C.border; }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>{s.icon}</div>
                  <div style={{ fontSize:32, fontWeight:800, color:s.color, fontFamily:"'Georgia',serif" }}>{s.value}</div>
                  <div style={{ fontSize:13, color:C.muted, marginTop:3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:20 }}>
              <div style={{ background:C.white, borderRadius:16, padding:22, border:"1px solid "+C.border }}>
                <div style={{ fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, color:C.muted, marginBottom:16 }}>Risk Distribution</div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {pieData.map((d,i) => <Cell key={i} fill={d.color} />)}
                  </Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
                {pieData.map(d => (
                  <div key={d.name} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, marginBottom:6 }}>
                    <div style={{ width:10, height:10, borderRadius:"50%", background:d.color }} />
                    <span style={{ color:C.muted }}>{d.name}</span>
                    <span style={{ marginLeft:"auto", fontWeight:700 }}>{d.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:C.white, borderRadius:16, padding:22, border:"1px solid "+C.border }}>
                <div style={{ fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, color:C.muted, marginBottom:16 }}>Monthly Registrations</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={MONTHLY} barSize={12}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE5" />
                    <XAxis dataKey="month" tick={{ fontSize:12, fill:C.muted }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize:12, fill:C.muted }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius:10, fontSize:12 }} />
                    <Legend wrapperStyle={{ fontSize:12 }} />
                    <Bar dataKey="high" name="High" fill={C.red} radius={[4,4,0,0]} />
                    <Bar dataKey="medium" name="Moderate" fill={C.yellow} radius={[4,4,0,0]} />
                    <Bar dataKey="low" name="Low" fill={C.green} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* PATIENTS TAB */}
        {activeTab==="patients" && (
          <div style={{ background:C.white, borderRadius:16, border:"1px solid "+C.border, overflow:"hidden" }}>
            <div style={{ padding:"16px 20px", borderBottom:"1px solid "+C.border, display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontWeight:700, fontSize:15, marginRight:"auto" }}>All Patients — Saharanpur District</span>
              <input placeholder="🔍 Search patient, village, ASHA..." value={search} onChange={e=>setSearch(e.target.value)}
                style={{ padding:"8px 14px", borderRadius:8, border:"1.5px solid "+C.border, fontSize:13, width:260, outline:"none", fontFamily:"inherit" }} />
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead><tr style={{ background:C.cream }}>
                {["Patient","ID","Age/Weeks","Village","Block","Risk","ASHA Worker","Date"].map(h => (
                  <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:0.6, color:C.muted, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} style={{ borderTop:"1px solid "+C.border }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.cream}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{ padding:"12px 16px", fontWeight:600 }}>{p.name}</td>
                    <td style={{ padding:"12px 16px" }}><span style={{ fontFamily:"monospace", fontSize:11, background:C.cream, padding:"2px 8px", borderRadius:5, color:C.muted }}>{p.id}</span></td>
                    <td style={{ padding:"12px 16px", color:C.muted }}>{p.age}y · {p.weeks}w</td>
                    <td style={{ padding:"12px 16px", color:C.muted }}>📍 {p.village}</td>
                    <td style={{ padding:"12px 16px", color:C.muted }}>{p.block}</td>
                    <td style={{ padding:"12px 16px" }}><span style={{ background:RISK[p.risk].bg, color:RISK[p.risk].color, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>{RISK[p.risk].emoji} {p.risk}</span></td>
                    <td style={{ padding:"12px 16px", color:C.muted, fontSize:12 }}>{p.asha}</td>
                    <td style={{ padding:"12px 16px", color:C.muted, fontSize:12 }}>{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding:"12px 20px", borderTop:"1px solid "+C.border, fontSize:12, color:C.muted }}>{filtered.length} patients shown</div>
          </div>
        )}

        {/* ASHA WORKERS TAB */}
        {activeTab==="workers" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            {ASHA_WORKERS.map(w => (
              <div key={w.name} style={{ background:C.white, borderRadius:16, padding:24, border:"1.5px solid "+C.border }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                  <div style={{ width:46, height:46, borderRadius:"50%", background:`linear-gradient(135deg, ${C.saffron}, #c04b2d)`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:700, fontSize:18 }}>
                    {w.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15 }}>{w.name}</div>
                    <div style={{ fontSize:12, color:C.muted }}>📍 {w.block} Block</div>
                  </div>
                  <span style={{ marginLeft:"auto", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:w.active?C.greenPale:C.redPale, color:w.active?C.green:C.red }}>
                    {w.active ? "● Active" : "● Inactive"}
                  </span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                  {[["Patients",w.patients,C.teal],["High Risk",w.high,C.red]].map(([l,v,c]) => (
                    <div key={l} style={{ background:C.cream, borderRadius:10, padding:"12px", textAlign:"center" }}>
                      <div style={{ fontSize:22, fontWeight:800, color:c }}>{v}</div>
                      <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize:12, color:C.muted }}>📱 {w.phone}</div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}