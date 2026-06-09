// src/pages/ASHAPortal.jsx — Enhanced with Doctor Assign + Appointments + Analytics

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { patientsAPI, appointmentsAPI, authAPI, mlAPI, getUser, clearAuth } from "../services/api";
import AIAssistant from "../components/AIAssistant";
import NotificationBell from "../components/NotificationBell";


const C = {
  saffron:"#E8621A", saffronPale:"#FDF0E8", saffronDark:"#C04B2D",
  teal:"#0D6E6E", tealPale:"#E8F5F5", tealDark:"#094f4f",
  cream:"#F4F0EB", charcoal:"#1C1C1C", muted:"#6B6260", border:"#E0D8D0",
  red:"#DC2626", redPale:"#FEE2E2", yellow:"#D97706", yellowPale:"#FEF3C7",
  green:"#16A34A", greenPale:"#DCFCE7", white:"#FFFFFF",
  navy:"#1E3A5F", navyPale:"#EFF6FF", purple:"#7C3AED", purplePale:"#F5F3FF",
  blue:"#2563EB", bluePale:"#EFF6FF",
};

const RISK = {
  HIGH:   { color:C.red,    bg:C.redPale,    emoji:"🔴", label:"High Risk"  },
  MEDIUM: { color:C.yellow, bg:C.yellowPale, emoji:"🟡", label:"Moderate"   },
  LOW:    { color:C.green,  bg:C.greenPale,  emoji:"🟢", label:"Low Risk"   },
};

const SYMPTOMS_LIST = [
  {id:"bleeding", label:"Vaginal Bleeding",      weight:35},
  {id:"headache", label:"Severe Headache",        weight:20},
  {id:"vision",   label:"Blurred Vision",         weight:25},
  {id:"swelling", label:"Swelling (face/hands)",  weight:15},
  {id:"pain",     label:"Abdominal Pain",         weight:25},
  {id:"fetal",    label:"Reduced Fetal Movement", weight:30},
  {id:"vomiting", label:"Severe Vomiting",        weight:10},
  {id:"fever",    label:"High Fever",             weight:15},
];

const LANG = {
  en: { dashboard:"Dashboard", patients:"Patients", register:"Register", appointments:"Appointments", analytics:"Analytics", resources:"Resources", highRisk:"High Risk", moderate:"Moderate", lowRisk:"Low Risk", total:"Total", searchPlaceholder:"🔍 Search by name or village…" },
  hi: { dashboard:"डैशबोर्ड", patients:"मरीज़", register:"पंजीकरण", appointments:"अपॉइंटमेंट", analytics:"विश्लेषण", resources:"संसाधन", highRisk:"उच्च जोखिम", moderate:"मध्यम", lowRisk:"कम जोखिम", total:"कुल", searchPlaceholder:"🔍 नाम या गांव से खोजें…" },
  ur: { dashboard:"ڈیش بورڈ", patients:"مریض", register:"رجسٹریشن", appointments:"ملاقات", analytics:"تجزیہ", resources:"وسائل", highRisk:"زیادہ خطرہ", moderate:"اعتدال", lowRisk:"کم خطرہ", total:"کل", searchPlaceholder:"🔍 نام یا گاؤں سے تلاش کریں…" },
};

function getANCStatus(p) {
  const lastVisit = p.visits?.[0]?.recorded_at ? new Date(p.visits[0].recorded_at) : new Date(p.registered_at);
  const daysSince = Math.floor((Date.now() - lastVisit) / 86400000);
  const weeks = Number(p.weeks) || 20;
  const intervalDays = weeks < 28 ? 28 : weeks < 36 ? 14 : 7;
  return { overdue: daysSince > intervalDays, daysUntilNext: Math.max(0, intervalDays - daysSince), daysSinceVisit: daysSince };
}

