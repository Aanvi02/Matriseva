import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  saffron:"#E8621A", saffronPale:"#FDF0E8", saffronDark:"#C04B2D",
  teal:"#0D6E6E", tealPale:"#E8F5F5", tealDark:"#094f4f",
  cream:"#F4F0EB", charcoal:"#1C1C1C", muted:"#6B6260", border:"#E0D8D0",
  red:"#DC2626", redPale:"#FEE2E2", yellow:"#D97706", yellowPale:"#FEF3C7",
  green:"#16A34A", greenPale:"#DCFCE7", white:"#FFFFFF",
  navy:"#1E3A5F", navyPale:"#EFF6FF", purple:"#7C3AED", purplePale:"#F5F3FF",
};

// ── Storage helpers ──────────────────────────────────────────
const getUser        = () => JSON.parse(localStorage.getItem("ms_currentUser") || "null");
const getPatients    = () => JSON.parse(localStorage.getItem("ms_patients") || "[]");
const savePatients   = (list) => localStorage.setItem("ms_patients", JSON.stringify(list));
const getMyPatients  = (email) => getPatients().filter(p => p.ashaEmail === email);
const getOfflineQ    = () => JSON.parse(localStorage.getItem("ms_offline_q") || "[]");
const saveOfflineQ   = (q) => localStorage.setItem("ms_offline_q", JSON.stringify(q));

// ── Risk Engine ──────────────────────────────────────────────
function computeRisk(d) {
  let score = 0; const flags = [];
  const bp=Number(d.bpSys), bpD=Number(d.bpDia), hb=Number(d.hb), age=Number(d.age);
  if(bp>=160||bpD>=110){score+=40;flags.push("Severe Hypertension");}
  else if(bp>=140||bpD>=90){score+=25;flags.push("High BP");}
  if(hb>0&&hb<7){score+=35;flags.push("Severe Anemia");}
  else if(hb>0&&hb<9){score+=20;flags.push("Moderate Anemia");}
  if(age>0&&age<18){score+=20;flags.push("Teenage Pregnancy");}
  else if(age>35){score+=15;flags.push("Advanced Age");}
  if(d.symptoms?.includes("bleeding")){score+=35;flags.push("Bleeding");}
  if(d.symptoms?.includes("headache")){score+=20;flags.push("Severe Headache");}
  if(d.symptoms?.includes("vision")){score+=25;flags.push("Blurred Vision");}
  if(d.symptoms?.includes("swelling")){score+=15;flags.push("Swelling");}
  if(d.symptoms?.includes("fetal")){score+=30;flags.push("Reduced Fetal Movement");}
  if(d.hiv==="Positive"){score+=30;flags.push("HIV+");}
  if(d.pregnancyType==="Twin"||d.pregnancyType==="Triplet"){score+=20;flags.push("Multiple Pregnancy");}
  return {level:score>=45?"HIGH":score>=20?"MEDIUM":"LOW", score:Math.min(score,100), flags};
}

const RISK = {
  HIGH:   {color:C.red,   bg:C.redPale,    emoji:"🔴",label:"High Risk",  short:"HIGH"},
  MEDIUM: {color:C.yellow,bg:C.yellowPale, emoji:"🟡",label:"Moderate",   short:"MOD"},
  LOW:    {color:C.green, bg:C.greenPale,  emoji:"🟢",label:"Low Risk",   short:"LOW"},
};

const SYMPTOMS_LIST = [
  {id:"bleeding", label:"Vaginal Bleeding",     w:35},
  {id:"headache", label:"Severe Headache",       w:20},
  {id:"vision",   label:"Blurred Vision",        w:25},
  {id:"swelling", label:"Swelling (face/hands)", w:15},
  {id:"pain",     label:"Abdominal Pain",        w:25},
  {id:"fetal",    label:"Reduced Fetal Movement",w:30},
  {id:"vomiting", label:"Severe Vomiting",       w:10},
  {id:"fever",    label:"High Fever",            w:15},
];

// ── ANC Schedule logic ───────────────────────────────────────
function getANCStatus(p) {
  const regDate  = p.registeredAt ? new Date(p.registeredAt) : null;
  const daysSinceReg = regDate ? Math.floor((Date.now()-regDate)/(86400000)) : 999;
  const lastVisitDate = p.visits?.[0]?.date ? new Date(p.visits[0].date) : regDate;
  const daysSinceVisit = lastVisitDate ? Math.floor((Date.now()-lastVisitDate)/(86400000)) : 999;
  const weeks = Number(p.weeks)||20;
  let visitIntervalDays = weeks<28 ? 28 : weeks<36 ? 14 : 7;
  const overdue = daysSinceVisit > visitIntervalDays;
  const daysUntilNext = Math.max(0, visitIntervalDays - daysSinceVisit);
  return { overdue, daysUntilNext, daysSinceVisit, visitIntervalDays };
}

// ── Vaccines due logic ────────────────────────────────────────
function getVaccinesDue(p) {
  const weeks = Number(p.weeks)||0;
  const due = [];
  const existing = p.vaccines||[];
  const has = (name) => existing.some(v=>v.name===name&&v.done);
  if(weeks>=16&&!has("TT1"))  due.push({name:"TT1",  note:"Tetanus (1st dose)"});
  if(weeks>=20&&!has("TT2"))  due.push({name:"TT2",  note:"Tetanus (2nd dose)"});
  if(weeks>=14&&!has("IFA"))  due.push({name:"IFA",  note:"Iron & Folic Acid"});
  if(weeks>=28&&!has("TDap")) due.push({name:"TDap", note:"Whooping cough booster"});
  return due;
}

// ── Language strings ─────────────────────────────────────────
const LANG = {
  en: {
    dashboard:"Dashboard", patients:"Patients", register:"Register", analytics:"Analytics", resources:"Resources",
    highRisk:"High Risk", moderate:"Moderate", lowRisk:"Low Risk", total:"Total",
    searchPlaceholder:"🔍 Search by name or village...",
    recordVitals:"Record Vitals", referDoctor:"Refer to Doctor", emergency:"Emergency", callPatient:"Call Patient",
    saveSync:"Save & Sync", offlineSaved:"Saved offline — will sync",
  },
  hi: {
    dashboard:"डैशबोर्ड", patients:"मरीज़", register:"पंजीकरण", analytics:"विश्लेषण", resources:"संसाधन",
    highRisk:"उच्च जोखिम", moderate:"मध्यम", lowRisk:"कम जोखिम", total:"कुल",
    searchPlaceholder:"🔍 नाम या गांव से खोजें...",
    recordVitals:"विटल्स दर्ज करें", referDoctor:"डॉक्टर को रेफर", emergency:"आपातकाल", callPatient:"कॉल करें",
    saveSync:"सेव करें", offlineSaved:"ऑफलाइन सेव — बाद में सिंक होगा",
  },
  ur: {
    dashboard:"ڈیش بورڈ", patients:"مریض", register:"رجسٹریشن", analytics:"تجزیہ", resources:"وسائل",
    highRisk:"زیادہ خطرہ", moderate:"اعتدال", lowRisk:"کم خطرہ", total:"کل",
    searchPlaceholder:"🔍 نام یا گاؤں سے تلاش کریں...",
    recordVitals:"وٹلز درج کریں", referDoctor:"ڈاکٹر کو ریفر", emergency:"ہنگامی", callPatient:"کال کریں",
    saveSync:"محفوظ کریں", offlineSaved:"آف لائن محفوظ",
  },
};

