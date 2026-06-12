import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ── Inline storage helpers ──
const getCurrentUser    = () => JSON.parse(localStorage.getItem("ms_currentUser") || "null");
const getPatients       = () => JSON.parse(localStorage.getItem("ms_patients") || "[]");
const getPatientsByAsha = (email) => getPatients().filter(p => p.ashaEmail === email);
const logout            = (navigate) => { localStorage.removeItem("ms_currentUser"); navigate("/login"); };

const C = {
  saffron:"#E8621A", saffronPale:"#FDF0E8", teal:"#0D6E6E", tealPale:"#E8F5F5",
  cream:"#F4F0EB", charcoal:"#1C1C1C", muted:"#6B6260", border:"#E0D8D0",
  red:"#DC2626", redPale:"#FEE2E2", yellow:"#D97706", yellowPale:"#FEF3C7",
  green:"#16A34A", greenPale:"#DCFCE7", white:"#FFFFFF",
};

const RISK = {
  HIGH:   { color:C.red,    bg:C.redPale,    emoji:"🔴", label:"High Risk" },
  MEDIUM: { color:C.yellow, bg:C.yellowPale, emoji:"🟡", label:"Moderate"  },
  LOW:    { color:C.green,  bg:C.greenPale,  emoji:"🟢", label:"Low Risk"  },
};

