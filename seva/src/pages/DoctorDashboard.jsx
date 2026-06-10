

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { patientsAPI, appointmentsAPI, getUser, clearAuth } from "../services/api";
import AIAssistant from "../components/AIAssistant";
const C = {
  navy:"#1a3a5c", navyDark:"#0d2a45", navyPale:"#e8eef5",
  saffron:"#E8621A", saffronLight:"#f97316", saffronPale:"#FDF0E8",
  teal:"#0D6E6E", tealPale:"#E8F5F5",
  cream:"#F4F0EB", charcoal:"#1C1C1C", muted:"#64748b", border:"#e8edf3",
  red:"#dc2626", redPale:"#fee2e2",
  yellow:"#d97706", yellowPale:"#fef3c7",
  green:"#16a34a", greenPale:"#dcfce7",
  purple:"#7c3aed", purplePale:"#f3f0ff",
  white:"#ffffff", bg:"#f0f4f8",
};

const riskColor = r => ({
  HIGH:   {bg:C.redPale,    text:C.red,    border:C.red},
  MEDIUM: {bg:C.yellowPale, text:C.yellow, border:C.yellow},
  LOW:    {bg:C.greenPale,  text:C.green,  border:C.green},
}[r] || {bg:C.navyPale, text:C.navy, border:C.navy});

const statusColor = s => ({
  pending:   {bg:C.yellowPale, text:C.yellow},
  confirmed: {bg:C.greenPale,  text:C.green},
  completed: {bg:C.navyPale,   text:C.navy},
  cancelled: {bg:C.redPale,    text:C.red},
}[s] || {bg:C.navyPale, text:C.navy});

const Btn = ({onClick,color,bg,border,children,style={}}) => (
  <button onClick={onClick} style={{padding:"6px 13px",borderRadius:7,border:`1.5px solid ${border||color}`,background:bg||"white",color,fontSize:11,fontWeight:600,cursor:"pointer",...style}}>
    {children}
  </button>
);