// ── QR Code generator (SVG-based) ────────────────────────────
function QRPlaceholder({ patient }) {
  const data = `MATRISEVA|${patient.id}|${patient.name}|${patient.risk}|${patient.riskFlags?.join(",")||"none"}|${new Date().toLocaleDateString("en-IN")}`;
  const hash  = [...data].reduce((a,c)=>a+c.charCodeAt(0),0) % 64;
  const cells = Array.from({length:64},(_,i)=>(hash+i*7+i%3)%3===0);
  return (
    <div style={{background:C.white,borderRadius:10,padding:12,display:"inline-block"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(8,8px)",gap:1,marginBottom:6}}>
        {cells.map((c,i)=><div key={i} style={{width:8,height:8,background:c?C.charcoal:C.white,borderRadius:1}}/>)}
      </div>
      <div style={{fontSize:9,color:C.muted,textAlign:"center",lineHeight:1.4}}>{patient.id}<br/>Scan at hospital</div>
    </div>
  );
}

// ── Mini Line Chart ───────────────────────────────────────────
function TrendChart({ visits, field, label, color, dangerLine }) {
  const vals = visits.slice().reverse().map(v => field==="bp" ? Number(v.bp?.split("/")?.[0])||0 : Number(v[field])||0).filter(v=>v>0);
  if(vals.length < 2) return <div style={{fontSize:12,color:C.muted,textAlign:"center",padding:"12px 0"}}>Need 2+ visits for trend</div>;
  const mn=Math.min(...vals)-5, mx=Math.max(...vals,dangerLine||0)+5, range=mx-mn||1;
  const W=240, H=60;
  const points = vals.map((v,i)=>({ x:i*(W/(vals.length-1)), y:H-((v-mn)/range*H) }));
  const d = points.map((p,i)=>`${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <div>
      <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{label} trend (last {vals.length} visits)</div>
      <svg width={W} height={H+10} style={{overflow:"visible"}}>
        {dangerLine && <line x1={0} y1={H-((dangerLine-mn)/range*H)} x2={W} y2={H-((dangerLine-mn)/range*H)} stroke={C.red} strokeWidth={1} strokeDasharray="4,3" opacity={0.6}/>}
        <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round"/>
        {points.map((p,i)=>(
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill={color}/>
            <text x={p.x} y={H+12} textAnchor="middle" fontSize={8} fill={C.muted}>{vals[i]}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 1 — DASHBOARD
// ════════════════════════════════════════════════════════════
function DashboardTab({patients, user, onNavigate, lang}) {
  const T = LANG[lang];
  const high   = patients.filter(p=>p.risk==="HIGH");
  const medium = patients.filter(p=>p.risk==="MEDIUM");
  const low    = patients.filter(p=>p.risk==="LOW");
  const overdueVisit = patients.filter(p=>getANCStatus(p).overdue);
  const vaccinesDue  = patients.filter(p=>getVaccinesDue(p).length>0);
  const offlineQ     = getOfflineQ();

  // Smart scheduling: prioritized visit list
  const smartSchedule = [...patients].map(p => {
    const anc  = getANCStatus(p);
    const vax  = getVaccinesDue(p);
    const r    = RISK[p.risk] || {color:C.muted};
    let priority = 0;
    if(p.risk==="HIGH")             priority += 100;
    else if(p.risk==="MEDIUM")      priority += 50;
    if(anc.overdue)                 priority += 40;
    else if(anc.daysUntilNext <= 3) priority += 20;
    if(vax.length > 0)              priority += 10;
    return {...p, _priority:priority, _anc:anc, _vax:vax, _r:r};
  }).sort((a,b)=>b._priority-a._priority).slice(0,6);

  return (
    <div>
      {/* Smart Alerts row */}
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:18}}>
        {high.length>0 && (
          <div style={{background:C.redPale,border:`2px solid ${C.red}`,borderRadius:13,padding:"13px 18px",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:24}}>🚨</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:800,color:C.red}}>{high.length} HIGH RISK — {high.map(p=>p.name).join(", ")}</div>
              <div style={{fontSize:11,color:C.muted}}>Immediate attention required</div>
            </div>
            <button onClick={()=>onNavigate("patients","HIGH")} style={{background:C.red,color:"white",border:"none",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>View →</button>
          </div>
        )}
        {overdueVisit.length>0 && (
          <div style={{background:C.yellowPale,border:`1.5px solid ${C.yellow}`,borderRadius:13,padding:"11px 18px",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:20}}>📅</span>
            <div style={{flex:1,fontSize:13,color:C.yellow,fontWeight:600}}>{overdueVisit.length} patients overdue for ANC visit: {overdueVisit.slice(0,3).map(p=>p.name).join(", ")}{overdueVisit.length>3?"...":""}</div>
          </div>
        )}
        {vaccinesDue.length>0 && (
          <div style={{background:C.tealPale,border:`1.5px solid ${C.teal}`,borderRadius:13,padding:"11px 18px",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:20}}>💉</span>
            <div style={{flex:1,fontSize:13,color:C.teal,fontWeight:600}}>{vaccinesDue.length} patients have pending vaccines</div>
          </div>
        )}
        {offlineQ.length>0 && (
          <div style={{background:"#F0FDF4",border:`1.5px solid ${C.green}`,borderRadius:13,padding:"11px 18px",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:20}}>📶</span>
            <div style={{flex:1,fontSize:13,color:C.green,fontWeight:600}}>{offlineQ.length} offline record(s) pending sync</div>
            <button onClick={()=>{saveOfflineQ([]);alert("Synced!");}} style={{background:C.green,color:"white",border:"none",borderRadius:7,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Sync Now</button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:18}}>
        {[
          {label:T.total,        value:patients.length, color:C.teal,   bg:C.tealPale,   icon:"👩"},
          {label:T.highRisk,     value:high.length,     color:C.red,    bg:C.redPale,    icon:"🔴"},
          {label:T.moderate,     value:medium.length,   color:C.yellow, bg:C.yellowPale, icon:"🟡"},
          {label:T.lowRisk,      value:low.length,      color:C.green,  bg:C.greenPale,  icon:"🟢"},
          {label:"Overdue Visit",value:overdueVisit.length, color:C.purple,bg:C.purplePale,icon:"⏰"},
        ].map(s=>(
          <div key={s.label} style={{background:s.bg,borderRadius:13,padding:"16px 12px",border:`1.5px solid ${s.color}30`,textAlign:"center"}}>
            <div style={{fontSize:22,marginBottom:4}}>{s.icon}</div>
            <div style={{fontSize:24,fontWeight:900,color:s.color,lineHeight:1}}>{s.value}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:3,fontWeight:600,textTransform:"uppercase",letterSpacing:0.4}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Risk bar */}
      {patients.length>0 && (
        <div style={{background:C.white,borderRadius:13,padding:"16px 20px",marginBottom:16,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,color:C.muted,marginBottom:10}}>Risk Distribution Heatmap</div>
          <div style={{display:"flex",height:20,borderRadius:6,overflow:"hidden",gap:2,marginBottom:8}}>
            {high.length>0   && <div style={{flex:high.length,  background:C.red,   display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"white"}}>{high.length}</div>}
            {medium.length>0 && <div style={{flex:medium.length,background:C.yellow,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"white"}}>{medium.length}</div>}
            {low.length>0    && <div style={{flex:low.length,   background:C.green, display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"white"}}>{low.length}</div>}
          </div>
          <div style={{display:"flex",gap:14,fontSize:11}}>
            {[[C.red,"High Risk",high.length],[C.yellow,"Moderate",medium.length],[C.green,"Low Risk",low.length]].map(([c,l,n])=>(
              <span key={l} style={{display:"flex",alignItems:"center",gap:4}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:c,display:"inline-block"}}/>
                <span style={{color:C.muted}}>{l}: <b style={{color:c}}>{n}</b></span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Smart scheduling */}
      <div style={{background:C.white,borderRadius:13,padding:"18px 20px",border:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <span style={{fontSize:16}}>🤖</span>
          <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,color:C.muted}}>AI Smart Visit Schedule (Today)</div>
        </div>
        {smartSchedule.length===0 ? (
          <div style={{textAlign:"center",padding:"20px 0",color:C.muted,fontSize:13}}>No patients registered yet</div>
        ) : smartSchedule.map((p,i)=>{
          const anc = p._anc, r = p._r||{color:C.muted,bg:C.cream,emoji:"⬜"};
          return (
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<smartSchedule.length-1?`1px solid ${C.border}`:"none"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:r.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{r.emoji}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600}}>{p.name}</div>
                <div style={{fontSize:11,color:C.muted}}>Wk {p.weeks} · {p.village}</div>
              </div>
              <div style={{textAlign:"right"}}>
                {anc.overdue
                  ? <span style={{fontSize:11,fontWeight:700,color:C.red,display:"block"}}>⚠ Overdue ({anc.daysSinceVisit}d)</span>
                  : <span style={{fontSize:11,color:C.green,display:"block"}}>Next: {anc.daysUntilNext}d</span>
                }
                {p._vax.length>0 && <span style={{fontSize:10,color:C.purple}}>💉 {p._vax.length} vaccine(s) due</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 2 — PATIENT LIST
// ════════════════════════════════════════════════════════════
function PatientListTab({patients, onSelect, onAdd, filterPreset, lang}) {
  const T = LANG[lang];
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState(filterPreset||"ALL");
  const [sortBy, setSortBy]   = useState("risk");

  const filtered = patients
    .filter(p=>filter==="ALL"||p.risk===filter||(!p.risk&&filter==="PENDING"))
    .filter(p=>!search||p.name?.toLowerCase().includes(search.toLowerCase())||p.village?.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>{
      if(sortBy==="risk"){const o={HIGH:0,MEDIUM:1,LOW:2};return(o[a.risk]??3)-(o[b.risk]??3);}
      if(sortBy==="week") return Number(b.weeks)-Number(a.weeks);
      if(sortBy==="name") return a.name?.localeCompare(b.name);
      return new Date(b.registeredAt)-new Date(a.registeredAt);
    });

  return (
    <div>
      <div style={{background:C.white,borderRadius:12,padding:"14px 18px",border:`1px solid ${C.border}`,marginBottom:14}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={T.searchPlaceholder}
          style={{width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",outline:"none",background:C.cream,boxSizing:"border-box",marginBottom:10}}/>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {[["ALL","All"],["HIGH","🔴 High"],["MEDIUM","🟡 Moderate"],["LOW","🟢 Low"]].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} style={{padding:"5px 12px",borderRadius:20,border:`1.5px solid ${filter===v?C.teal:C.border}`,background:filter===v?C.tealPale:C.white,color:filter===v?C.teal:C.muted,fontSize:12,fontWeight:filter===v?700:400,cursor:"pointer"}}>{l}</button>
          ))}
          <div style={{marginLeft:"auto",display:"flex",gap:5}}>
            {[["risk","Risk"],["week","Week"],["name","Name"]].map(([v,l])=>(
              <button key={v} onClick={()=>setSortBy(v)} style={{padding:"4px 10px",borderRadius:20,border:`1.5px solid ${sortBy===v?C.saffron:C.border}`,background:sortBy===v?C.saffronPale:C.white,color:sortBy===v?C.saffron:C.muted,fontSize:11,fontWeight:600,cursor:"pointer"}}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{fontSize:12,color:C.muted,marginBottom:8,fontWeight:600}}>{filtered.length} patients</div>

      {filtered.length===0 ? (
        <div style={{background:C.white,borderRadius:13,padding:"40px 28px",textAlign:"center",border:`1px solid ${C.border}`}}>
          <div style={{fontSize:40,marginBottom:10}}>👩</div>
          <div style={{fontSize:14,fontWeight:600,marginBottom:8}}>No patients found</div>
          <button onClick={onAdd} style={{background:C.saffron,color:"white",border:"none",borderRadius:9,padding:"10px 22px",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Register First Patient</button>
        </div>
      ) : filtered.map(p=>{
        const r = p.risk?RISK[p.risk]:{color:C.muted,bg:C.cream,emoji:"⬜",label:"Pending"};
        const anc = getANCStatus(p);
        const vax = getVaccinesDue(p);
        return (
          <div key={p.id} onClick={()=>onSelect(p)} style={{background:C.white,borderRadius:12,padding:"15px 18px",border:`1.5px solid ${p.risk==="HIGH"?C.red+"50":C.border}`,cursor:"pointer",marginBottom:8,transition:"all 0.15s",display:"flex",alignItems:"center",gap:13}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.teal;e.currentTarget.style.boxShadow=`0 3px 14px rgba(13,110,110,0.1)`;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=p.risk==="HIGH"?C.red+"50":C.border;e.currentTarget.style.boxShadow="none";}}>
            <div style={{width:44,height:44,borderRadius:11,background:r.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{r.emoji}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                <span style={{fontSize:14,fontWeight:700}}>{p.name}</span>
                <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,background:r.bg,color:r.color}}>{r.label}</span>
              </div>
              <div style={{fontSize:12,color:C.muted,marginBottom:3}}>Wk {p.weeks} · Age {p.age} · {p.village} · {p.phone}</div>
              <div style={{display:"flex",gap:6}}>
                {anc.overdue && <span style={{fontSize:10,background:C.yellowPale,color:C.yellow,padding:"1px 7px",borderRadius:20,fontWeight:600}}>⏰ Visit Overdue</span>}
                {vax.length>0 && <span style={{fontSize:10,background:C.purplePale,color:C.purple,padding:"1px 7px",borderRadius:20,fontWeight:600}}>💉 Vaccine Due</span>}
                {p.riskFlags?.slice(0,2).map(f=><span key={f} style={{fontSize:10,background:C.redPale,color:C.red,padding:"1px 7px",borderRadius:20,fontWeight:600}}>⚠ {f}</span>)}
              </div>
            </div>
            <div style={{fontSize:11,color:C.muted,textAlign:"right",flexShrink:0}}>
              <div>{p.visits?.length||0} visits</div>
              <div style={{marginTop:2}}>ID: {p.id?.slice(-6)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// REGISTER FORM FIELD COMPONENTS (defined outside to prevent re-mount)
// ════════════════════════════════════════════════════════════
function RegField({label, fieldKey, type="text", placeholder, error, req, value, onChange, onVoice, listening}) {
  return (
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
        <label style={{fontSize:12,fontWeight:600,color:"#1C1C1C"}}>{label}{req&&<span style={{color:"#DC2626"}}> *</span>}</label>
        {onVoice && (
          <button type="button" onClick={()=>onVoice(fieldKey)} title="Voice input"
            style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:listening?"#DC2626":"#0D6E6E",padding:0}}>
            {listening?"🔴":"🎙️"}
          </button>
        )}
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{width:"100%",padding:"9px 11px",borderRadius:8,border:`1.5px solid ${error?"#DC2626":"#E0D8D0"}`,fontSize:13,fontFamily:"inherit",outline:"none",background:"#F4F0EB",boxSizing:"border-box"}}
      />
      {error && <div style={{fontSize:11,color:"#DC2626",marginTop:2}}>⚠ {error}</div>}
    </div>
  );
}

function RegSelect({label, value, onChange, opts, req, error}) {
  return (
    <div style={{marginBottom:12}}>
      <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:3,color:"#1C1C1C"}}>{label}{req&&<span style={{color:"#DC2626"}}> *</span>}</label>
      <select
        value={value}
        onChange={onChange}
        style={{width:"100%",padding:"9px 11px",borderRadius:8,border:`1.5px solid ${error?"#DC2626":"#E0D8D0"}`,fontSize:13,fontFamily:"inherit",outline:"none",background:"#F4F0EB",cursor:"pointer",boxSizing:"border-box"}}>
        <option value="">— Select —</option>
        {opts.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
      </select>
      {error && <div style={{fontSize:11,color:"#DC2626",marginTop:2}}>⚠ {error}</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 3 — REGISTER
// ════════════════════════════════════════════════════════════
function RegisterTab({user, onSuccess, lang}) {
  const T = LANG[lang];
  const [step, setStep]     = useState(1);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(null);
  const [isOnline]          = useState(navigator.onLine);
  const [listening, setListening] = useState(false);

  const [d, setD] = useState({
    name:"",phone:"",age:"",weeks:"",village:"",district:user?.district||"",block:user?.block||"",
    guardian:"",gravida:"1",para:"0",lmp:"",bloodGroup:"",pregnancyType:"Singleton",
    bpSys:"",bpDia:"",hb:"",weight:"",sugar:"",anemia:"None",hiv:"Negative",
    symptoms:[],prevComplications:"",ancDone:"Yes",
  });

  const set = (k,v) => {setD(p=>({...p,[k]:v}));setErrors(e=>{const n={...e};delete n[k];return n;});};
  const toggleSym = (id) => setD(p=>({...p,symptoms:p.symptoms.includes(id)?p.symptoms.filter(s=>s!==id):[...p.symptoms,id]}));

  // Voice to text
  const startVoice = (field) => {
    if(!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)){alert("Voice not supported in this browser. Try Chrome.");return;}
    const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = lang==="hi"?"hi-IN":lang==="ur"?"ur-PK":"en-IN";
    rec.interimResults = false;
    setListening(true);
    rec.onresult = (e) => {set(field, e.results[0][0].transcript); setListening(false);};
    rec.onerror  = () => setListening(false);
    rec.onend    = () => setListening(false);
    rec.start();
  };

  const validate = () => {
    const e={};
    if(step===1){
      if(!d.name.trim())              e.name="Required";
      if(!/^[6-9]\d{9}$/.test(d.phone))e.phone="Valid 10-digit";
      if(!d.age||d.age<10||d.age>60) e.age="Valid age";
      if(!d.weeks)                    e.weeks="Required";
      if(!d.village.trim())           e.village="Required";
    }
    if(step===2){
      if(!d.lmp)                      e.lmp="Required";
      if(!d.bloodGroup)               e.bloodGroup="Required";
    }
    if(step===3){
      if(!d.bpSys||!d.bpDia)         e.bpSys="BP required";
      if(!d.hb||d.hb<1||d.hb>25)     e.hb="Valid Hb (1–25)";
      if(!d.weight)                   e.weight="Required";
    }
    setErrors(e);
    return Object.keys(e).length===0;
  };

  const handleSubmit = async () => {
    setSaving(true);
    await new Promise(r=>setTimeout(r,1000));
    const risk = computeRisk(d);
    const patient = {
      id:"MAT-"+(d.district||"XXX").slice(0,3).toUpperCase()+"-"+Date.now().toString().slice(-6),
      ...d, ashaEmail:user.email, ashaName:user.name,
      risk:risk.level, riskScore:risk.score, riskFlags:risk.flags,
      registeredAt:new Date().toISOString(), visits:[], vaccines:[], documents:[],
    };
    const all = getPatients();
    all.push(patient);
    if(!isOnline){
      const q=getOfflineQ(); q.push(patient); saveOfflineQ(q);
    }
    savePatients(all);
    setSaving(false); setDone(patient); onSuccess(patient);
  };

  const handleNext = () => {if(!validate())return;if(step<3)setStep(step+1);else handleSubmit();};

  if(done) return (
    <div style={{background:C.white,borderRadius:16,padding:"36px 28px",textAlign:"center",border:`2px solid ${RISK[done.risk]?.color||C.green}`}}>
      <div style={{fontSize:48,marginBottom:12}}>{RISK[done.risk]?.emoji||"✅"}</div>
      <div style={{fontFamily:"Georgia,serif",fontSize:20,fontWeight:700,marginBottom:4}}>{done.name} Registered!</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:12}}>ID: {done.id}</div>
      <div style={{background:RISK[done.risk]?.bg,borderRadius:10,padding:"10px 18px",display:"inline-block",marginBottom:8}}>
        <span style={{fontSize:15,fontWeight:700,color:RISK[done.risk]?.color}}>{RISK[done.risk]?.emoji} {RISK[done.risk]?.label}</span>
      </div>
      {!isOnline && <div style={{background:C.yellowPale,border:`1px solid ${C.yellow}`,borderRadius:8,padding:"8px 14px",fontSize:12,color:C.yellow,margin:"10px 0"}}>{T.offlineSaved}</div>}
      <br/>
      <button onClick={()=>{setDone(null);setStep(1);setD({name:"",phone:"",age:"",weeks:"",village:"",district:user?.district||"",block:user?.block||"",guardian:"",gravida:"1",para:"0",lmp:"",bloodGroup:"",pregnancyType:"Singleton",bpSys:"",bpDia:"",hb:"",weight:"",sugar:"",anemia:"None",hiv:"Negative",symptoms:[],prevComplications:"",ancDone:"Yes"});}}
        style={{background:C.teal,color:"white",border:"none",borderRadius:9,padding:"10px 26px",fontSize:13,fontWeight:700,cursor:"pointer",marginTop:10}}>
        + Register Another
      </button>
    </div>
  );

  return (
    <div style={{background:C.white,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"}}>
      <div style={{height:4,background:C.cream}}>
        <div style={{height:"100%",width:`${((step-1)/3)*100}%`,background:`linear-gradient(90deg,${C.teal},${C.saffron})`,transition:"width 0.4s"}}/>
      </div>
      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`}}>
        {[{label:"Basic Info",icon:"👩"},{label:"Pregnancy",icon:"🤰"},{label:"Vitals",icon:"🩺"}].map((s,i)=>(
          <div key={i} style={{flex:1,padding:"12px",textAlign:"center",borderBottom:`3px solid ${step===i+1?C.saffron:"transparent"}`,cursor:i+1<step?"pointer":"default"}} onClick={()=>i+1<step&&setStep(i+1)}>
            <div style={{fontSize:16,marginBottom:2}}>{i+1<step?"✅":s.icon}</div>
            <div style={{fontSize:11,fontWeight:step===i+1?700:400,color:step===i+1?C.saffron:i+1<step?C.green:C.muted}}>{s.label}</div>
          </div>
        ))}
      </div>

      {!isOnline && <div style={{background:C.yellowPale,padding:"8px 20px",fontSize:12,color:C.yellow,fontWeight:600}}>📶 Offline Mode — data will sync when online</div>}

      <div style={{padding:"22px 26px"}}>
        {step===1 && (
          <>
            <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>👩 Basic Patient Info
              <span style={{fontSize:11,color:C.teal,fontWeight:600,marginLeft:10}}>🎙️ Click mic icon next to any field for voice input</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
              <RegField label="Full Name" fieldKey="name" req value={d.name} onChange={e=>set("name",e.target.value)} error={errors.name} onVoice={startVoice} listening={listening}/>
              <RegField label="Mobile Number" fieldKey="phone" type="tel" placeholder="10-digit" req value={d.phone} onChange={e=>set("phone",e.target.value)} error={errors.phone} onVoice={startVoice} listening={listening}/>
              <RegField label="Age" fieldKey="age" type="number" placeholder="e.g. 24" req value={d.age} onChange={e=>set("age",e.target.value)} error={errors.age} onVoice={startVoice} listening={listening}/>
              <RegSelect label="Pregnancy Week" value={d.weeks} onChange={e=>set("weeks",e.target.value)} req opts={Array.from({length:42},(_,i)=>({v:`${i+1}`,l:`Week ${i+1}`}))} error={errors.weeks}/>
              <RegField label="Village / Mohalla" fieldKey="village" req value={d.village} onChange={e=>set("village",e.target.value)} error={errors.village} onVoice={startVoice} listening={listening}/>
              <RegField label="Husband / Guardian" fieldKey="guardian" value={d.guardian} onChange={e=>set("guardian",e.target.value)} onVoice={startVoice} listening={listening}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
              <RegSelect label="District" value={d.district} onChange={e=>set("district",e.target.value)} req opts={["Saharanpur","Muzaffarnagar","Shamli","Haridwar","Dehradun","Other"]}/>
              <RegSelect label="Block" value={d.block} onChange={e=>set("block",e.target.value)} opts={["Behat","Nakur","Sarsawa","Deoband","Rampur Maniharan","Other"]}/>
            </div>
          </>
        )}
        {step===2 && (
          <>
            <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>🤰 Pregnancy History</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
              <RegField label="LMP Date" fieldKey="lmp" type="date" req value={d.lmp} onChange={e=>set("lmp",e.target.value)} error={errors.lmp}/>
              <RegSelect label="Blood Group" value={d.bloodGroup} onChange={e=>set("bloodGroup",e.target.value)} req opts={["A+","A-","B+","B-","O+","O-","AB+","AB-"]} error={errors.bloodGroup}/>
              <RegSelect label="Gravida" value={d.gravida} onChange={e=>set("gravida",e.target.value)} opts={["1","2","3","4","5+"]}/>
              <RegSelect label="Para" value={d.para} onChange={e=>set("para",e.target.value)} opts={["0","1","2","3","4+"]}/>
            </div>
            <RegSelect label="Type of Pregnancy" value={d.pregnancyType} onChange={e=>set("pregnancyType",e.target.value)} opts={["Singleton","Twin","Triplet"]}/>
            <RegSelect label="ANC Registration Done?" value={d.ancDone} onChange={e=>set("ancDone",e.target.value)} opts={["Yes","No"]}/>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:3}}>Previous Complications</label>
              <textarea value={d.prevComplications} onChange={e=>set("prevComplications",e.target.value)} rows={2}
                style={{width:"100%",padding:"9px 11px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",outline:"none",background:C.cream,resize:"vertical",boxSizing:"border-box"}}/>
            </div>
          </>
        )}
        {step===3 && (
          <>
            <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>🩺 Current Vitals</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 12px"}}>
              <RegField label="BP Systolic" fieldKey="bpSys" type="number" placeholder="e.g. 120" req value={d.bpSys} onChange={e=>set("bpSys",e.target.value)} error={errors.bpSys}/>
              <RegField label="BP Diastolic" fieldKey="bpDia" type="number" placeholder="e.g. 80" req value={d.bpDia} onChange={e=>set("bpDia",e.target.value)}/>
              <RegField label="Hemoglobin (g/dL)" fieldKey="hb" type="number" placeholder="e.g. 11.5" req value={d.hb} onChange={e=>set("hb",e.target.value)} error={errors.hb}/>
              <RegField label="Weight (kg)" fieldKey="weight" type="number" req value={d.weight} onChange={e=>set("weight",e.target.value)} error={errors.weight}/>
              <RegField label="Blood Sugar" fieldKey="sugar" type="number" placeholder="e.g. 95" value={d.sugar} onChange={e=>set("sugar",e.target.value)}/>
              <RegSelect label="Anemia" value={d.anemia} onChange={e=>set("anemia",e.target.value)} opts={["None","Mild","Moderate","Severe"]}/>
            </div>
            <RegSelect label="HIV Status" value={d.hiv} onChange={e=>set("hiv",e.target.value)} opts={["Negative","Positive","Not Tested"]}/>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:8}}>Symptoms Observed</label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {SYMPTOMS_LIST.map(s=>(
                  <div key={s.id} onClick={()=>toggleSym(s.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,border:`1.5px solid ${d.symptoms.includes(s.id)?C.red:C.border}`,background:d.symptoms.includes(s.id)?C.redPale:C.cream,cursor:"pointer"}}>
                    <span style={{fontSize:15}}>{d.symptoms.includes(s.id)?"☑":"☐"}</span>
                    <span style={{fontSize:12,fontWeight:d.symptoms.includes(s.id)?600:400,color:d.symptoms.includes(s.id)?C.red:C.charcoal}}>{s.label}</span>
                    {s.w>=25&&<span style={{marginLeft:"auto",fontSize:9,color:C.red,fontWeight:700}}>HIGH</span>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 26px",borderTop:`1px solid ${C.border}`,background:C.cream}}>
        <button onClick={()=>{if(step>1){setStep(step-1);setErrors({});}}} disabled={step===1}
          style={{padding:"9px 20px",borderRadius:8,border:`1.5px solid ${C.border}`,background:C.white,fontSize:13,fontWeight:600,cursor:step===1?"not-allowed":"pointer",opacity:step===1?0.5:1}}>← Back</button>
        <span style={{fontSize:12,color:C.muted}}>Step {step} / 3</span>
        <button onClick={handleNext} disabled={saving}
          style={{padding:"9px 24px",borderRadius:8,border:"none",background:saving?C.muted:step===3?C.green:C.saffron,color:"white",fontSize:13,fontWeight:700,cursor:saving?"not-allowed":"pointer"}}>
          {saving?"Saving...":step===3?"✓ Register":"Next →"}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 4 — ANALYTICS (Risk Trends)
// ════════════════════════════════════════════════════════════
function AnalyticsTab({patients}) {
  const [selected, setSelected] = useState(patients[0]||null);

  const highRiskPatients = patients.filter(p=>p.risk==="HIGH");
  const avgBP = patients.filter(p=>p.bpSys).map(p=>Number(p.bpSys));
  const avgHb = patients.filter(p=>p.hb).map(p=>Number(p.hb));
  const avgBPVal = avgBP.length ? Math.round(avgBP.reduce((a,b)=>a+b,0)/avgBP.length) : "—";
  const avgHbVal = avgHb.length ? (avgHb.reduce((a,b)=>a+b,0)/avgHb.length).toFixed(1) : "—";

  const weekDist = {};
  patients.forEach(p=>{ const w=Math.floor((Number(p.weeks)||20)/10)*10; weekDist[w]=(weekDist[w]||0)+1; });

  return (
    <div>
      {/* Summary stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
        {[
          {label:"Avg. BP (Systolic)", value:avgBPVal, unit:"mmHg", color:Number(avgBPVal)>=140?C.red:C.green, icon:"💓"},
          {label:"Avg. Hemoglobin",    value:avgHbVal, unit:"g/dL", color:Number(avgHbVal)<9?C.red:C.green, icon:"🩸"},
          {label:"High Risk Rate",     value:patients.length?Math.round(highRiskPatients.length/patients.length*100)+"%":"—", unit:"", color:C.red, icon:"🔴"},
        ].map(s=>(
          <div key={s.label} style={{background:C.white,borderRadius:13,padding:"18px",border:`1px solid ${C.border}`,textAlign:"center"}}>
            <div style={{fontSize:24,marginBottom:6}}>{s.icon}</div>
            <div style={{fontSize:26,fontWeight:900,color:s.color}}>{s.value}<span style={{fontSize:12,color:C.muted}}> {s.unit}</span></div>
            <div style={{fontSize:11,color:C.muted,marginTop:4,fontWeight:600}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Patient trend selector */}
      <div style={{background:C.white,borderRadius:13,padding:"18px 20px",marginBottom:16,border:`1px solid ${C.border}`}}>
        <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,color:C.muted,marginBottom:12}}>📈 AI Risk Trend Analysis</div>
        <div style={{marginBottom:14}}>
          <select value={selected?.id||""} onChange={e=>{const p=patients.find(p=>p.id===e.target.value);setSelected(p||null);}}
            style={{width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",outline:"none",background:C.cream,cursor:"pointer"}}>
            <option value="">— Select patient —</option>
            {patients.map(p=><option key={p.id} value={p.id}>{p.name} (Wk {p.weeks}, {RISK[p.risk]?.label||"Pending"})</option>)}
          </select>
        </div>
        {selected && selected.visits?.length >= 2 ? (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={{background:C.redPale,borderRadius:10,padding:"14px"}}>
              <TrendChart visits={selected.visits} field="bp" label="BP Systolic" color={C.red} dangerLine={140}/>
            </div>
            <div style={{background:C.tealPale,borderRadius:10,padding:"14px"}}>
              <TrendChart visits={selected.visits} field="hb" label="Hemoglobin" color={C.teal} dangerLine={9}/>
            </div>
          </div>
        ) : (
          <div style={{background:C.cream,borderRadius:10,padding:"20px",textAlign:"center",color:C.muted,fontSize:13}}>
            {selected ? `${selected.name} needs 2+ visits for trend analysis` : "Select a patient to view trends"}
          </div>
        )}
      </div>

      {/* Gestation distribution */}
      <div style={{background:C.white,borderRadius:13,padding:"18px 20px",border:`1px solid ${C.border}`}}>
        <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,color:C.muted,marginBottom:14}}>📊 Gestational Age Distribution</div>
        {Object.keys(weekDist).length===0 ? (
          <div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"20px 0"}}>No patient data yet</div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[["1–10","Wk 1–10",0],["10–20","Wk 10–20",10],["20–30","Wk 20–30",20],["30–40","Wk 30–40",30]].map(([k,l,wk])=>{
              const count = weekDist[wk]||0;
              const pct = patients.length ? Math.round(count/patients.length*100) : 0;
              return (
                <div key={k} style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:12,color:C.muted,minWidth:70}}>{l}</span>
                  <div style={{flex:1,height:18,background:C.cream,borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:pct+"%",background:`linear-gradient(90deg,${C.teal},${C.saffron})`,borderRadius:4,transition:"width 0.6s"}}/>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:C.teal,minWidth:30}}>{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 5 — PATIENT DETAIL
// ════════════════════════════════════════════════════════════
function PatientDetailTab({patient:init, onBack, onUpdate}) {
  const [patient, setPatient] = useState(init);
  const [tab, setTab]         = useState("overview");
  const [showVitals, setShowVitals]       = useState(false);
  const [showReferral, setShowReferral]   = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showQR, setShowQR]               = useState(false);
  const r = patient.risk?RISK[patient.risk]:{color:C.muted,bg:C.cream,emoji:"⬜",label:"Pending"};

  const [vForm, setVForm] = useState({bpSys:"",bpDia:"",hb:"",weight:"",sugar:"",symptoms:[],note:"",date:new Date().toISOString().split("T")[0]});
  const toggleVSym = (id) => setVForm(p=>({...p,symptoms:p.symptoms.includes(id)?p.symptoms.filter(s=>s!==id):[...p.symptoms,id]}));

  const saveVisit = () => {
    if(!vForm.bpSys||!vForm.bpDia){alert("Please enter BP");return;}
    const newRisk    = computeRisk({...patient,...vForm});
    const newVisit   = {date:vForm.date,bp:`${vForm.bpSys}/${vForm.bpDia}`,hb:vForm.hb,weight:vForm.weight,sugar:vForm.sugar,symptoms:vForm.symptoms,note:vForm.note,recordedAt:new Date().toISOString()};
    const updated    = {...patient,bpSys:vForm.bpSys,bpDia:vForm.bpDia,hb:vForm.hb||patient.hb,weight:vForm.weight||patient.weight,risk:newRisk.level,riskScore:newRisk.score,riskFlags:newRisk.flags,visits:[newVisit,...(patient.visits||[])]};
    const all = getPatients(); const idx=all.findIndex(p=>p.id===patient.id); if(idx>=0)all[idx]=updated;
    savePatients(all); setPatient(updated); onUpdate(updated); setShowVitals(false);
    setVForm({bpSys:"",bpDia:"",hb:"",weight:"",sugar:"",symptoms:[],note:"",date:new Date().toISOString().split("T")[0]});
  };

  const anc  = getANCStatus(patient);
  const vax  = getVaccinesDue(patient);

  return (
    <div>
      <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:C.teal,fontSize:13,fontWeight:600,marginBottom:14,display:"flex",alignItems:"center",gap:6}}>← Back to Patients</button>

      {/* Header */}
      <div style={{background:C.white,borderRadius:14,padding:"18px 22px",marginBottom:14,border:`2px solid ${r.color}30`,display:"flex",alignItems:"center",gap:16}}>
        <div style={{width:54,height:54,borderRadius:"50%",background:r.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{r.emoji}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:20,fontWeight:700,fontFamily:"Georgia,serif"}}>{patient.name}</div>
          <div style={{fontSize:13,color:C.muted,marginTop:2}}>Age {patient.age} · Wk {patient.weeks} · {patient.village} · {patient.phone}</div>
          <div style={{display:"flex",gap:6,marginTop:6}}>
            {anc.overdue && <span style={{fontSize:11,background:C.yellowPale,color:C.yellow,padding:"2px 9px",borderRadius:20,fontWeight:600}}>⏰ Visit Overdue by {anc.daysSinceVisit}d</span>}
            {vax.map(v=><span key={v.name} style={{fontSize:11,background:C.purplePale,color:C.purple,padding:"2px 9px",borderRadius:20,fontWeight:600}}>💉 {v.name} due</span>)}
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <span style={{background:r.bg,color:r.color,padding:"7px 16px",borderRadius:20,fontSize:13,fontWeight:700,display:"block"}}>{r.emoji} {r.label}</span>
          {patient.riskScore>0&&<div style={{fontSize:12,color:C.muted,marginTop:4}}>Score: {patient.riskScore}/100</div>}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <button onClick={()=>setShowVitals(!showVitals)} style={{flex:1,minWidth:120,padding:"10px",borderRadius:9,border:`1.5px solid ${C.teal}`,background:showVitals?C.teal:C.tealPale,color:showVitals?"white":C.teal,fontSize:12,fontWeight:700,cursor:"pointer"}}>🩺 Record Vitals</button>
        <button onClick={()=>setShowReferral(!showReferral)} style={{flex:1,minWidth:120,padding:"10px",borderRadius:9,border:`1.5px solid ${C.navy}`,background:showReferral?C.navy:C.navyPale,color:showReferral?"white":C.navy,fontSize:12,fontWeight:700,cursor:"pointer"}}>📋 Refer Doctor</button>
        <button onClick={()=>setShowQR(true)} style={{flex:1,minWidth:120,padding:"10px",borderRadius:9,border:`1.5px solid ${C.purple}`,background:C.purplePale,color:C.purple,fontSize:12,fontWeight:700,cursor:"pointer"}}>🔲 Priority Pass</button>
        <button onClick={()=>setShowEmergency(true)} style={{flex:1,minWidth:120,padding:"10px",borderRadius:9,border:`2px solid ${C.red}`,background:C.redPale,color:C.red,fontSize:12,fontWeight:800,cursor:"pointer",animation:"pulse 2s infinite"}}>🚨 Emergency</button>
        <a href={`tel:${patient.phone}`} style={{flex:1,minWidth:120,padding:"10px",borderRadius:9,border:`1.5px solid ${C.green}`,background:C.greenPale,color:C.green,fontSize:12,fontWeight:700,textDecoration:"none",textAlign:"center"}}>📞 Call</a>
      </div>

      {/* Record Vitals */}
      {showVitals && (
        <div style={{background:C.tealPale,border:`2px solid ${C.teal}`,borderRadius:14,padding:"18px 20px",marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:700,color:C.teal,marginBottom:14}}>🩺 Record Visit</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0 12px"}}>
            {[["BP Sys","bpSys","number","e.g. 120"],["BP Dia","bpDia","number","e.g. 80"],["Date","date","date",""]].map(([l,k,t,ph])=>(
              <div key={k} style={{marginBottom:10}}>
                <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:3}}>{l}</label>
                <input type={t} value={vForm[k]} onChange={e=>setVForm(p=>({...p,[k]:e.target.value}))} placeholder={ph}
                  style={{width:"100%",padding:"8px 10px",borderRadius:7,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",outline:"none",background:C.white,boxSizing:"border-box"}}/>
              </div>
            ))}
            {[["Hemoglobin","hb","number","e.g. 11"],["Weight(kg)","weight","number","e.g. 58"],["Sugar","sugar","number","e.g. 95"]].map(([l,k,t,ph])=>(
              <div key={k} style={{marginBottom:10}}>
                <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:3}}>{l}</label>
                <input type={t} value={vForm[k]} onChange={e=>setVForm(p=>({...p,[k]:e.target.value}))} placeholder={ph}
                  style={{width:"100%",padding:"8px 10px",borderRadius:7,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",outline:"none",background:C.white,boxSizing:"border-box"}}/>
              </div>
            ))}
          </div>
          <div style={{marginBottom:10}}>
            <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:6}}>Symptoms</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
              {SYMPTOMS_LIST.map(s=>(
                <div key={s.id} onClick={()=>toggleVSym(s.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 8px",borderRadius:7,border:`1.5px solid ${vForm.symptoms.includes(s.id)?C.red:C.border}`,background:vForm.symptoms.includes(s.id)?C.redPale:C.white,cursor:"pointer",fontSize:11}}>
                  <span>{vForm.symptoms.includes(s.id)?"☑":"☐"}</span>
                  <span style={{color:vForm.symptoms.includes(s.id)?C.red:C.charcoal}}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{marginBottom:10}}>
            <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:3}}>Notes</label>
            <textarea value={vForm.note} onChange={e=>setVForm(p=>({...p,note:e.target.value}))} rows={2}
              style={{width:"100%",padding:"8px 10px",borderRadius:7,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",outline:"none",background:C.white,resize:"vertical",boxSizing:"border-box"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setShowVitals(false)} style={{padding:"8px 18px",borderRadius:8,border:`1.5px solid ${C.border}`,background:C.white,cursor:"pointer",fontSize:12}}>Cancel</button>
            <button onClick={saveVisit} style={{padding:"8px 22px",borderRadius:8,border:"none",background:C.teal,color:"white",fontSize:12,fontWeight:700,cursor:"pointer"}}>Save & Recalculate Risk</button>
          </div>
        </div>
      )}

      {/* Referral */}
      {showReferral && (
        <div style={{background:C.navyPale,border:`2px solid ${C.navy}`,borderRadius:14,padding:"18px 20px",marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:14}}>📋 Digital Referral — Priority Slot</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:3}}>Hospital</label>
              <input placeholder="Hospital name" style={{width:"100%",padding:"8px 10px",borderRadius:7,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",outline:"none",background:C.white,boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:3}}>Urgency</label>
              <select style={{width:"100%",padding:"8px 10px",borderRadius:7,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",outline:"none",background:C.white,cursor:"pointer",boxSizing:"border-box"}}>
                {["Routine","Urgent","Emergency"].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div style={{marginBottom:10}}>
            <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:3}}>Reason</label>
            <input placeholder="e.g. High BP, needs specialist" style={{width:"100%",padding:"8px 10px",borderRadius:7,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",outline:"none",background:C.white,boxSizing:"border-box"}}/>
          </div>
          {/* Mock bed availability */}
          <div style={{background:C.white,borderRadius:8,padding:"12px",marginBottom:12,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:8}}>🏥 Live Bed Availability (Demo)</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {[
                {name:"Govt. District Hospital", beds:3, nicu:true,  avail:true},
                {name:"City Women's Hospital",   beds:0, nicu:true,  avail:false},
                {name:"Shree Maternity Centre",  beds:5, nicu:false, avail:true},
              ].map(h=>(
                <div key={h.name} style={{display:"flex",alignItems:"center",gap:10,fontSize:12}}>
                  <span style={{fontSize:14}}>{h.avail?"🟢":"🔴"}</span>
                  <span style={{flex:1,fontWeight:600}}>{h.name}</span>
                  {h.nicu&&<span style={{fontSize:10,background:C.tealPale,color:C.teal,padding:"1px 7px",borderRadius:20,fontWeight:600}}>NICU</span>}
                  <span style={{color:h.avail?C.green:C.red,fontWeight:700}}>{h.avail?`${h.beds} beds`:"Full"}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setShowReferral(false)} style={{padding:"8px 16px",borderRadius:8,border:`1.5px solid ${C.border}`,background:C.white,cursor:"pointer",fontSize:12}}>Cancel</button>
            <button onClick={()=>{alert(`Referral sent for ${patient.name}!\nPriority slot booked. QR pass generated.`);setShowReferral(false);}}
              style={{padding:"8px 20px",borderRadius:8,border:"none",background:C.navy,color:"white",fontSize:12,fontWeight:700,cursor:"pointer"}}>
              📤 Send Referral + Book Priority Slot
            </button>
          </div>
        </div>
      )}

      {/* QR Priority Pass modal */}
      {showQR && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300}}>
          <div style={{background:C.white,borderRadius:16,padding:28,maxWidth:340,width:"90%",textAlign:"center"}}>
            <div style={{fontSize:14,fontWeight:700,color:C.purple,marginBottom:4}}>🔲 Digital Priority Pass</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:16}}>Show this QR at hospital to skip registration queue</div>
            <QRPlaceholder patient={patient}/>
            <div style={{marginTop:14,fontSize:12,color:C.muted,lineHeight:1.6}}>
              <b>{patient.name}</b> · {patient.id}<br/>
              Risk: <b style={{color:r.color}}>{r.label}</b><br/>
              Valid: {new Date().toLocaleDateString("en-IN")}
            </div>
            <button onClick={()=>setShowQR(false)} style={{marginTop:16,background:C.purple,color:"white",border:"none",borderRadius:9,padding:"9px 24px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Close</button>
          </div>
        </div>
      )}

      {/* Emergency modal */}
      {showEmergency && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300}}>
          <div style={{background:C.white,borderRadius:18,padding:28,width:380,textAlign:"center"}}>
            <div style={{fontSize:46,marginBottom:10}}>🚨</div>
            <div style={{fontSize:17,fontWeight:800,color:C.red,marginBottom:4}}>Emergency Mode</div>
            <div style={{fontSize:13,color:C.muted,marginBottom:18}}>Patient: <b>{patient.name}</b> · {patient.village}</div>
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              <a href="tel:108" style={{padding:"12px",borderRadius:10,background:C.red,color:"white",fontWeight:700,textDecoration:"none",fontSize:14}}>📞 Call 108 — Ambulance</a>
              <a href="tel:1910" style={{padding:"12px",borderRadius:10,background:C.redPale,color:C.red,border:`2px solid ${C.red}`,fontWeight:700,textDecoration:"none",fontSize:14}}>🩸 Blood Helpline 1910</a>
              <a href="https://www.openstreetmap.org/search?query=hospital+near+me" target="_blank" rel="noreferrer"
                style={{padding:"12px",borderRadius:10,background:C.navyPale,color:C.navy,border:`2px solid ${C.navy}`,fontWeight:700,textDecoration:"none",fontSize:14}}>
                🏥 Find Nearest Hospital (GPS)
              </a>
              <button onClick={()=>{if(navigator.geolocation){navigator.geolocation.getCurrentPosition(p=>{alert(`GPS Location shared!\nLat: ${p.coords.latitude.toFixed(4)}\nLon: ${p.coords.longitude.toFixed(4)}\n\nAmbulance team notified.`);});}else{alert("GPS not available");}}}
                style={{padding:"12px",borderRadius:10,background:C.greenPale,color:C.green,border:`2px solid ${C.green}`,fontWeight:700,fontSize:14,cursor:"pointer"}}>
                📡 Share GPS Location
              </button>
            </div>
            <button onClick={()=>setShowEmergency(false)} style={{marginTop:12,background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13}}>Close</button>
          </div>
        </div>
      )}

      {/* Vitals grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:9,marginBottom:14}}>
        {[
          {label:"BP",value:`${patient.bpSys||"—"}/${patient.bpDia||"—"}`,unit:"mmHg",warn:Number(patient.bpSys)>=140},
          {label:"Hemoglobin",value:patient.hb||"—",unit:"g/dL",warn:Number(patient.hb)<9&&!!patient.hb},
          {label:"Weight",value:patient.weight||"—",unit:"kg",warn:false},
          {label:"Blood Sugar",value:patient.sugar||"—",unit:"mg/dL",warn:Number(patient.sugar)>140&&!!patient.sugar},
          {label:"Week",value:patient.weeks||"—",unit:"wks",warn:false},
        ].map(v=>(
          <div key={v.label} style={{background:C.white,borderRadius:10,padding:"11px",border:`1px solid ${v.warn?C.red+"60":C.border}`,textAlign:"center"}}>
            <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:0.4}}>{v.label}</div>
            <div style={{fontSize:15,fontWeight:800,color:v.warn?C.red:C.green,marginTop:3}}>{v.value}<span style={{fontSize:9,color:C.muted}}> {v.unit}</span></div>
            <div style={{fontSize:10,color:v.warn?C.red:C.green,fontWeight:600,marginTop:1}}>{v.warn?"⚠":"✓"}</div>
          </div>
        ))}
      </div>

      {/* Trend charts */}
      {patient.visits?.length >= 2 && (
        <div style={{background:C.white,borderRadius:13,padding:"18px 20px",marginBottom:14,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,color:C.muted,marginBottom:12}}>📈 Health Trends</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={{background:C.redPale,borderRadius:9,padding:12}}>
              <TrendChart visits={patient.visits} field="bp" label="BP Systolic" color={C.red} dangerLine={140}/>
            </div>
            <div style={{background:C.tealPale,borderRadius:9,padding:12}}>
              <TrendChart visits={patient.visits} field="hb" label="Hemoglobin" color={C.teal} dangerLine={9}/>
            </div>
          </div>
        </div>
      )}

      {/* Visit history */}
      <div style={{background:C.white,borderRadius:13,padding:"18px 20px",border:`1px solid ${C.border}`}}>
        <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,color:C.muted,marginBottom:12}}>Visit History ({patient.visits?.length||0})</div>
        {patient.visits?.length>0 ? patient.visits.map((v,i)=>(
          <div key={i} style={{borderLeft:`3px solid ${i===0?C.saffron:C.border}`,paddingLeft:13,marginBottom:13}}>
            <div style={{fontSize:13,fontWeight:700}}>{v.date}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:1}}>BP: {v.bp} · Hb: {v.hb||"—"} · Wt: {v.weight||"—"}kg · Sugar: {v.sugar||"—"}</div>
            {v.symptoms?.length>0&&<div style={{fontSize:11,color:C.red,marginTop:2}}>⚠ {v.symptoms.join(", ")}</div>}
            {v.note&&<div style={{fontSize:12,color:C.teal,marginTop:2}}>📋 {v.note}</div>}
          </div>
        )) : (
          <div style={{textAlign:"center",padding:"18px 0",color:C.muted,fontSize:13}}>No visits yet. Record first visit above.</div>
        )}
      </div>

      <style>{`@keyframes pulse{0%,100%{box-shadow:0 0 0 3px rgba(220,38,38,0.2)}50%{box-shadow:0 0 0 8px rgba(220,38,38,0)}}`}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 6 — RESOURCES (Counseling Kits + Hospital Trust Scores)