export default function ASHADashboard() {
  const navigate  = useNavigate();
  const user      = getCurrentUser();
  const [patients, setPatients] = useState([]);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("ALL");

  // Load only THIS asha's patients from localStorage
  useEffect(() => {
    const mine = getPatientsByAsha(user.email);
    setPatients(mine);
  }, []);

  const handleLogout = () => { localStorage.removeItem("ms_currentUser"); navigate("/login"); };

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.name?.toLowerCase().includes(q) || p.village?.toLowerCase().includes(q);
    const matchRisk   = filter === "ALL" || p.risk === filter;
    return matchSearch && matchRisk;
  });

  const high = patients.filter(p => p.risk === "HIGH");

  return (
    <div style={{ minHeight:"100vh", background:C.cream, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>

      {/* Topbar */}
      <div style={{ background:C.teal, padding:"0 28px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:20 }}>🌸</span>
          <span style={{ fontFamily:"'Georgia',serif", fontSize:17, fontWeight:700, color:"white" }}>Matri<span style={{ color:"#F4894A" }}>seva</span></span>
          <span style={{ background:"rgba(255,255,255,0.15)", color:"white", fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:20 }}>ASHA WORKER</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:13, color:"rgba(255,255,255,0.9)", fontWeight:600 }}>👋 {user.name}</span>
          <button onClick={handleLogout} style={{ background:"rgba(255,255,255,0.15)", color:"white", border:"none", borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>Logout</button>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"24px 20px" }}>

        {/* High risk alert */}
        {high.length > 0 && (
          <div style={{ background:C.redPale, border:"2px solid "+C.red, borderRadius:12, padding:"12px 18px", marginBottom:20, display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:22 }}>🚨</span>
            <div>
              <div style={{ fontWeight:700, color:C.red, fontSize:14 }}>{high.length} patient(s) need immediate attention</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{high.map(p=>p.name).join(", ")}</div>
            </div>
            <button onClick={()=>setFilter("HIGH")} style={{ marginLeft:"auto", background:C.red, color:"white", border:"none", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:700, cursor:"pointer" }}>View →</button>
          </div>
        )}

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
          {[
            { icon:"👥", label:"My Patients",   value:patients.length,                                    color:C.teal,    bg:C.tealPale    },
            { icon:"🔴", label:"High Risk",     value:patients.filter(p=>p.risk==="HIGH").length,         color:C.red,     bg:C.redPale     },
            { icon:"🟡", label:"Moderate Risk", value:patients.filter(p=>p.risk==="MEDIUM").length,       color:C.yellow,  bg:C.yellowPale  },
            { icon:"🟢", label:"Low Risk",      value:patients.filter(p=>p.risk==="LOW").length,          color:C.green,   bg:C.greenPale   },
          ].map(s => (
            <div key={s.label} style={{ background:C.white, borderRadius:12, padding:"16px 18px", border:"1.5px solid "+C.border, transition:"all 0.2s", cursor:"default" }}
              onMouseEnter={e=>{ e.currentTarget.style.background=s.bg; e.currentTarget.style.borderColor=s.color; }}
              onMouseLeave={e=>{ e.currentTarget.style.background=C.white; e.currentTarget.style.borderColor=C.border; }}>
              <div style={{ fontSize:24, marginBottom:6 }}>{s.icon}</div>
              <div style={{ fontSize:26, fontWeight:800, color:s.color, fontFamily:"'Georgia',serif" }}>{s.value}</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Patient table */}
        <div style={{ background:C.white, borderRadius:14, border:"1px solid "+C.border, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid "+C.border, display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <span style={{ fontWeight:700, fontSize:15, color:C.charcoal, marginRight:"auto" }}>My Patients</span>
            <input placeholder="🔍 Search name or village..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{ padding:"7px 12px", borderRadius:8, border:"1.5px solid "+C.border, fontSize:13, width:200, outline:"none", fontFamily:"inherit" }} />
            {["ALL","HIGH","MEDIUM","LOW"].map(r => (
              <button key={r} onClick={()=>setFilter(r)} style={{ padding:"6px 12px", borderRadius:8, border:"1.5px solid "+(filter===r?C.saffron:C.border), background:filter===r?C.saffronPale:C.white, color:filter===r?C.saffron:C.muted, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                {r==="ALL"?"All":RISK[r].emoji+" "+r}
              </button>
            ))}
            <button onClick={()=>navigate("/register")} style={{ background:C.saffron, color:"white", border:"none", borderRadius:8, padding:"8px 16px", fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 12px rgba(232,98,26,0.3)" }}>
              + Register Patient
            </button>
          </div>

          {/* Empty state */}
          {patients.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 20px" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>👩‍⚕️</div>
              <div style={{ fontSize:16, fontWeight:700, color:C.charcoal, marginBottom:8 }}>No patients registered yet</div>
              <div style={{ fontSize:13, color:C.muted, marginBottom:20 }}>Start by registering your first patient</div>
              <button onClick={()=>navigate("/register")} style={{ background:C.saffron, color:"white", border:"none", borderRadius:10, padding:"12px 28px", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                + Register First Patient
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px", color:C.muted, fontSize:14 }}>No patients match your search</div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead><tr style={{ background:C.cream }}>
                {["Patient","Age / Weeks","Village","Vitals","Risk","Registered","Action"].map(h=>(
                  <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:0.6, color:C.muted, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} style={{ borderTop:"1px solid "+C.border }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.cream}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{ padding:"11px 14px", fontWeight:600, color:C.charcoal }}>{p.name}</td>
                    <td style={{ padding:"11px 14px", color:C.muted }}>{p.age}y · {p.weeks}w</td>
                    <td style={{ padding:"11px 14px", color:C.muted }}>📍 {p.village}</td>
                    <td style={{ padding:"11px 14px" }}>
                      <div style={{ fontSize:12 }}>Hb <b style={{ color:Number(p.hb)<9?C.red:C.green }}>{p.hb||"—"}</b></div>
                      <div style={{ fontSize:12 }}>BP <b style={{ color:parseInt(p.bp||0)>=140?C.red:C.green }}>{p.bp||"—"}</b></div>
                    </td>
                    <td style={{ padding:"11px 14px" }}>
                      {p.risk ? (
                        <span style={{ background:RISK[p.risk].bg, color:RISK[p.risk].color, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>
                          {RISK[p.risk].emoji} {RISK[p.risk].label}
                        </span>
                      ) : <span style={{ color:C.muted, fontSize:12 }}>—</span>}
                    </td>
                    <td style={{ padding:"11px 14px", color:C.muted, fontSize:12 }}>{p.registeredAt?.split("T")[0] || "—"}</td>
                    <td style={{ padding:"11px 14px" }}>
                      <button onClick={()=>navigate("/result", { state:{ patient:p } })} style={{ padding:"5px 12px", borderRadius:7, border:"1.5px solid "+C.teal, background:"white", color:C.teal, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {patients.length > 0 && (
            <div style={{ padding:"10px 18px", borderTop:"1px solid "+C.border, fontSize:12, color:C.muted }}>
              {filtered.length} of {patients.length} patients shown
            </div>
          )}
        </div>
      </div>
    </div>
  );
}