export default function DoctorDashboard({onLogout}) {
  const navigate = useNavigate();
  const user = getUser();

  const [patients,      setPatients]      = useState([]);
  const [appointments,  setAppointments]  = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [activeTab,     setActiveTab]     = useState("high");
  const [activeSection, setActiveSection] = useState("patients");
  const [search,        setSearch]        = useState("");
  const [villageFilter, setVillageFilter] = useState("");
  const [riskFilter,    setRiskFilter]    = useState("");
  const [noteModal,     setNoteModal]     = useState(null);
  const [noteText,      setNoteText]      = useState("");
  const [saving,        setSaving]        = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);
  const [lastUpdated,   setLastUpdated]   = useState(null);
  const [aptTab,        setAptTab]        = useState("pending");

  const fetchAll = useCallback(async (silent=false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [pts, apts] = await Promise.all([
        patientsAPI.getAll(),
        appointmentsAPI.getAll(),
      ]);
      setPatients(pts);
      setAppointments(apts);
      setLastUpdated(new Date());
    } catch(err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(() => fetchAll(true), 30000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  const saveNote = async id => {
    setSaving(true);
    try {
      const updated = await patientsAPI.update(id, {notes:noteText, status:"reviewed"});
      setPatients(prev => prev.map(p => p.id===id ? {...p,...updated} : p));
      setNoteModal(null); setNoteText("");
    } catch(err) { alert("Failed: "+err.message); }
    finally { setSaving(false); }
  };

  const markReviewed = async id => {
    try {
      const updated = await patientsAPI.update(id, {status:"reviewed"});
      setPatients(prev => prev.map(p => p.id===id ? {...p,...updated} : p));
    } catch(err) { alert("Failed: "+err.message); }
  };

  const updateAptStatus = async (id, status) => {
    try {
      const updated = await appointmentsAPI.update(id, {status});
      setAppointments(prev => prev.map(a => a.id===id ? {...a,...updated} : a));
    } catch(err) { alert("Failed: "+err.message); }
  };

  const handleLogout = () => { clearAuth(); onLogout?.(); };

  // ── Derived ────────────────────────────────────────────────
  const villages  = [...new Set(patients.map(p=>p.village).filter(Boolean))];
  const highRisk  = patients.filter(p=>p.risk==="HIGH");
  const pending   = patients.filter(p=>p.status==="pending");
  const reviewed  = patients.filter(p=>p.status==="reviewed");
  const medium    = patients.filter(p=>p.risk==="MEDIUM");
  const low       = patients.filter(p=>p.risk==="LOW");
  const alerts    = patients.filter(p=>p.risk==="HIGH"&&p.status==="pending");

  const aptPending   = appointments.filter(a=>a.status==="pending");
  const aptConfirmed = appointments.filter(a=>a.status==="confirmed");
  const aptToday     = appointments.filter(a=>a.date===new Date().toISOString().slice(0,10));

  const shownApts = (aptTab==="pending"?aptPending:aptTab==="confirmed"?aptConfirmed:aptTab==="today"?aptToday:appointments)
    .sort((a,b)=>new Date(a.date+" "+a.time)-new Date(b.date+" "+b.time));

  const tabMap = {high:highRisk, pending, reviewed, all:patients};
  const shown = (tabMap[activeTab]||patients)
    .filter(p=>!search||(p.name||"").toLowerCase().includes(search.toLowerCase())||(p.village||"").toLowerCase().includes(search.toLowerCase()))
    .filter(p=>!villageFilter||p.village===villageFilter)
    .filter(p=>!riskFilter||p.risk===riskFilter);

  const maxRisk = Math.max(highRisk.length, medium.length, low.length, 1);

  if (loading) return (
    <div style={{minHeight:"100vh",background:C.cream,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:52,marginBottom:16,animation:"spin 3s linear infinite",display:"inline-block"}}>🌸</div>
        <div style={{fontSize:15,color:C.muted,fontWeight:600}}>Loading dashboard…</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{minHeight:"100vh",background:C.cream,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:12}}>⚠️</div>
        <div style={{fontSize:14,color:C.red,marginBottom:16}}>{error}</div>
        <button onClick={()=>fetchAll()} style={{background:C.navy,color:"white",border:"none",borderRadius:8,padding:"10px 24px",cursor:"pointer",fontWeight:700}}>Retry</button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>

      {/* ── Topbar ── */}
      <div style={{background:`linear-gradient(135deg,${C.navy} 0%,${C.navyDark} 100%)`,padding:"0 28px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50,boxShadow:"0 2px 12px rgba(0,0,0,0.15)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:22}}>🌸</span>
          <span style={{fontFamily:"Georgia,serif",fontSize:18,fontWeight:700,color:"white"}}>Matri<span style={{color:C.saffron}}>seva</span></span>
          <span style={{background:"rgba(255,255,255,0.15)",color:"white",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20,letterSpacing:".5px"}}>DOCTOR</span>
          <span style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"rgba(255,255,255,0.65)",marginLeft:4}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:C.green,display:"inline-block",animation:"pulse 1.5s infinite"}}></span>
            Live
          </span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {/* Section switcher */}
          {["patients","appointments"].map(s=>(
            <button key={s} onClick={()=>setActiveSection(s)}
              style={{padding:"6px 16px",borderRadius:8,border:`1.5px solid ${activeSection===s?"rgba(255,255,255,0.6)":"rgba(255,255,255,0.2)"}`,background:activeSection===s?"rgba(255,255,255,0.2)":"transparent",color:"white",fontSize:12,fontWeight:600,cursor:"pointer",textTransform:"capitalize"}}>
              {s==="patients"?"👥 Patients":"📅 Appointments"}{s==="appointments"&&aptPending.length>0&&<span style={{marginLeft:5,background:C.saffron,borderRadius:20,padding:"1px 6px",fontSize:10}}>{aptPending.length}</span>}
            </button>
          ))}
          <div style={{width:1,height:20,background:"rgba(255,255,255,0.2)"}}></div>
          {lastUpdated&&<span style={{fontSize:10,color:"rgba(255,255,255,0.45)"}}>Updated {lastUpdated.toLocaleTimeString()}</span>}
          <button onClick={()=>fetchAll(true)} style={{background:"rgba(255,255,255,0.1)",color:"white",border:"1px solid rgba(255,255,255,0.2)",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
            <span style={{display:"inline-block",animation:refreshing?"spin 1s linear infinite":"none"}}>🔄</span>
          </button>
          <span style={{fontSize:13,color:"rgba(255,255,255,0.9)",fontWeight:500}}>👨‍⚕️ {user?.name||"Doctor"}</span>
          <button onClick={handleLogout} style={{background:"rgba(220,38,38,0.25)",color:"white",border:"1px solid rgba(220,38,38,0.4)",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Logout</button>
        </div>
      </div>

      <div style={{maxWidth:1200,margin:"0 auto",padding:"22px 20px"}}>

        {/* ── Stats ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
          {[
            {icon:"🔴",label:"High Risk",      value:highRisk.length,  sub:highRisk.length>0?"Needs attention":"All clear",  color:C.red,    bg:C.redPale,    tab:"high",     section:"patients"},
            {icon:"⏳",label:"Pending Review", value:pending.length,   sub:pending.length+" awaiting",                      color:C.yellow, bg:C.yellowPale, tab:"pending",  section:"patients"},
            {icon:"✅",label:"Reviewed",       value:reviewed.length,  sub:"Completed",                                     color:C.green,  bg:C.greenPale,  tab:"reviewed", section:"patients"},
            {icon:"📅",label:"Appointments",   value:aptPending.length,sub:aptPending.length+" pending",                    color:C.saffron,bg:C.saffronPale,tab:"pending",  section:"appointments"},
            {icon:"👥",label:"Total Patients", value:patients.length,  sub:villages.length+" villages",                     color:C.navy,   bg:C.navyPale,   tab:"all",      section:"patients"},
          ].map(s=>(
            <div key={s.label} onClick={()=>{setActiveSection(s.section);if(s.section==="patients")setActiveTab(s.tab);else setAptTab(s.tab);}}
              style={{background:C.white,borderRadius:14,padding:"16px 18px",border:`1.5px solid ${C.border}`,cursor:"pointer",position:"relative",overflow:"hidden",transition:"transform .15s,box-shadow .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.08)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:s.color,borderRadius:"14px 14px 0 0"}}></div>
              <div style={{width:36,height:36,borderRadius:9,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,marginBottom:10}}>{s.icon}</div>
              <div style={{fontSize:26,fontWeight:800,color:s.color,fontFamily:"Georgia,serif",lineHeight:1}}>{s.value}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:3,fontWeight:500}}>{s.label}</div>
              <div style={{fontSize:10,color:s.color,marginTop:4,fontWeight:600}}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════ */}
        {/* PATIENTS SECTION */}
        {/* ════════════════════════════════════════════════════ */}
        {activeSection==="patients" && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:16}}>
            <div style={{background:C.white,borderRadius:14,border:`1.5px solid ${C.border}`,overflow:"hidden"}}>

              {/* Tabs */}
              <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                <span style={{fontWeight:700,fontSize:14,color:C.charcoal}}>Patient List</span>
                <div style={{display:"flex",gap:6}}>
                  {[["high","🔴 High Risk"],["pending","⏳ Pending"],["reviewed","✅ Reviewed"],["all","All"]].map(([id,label])=>(
                    <button key={id} onClick={()=>setActiveTab(id)}
                      style={{padding:"6px 13px",borderRadius:8,border:`1.5px solid ${activeTab===id?C.navy:C.border}`,background:activeTab===id?C.navy:C.white,color:activeTab===id?"white":C.muted,fontSize:11,fontWeight:600,cursor:"pointer",transition:"all .15s"}}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div style={{padding:"10px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:8}}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or village…"
                  style={{flex:1,padding:"7px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,outline:"none",color:C.charcoal,fontFamily:"inherit"}}
                  onFocus={e=>e.target.style.borderColor=C.navy} onBlur={e=>e.target.style.borderColor=C.border}/>
                <select value={villageFilter} onChange={e=>setVillageFilter(e.target.value)}
                  style={{padding:"7px 10px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,color:C.muted,background:C.white,cursor:"pointer",outline:"none"}}>
                  <option value="">All Villages</option>
                  {villages.map(v=><option key={v} value={v}>{v}</option>)}
                </select>
                <select value={riskFilter} onChange={e=>setRiskFilter(e.target.value)}
                  style={{padding:"7px 10px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,color:C.muted,background:C.white,cursor:"pointer",outline:"none"}}>
                  <option value="">All Risk</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {/* Patient cards */}
              <div style={{padding:12,maxHeight:"calc(100vh - 320px)",overflowY:"auto"}}>
                {shown.length===0?(
                  <div style={{padding:"40px",textAlign:"center",color:C.muted,fontSize:13}}>No patients found</div>
                ):shown.map(p=>{
                  const rc=riskColor(p.risk);
                  const flags=p.risk_flags||p.riskFlags||[];
                  const hbOk=Number(p.hb)>=10, bpOk=Number(p.bp_sys)<140;
                  const initials=(p.name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
                  return(
                    <div key={p.id}
                      style={{background:"#f8fafc",borderRadius:12,padding:"14px 16px",marginBottom:10,border:`1.5px solid ${C.border}`,borderLeft:`3px solid ${rc.border}`,transition:"all .15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.navy;e.currentTarget.style.background=C.navyPale;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.borderLeftColor=rc.border;e.currentTarget.style.background="#f8fafc";}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                        <div style={{width:38,height:38,borderRadius:"50%",background:`linear-gradient(135deg,${C.navy},${C.teal})`,color:"white",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{initials}</div>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                            <span style={{fontWeight:700,fontSize:14,color:C.charcoal}}>{p.name}</span>
                            <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:rc.bg,color:rc.text}}>{p.risk||"—"}</span>
                            <span style={{marginLeft:"auto",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:p.status==="reviewed"?C.greenPale:C.yellowPale,color:p.status==="reviewed"?C.green:C.yellow}}>
                              {p.status==="reviewed"?"✅ Reviewed":"⏳ Pending"}
                            </span>
                          </div>
                          <div style={{fontSize:11,color:C.muted,marginTop:2}}>Age {p.age||"—"} · {p.weeks||"—"} wks · {p.village||"—"} · ASHA: {p.asha_name||"—"}</div>
                        </div>
                      </div>
                      {flags.length>0&&(
                        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
                          {flags.map(f=><span key={f} style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:C.redPale,color:C.red,fontWeight:600}}>⚠ {f}</span>)}
                        </div>
                      )}
                      <div style={{display:"flex",gap:16,fontSize:12,marginBottom:10,flexWrap:"wrap"}}>
                        <span>Hb: <b style={{color:hbOk?C.green:C.red}}>{p.hb||"—"} g/dL</b></span>
                        <span>BP: <b style={{color:bpOk?C.green:C.red}}>{p.bp_sys||"—"}/{p.bp_dia||"—"} mmHg</b></span>
                        {p.risk_score&&<span style={{color:C.muted}}>Score: <b style={{color:C.charcoal}}>{p.risk_score}</b></span>}
                      </div>
                      {p.notes&&(
                        <div style={{fontSize:12,color:C.teal,background:C.tealPale,borderRadius:7,padding:"6px 10px",marginBottom:10,lineHeight:1.4}}>📋 {p.notes}</div>
                      )}
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        <Btn onClick={()=>navigate("/result",{state:{patient:p}})} color="white" bg={C.navy} border={C.navy}>View Report →</Btn>
                        <Btn onClick={()=>{setNoteModal(p.id);setNoteText(p.notes||"");}} color={C.teal} border={C.teal}>📝 Note</Btn>
                        {p.status==="pending"&&<Btn onClick={()=>markReviewed(p.id)} color="white" bg={C.green} border={C.green}>✅ Mark Reviewed</Btn>}
                        <Btn onClick={()=>navigate("/result",{state:{patient:p,runML:true}})} color={C.purple} border={C.purple}>🤖 Predict Risk</Btn>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right sidebar */}
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {/* Upcoming appointments preview */}
              <div style={{background:C.white,borderRadius:14,border:`1.5px solid ${C.border}`,overflow:"hidden"}}>
                <div style={{padding:"13px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontWeight:700,fontSize:13,color:C.charcoal}}>📅 Upcoming Appointments</span>
                  <button onClick={()=>setActiveSection("appointments")} style={{fontSize:11,color:C.saffron,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>View All →</button>
                </div>
                {appointments.filter(a=>a.status!=="cancelled"&&a.status!=="completed").slice(0,4).length===0?(
                  <div style={{padding:"20px",textAlign:"center",color:C.muted,fontSize:12}}>No upcoming appointments</div>
                ):appointments.filter(a=>a.status!=="cancelled"&&a.status!=="completed").slice(0,4).map((a,i,arr)=>(
                  <div key={a.id} style={{padding:"11px 16px",borderBottom:i<arr.length-1?`1px solid #f8fafc`:"none",display:"flex",gap:10,alignItems:"center"}}>
                    <div style={{background:C.saffronPale,borderRadius:8,padding:"4px 8px",textAlign:"center",flexShrink:0}}>
                      <div style={{fontSize:10,fontWeight:700,color:C.saffron}}>{a.time||"—"}</div>
                      <div style={{fontSize:9,color:C.muted}}>{a.date?new Date(a.date).toLocaleDateString("en-IN",{day:"numeric",month:"short"}):""}</div>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:C.charcoal,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.patient_name||"Patient"}</div>
                      <div style={{fontSize:11,color:C.muted}}>{a.type||"Checkup"} · {a.village||""}</div>
                    </div>
                    <span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:20,background:statusColor(a.status).bg,color:statusColor(a.status).text,flexShrink:0}}>{a.status}</span>
                  </div>
                ))}
              </div>

              {/* Alerts */}
              <div style={{background:C.white,borderRadius:14,border:`1.5px solid ${C.border}`,overflow:"hidden"}}>
                <div style={{padding:"13px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontWeight:700,fontSize:13,color:C.charcoal}}>🚨 Critical Alerts</span>
                  <span style={{background:C.redPale,color:C.red,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20}}>{alerts.length}</span>
                </div>
                {alerts.length===0?(
                  <div style={{padding:"20px",textAlign:"center",color:C.muted,fontSize:12}}>No critical alerts ✓</div>
                ):alerts.slice(0,4).map(p=>(
                  <div key={p.id} style={{padding:"10px 16px",borderBottom:`1px solid #f8fafc`,display:"flex",gap:10,alignItems:"flex-start"}}>
                    <span style={{fontSize:16,flexShrink:0}}>🚨</span>
                    <div>
                      <div style={{fontSize:12,color:C.charcoal,fontWeight:600}}>{p.name}</div>
                      <div style={{fontSize:11,color:C.red,marginTop:1}}>{(p.risk_flags||[]).join(", ")||"High risk"}</div>
                      <div style={{fontSize:10,color:C.muted,marginTop:1}}>{p.village} · {p.weeks||"—"} weeks</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Risk Chart */}
              <div style={{background:C.white,borderRadius:14,border:`1.5px solid ${C.border}`,overflow:"hidden"}}>
                <div style={{padding:"13px 16px",borderBottom:`1px solid ${C.border}`,fontWeight:700,fontSize:13,color:C.charcoal}}>📊 Risk Distribution</div>
                <div style={{padding:"16px 20px"}}>
                  <div style={{display:"flex",alignItems:"flex-end",gap:8,height:90}}>
                    {[{l:"High",n:highRisk.length,c:C.red,bg:C.redPale},{l:"Medium",n:medium.length,c:C.yellow,bg:C.yellowPale},{l:"Low",n:low.length,c:C.green,bg:C.greenPale}].map(b=>(
                      <div key={b.l} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                        <span style={{fontSize:11,fontWeight:700,color:b.c}}>{b.n}</span>
                        <div style={{width:"100%",height:Math.round((b.n/maxRisk)*80)+"px",minHeight:4,background:b.bg,border:`2px solid ${b.c}`,borderRadius:"4px 4px 0 0",transition:"height .4s"}}></div>
                        <span style={{fontSize:10,color:C.muted}}>{b.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════ */}
        {/* APPOINTMENTS SECTION */}
        {/* ════════════════════════════════════════════════════ */}
        {activeSection==="appointments" && (
          <div style={{background:C.white,borderRadius:14,border:`1.5px solid ${C.border}`,overflow:"hidden"}}>
            <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <span style={{fontWeight:700,fontSize:15,color:C.charcoal}}>📅 Appointments</span>
              <div style={{display:"flex",gap:6}}>
                {[["today","📆 Today"],["pending","⏳ Pending"],["confirmed","✅ Confirmed"],["all","All"]].map(([id,label])=>(
                  <button key={id} onClick={()=>setAptTab(id)}
                    style={{padding:"7px 14px",borderRadius:8,border:`1.5px solid ${aptTab===id?C.saffron:C.border}`,background:aptTab===id?C.saffron:C.white,color:aptTab===id?"white":C.muted,fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s"}}>
                    {label}{id==="pending"&&aptPending.length>0&&<span style={{marginLeft:5,background:"rgba(255,255,255,0.3)",borderRadius:20,padding:"0px 5px",fontSize:10}}>{aptPending.length}</span>}
                  </button>
                ))}
              </div>
            </div>

            {shownApts.length===0?(
              <div style={{padding:"60px",textAlign:"center",color:C.muted}}>
                <div style={{fontSize:36,marginBottom:12}}>📅</div>
                <div style={{fontSize:14,fontWeight:600}}>No appointments found</div>
                <div style={{fontSize:12,marginTop:6}}>Appointments scheduled by ASHA workers will appear here</div>
              </div>
            ):(
              <div style={{padding:16,display:"flex",flexDirection:"column",gap:12}}>
                {shownApts.map(a=>{
                  const sc=statusColor(a.status);
                  const isToday=a.date===new Date().toISOString().slice(0,10);
                  return(
                    <div key={a.id} style={{background:isToday?C.saffronPale:"#f8fafc",borderRadius:12,padding:"16px 20px",border:`1.5px solid ${isToday?C.saffron:C.border}`,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                      {/* Date badge */}
                      <div style={{background:isToday?C.saffron:C.navy,color:"white",borderRadius:10,padding:"10px 14px",textAlign:"center",flexShrink:0,minWidth:60}}>
                        <div style={{fontSize:18,fontWeight:800,lineHeight:1}}>{a.date?new Date(a.date).getDate():"—"}</div>
                        <div style={{fontSize:10,opacity:.85}}>{a.date?new Date(a.date).toLocaleString("en-IN",{month:"short"}):""}</div>
                      </div>
                      {/* Info */}
                      <div style={{flex:1,minWidth:180}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                          <span style={{fontWeight:700,fontSize:15,color:C.charcoal}}>{a.patient_name||"Patient"}</span>
                          {isToday&&<span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:C.saffron,color:"white"}}>TODAY</span>}
                          <span style={{fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:20,background:sc.bg,color:sc.text,textTransform:"capitalize"}}>{a.status}</span>
                        </div>
                        <div style={{fontSize:12,color:C.muted,display:"flex",gap:12,flexWrap:"wrap"}}>
                          <span>🕐 {a.time||"—"}</span>
                          <span>📍 {a.village||"—"}</span>
                          <span>🏥 {a.type||"Checkup"}</span>
                          {a.asha_name&&<span>👩‍⚕️ ASHA: {a.asha_name}</span>}
                        </div>
                        {a.notes&&<div style={{fontSize:12,color:C.teal,background:C.tealPale,borderRadius:6,padding:"5px 9px",marginTop:8}}>📋 {a.notes}</div>}
                      </div>
                      {/* Actions */}
                      <div style={{display:"flex",gap:8,flexWrap:"wrap",flexShrink:0}}>
                        {a.status==="pending"&&(
                          <>
                            <Btn onClick={()=>updateAptStatus(a.id,"confirmed")} color="white" bg={C.green} border={C.green}>✅ Confirm</Btn>
                            <Btn onClick={()=>updateAptStatus(a.id,"cancelled")} color={C.red} border={C.red}>✗ Cancel</Btn>
                          </>
                        )}
                        {a.status==="confirmed"&&(
                          <Btn onClick={()=>updateAptStatus(a.id,"completed")} color="white" bg={C.navy} border={C.navy}>Mark Complete</Btn>
                        )}
                        {a.patient_id&&(
                          <Btn onClick={()=>navigate("/result",{state:{patientId:a.patient_id}})} color={C.muted} border={C.border}>View Patient →</Btn>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Note Modal ── */}
      {noteModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{background:C.white,borderRadius:16,padding:28,width:440,maxWidth:"90vw",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <div style={{width:36,height:36,borderRadius:10,background:C.tealPale,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📝</div>
              <span style={{fontWeight:700,fontSize:16,color:C.charcoal}}>Add Clinical Note</span>
            </div>
            <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} rows={4}
              placeholder="Enter clinical notes, referral details, treatment plan..."
              style={{width:"100%",padding:12,borderRadius:10,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",resize:"vertical",outline:"none",color:C.charcoal,boxSizing:"border-box"}}
              onFocus={e=>e.target.style.borderColor=C.teal} onBlur={e=>e.target.style.borderColor=C.border}/>
            <div style={{display:"flex",gap:10,marginTop:16,justifyContent:"flex-end"}}>
              <button onClick={()=>setNoteModal(null)} style={{padding:"9px 20px",borderRadius:8,border:`1.5px solid ${C.border}`,background:C.white,fontSize:13,cursor:"pointer",color:C.muted}}>Cancel</button>
              <button onClick={()=>saveNote(noteModal)} disabled={saving} style={{padding:"9px 20px",borderRadius:8,border:"none",background:saving?C.muted:C.teal,color:"white",fontSize:13,fontWeight:700,cursor:saving?"not-allowed":"pointer"}}>
                {saving?"Saving…":"Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.3)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#f1f5f9} ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
      `}</style>
      <AIAssistant userRole="doctor" />
    </div>
  );
}
