import { useState } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  saffron:"#E8621A", saffronPale:"#FDF0E8", teal:"#0D6E6E", tealPale:"#E8F5F5",
  cream:"#F4F0EB", charcoal:"#1C1C1C", muted:"#6B6260", border:"#E0D8D0",
  red:"#DC2626", redPale:"#FEE2E2", yellow:"#D97706", yellowPale:"#FEF3C7",
  green:"#16A34A", greenPale:"#DCFCE7", white:"#FFFFFF",
};

const HIGH_RISK = [
  { id:"MAT-001", name:"Priya Devi",   age:26, weeks:28, village:"Gangoh",  hb:8.1,  bp:"148/95",  flags:["High BP","Low Hb"],        asha:"Sunita Sharma",  status:"pending",  notes:"" },
  { id:"MAT-004", name:"Anita Kumari", age:17, weeks:10, village:"Nakur",   hb:7.2,  bp:"156/100", flags:["Teenage","Severe Anemia","High BP"], asha:"Meena Devi", status:"pending", notes:"" },
  { id:"MAT-008", name:"Pooja Sharma", age:28, weeks:30, village:"Behat",   hb:7.8,  bp:"152/98",  flags:["High BP","Low Hb"],        asha:"Meena Devi",    status:"reviewed", notes:"Referred to district hospital" },
];

const ALL_PATIENTS = [
  ...HIGH_RISK,
  { id:"MAT-003", name:"Fatima Begum", age:19, weeks:32, village:"Rampur", hb:9.5, bp:"132/84", flags:["Borderline BP"], asha:"Sunita Sharma", status:"reviewed", notes:"" },
  { id:"MAT-005", name:"Geeta Rawat",  age:34, weeks:36, village:"Gangoh", hb:10.1,bp:"138/88", flags:["Age>30","Late Preterm"], asha:"Kavita Patel", status:"pending", notes:"" },
];