// ════════════════════════════════════════════════════════════
function ResourcesTab() {
  const [open, setOpen] = useState(null);
  const kits = [
    {id:0, title:"Warning Signs — When to Go to Hospital",icon:"🚨",color:C.red,bg:C.redPale,
      content:"Go IMMEDIATELY if: Heavy bleeding, Severe headache, Blurred vision, Fits/Convulsions, No fetal movement 12 hours, Water breaking, High fever, Chest pain.",
      audio:"(Tap to play voice message in Hindi)"},
    {id:1, title:"Nutrition During Pregnancy",            icon:"🥗",color:C.green,bg:C.greenPale,
      content:"Eat: Dal, spinach, methi, citrus, milk, eggs, bananas. Avoid: Raw meat, alcohol, excess tea/coffee, papaya, pineapple. 8-10 glasses water daily.",
      audio:"(Tap to play voice message in Hindi)"},
    {id:2, title:"IFA Tablets — Why Not to Skip",         icon:"💊",color:C.teal,bg:C.tealPale,
      content:"IFA prevents anemia. Take daily after meals. Black stool is normal — don't worry. Calcium and IFA must be taken 2 hours apart.",
      audio:"(Tap to play voice message in Hindi)"},
    {id:3, title:"ANC Visit Schedule Explained",          icon:"📅",color:C.saffron,bg:C.saffronPale,
      content:"Visit 1: Before week 12. Visit 2: Week 14–26. Visit 3: Week 28–34. Visit 4: Week 36+. Each visit: BP, weight, Hb, baby growth.",
      audio:"(Tap to play voice message in Hindi)"},
    {id:4, title:"Mental Health During Pregnancy",        icon:"🧘",color:C.purple,bg:C.purplePale,
      content:"Anxiety is common. Encourage family support. Light walks help. Report extreme mood changes to doctor.",
      audio:"(Tap to play voice message in Hindi)"},
  ];

  const hospitals = [
    {name:"Govt. District Hospital",  type:"Government",trust:87,nicu:true, beds:200,phone:"0132-2712345"},
    {name:"Shree Maternity Centre",   type:"Private",   trust:92,nicu:true, beds:40, phone:"9876500001"},
    {name:"City Women's Hospital",    type:"Private",   trust:95,nicu:true, beds:80, phone:"9876500003"},
    {name:"PHC Behat",                type:"Government",trust:74,nicu:false,beds:30, phone:"9876500002"},
  ];

  const playAudio = (text) => {
    if(!('speechSynthesis' in window)){alert("Voice not supported in this browser");return;}
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "hi-IN"; u.rate=0.85;
    window.speechSynthesis.speak(u);
  };

  return (
    <div>
      {/* Counseling kits */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,color:C.muted,marginBottom:12}}>📚 Interactive Counseling Kits</div>
        {kits.map(k=>(
          <div key={k.id} style={{background:C.white,borderRadius:11,border:`1px solid ${C.border}`,overflow:"hidden",marginBottom:8}}>
            <div onClick={()=>setOpen(open===k.id?null:k.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",cursor:"pointer",background:open===k.id?k.bg:C.white}}>
              <div style={{width:36,height:36,borderRadius:9,background:k.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{k.icon}</div>
              <span style={{flex:1,fontSize:14,fontWeight:600}}>{k.title}</span>
              <span style={{color:C.muted,fontSize:16,transform:open===k.id?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
            </div>
            {open===k.id && (
              <div style={{padding:"12px 18px 16px",borderTop:`1px solid ${C.border}`,background:k.bg+"60"}}>
                <div style={{fontSize:13,lineHeight:1.8,marginBottom:12}}>{k.content}</div>
                <button onClick={()=>playAudio(k.content)} style={{background:k.color,color:"white",border:"none",borderRadius:8,padding:"7px 16px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  🔊 Play Voice (Hindi)
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Hospital trust scores */}
      <div>
        <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,color:C.muted,marginBottom:12}}>🏆 Hospital Trust Scores</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {hospitals.map(h=>(
            <div key={h.name} style={{background:C.white,borderRadius:12,padding:"16px 18px",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:42,height:42,borderRadius:10,background:C.tealPale,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🏥</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{fontSize:14,fontWeight:700}}>{h.name}</span>
                  <span style={{fontSize:10,padding:"1px 8px",borderRadius:20,background:h.type==="Government"?C.tealPale:C.saffronPale,color:h.type==="Government"?C.teal:C.saffron,fontWeight:600}}>{h.type}</span>
                  {h.nicu&&<span style={{fontSize:10,padding:"1px 8px",borderRadius:20,background:C.purplePale,color:C.purple,fontWeight:600}}>NICU</span>}
                </div>
                <div style={{height:6,background:C.cream,borderRadius:4,overflow:"hidden",marginBottom:4}}>
                  <div style={{height:"100%",width:h.trust+"%",background:h.trust>=85?C.green:h.trust>=70?C.yellow:C.red,borderRadius:4}}/>
                </div>
                <div style={{fontSize:12,color:C.muted}}>Trust Score: <b style={{color:h.trust>=85?C.green:h.trust>=70?C.yellow:C.red}}>{h.trust}/100</b> · {h.beds} beds</div>
              </div>
              <a href={`tel:${h.phone}`} style={{padding:"7px 14px",borderRadius:8,background:C.greenPale,color:C.green,border:`1px solid ${C.green}`,fontSize:12,fontWeight:700,textDecoration:"none"}}>📞 Call</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN ASHA PORTAL
// ════════════════════════════════════════════════════════════
export default function ASHAPortal() {
  const navigate   = useNavigate();
  const user       = getUser();
  const [patients, setPatients]   = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selected, setSelected]   = useState(null);
  const [filterPreset, setFilterPreset] = useState("ALL");
  const [lang, setLang]           = useState("en");
  const [isOnline, setIsOnline]   = useState(navigator.onLine);

  useEffect(()=>{
    setPatients(getMyPatients(user?.email));
    const on =()=>setIsOnline(true);
    const off=()=>setIsOnline(false);
    window.addEventListener("online",on);
    window.addEventListener("offline",off);
    return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off);};
  },[]);

  const refresh = () => setPatients(getMyPatients(user?.email));
  const handleLogout = () => {localStorage.removeItem("ms_currentUser");navigate("/login");};

  const high = patients.filter(p=>p.risk==="HIGH").length;
  const offlineCount = getOfflineQ().length;

  const TABS = [
    {id:"dashboard", label:LANG[lang].dashboard,  icon:"📊"},
    {id:"patients",  label:LANG[lang].patients,   icon:"👩"},
    {id:"register",  label:LANG[lang].register,   icon:"➕"},
    {id:"analytics", label:LANG[lang].analytics,  icon:"📈"},
    {id:"resources", label:LANG[lang].resources,  icon:"📚"},
  ];

  return (
    <div style={{minHeight:"100vh",background:C.cream,fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      {/* Topbar */}
      <div style={{background:`linear-gradient(135deg,${C.teal},${C.tealDark})`,padding:"0 24px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 12px rgba(13,110,110,0.25)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>🌸</span>
          <span style={{fontFamily:"Georgia,serif",fontSize:17,fontWeight:700,color:"white"}}>Matriseva</span>
          <span style={{background:"rgba(255,255,255,0.2)",color:"white",fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:20}}>ASHA PORTAL</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {high>0&&<span style={{background:C.red,color:"white",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20}}>🔴 {high} High Risk</span>}
          {offlineCount>0&&<span style={{background:C.yellow,color:"white",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20}}>📶 {offlineCount} offline</span>}
          {/* Language selector */}
          <select value={lang} onChange={e=>setLang(e.target.value)} style={{background:"rgba(255,255,255,0.2)",color:"white",border:"none",borderRadius:7,padding:"4px 8px",fontSize:12,cursor:"pointer",outline:"none"}}>
            <option value="en" style={{color:C.charcoal}}>🌐 English</option>
            <option value="hi" style={{color:C.charcoal}}>🇮🇳 हिंदी</option>
            <option value="ur" style={{color:C.charcoal}}>اردو</option>
          </select>
          <span style={{fontSize:11,padding:"3px 9px",borderRadius:20,background:isOnline?"rgba(22,163,74,0.3)":"rgba(220,38,38,0.3)",color:"white",fontWeight:600}}>{isOnline?"🟢 Online":"🔴 Offline"}</span>
          <span style={{fontSize:13,color:"rgba(255,255,255,0.85)",fontWeight:600}}>👋 {user?.name}</span>
          <button onClick={handleLogout} style={{background:"rgba(255,255,255,0.18)",color:"white",border:"none",borderRadius:7,padding:"5px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Logout</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,padding:"0 24px",display:"flex",gap:0,overflowX:"auto"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>{setActiveTab(t.id);setSelected(null);}} style={{padding:"13px 18px",border:"none",borderBottom:`3px solid ${activeTab===t.id?C.teal:"transparent"}`,background:"transparent",color:activeTab===t.id?C.teal:C.muted,fontSize:12,fontWeight:activeTab===t.id?700:500,cursor:"pointer",display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap",fontFamily:"inherit"}}>
            {t.icon} {t.label}
            {t.id==="patients"&&patients.length>0&&<span style={{background:C.teal,color:"white",borderRadius:20,fontSize:10,fontWeight:700,padding:"1px 6px"}}>{patients.length}</span>}
            {t.id==="patients"&&high>0&&<span style={{background:C.red,color:"white",borderRadius:20,fontSize:10,fontWeight:700,padding:"1px 6px"}}>{high}!</span>}
          </button>
        ))}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8,fontSize:11,color:C.muted,flexShrink:0}}>
          <span>🏥 {user?.phc||"PHC "+user?.block}</span>
          <span>ASHA ID: <b style={{color:C.teal}}>{user?.ashaId||"—"}</b></span>
        </div>
      </div>

      {/* Content */}
      <div style={{maxWidth:1020,margin:"0 auto",padding:"20px 18px"}}>
        {activeTab==="dashboard" && <DashboardTab patients={patients} user={user} onNavigate={(tab,filter)=>{setActiveTab(tab);if(filter)setFilterPreset(filter);}} lang={lang}/>}
        {activeTab==="patients"  && !selected && <PatientListTab patients={patients} onSelect={p=>{setSelected(p);}} onAdd={()=>setActiveTab("register")} filterPreset={filterPreset} lang={lang}/>}
        {activeTab==="patients"  && selected  && <PatientDetailTab patient={selected} onBack={()=>setSelected(null)} onUpdate={p=>{refresh();setSelected(p);}}/>}
        {activeTab==="register"  && <RegisterTab user={user} onSuccess={()=>{refresh();setActiveTab("patients");}} lang={lang}/>}
        {activeTab==="analytics" && <AnalyticsTab patients={patients}/>}
        {activeTab==="resources" && <ResourcesTab/>}
      </div>
    </div>
  );
}