function TrendChart({ visits, field, label, color, dangerLine }) {
  const vals = visits.slice().reverse()
    .map(v => field === "bp" ? Number(v.bp_sys)||0 : Number(v[field])||0)
    .filter(v => v > 0);
  if (vals.length < 2) return <div style={{fontSize:12,color:C.muted,textAlign:"center",padding:"12px 0"}}>Need 2+ visits for trend</div>;
  const mn=Math.min(...vals)-5, mx=Math.max(...vals,dangerLine||0)+5, range=mx-mn||1;
  const W=240, H=60;
  const pts=vals.map((v,i)=>({x:i*(W/(vals.length-1)),y:H-((v-mn)/range*H)}));
  const d=pts.map((p,i)=>`${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <div>
      <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{label} trend ({vals.length} visits)</div>
      <svg width={W} height={H+10} style={{overflow:"visible"}}>
        {dangerLine && <line x1={0} y1={H-((dangerLine-mn)/range*H)} x2={W} y2={H-((dangerLine-mn)/range*H)} stroke={C.red} strokeWidth={1} strokeDasharray="4,3" opacity={0.6}/>}
        <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round"/>
        {pts.map((p,i)=>(
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill={color}/>
            <text x={p.x} y={H+12} textAnchor="middle" fontSize={8} fill={C.muted}>{vals[i]}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// REGISTER TAB
// ══════════════════════════════════════════════════════════════
function RegisterTab({ user, onSuccess, lang, doctors }) {
  const [step, setStep]         = useState(1);
  const [errors, setErrors]     = useState({});
  const [saving, setSaving]     = useState(false);
  const [done, setDone]         = useState(null);
  const [listening, setListening] = useState(false);

  const initD = {
    name:"", phone:"", age:"", weeks:"", village:"", district:user?.district||"", block:user?.block||"",
    guardian:"", gravida:"1", para:"0", lmp:"", blood_group:"", pregnancy_type:"Singleton",
    bp_sys:"", bp_dia:"", hb:"", weight:"", sugar:"", anemia:"None", hiv:"Negative",
    symptoms:[], prev_complications:"", anc_done:"Yes",
    doctor_id:"", doctor_name:"",
  };
  const [d, setD] = useState(initD);

  const set = (k, v) => { setD(p=>({...p,[k]:v})); setErrors(e=>{const n={...e};delete n[k];return n;}); };
  const toggleSym = (id) => setD(p=>({...p, symptoms:p.symptoms.includes(id)?p.symptoms.filter(s=>s!==id):[...p.symptoms,id]}));

  const startVoice = (field) => {
    if (!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)){alert("Voice not supported. Try Chrome.");return;}
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    const rec=new SR();
    rec.lang=lang==="hi"?"hi-IN":lang==="ur"?"ur-PK":"en-IN";
    rec.interimResults=false;
    setListening(true);
    rec.onresult=(e)=>{set(field,e.results[0][0].transcript);setListening(false);};
    rec.onerror=()=>setListening(false);
    rec.onend=()=>setListening(false);
    rec.start();
  };

  const validate = () => {
    const e={};
    if(step===1){
      if(!d.name.trim())                  e.name="Required";
      if(!/^[6-9]\d{9}$/.test(d.phone))  e.phone="Valid 10-digit number";
      if(!d.age||d.age<10||d.age>60)     e.age="Valid age";
      if(!d.weeks)                        e.weeks="Required";
      if(!d.village.trim())               e.village="Required";
    }
    if(step===2){
      if(!d.lmp)         e.lmp="Required";
      if(!d.blood_group) e.blood_group="Required";
    }
    if(step===3){
      if(!d.bp_sys||!d.bp_dia) e.bp_sys="BP required";
      if(!d.hb||d.hb<1||d.hb>25) e.hb="Valid Hb (1–25)";
      if(!d.weight) e.weight="Required";
    }
    setErrors(e);
    return Object.keys(e).length===0;
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      let risk={level:"MEDIUM",score:50,flags:[]};
      try {
        risk=await mlAPI.predict({
          age:Number(d.age), bp_sys:Number(d.bp_sys), bp_dia:Number(d.bp_dia),
          hb:Number(d.hb), sugar:Number(d.sugar)||90, body_temp:98, heart_rate:75,
        });
      } catch(mlErr){ console.warn("ML predict failed:",mlErr.message); }

      const patient=await patientsAPI.create({
        ...d,
        age:Number(d.age), weeks:Number(d.weeks),
        bp_sys:Number(d.bp_sys), bp_dia:Number(d.bp_dia),
        hb:Number(d.hb), weight:Number(d.weight),
        sugar:Number(d.sugar)||null,
        asha_name:user?.name,
        risk:risk.level, risk_score:risk.score, risk_flags:risk.flags,
        status:"pending", visits:[],
      });
      setDone(patient);
      onSuccess(patient);
    } catch(err){ alert("Registration failed: "+err.message); }
    finally { setSaving(false); }
  };

  const handleNext=()=>{if(!validate())return;if(step<4)setStep(step+1);else handleSubmit();};

  const inputStyle=(err)=>({width:"100%",padding:"9px 11px",borderRadius:8,border:`1.5px solid ${err?C.red:C.border}`,fontSize:13,fontFamily:"inherit",outline:"none",background:C.cream,boxSizing:"border-box"});
  const labelStyle={fontSize:12,fontWeight:600,display:"block",marginBottom:3,color:C.charcoal};

  if(done){
    const r=RISK[done.risk]||RISK.LOW;
    return(
      <div style={{background:C.white,borderRadius:16,padding:"36px 28px",textAlign:"center",border:`2px solid ${r.color}`}}>
        <div style={{fontSize:48,marginBottom:12}}>{r.emoji}</div>
        <div style={{fontFamily:"Georgia,serif",fontSize:20,fontWeight:700,marginBottom:4}}>{done.name} Registered!</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:12}}>ID: {done.id}</div>
        <div style={{background:r.bg,borderRadius:10,padding:"10px 18px",display:"inline-block",marginBottom:8}}>
          <span style={{fontSize:15,fontWeight:700,color:r.color}}>{r.emoji} {r.label} — Score: {done.risk_score}/100</span>
        </div>
        {done.doctor_name&&<div style={{fontSize:13,color:C.teal,marginTop:8,fontWeight:600}}>👨‍⚕️ Assigned to Dr. {done.doctor_name}</div>}
        {(done.risk_flags||[]).length>0&&(
          <div style={{marginTop:8,display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
            {done.risk_flags.map(f=><span key={f} style={{fontSize:11,background:C.redPale,color:C.red,padding:"2px 10px",borderRadius:20,fontWeight:600}}>⚠ {f}</span>)}
          </div>
        )}
        <br/>
        <button onClick={()=>{setDone(null);setStep(1);setD(initD);}}
          style={{background:C.teal,color:"white",border:"none",borderRadius:9,padding:"10px 26px",fontSize:13,fontWeight:700,cursor:"pointer",marginTop:12}}>
          + Register Another
        </button>
      </div>
    );
  }

  return(
    <div style={{background:C.white,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"}}>
      {/* Progress bar */}
      <div style={{height:4,background:C.cream}}>
        <div style={{height:"100%",width:`${((step-1)/4)*100}%`,background:`linear-gradient(90deg,${C.teal},${C.saffron})`,transition:"width 0.4s"}}/>
      </div>

      {/* Step tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`}}>
        {[{label:"Basic Info",icon:"👩"},{label:"Pregnancy",icon:"🤰"},{label:"Vitals",icon:"🩺"},{label:"Assign Doctor",icon:"👨‍⚕️"}].map((s,i)=>(
          <div key={i} style={{flex:1,padding:"12px",textAlign:"center",borderBottom:`3px solid ${step===i+1?C.saffron:"transparent"}`,cursor:i+1<step?"pointer":"default"}} onClick={()=>i+1<step&&setStep(i+1)}>
            <div style={{fontSize:16,marginBottom:2}}>{i+1<step?"✅":s.icon}</div>
            <div style={{fontSize:11,fontWeight:step===i+1?700:400,color:step===i+1?C.saffron:i+1<step?C.green:C.muted}}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{padding:"22px 26px"}}>

        {/* Step 1 — Basic Info */}
        {step===1&&(
          <>
            <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>👩 Basic Patient Info
              <span style={{fontSize:11,color:C.teal,fontWeight:600,marginLeft:10}}>🎙️ Click mic for voice input</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
              {[["Full Name","name","text"],["Mobile Number","phone","tel"],["Age","age","number"],["Guardian","guardian","text"],["Village / Mohalla","village","text"]].map(([label,key,type])=>(
                <div key={key} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <label style={labelStyle}>{label}</label>
                    <button type="button" onClick={()=>startVoice(key)} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:listening?C.red:C.teal,padding:0}}>{listening?"🔴":"🎙️"}</button>
                  </div>
                  <input type={type} value={d[key]} onChange={e=>set(key,e.target.value)} style={inputStyle(errors[key])}/>
                  {errors[key]&&<div style={{fontSize:11,color:C.red,marginTop:2}}>⚠ {errors[key]}</div>}
                </div>
              ))}
              <div style={{marginBottom:12}}>
                <label style={labelStyle}>Pregnancy Week <span style={{color:C.red}}>*</span></label>
                <select value={d.weeks} onChange={e=>set("weeks",e.target.value)} style={inputStyle(errors.weeks)}>
                  <option value="">— Select —</option>
                  {Array.from({length:42},(_,i)=><option key={i+1} value={i+1}>Week {i+1}</option>)}
                </select>
                {errors.weeks&&<div style={{fontSize:11,color:C.red,marginTop:2}}>⚠ {errors.weeks}</div>}
              </div>
              <div style={{marginBottom:12}}>
                <label style={labelStyle}>District</label>
                <select value={d.district} onChange={e=>set("district",e.target.value)} style={inputStyle()}>
                  <option value="">— Select —</option>
                  {["Saharanpur","Muzaffarnagar","Shamli","Haridwar","Dehradun","Other"].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </>
        )}

        {/* Step 2 — Pregnancy */}
        {step===2&&(
          <>
            <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>🤰 Pregnancy History</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
              <div style={{marginBottom:12}}>
                <label style={labelStyle}>LMP Date <span style={{color:C.red}}>*</span></label>
                <input type="date" value={d.lmp} onChange={e=>set("lmp",e.target.value)} style={inputStyle(errors.lmp)}/>
                {errors.lmp&&<div style={{fontSize:11,color:C.red,marginTop:2}}>⚠ {errors.lmp}</div>}
              </div>
              <div style={{marginBottom:12}}>
                <label style={labelStyle}>Blood Group <span style={{color:C.red}}>*</span></label>
                <select value={d.blood_group} onChange={e=>set("blood_group",e.target.value)} style={inputStyle(errors.blood_group)}>
                  <option value="">— Select —</option>
                  {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(o=><option key={o}>{o}</option>)}
                </select>
                {errors.blood_group&&<div style={{fontSize:11,color:C.red,marginTop:2}}>⚠ {errors.blood_group}</div>}
              </div>
              {[["Gravida","gravida",["1","2","3","4","5+"]],["Para","para",["0","1","2","3","4+"]]].map(([label,key,opts])=>(
                <div key={key} style={{marginBottom:12}}>
                  <label style={labelStyle}>{label}</label>
                  <select value={d[key]} onChange={e=>set(key,e.target.value)} style={inputStyle()}>
                    {opts.map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div style={{marginBottom:12}}>
                <label style={labelStyle}>Pregnancy Type</label>
                <select value={d.pregnancy_type} onChange={e=>set("pregnancy_type",e.target.value)} style={inputStyle()}>
                  {["Singleton","Twin","Triplet"].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              <div style={{marginBottom:12}}>
                <label style={labelStyle}>ANC Registered?</label>
                <select value={d.anc_done} onChange={e=>set("anc_done",e.target.value)} style={inputStyle()}>
                  {["Yes","No"].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div style={{marginBottom:12}}>
              <label style={labelStyle}>Previous Complications</label>
              <textarea value={d.prev_complications} onChange={e=>set("prev_complications",e.target.value)} rows={2}
                style={{width:"100%",padding:"9px 11px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",outline:"none",background:C.cream,resize:"vertical",boxSizing:"border-box"}}/>
            </div>
          </>
        )}

        {/* Step 3 — Vitals */}
        {step===3&&(
          <>
            <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>🩺 Current Vitals
              <span style={{fontSize:11,color:C.teal,fontWeight:500,marginLeft:10}}>Risk will be calculated by ML model</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 12px"}}>
              {[["BP Systolic","bp_sys","e.g. 120"],["BP Diastolic","bp_dia","e.g. 80"],["Hemoglobin (g/dL)","hb","e.g. 11.5"],["Weight (kg)","weight","e.g. 58"],["Blood Sugar (mg/dL)","sugar","e.g. 95"]].map(([label,key,ph])=>(
                <div key={key} style={{marginBottom:12}}>
                  <label style={labelStyle}>{label}</label>
                  <input type="number" value={d[key]} onChange={e=>set(key,e.target.value)} placeholder={ph} style={inputStyle(errors[key])}/>
                  {errors[key]&&<div style={{fontSize:11,color:C.red,marginTop:2}}>⚠ {errors[key]}</div>}
                </div>
              ))}
              <div style={{marginBottom:12}}>
                <label style={labelStyle}>HIV Status</label>
                <select value={d.hiv} onChange={e=>set("hiv",e.target.value)} style={inputStyle()}>
                  {["Negative","Positive","Not Tested"].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div style={{marginBottom:12}}>
              <label style={labelStyle}>Symptoms Observed</label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {SYMPTOMS_LIST.map(s=>(
                  <div key={s.id} onClick={()=>toggleSym(s.id)}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,border:`1.5px solid ${d.symptoms.includes(s.id)?C.red:C.border}`,background:d.symptoms.includes(s.id)?C.redPale:C.cream,cursor:"pointer"}}>
                    <span style={{fontSize:15}}>{d.symptoms.includes(s.id)?"☑":"☐"}</span>
                    <span style={{fontSize:12,fontWeight:d.symptoms.includes(s.id)?600:400,color:d.symptoms.includes(s.id)?C.red:C.charcoal}}>{s.label}</span>
                    {s.weight>=25&&<span style={{marginLeft:"auto",fontSize:9,color:C.red,fontWeight:700}}>HIGH</span>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Step 4 — Assign Doctor */}
        {step===4&&(
          <>
            <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>👨‍⚕️ Assign Doctor
              <span style={{fontSize:11,color:C.muted,fontWeight:400,marginLeft:10}}>Optional — can be changed later</span>
            </div>
            {doctors.length===0?(
              <div style={{background:C.yellowPale,borderRadius:12,padding:"20px",textAlign:"center",border:`1px solid ${C.yellow}`}}>
                <div style={{fontSize:24,marginBottom:8}}>👨‍⚕️</div>
                <div style={{fontSize:13,color:C.yellow,fontWeight:600}}>No doctors registered yet</div>
                <div style={{fontSize:12,color:C.muted,marginTop:4}}>Patient will be auto-assigned when doctor registers</div>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {/* No doctor option */}
                <div onClick={()=>{set("doctor_id","");set("doctor_name","");}}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderRadius:12,border:`2px solid ${!d.doctor_id?C.teal:C.border}`,background:!d.doctor_id?C.tealPale:C.white,cursor:"pointer"}}>
                  <div style={{width:40,height:40,borderRadius:"50%",background:C.cream,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>⏳</div>
                  <div>
                    <div style={{fontSize:14,fontWeight:600}}>Auto Assign Later</div>
                    <div style={{fontSize:12,color:C.muted}}>System will assign available doctor</div>
                  </div>
                  {!d.doctor_id&&<span style={{marginLeft:"auto",fontSize:18,color:C.teal}}>✓</span>}
                </div>
                {doctors.map(doc=>(
                  <div key={doc.id} onClick={()=>{set("doctor_id",doc.id);set("doctor_name",doc.name);}}
                    style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderRadius:12,border:`2px solid ${d.doctor_id===doc.id?C.teal:C.border}`,background:d.doctor_id===doc.id?C.tealPale:C.white,cursor:"pointer"}}>
                    <div style={{width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,${C.navy},${C.teal})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"white",fontWeight:700}}>
                      {doc.name?.charAt(0)||"D"}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:700}}>Dr. {doc.name}</div>
                      <div style={{fontSize:12,color:C.muted}}>{doc.email}{doc.phone&&" · "+doc.phone}</div>
                    </div>
                    {d.doctor_id===doc.id&&<span style={{fontSize:18,color:C.teal}}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 26px",borderTop:`1px solid ${C.border}`,background:C.cream}}>
        <button onClick={()=>{if(step>1){setStep(step-1);setErrors({});}}} disabled={step===1}
          style={{padding:"9px 20px",borderRadius:8,border:`1.5px solid ${C.border}`,background:C.white,fontSize:13,fontWeight:600,cursor:step===1?"not-allowed":"pointer",opacity:step===1?0.5:1}}>← Back</button>
        <span style={{fontSize:12,color:C.muted}}>Step {step} / 4</span>
        <button onClick={handleNext} disabled={saving}
          style={{padding:"9px 24px",borderRadius:8,border:"none",background:saving?C.muted:step===4?C.green:C.saffron,color:"white",fontSize:13,fontWeight:700,cursor:saving?"not-allowed":"pointer"}}>
          {saving?(step===4?"Predicting & Saving…":"Saving…"):step===4?"✓ Register":"Next →"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// PATIENT LIST TAB
// ══════════════════════════════════════════════════════════════
function PatientListTab({ patients, loading, onSelect, onAdd, filterPreset, lang, doctors, onAssignDoctor }) {
  const T=LANG[lang];
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState(filterPreset||"ALL");
  const [sortBy,setSortBy]=useState("risk");
  const [assignModal,setAssignModal]=useState(null);
  const [assigning,setAssigning]=useState(false);
  const [selectedDoc,setSelectedDoc]=useState("");

  const filtered=patients
    .filter(p=>filter==="ALL"||p.risk===filter)
    .filter(p=>!search||(p.name||"").toLowerCase().includes(search.toLowerCase())||(p.village||"").toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>{
      if(sortBy==="risk"){const o={HIGH:0,MEDIUM:1,LOW:2};return(o[a.risk]??3)-(o[b.risk]??3);}
      if(sortBy==="week") return Number(b.weeks)-Number(a.weeks);
      if(sortBy==="name") return a.name?.localeCompare(b.name);
      return new Date(b.registered_at)-new Date(a.registered_at);
    });

  const handleAssign=async()=>{
    if(!selectedDoc||!assignModal) return;
    setAssigning(true);
    const doc=doctors.find(d=>d.id===selectedDoc);
    try{
      await onAssignDoctor(assignModal.id,selectedDoc,doc?.name||"");
      setAssignModal(null);setSelectedDoc("");
    }catch(err){alert("Failed: "+err.message);}
    finally{setAssigning(false);}
  };

  if(loading) return <div style={{textAlign:"center",padding:"48px",color:C.muted,fontSize:14}}>Loading patients…</div>;

  return(
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
          <button onClick={onAdd} style={{background:C.saffron,color:"white",border:"none",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Register</button>
        </div>
      </div>

      <div style={{fontSize:12,color:C.muted,marginBottom:8,fontWeight:600}}>{filtered.length} patients</div>

      {filtered.length===0?(
        <div style={{background:C.white,borderRadius:13,padding:"40px 28px",textAlign:"center",border:`1px solid ${C.border}`}}>
          <div style={{fontSize:40,marginBottom:10}}>👩</div>
          <div style={{fontSize:14,fontWeight:600,marginBottom:8}}>No patients found</div>
          <button onClick={onAdd} style={{background:C.saffron,color:"white",border:"none",borderRadius:9,padding:"10px 22px",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Register First Patient</button>
        </div>
      ):filtered.map(p=>{
        const r=p.risk?RISK[p.risk]:{color:C.muted,bg:C.cream,emoji:"⬜",label:"Pending"};
        const anc=getANCStatus(p);
        return(
          <div key={p.id} style={{background:C.white,borderRadius:12,padding:"15px 18px",border:`1.5px solid ${p.risk==="HIGH"?C.red+"50":C.border}`,marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:13,cursor:"pointer"}} onClick={()=>onSelect(p)}
              onMouseEnter={e=>{e.currentTarget.parentElement.style.borderColor=C.teal;}}
              onMouseLeave={e=>{e.currentTarget.parentElement.style.borderColor=p.risk==="HIGH"?C.red+"50":C.border;}}>
              <div style={{width:44,height:44,borderRadius:11,background:r.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{r.emoji}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3,flexWrap:"wrap"}}>
                  <span style={{fontSize:14,fontWeight:700}}>{p.name}</span>
                  <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,background:r.bg,color:r.color}}>{r.label}</span>
                  {p.risk_score&&<span style={{fontSize:10,color:C.muted}}>Score: {p.risk_score}</span>}
                  {p.doctor_name&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:C.tealPale,color:C.teal,fontWeight:600}}>👨‍⚕️ Dr. {p.doctor_name}</span>}
                </div>
                <div style={{fontSize:12,color:C.muted,marginBottom:3}}>Wk {p.weeks} · Age {p.age} · {p.village} · {p.phone}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {anc.overdue&&<span style={{fontSize:10,background:C.yellowPale,color:C.yellow,padding:"1px 7px",borderRadius:20,fontWeight:600}}>⏰ Visit Overdue</span>}
                  {(p.risk_flags||[]).slice(0,2).map(f=><span key={f} style={{fontSize:10,background:C.redPale,color:C.red,padding:"1px 7px",borderRadius:20,fontWeight:600}}>⚠ {f}</span>)}
                </div>
              </div>
              <div style={{fontSize:11,color:C.muted,textAlign:"right",flexShrink:0}}>
                <div>{p.visits?.length||0} visits</div>
                <div style={{marginTop:2}}>ID: {p.id?.toString().slice(-6)}</div>
              </div>
            </div>
            {/* Action buttons */}
            <div style={{display:"flex",gap:6,marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`,flexWrap:"wrap"}}>
              <button onClick={()=>onSelect(p)} style={{padding:"5px 12px",borderRadius:7,border:`1.5px solid ${C.teal}`,background:C.white,color:C.teal,fontSize:11,fontWeight:600,cursor:"pointer"}}>View Details →</button>
              <button onClick={e=>{e.stopPropagation();setAssignModal(p);setSelectedDoc(p.doctor_id||"");}}
                style={{padding:"5px 12px",borderRadius:7,border:`1.5px solid ${C.purple}`,background:C.white,color:C.purple,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                👨‍⚕️ {p.doctor_name?"Change Doctor":"Assign Doctor"}
              </button>
              <a href={`tel:${p.phone}`} style={{padding:"5px 12px",borderRadius:7,border:`1.5px solid ${C.green}`,background:C.white,color:C.green,fontSize:11,fontWeight:600,textDecoration:"none"}}>📞 Call</a>
            </div>
          </div>
        );
      })}

      {/* Assign Doctor Modal */}
      {assignModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{background:C.white,borderRadius:16,padding:28,width:420,maxWidth:"90vw"}}>
            <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>👨‍⚕️ Assign Doctor</div>
            <div style={{fontSize:13,color:C.muted,marginBottom:16}}>Patient: <b>{assignModal.name}</b></div>
            {doctors.length===0?(
              <div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"20px 0"}}>No doctors available</div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                {doctors.map(doc=>(
                  <div key={doc.id} onClick={()=>setSelectedDoc(doc.id)}
                    style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,border:`2px solid ${selectedDoc===doc.id?C.teal:C.border}`,background:selectedDoc===doc.id?C.tealPale:C.white,cursor:"pointer"}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${C.navy},${C.teal})`,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:16}}>
                      {doc.name?.charAt(0)||"D"}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600}}>Dr. {doc.name}</div>
                      <div style={{fontSize:12,color:C.muted}}>{doc.email}</div>
                    </div>
                    {selectedDoc===doc.id&&<span style={{color:C.teal,fontSize:18}}>✓</span>}
                  </div>
                ))}
              </div>
            )}
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>{setAssignModal(null);setSelectedDoc("");}} style={{flex:1,padding:"9px",borderRadius:9,border:`1.5px solid ${C.border}`,background:C.white,cursor:"pointer",fontSize:13}}>Cancel</button>
              <button onClick={handleAssign} disabled={assigning||!selectedDoc}
                style={{flex:1,padding:"9px",borderRadius:9,border:"none",background:assigning||!selectedDoc?C.muted:C.teal,color:"white",fontSize:13,fontWeight:700,cursor:assigning||!selectedDoc?"not-allowed":"pointer"}}>
                {assigning?"Assigning…":"Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// PATIENT DETAIL TAB
// ══════════════════════════════════════════════════════════════
function PatientDetailTab({ patient:init, onBack, onUpdate, doctors, onAssignDoctor }) {
  const [patient,setPatient]=useState(init);
  const [showVitals,setShowVitals]=useState(false);
  const [saving,setSaving]=useState(false);
  const [showAssign,setShowAssign]=useState(false);
  const [selectedDoc,setSelectedDoc]=useState(patient.doctor_id||"");
  const [assigning,setAssigning]=useState(false);
  const r=patient.risk?RISK[patient.risk]:{color:C.muted,bg:C.cream,emoji:"⬜",label:"Pending"};
  const anc=getANCStatus(patient);

  const [vForm,setVForm]=useState({bp_sys:"",bp_dia:"",hb:"",weight:"",sugar:"",symptoms:[],note:"",date:new Date().toISOString().split("T")[0]});
  const toggleVSym=(id)=>setVForm(p=>({...p,symptoms:p.symptoms.includes(id)?p.symptoms.filter(s=>s!==id):[...p.symptoms,id]}));

  const saveVisit=async()=>{
    if(!vForm.bp_sys||!vForm.bp_dia){alert("Please enter BP");return;}
    setSaving(true);
    try{
      let newRisk={level:patient.risk,score:patient.risk_score,flags:patient.risk_flags};
      try{
        newRisk=await mlAPI.predict({age:patient.age,bp_sys:Number(vForm.bp_sys),bp_dia:Number(vForm.bp_dia),hb:Number(vForm.hb)||patient.hb,sugar:Number(vForm.sugar)||90,body_temp:98,heart_rate:75});
      }catch(_){}
      const updated=await patientsAPI.addVisit(patient.id,{date:vForm.date,bp_sys:Number(vForm.bp_sys),bp_dia:Number(vForm.bp_dia),hb:Number(vForm.hb)||null,weight:Number(vForm.weight)||null,sugar:Number(vForm.sugar)||null,symptoms:vForm.symptoms,note:vForm.note});
      await patientsAPI.update(patient.id,{risk:newRisk.level,risk_score:newRisk.score,risk_flags:newRisk.flags});
      const refreshed={...updated,risk:newRisk.level,risk_score:newRisk.score,risk_flags:newRisk.flags};
      setPatient(refreshed);onUpdate(refreshed);
      setShowVitals(false);
      setVForm({bp_sys:"",bp_dia:"",hb:"",weight:"",sugar:"",symptoms:[],note:"",date:new Date().toISOString().split("T")[0]});
    }catch(err){alert("Failed: "+err.message);}
    finally{setSaving(false);}
  };

  const handleAssign=async()=>{
    if(!selectedDoc) return;
    setAssigning(true);
    const doc=doctors.find(d=>d.id===selectedDoc);
    try{
      const updated=await onAssignDoctor(patient.id,selectedDoc,doc?.name||"");
      setPatient(p=>({...p,doctor_id:selectedDoc,doctor_name:doc?.name||""}));
      setShowAssign(false);
    }catch(err){alert("Failed: "+err.message);}
    finally{setAssigning(false);}
  };

  return(
    <div>
      <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:C.teal,fontSize:13,fontWeight:600,marginBottom:14,display:"flex",alignItems:"center",gap:6}}>← Back to Patients</button>

      {/* Header */}
      <div style={{background:C.white,borderRadius:14,padding:"18px 22px",marginBottom:14,border:`2px solid ${r.color}30`,display:"flex",alignItems:"center",gap:16}}>
        <div style={{width:54,height:54,borderRadius:"50%",background:r.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{r.emoji}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:20,fontWeight:700,fontFamily:"Georgia,serif"}}>{patient.name}</div>
          <div style={{fontSize:13,color:C.muted,marginTop:2}}>Age {patient.age} · Wk {patient.weeks} · {patient.village} · {patient.phone}</div>
          {patient.doctor_name&&<div style={{fontSize:12,color:C.teal,marginTop:4,fontWeight:600}}>👨‍⚕️ Dr. {patient.doctor_name}</div>}
          {anc.overdue&&<span style={{fontSize:11,background:C.yellowPale,color:C.yellow,padding:"2px 9px",borderRadius:20,fontWeight:600,marginTop:6,display:"inline-block"}}>⏰ Visit Overdue by {anc.daysSinceVisit}d</span>}
        </div>
        <div style={{textAlign:"right"}}>
          <span style={{background:r.bg,color:r.color,padding:"7px 16px",borderRadius:20,fontSize:13,fontWeight:700,display:"block"}}>{r.emoji} {r.label}</span>
          {patient.risk_score&&<div style={{fontSize:12,color:C.muted,marginTop:4}}>ML Score: {patient.risk_score}/100</div>}
        </div>
      </div>

      {(patient.risk_flags||[]).length>0&&(
        <div style={{background:C.redPale,borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:13,fontWeight:700,color:C.red}}>⚠ Risk Factors:</span>
          {patient.risk_flags.map(f=><span key={f} style={{fontSize:12,background:C.white,color:C.red,padding:"3px 10px",borderRadius:20,fontWeight:600}}>{f}</span>)}
        </div>
      )}

      {/* Actions */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <button onClick={()=>setShowVitals(!showVitals)} style={{flex:1,minWidth:120,padding:"10px",borderRadius:9,border:`1.5px solid ${C.teal}`,background:showVitals?C.teal:C.tealPale,color:showVitals?"white":C.teal,fontSize:12,fontWeight:700,cursor:"pointer"}}>🩺 Record Vitals</button>
        <button onClick={()=>setShowAssign(true)} style={{flex:1,minWidth:120,padding:"10px",borderRadius:9,border:`1.5px solid ${C.purple}`,background:C.purplePale,color:C.purple,fontSize:12,fontWeight:700,cursor:"pointer"}}>👨‍⚕️ {patient.doctor_name?"Change Doctor":"Assign Doctor"}</button>
        <a href={`tel:${patient.phone}`} style={{flex:1,minWidth:120,padding:"10px",borderRadius:9,border:`1.5px solid ${C.green}`,background:C.greenPale,color:C.green,fontSize:12,fontWeight:700,textDecoration:"none",textAlign:"center"}}>📞 Call Patient</a>
        <button onClick={()=>{window.speechSynthesis?.cancel();const u=new SpeechSynthesisUtterance(`Patient ${patient.name}, Risk: ${patient.risk}, BP ${patient.bp_sys} over ${patient.bp_dia}`);u.lang="hi-IN";window.speechSynthesis?.speak(u);}} style={{flex:1,minWidth:120,padding:"10px",borderRadius:9,border:`1.5px solid ${C.purple}`,background:C.purplePale,color:C.purple,fontSize:12,fontWeight:700,cursor:"pointer"}}>🔊 Read Summary</button>
      </div>

      {/* Assign Doctor Modal */}
      {showAssign&&(
        <div style={{background:C.tealPale,border:`2px solid ${C.teal}`,borderRadius:14,padding:"18px 20px",marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:700,color:C.teal,marginBottom:14}}>👨‍⚕️ Assign Doctor to {patient.name}</div>
          {doctors.length===0?(
            <div style={{fontSize:13,color:C.muted}}>No doctors available</div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
              {doctors.map(doc=>(
                <div key={doc.id} onClick={()=>setSelectedDoc(doc.id)}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:10,border:`2px solid ${selectedDoc===doc.id?C.teal:C.border}`,background:selectedDoc===doc.id?C.white:C.white,cursor:"pointer"}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.navy},${C.teal})`,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:14}}>
                    {doc.name?.charAt(0)||"D"}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600}}>Dr. {doc.name}</div>
                    <div style={{fontSize:11,color:C.muted}}>{doc.email}</div>
                  </div>
                  {selectedDoc===doc.id&&<span style={{color:C.teal,fontSize:16}}>✓</span>}
                </div>
              ))}
            </div>
          )}
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setShowAssign(false)} style={{padding:"8px 18px",borderRadius:8,border:`1.5px solid ${C.border}`,background:C.white,cursor:"pointer",fontSize:12}}>Cancel</button>
            <button onClick={handleAssign} disabled={assigning||!selectedDoc}
              style={{padding:"8px 22px",borderRadius:8,border:"none",background:assigning||!selectedDoc?C.muted:C.teal,color:"white",fontSize:12,fontWeight:700,cursor:assigning||!selectedDoc?"not-allowed":"pointer"}}>
              {assigning?"Assigning…":"Confirm Assign"}
            </button>
          </div>
        </div>
      )}

      {/* Record Vitals */}
      {showVitals&&(
        <div style={{background:C.tealPale,border:`2px solid ${C.teal}`,borderRadius:14,padding:"18px 20px",marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:700,color:C.teal,marginBottom:14}}>🩺 Record Visit</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0 12px"}}>
            {[["BP Sys","bp_sys"],["BP Dia","bp_dia"],["Date","date"],["Hemoglobin","hb"],["Weight(kg)","weight"],["Sugar","sugar"]].map(([l,k])=>(
              <div key={k} style={{marginBottom:10}}>
                <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:3}}>{l}</label>
                <input type={k==="date"?"date":"number"} value={vForm[k]} onChange={e=>setVForm(p=>({...p,[k]:e.target.value}))}
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
            <button onClick={saveVisit} disabled={saving} style={{padding:"8px 22px",borderRadius:8,border:"none",background:saving?C.muted:C.teal,color:"white",fontSize:12,fontWeight:700,cursor:saving?"not-allowed":"pointer"}}>
              {saving?"Saving & Re-predicting…":"Save & Recalculate Risk"}
            </button>
          </div>
        </div>
      )}

      {/* Vitals grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:9,marginBottom:14}}>
        {[
          {label:"BP",value:`${patient.bp_sys||"—"}/${patient.bp_dia||"—"}`,unit:"mmHg",warn:Number(patient.bp_sys)>=140},
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

      {(patient.visits||[]).length>=2&&(
        <div style={{background:C.white,borderRadius:13,padding:"18px 20px",marginBottom:14,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,color:C.muted,marginBottom:12}}>📈 Health Trends</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={{background:C.redPale,borderRadius:9,padding:12}}><TrendChart visits={patient.visits} field="bp" label="BP Systolic" color={C.red} dangerLine={140}/></div>
            <div style={{background:C.tealPale,borderRadius:9,padding:12}}><TrendChart visits={patient.visits} field="hb" label="Hemoglobin" color={C.teal} dangerLine={9}/></div>
          </div>
        </div>
      )}

      <div style={{background:C.white,borderRadius:13,padding:"18px 20px",border:`1px solid ${C.border}`}}>
        <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,color:C.muted,marginBottom:12}}>Visit History ({(patient.visits||[]).length})</div>
        {(patient.visits||[]).length>0?patient.visits.map((v,i)=>(
          <div key={i} style={{borderLeft:`3px solid ${i===0?C.saffron:C.border}`,paddingLeft:13,marginBottom:13}}>
            <div style={{fontSize:13,fontWeight:700}}>{v.date}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:1}}>BP: {v.bp_sys}/{v.bp_dia} · Hb: {v.hb||"—"} · Wt: {v.weight||"—"}kg</div>
            {v.symptoms?.length>0&&<div style={{fontSize:11,color:C.red,marginTop:2}}>⚠ {v.symptoms.join(", ")}</div>}
            {v.note&&<div style={{fontSize:12,color:C.teal,marginTop:2}}>📋 {v.note}</div>}
          </div>
        )):(
          <div style={{textAlign:"center",padding:"18px 0",color:C.muted,fontSize:13}}>No visits yet. Record first visit above.</div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// APPOINTMENTS TAB
// ══════════════════════════════════════════════════════════════
function AppointmentsTab({ patients, doctors, user }) {
  const [appointments,setAppointments]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [saving,setSaving]=useState(false);
  const [aptTab,setAptTab]=useState("upcoming");
  const [form,setForm]=useState({patient_id:"",patient_name:"",doctor_id:"",doctor_name:"",date:"",time:"",type:"ANC Checkup",notes:"",village:""});

  useEffect(()=>{
    appointmentsAPI.getAll().then(setAppointments).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const handleCreate=async()=>{
    if(!form.patient_id||!form.date){alert("Select patient and date");return;}
    setSaving(true);
    try{
      const apt=await appointmentsAPI.create({
        ...form,
        asha_id:user?.id,
        asha_name:user?.name,
        status:"pending",
      });
      setAppointments(p=>[apt,...p]);
      setShowForm(false);
      setForm({patient_id:"",patient_name:"",doctor_id:"",doctor_name:"",date:"",time:"",type:"ANC Checkup",notes:"",village:""});
    }catch(err){alert("Failed: "+err.message);}
    finally{setSaving(false);}
  };

  const today=new Date().toISOString().slice(0,10);
  const upcoming=appointments.filter(a=>a.date>=today&&a.status!=="cancelled");
  const past=appointments.filter(a=>a.date<today||a.status==="cancelled");
  const shown=aptTab==="upcoming"?upcoming:past;

  const statusColor=(s)=>({pending:{bg:C.yellowPale,text:C.yellow},confirmed:{bg:C.greenPale,text:C.green},completed:{bg:C.navyPale,text:C.navy},cancelled:{bg:C.redPale,text:C.red}}[s]||{bg:C.navyPale,text:C.navy});

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{display:"flex",gap:8}}>
          {[["upcoming","📅 Upcoming"],["past","📋 Past"]].map(([id,label])=>(
            <button key={id} onClick={()=>setAptTab(id)} style={{padding:"7px 16px",borderRadius:8,border:`1.5px solid ${aptTab===id?C.saffron:C.border}`,background:aptTab===id?C.saffron:C.white,color:aptTab===id?"white":C.muted,fontSize:12,fontWeight:600,cursor:"pointer"}}>{label}</button>
          ))}
        </div>
        <button onClick={()=>setShowForm(true)} style={{background:C.saffron,color:"white",border:"none",borderRadius:9,padding:"9px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Book Appointment</button>
      </div>

      {showForm&&(
        <div style={{background:C.white,borderRadius:14,padding:22,border:`2px solid ${C.saffron}`,marginBottom:18}}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:16}}>📅 Book New Appointment</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Patient <span style={{color:C.red}}>*</span></label>
              <select value={form.patient_id} onChange={e=>{
                const p=patients.find(p=>p.id===e.target.value);
                setForm(f=>({...f,patient_id:e.target.value,patient_name:p?.name||"",village:p?.village||"",doctor_id:p?.doctor_id||"",doctor_name:p?.doctor_name||""}));
              }} style={{width:"100%",padding:"9px 11px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",outline:"none",background:C.cream,boxSizing:"border-box"}}>
                <option value="">— Select Patient —</option>
                {patients.map(p=><option key={p.id} value={p.id}>{p.name} · {p.village}</option>)}
              </select>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Doctor</label>
              <select value={form.doctor_id} onChange={e=>{
                const doc=doctors.find(d=>d.id===e.target.value);
                setForm(f=>({...f,doctor_id:e.target.value,doctor_name:doc?.name||""}));
              }} style={{width:"100%",padding:"9px 11px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",outline:"none",background:C.cream,boxSizing:"border-box"}}>
                <option value="">— Select Doctor —</option>
                {doctors.map(d=><option key={d.id} value={d.id}>Dr. {d.name}</option>)}
              </select>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Date <span style={{color:C.red}}>*</span></label>
              <input type="date" value={form.date} min={today} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
                style={{width:"100%",padding:"9px 11px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",outline:"none",background:C.cream,boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Time</label>
              <input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}
                style={{width:"100%",padding:"9px 11px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",outline:"none",background:C.cream,boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Type</label>
              <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}
                style={{width:"100%",padding:"9px 11px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",outline:"none",background:C.cream,boxSizing:"border-box"}}>
                {["ANC Checkup","Iron Therapy","Ultrasound","Blood Test","Emergency","Delivery","Postnatal"].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Notes</label>
              <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Optional notes..."
                style={{width:"100%",padding:"9px 11px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",outline:"none",background:C.cream,boxSizing:"border-box"}}/>
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setShowForm(false)} style={{padding:"9px 20px",borderRadius:9,border:`1.5px solid ${C.border}`,background:C.white,cursor:"pointer",fontSize:13}}>Cancel</button>
            <button onClick={handleCreate} disabled={saving} style={{padding:"9px 24px",borderRadius:9,border:"none",background:saving?C.muted:C.saffron,color:"white",fontSize:13,fontWeight:700,cursor:saving?"not-allowed":"pointer"}}>{saving?"Booking…":"Book Appointment"}</button>
          </div>
        </div>
      )}

      {loading?<div style={{textAlign:"center",padding:"40px",color:C.muted}}>Loading…</div>:
      shown.length===0?(
        <div style={{background:C.white,borderRadius:14,padding:"48px",textAlign:"center",border:`1px solid ${C.border}`}}>
          <div style={{fontSize:36,marginBottom:12}}>📅</div>
          <div style={{fontSize:14,fontWeight:600}}>No {aptTab} appointments</div>
        </div>
      ):shown.map(a=>{
        const sc=statusColor(a.status);
        const isToday=a.date===today;
        return(
          <div key={a.id} style={{background:isToday?C.saffronPale:C.white,borderRadius:12,padding:"16px 20px",border:`1.5px solid ${isToday?C.saffron:C.border}`,display:"flex",alignItems:"center",gap:16,marginBottom:10,flexWrap:"wrap"}}>
            <div style={{background:isToday?C.saffron:C.navy,color:"white",borderRadius:10,padding:"10px 14px",textAlign:"center",flexShrink:0,minWidth:55}}>
              <div style={{fontSize:18,fontWeight:800,lineHeight:1}}>{a.date?new Date(a.date).getDate():"—"}</div>
              <div style={{fontSize:10,opacity:.85}}>{a.date?new Date(a.date).toLocaleString("en-IN",{month:"short"}):""}</div>
            </div>
            <div style={{flex:1,minWidth:160}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:14}}>{a.patient_name||"Patient"}</span>
                {isToday&&<span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:C.saffron,color:"white"}}>TODAY</span>}
                <span style={{fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:20,background:sc.bg,color:sc.text,textTransform:"capitalize"}}>{a.status}</span>
              </div>
              <div style={{fontSize:12,color:C.muted,display:"flex",gap:10,flexWrap:"wrap"}}>
                {a.time&&<span>🕐 {a.time}</span>}
                {a.village&&<span>📍 {a.village}</span>}
                <span>🏥 {a.type||"Checkup"}</span>
                {a.doctor_name&&<span>👨‍⚕️ Dr. {a.doctor_name}</span>}
              </div>
              {a.notes&&<div style={{fontSize:12,color:C.teal,marginTop:4}}>📋 {a.notes}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ANALYTICS TAB
// ══════════════════════════════════════════════════════════════
function AnalyticsTab({ patients }) {
  const high=patients.filter(p=>p.risk==="HIGH");
  const medium=patients.filter(p=>p.risk==="MEDIUM");
  const low=patients.filter(p=>p.risk==="LOW");
  const overdue=patients.filter(p=>getANCStatus(p).overdue);
  const reviewed=patients.filter(p=>p.status==="reviewed");
  const withDoctor=patients.filter(p=>p.doctor_id);

  const villages=[...new Set(patients.map(p=>p.village).filter(Boolean))];
  const villageData=villages.map(v=>({
    village:v,
    total:patients.filter(p=>p.village===v).length,
    high:patients.filter(p=>p.village===v&&p.risk==="HIGH").length,
  })).sort((a,b)=>b.high-a.high);

  const maxBar=Math.max(...villageData.map(v=>v.total),1);

  return(
    <div>
      {/* Summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
        {[
          {icon:"👩",label:"Total Patients",value:patients.length,color:C.teal,bg:C.tealPale},
          {icon:"🔴",label:"High Risk",value:high.length,color:C.red,bg:C.redPale},
          {icon:"✅",label:"Reviewed",value:reviewed.length,color:C.green,bg:C.greenPale},
          {icon:"⏰",label:"Visit Overdue",value:overdue.length,color:C.yellow,bg:C.yellowPale},
          {icon:"👨‍⚕️",label:"Assigned to Doctor",value:withDoctor.length,color:C.purple,bg:C.purplePale},
          {icon:"🏘️",label:"Villages Covered",value:villages.length,color:C.navy,bg:C.navyPale},
        ].map(s=>(
          <div key={s.label} style={{background:s.bg,borderRadius:13,padding:"16px 14px",border:`1.5px solid ${s.color}30`,textAlign:"center"}}>
            <div style={{fontSize:22,marginBottom:4}}>{s.icon}</div>
            <div style={{fontSize:24,fontWeight:900,color:s.color,lineHeight:1}}>{s.value}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:3,fontWeight:600,textTransform:"uppercase",letterSpacing:0.4}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Risk distribution */}
      <div style={{background:C.white,borderRadius:14,padding:"18px 20px",marginBottom:16,border:`1px solid ${C.border}`}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>📊 Risk Distribution</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:16,height:120,marginBottom:10}}>
          {[{l:"High",n:high.length,c:C.red,bg:C.redPale},{l:"Medium",n:medium.length,c:C.yellow,bg:C.yellowPale},{l:"Low",n:low.length,c:C.green,bg:C.greenPale}].map(b=>(
            <div key={b.l} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <span style={{fontSize:13,fontWeight:700,color:b.c}}>{b.n}</span>
              <div style={{width:"100%",height:Math.round((b.n/Math.max(high.length,medium.length,low.length,1))*100)+"px",minHeight:4,background:b.bg,border:`2px solid ${b.c}`,borderRadius:"6px 6px 0 0",transition:"height .4s"}}/>
              <span style={{fontSize:12,color:C.muted,fontWeight:600}}>{b.l}</span>
            </div>
          ))}
        </div>
        {patients.length>0&&(
          <div style={{display:"flex",height:12,borderRadius:6,overflow:"hidden",gap:1}}>
            {high.length>0&&<div style={{flex:high.length,background:C.red}}/>}
            {medium.length>0&&<div style={{flex:medium.length,background:C.yellow}}/>}
            {low.length>0&&<div style={{flex:low.length,background:C.green}}/>}
          </div>
        )}
      </div>

      {/* Village breakdown */}
      {villageData.length>0&&(
        <div style={{background:C.white,borderRadius:14,padding:"18px 20px",border:`1px solid ${C.border}`}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>🏘️ Village-wise Distribution</div>
          {villageData.map(v=>(
            <div key={v.village} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:13,fontWeight:600}}>{v.village}</span>
                <span style={{fontSize:12,color:C.muted}}>{v.total} patients{v.high>0&&<span style={{color:C.red,fontWeight:700}}> · {v.high} high risk</span>}</span>
              </div>
              <div style={{height:8,background:C.cream,borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(v.total/maxBar)*100}%`,background:v.high>0?`linear-gradient(90deg,${C.red},${C.saffron})`:`linear-gradient(90deg,${C.teal},${C.green})`,borderRadius:4}}/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// RESOURCES TAB
// ══════════════════════════════════════════════════════════════
function ResourcesTab() {
  const [open,setOpen]=useState(null);
  const resources=[
    {icon:"🚨",color:C.red,bg:C.redPale,title:"Warning Signs — Go to Hospital Immediately",body:"Heavy bleeding · Severe headache · Blurred vision · Fits/Convulsions · No fetal movement for 12h · Water breaking early · High fever · Severe chest pain. Jab bhi ye symptoms dikhein — TURANT hospital le jao."},
    {icon:"💊",color:C.teal,bg:C.tealPale,title:"IFA & Medicine Distribution Guide",body:"IFA (Iron-Folic Acid): Roz 1 goli, raat ko khane ke baad deni chahiye. Side effects: kaale rang ka mal aana — normal hai. Calcium aur IFA ek saath mat do — 2 ghante ka gap rakho. Folic Acid: 14 weeks tak roz deni chahiye."},
    {icon:"🥗",color:C.green,bg:C.greenPale,title:"Nutrition Counseling Points",body:"Khane mein shamil karo: Dal, palak, methi, citrus fruits, doodh, ande, kela. Bachao: Kachcha maas, sharab, zyada chai/coffee, papaya, pineapple. Roz 8-10 glass paani piyein."},
    {icon:"📅",color:C.saffron,bg:C.saffronPale,title:"ANC Visit Schedule",body:"Visit 1: 12 weeks se pehle. Visit 2: 14-26 weeks. Visit 3: 28-34 weeks. Visit 4: 36+ weeks. Har visit mein: BP, wajan, Hb check + baby ki growth dekhna. TT injection dono doses zaroor deni hain."},
    {icon:"🧘",color:C.purple,bg:C.purplePale,title:"Mental Health Support",body:"Pregnancy mein anxiety aur tension common hai. Parivar ka saath zaruri hai. Raat ko 8 ghante neend. Halka walk theek hai. Agar depression ke lakshan dikhein — doctor se milwao. ASHA worker sunne waali bano."},
    {icon:"🏥",color:C.navy,bg:C.navyPale,title:"Referral Criteria",body:"Refer karo agar: Hb < 7 g/dL · BP > 140/90 · Blood sugar > 200 · Gestational age > 36 weeks with complications · Any emergency symptoms · Previous cesarean · Twin pregnancy. High risk patients ko seedha doctor/hospital referral."},
  ];

  return(
    <div>
      <div style={{background:`linear-gradient(135deg,${C.teal},${C.tealDark})`,borderRadius:14,padding:"18px 22px",marginBottom:18,color:"white"}}>
        <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:1,color:"rgba(255,255,255,0.6)",marginBottom:4}}>ASHA Worker Resources</div>
        <div style={{fontSize:18,fontWeight:700}}>📚 Counseling & Reference Guide</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {resources.map((r,i)=>(
          <div key={i} style={{background:C.white,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}>
            <div onClick={()=>setOpen(open===i?null:i)} style={{display:"flex",alignItems:"center",gap:12,padding:"16px 18px",cursor:"pointer",background:open===i?r.bg:C.white}}>
              <div style={{width:38,height:38,borderRadius:10,background:r.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{r.icon}</div>
              <span style={{flex:1,fontSize:14,fontWeight:600}}>{r.title}</span>
              <span style={{color:C.muted,fontSize:16,display:"inline-block",transform:open===i?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
            </div>
            {open===i&&<div style={{padding:"14px 18px 18px",borderTop:`1px solid ${C.border}`,fontSize:13,lineHeight:1.9,background:r.bg+"60",color:C.charcoal}}>{r.body}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN ASHA PORTAL
// ══════════════════════════════════════════════════════════════
export default function ASHAPortal() {
  const navigate=useNavigate();
  const user=getUser();

  const [patients,setPatients]=useState([]);
  const [doctors,setDoctors]=useState([]);
  const [loading,setLoading]=useState(true);
  const [activeTab,setActiveTab]=useState("dashboard");
  const [selected,setSelected]=useState(null);
  const [filterPreset,setFilterPreset]=useState("ALL");
  const [lang,setLang]=useState("en");
  const [isOnline,setIsOnline]=useState(navigator.onLine);

  const fetchAll=useCallback(async()=>{
  setLoading(true);
  try{
    const pts = await patientsAPI.getAll();
    setPatients(Array.isArray(pts)?pts:[]);
  }catch(err){
    console.error("Patients fetch error:",err);
    setPatients([]);
  }
  try{
    const docs = await authAPI.getDoctors();
    setDoctors(Array.isArray(docs)?docs:[]);
  }catch(err){
    console.error("Doctors fetch error:",err);
    setDoctors([]);
  }
  setLoading(false);
},[]);

  useEffect(()=>{
    fetchAll();
    const on=()=>setIsOnline(true);
    const off=()=>setIsOnline(false);
    window.addEventListener("online",on);
    window.addEventListener("offline",off);
    return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off);};
  },[fetchAll]);

  const handleAssignDoctor=async(patientId,doctorId,doctorName)=>{
    const updated=await patientsAPI.assignDoctor(patientId,doctorId,doctorName);
    setPatients(prev=>prev.map(p=>p.id===patientId?{...p,doctor_id:doctorId,doctor_name:doctorName}:p));
    return updated;
  };

  const handleLogout=()=>{clearAuth();navigate("/login");};
  const high=patients.filter(p=>p.risk==="HIGH").length;
  const T=LANG[lang];

  const TABS=[
    {id:"dashboard",label:T.dashboard,icon:"📊"},
    {id:"patients",label:T.patients,icon:"👩"},
    {id:"register",label:T.register,icon:"➕"},
    {id:"appointments",label:T.appointments,icon:"📅"},
    {id:"analytics",label:T.analytics,icon:"📈"},
    {id:"resources",label:T.resources,icon:"📚"},
  ];

  const DashboardTab=()=>{
    const medium=patients.filter(p=>p.risk==="MEDIUM");
    const low=patients.filter(p=>p.risk==="LOW");
    const highP=patients.filter(p=>p.risk==="HIGH");
    const overdue=patients.filter(p=>getANCStatus(p).overdue);
    const unassigned=patients.filter(p=>!p.doctor_id);

    return(
      <div>
        {highP.length>0&&(
          <div style={{background:C.redPale,border:`2px solid ${C.red}`,borderRadius:13,padding:"13px 18px",marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:24}}>🚨</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:800,color:C.red}}>{highP.length} HIGH RISK — {highP.map(p=>p.name).join(", ")}</div>
              <div style={{fontSize:11,color:C.muted}}>Immediate attention required</div>
            </div>
            <button onClick={()=>{setActiveTab("patients");setFilterPreset("HIGH");}} style={{background:C.red,color:"white",border:"none",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>View →</button>
          </div>
        )}
        {overdue.length>0&&(
          <div style={{background:C.yellowPale,border:`1.5px solid ${C.yellow}`,borderRadius:13,padding:"11px 18px",display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <span style={{fontSize:20}}>📅</span>
            <div style={{flex:1,fontSize:13,color:C.yellow,fontWeight:600}}>{overdue.length} patients overdue for ANC visit</div>
            <button onClick={()=>setActiveTab("patients")} style={{background:C.yellow,color:"white",border:"none",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>View →</button>
          </div>
        )}
        {unassigned.length>0&&(
          <div style={{background:C.purplePale,border:`1.5px solid ${C.purple}`,borderRadius:13,padding:"11px 18px",display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <span style={{fontSize:20}}>👨‍⚕️</span>
            <div style={{flex:1,fontSize:13,color:C.purple,fontWeight:600}}>{unassigned.length} patients without assigned doctor</div>
            <button onClick={()=>setActiveTab("patients")} style={{background:C.purple,color:"white",border:"none",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Assign →</button>
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
          {[
            {label:T.total,value:patients.length,color:C.teal,bg:C.tealPale,icon:"👩"},
            {label:T.highRisk,value:highP.length,color:C.red,bg:C.redPale,icon:"🔴"},
            {label:T.moderate,value:medium.length,color:C.yellow,bg:C.yellowPale,icon:"🟡"},
            {label:T.lowRisk,value:low.length,color:C.green,bg:C.greenPale,icon:"🟢"},
          ].map(s=>(
            <div key={s.label} style={{background:s.bg,borderRadius:13,padding:"16px 12px",border:`1.5px solid ${s.color}30`,textAlign:"center"}}>
              <div style={{fontSize:22,marginBottom:4}}>{s.icon}</div>
              <div style={{fontSize:24,fontWeight:900,color:s.color,lineHeight:1}}>{s.value}</div>
              <div style={{fontSize:10,color:C.muted,marginTop:3,fontWeight:600,textTransform:"uppercase",letterSpacing:0.4}}>{s.label}</div>
            </div>
          ))}
        </div>
        {patients.length>0&&(
          <div style={{background:C.white,borderRadius:13,padding:"16px 20px",border:`1px solid ${C.border}`,marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,color:C.muted,marginBottom:10}}>Risk Distribution</div>
            <div style={{display:"flex",height:20,borderRadius:6,overflow:"hidden",gap:2,marginBottom:8}}>
              {highP.length>0&&<div style={{flex:highP.length,background:C.red,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"white"}}>{highP.length}</div>}
              {medium.length>0&&<div style={{flex:medium.length,background:C.yellow,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"white"}}>{medium.length}</div>}
              {low.length>0&&<div style={{flex:low.length,background:C.green,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"white"}}>{low.length}</div>}
            </div>
          </div>
        )}
        {/* Quick stats */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div style={{background:C.white,borderRadius:13,padding:"16px",border:`1px solid ${C.border}`}}>
            <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:10}}>👨‍⚕️ Doctor Assignment</div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:13}}>Assigned</span>
              <span style={{fontSize:13,fontWeight:700,color:C.green}}>{patients.filter(p=>p.doctor_id).length}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:13}}>Unassigned</span>
              <span style={{fontSize:13,fontWeight:700,color:C.red}}>{patients.filter(p=>!p.doctor_id).length}</span>
            </div>
          </div>
          <div style={{background:C.white,borderRadius:13,padding:"16px",border:`1px solid ${C.border}`}}>
            <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:10}}>📋 Review Status</div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:13}}>Reviewed</span>
              <span style={{fontSize:13,fontWeight:700,color:C.green}}>{patients.filter(p=>p.status==="reviewed").length}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:13}}>Pending</span>
              <span style={{fontSize:13,fontWeight:700,color:C.yellow}}>{patients.filter(p=>p.status==="pending").length}</span>
            </div>
          </div>
        </div>
        {loading&&<div style={{textAlign:"center",padding:"24px",color:C.muted,fontSize:13}}>Loading patients…</div>}
      </div>
    );
  };

  return(
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
          <button key={t.id} onClick={()=>{setActiveTab(t.id);setSelected(null);}}
            style={{padding:"13px 16px",border:"none",borderBottom:`3px solid ${activeTab===t.id?C.teal:"transparent"}`,background:"transparent",color:activeTab===t.id?C.teal:C.muted,fontSize:12,fontWeight:activeTab===t.id?700:500,cursor:"pointer",display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap",fontFamily:"inherit"}}>
            {t.icon} {t.label}
            {t.id==="patients"&&patients.length>0&&<span style={{background:C.teal,color:"white",borderRadius:20,fontSize:10,fontWeight:700,padding:"1px 6px"}}>{patients.length}</span>}
            {t.id==="patients"&&high>0&&<span style={{background:C.red,color:"white",borderRadius:20,fontSize:10,fontWeight:700,padding:"1px 6px"}}>{high}!</span>}
          </button>
        ))}
        <button onClick={fetchAll} style={{marginLeft:"auto",padding:"13px 14px",border:"none",background:"transparent",color:C.muted,fontSize:12,cursor:"pointer",flexShrink:0}}>🔄</button>
      </div>

      {/* Content */}
      <div style={{maxWidth:1020,margin:"0 auto",padding:"20px 18px"}}>
        {activeTab==="dashboard"    && <DashboardTab/>}
        {activeTab==="patients"     && !selected && <PatientListTab patients={patients} loading={loading} onSelect={setSelected} onAdd={()=>setActiveTab("register")} filterPreset={filterPreset} lang={lang} doctors={doctors} onAssignDoctor={handleAssignDoctor}/>}
        {activeTab==="patients"     && selected  && <PatientDetailTab patient={selected} onBack={()=>setSelected(null)} onUpdate={p=>{fetchAll();setSelected(p);}} doctors={doctors} onAssignDoctor={handleAssignDoctor}/>}
        {activeTab==="register"     && <RegisterTab user={user} onSuccess={()=>{fetchAll();setActiveTab("patients");}} lang={lang} doctors={doctors}/>}
        {activeTab==="appointments" && <AppointmentsTab patients={patients} doctors={doctors} user={user}/>}
        {activeTab==="analytics"    && <AnalyticsTab patients={patients}/>}
        {activeTab==="resources"    && <ResourcesTab/>}
      </div>
      <AIAssistant userRole="asha" />
    </div>
  );
}