export default function DoctorDashboard({ onLogout }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("ms_currentUser") || "{}");
  const [patients, setPatients] = useState(ALL_PATIENTS);
  const [activeTab, setActiveTab] = useState("high");
  const [noteModal, setNoteModal] = useState(null);
  const [noteText, setNoteText] = useState("");

  const saveNote = (id) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, notes: noteText, status:"reviewed" } : p));
    setNoteModal(null); setNoteText("");
  };

  const markReviewed = (id) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, status:"reviewed" } : p));
  };

  const shown = activeTab === "high"
    ? patients.filter(p => HIGH_RISK.find(h => h.id === p.id))
    : patients;

  return (
    <div style={{ minHeight:"100vh", background:C.cream, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>

      {/* Topbar */}
      <div style={{ background:"#1a3a5c", padding:"0 32px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:22 }}>🌸</span>
          <span style={{ fontFamily:"'Georgia',serif", fontSize:18, fontWeight:700, color:"white" }}>Matri<span style={{ color:"#F4894A" }}>seva</span></span>
          <span style={{ background:"rgba(255,255,255,0.15)", color:"white", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20 }}>DOCTOR</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <span style={{ fontSize:13, color:"white", fontWeight:600 }}>👨‍⚕️ {user.name}</span>
          <button onClick={onLogout} style={{ background:"rgba(255,255,255,0.15)", color:"white", border:"none", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>Logout</button>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"28px 20px" }}>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
          {[
            { icon:"🔴", label:"High Risk Cases",    value:HIGH_RISK.length,                                         color:C.red,    bg:C.redPale },
            { icon:"⏳", label:"Pending Review",     value:patients.filter(p=>p.status==="pending").length,          color:C.yellow, bg:C.yellowPale },
            { icon:"✅", label:"Reviewed Today",     value:patients.filter(p=>p.status==="reviewed").length,         color:C.green,  bg:C.greenPale },
            { icon:"👥", label:"Total Assigned",     value:patients.length,                                          color:"#1a3a5c", bg:"#e8eef5" },
          ].map(s => (
            <div key={s.label} style={{ background:C.white, borderRadius:14, padding:"18px 20px", border:"1.5px solid "+C.border }}
              onMouseEnter={e=>{ e.currentTarget.style.background=s.bg; e.currentTarget.style.borderColor=s.color; }}
              onMouseLeave={e=>{ e.currentTarget.style.background=C.white; e.currentTarget.style.borderColor=C.border; }}>
              <div style={{ fontSize:26, marginBottom:8 }}>{s.icon}</div>
              <div style={{ fontSize:28, fontWeight:800, color:s.color, fontFamily:"'Georgia',serif" }}>{s.value}</div>
              <div style={{ fontSize:13, color:C.muted, marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          {[["high","🔴 High Risk Cases"],["all","👥 All Assigned Patients"]].map(([id,label]) => (
            <button key={id} onClick={()=>setActiveTab(id)} style={{ padding:"9px 20px", borderRadius:10, border:"1.5px solid "+(activeTab===id?"#1a3a5c":C.border), background:activeTab===id?"#1a3a5c":C.white, color:activeTab===id?"white":C.muted, fontSize:13, fontWeight:600, cursor:"pointer" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Patient cards */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {shown.map(p => (
            <div key={p.id} style={{ background:C.white, borderRadius:14, padding:"18px 22px", border:"1.5px solid "+(p.status==="pending" && HIGH_RISK.find(h=>h.id===p.id) ? C.red : C.border) }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                    <span style={{ fontWeight:700, fontSize:15 }}>{p.name}</span>
                    <span style={{ fontSize:12, color:C.muted }}>Age {p.age} · {p.weeks} weeks · {p.village}</span>
                    <span style={{ marginLeft:"auto", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:p.status==="reviewed"?C.greenPale:C.yellowPale, color:p.status==="reviewed"?C.green:C.yellow }}>
                      {p.status==="reviewed" ? "✅ Reviewed" : "⏳ Pending"}
                    </span>
                  </div>

                  {/* Flags */}
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                    {p.flags.map(f => (
                      <span key={f} style={{ fontSize:11, padding:"2px 10px", borderRadius:20, background:C.redPale, color:C.red, fontWeight:600 }}>⚠ {f}</span>
                    ))}
                  </div>

                  {/* Vitals */}
                  <div style={{ display:"flex", gap:16, fontSize:13 }}>
                    <span>Hb: <b style={{ color:p.hb<9?C.red:C.green }}>{p.hb} g/dL</b></span>
                    <span>BP: <b style={{ color:parseInt(p.bp)>=140?C.red:C.green }}>{p.bp} mmHg</b></span>
                    <span style={{ color:C.muted }}>ASHA: {p.asha}</span>
                  </div>

                  {/* Notes */}
                  {p.notes && (
                    <div style={{ marginTop:10, background:C.tealPale, borderRadius:8, padding:"8px 12px", fontSize:13, color:C.teal }}>
                      📋 Note: {p.notes}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  <button onClick={()=>navigate("/result",{state:{patient:p}})} style={{ padding:"8px 16px", borderRadius:8, border:"1.5px solid #1a3a5c", background:"white", color:"#1a3a5c", fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>
                    View Report →
                  </button>
                  <button onClick={()=>{ setNoteModal(p.id); setNoteText(p.notes); }} style={{ padding:"8px 16px", borderRadius:8, border:"1.5px solid "+C.teal, background:"white", color:C.teal, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                    📝 Add Note
                  </button>
                  {p.status==="pending" && (
                    <button onClick={()=>markReviewed(p.id)} style={{ padding:"8px 16px", borderRadius:8, border:"none", background:C.green, color:"white", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                      ✅ Mark Reviewed
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Note modal */}
      {noteModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
          <div style={{ background:C.white, borderRadius:16, padding:32, width:420 }}>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>📝 Add Case Note</div>
            <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} rows={4} placeholder="Enter clinical notes, referral details, treatment plan..."
              style={{ width:"100%", padding:12, borderRadius:10, border:"1.5px solid "+C.border, fontSize:14, fontFamily:"inherit", resize:"vertical", outline:"none", boxSizing:"border-box" }} />
            <div style={{ display:"flex", gap:10, marginTop:16, justifyContent:"flex-end" }}>
              <button onClick={()=>setNoteModal(null)} style={{ padding:"9px 20px", borderRadius:8, border:"1.5px solid "+C.border, background:C.white, fontSize:13, cursor:"pointer" }}>Cancel</button>
              <button onClick={()=>saveNote(noteModal)} style={{ padding:"9px 20px", borderRadius:8, border:"none", background:C.teal, color:"white", fontSize:13, fontWeight:700, cursor:"pointer" }}>Save Note</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}