import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = "http://127.0.0.1:8000";
const C = {
  saffron:"#E8621A", saffronPale:"#FDF0E8", saffronDark:"#C04B2D",
  teal:"#0D6E6E", tealPale:"#E8F5F5", tealDark:"#094f4f",
  cream:"#F4F0EB", charcoal:"#1C1C1C", muted:"#6B6260", border:"#E0D8D0",
  red:"#DC2626", redPale:"#FEE2E2", yellow:"#D97706", yellowPale:"#FEF3C7",
  green:"#16A34A", greenPale:"#DCFCE7", white:"#FFFFFF",
  blue:"#2563EB", bluePale:"#EFF6FF", purple:"#7C3AED", purplePale:"#F5F3FF",
};

const getToken       = () => localStorage.getItem("ms_token");
const getCurrentUser = () => JSON.parse(localStorage.getItem("ms_currentUser") || "null");

const apiCall = async (endpoint, method = "GET", body = null) => {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method, headers, ...(body && { body: JSON.stringify(body) }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.detail || "Something went wrong");
    err.status = res.status;
    throw err;
  }
  return data;
};

const RISK_META = {
  HIGH:   { color:C.red,    bg:C.redPale,    emoji:"🔴", label:"High Risk",     glow:"rgba(220,38,38,0.2)"  },
  MEDIUM: { color:C.yellow, bg:C.yellowPale, emoji:"🟡", label:"Moderate Risk", glow:"rgba(217,119,6,0.2)"  },
  LOW:    { color:C.green,  bg:C.greenPale,  emoji:"🟢", label:"Low Risk",      glow:"rgba(22,163,74,0.2)"  },
};

const MOCK_HOSPITALS = [
  { name:"Govt. District Hospital",  type:"Government", distance:"1.2 km", cost:"Free",          rating:4.2, tags:["NICU","Blood Bank","24/7","ICU"], trustScore:87, beds:200, phone:"0132-2712345" },
  { name:"Shree Maternity Centre",   type:"Private",    distance:"2.8 km", cost:"₹4,500–8,000",  rating:4.5, tags:["24/7","Gynecologist","NICU"],      trustScore:92, beds:40,  phone:"9876500001" },
  { name:"PHC Behat",                type:"Government", distance:"4.1 km", cost:"Free",          rating:3.8, tags:["ANC","Normal Delivery","Vaccines"], trustScore:74, beds:30,  phone:"9876500002" },
  { name:"City Women's Hospital",    type:"Private",    distance:"5.3 km", cost:"₹6,000–12,000", rating:4.7, tags:["NICU","Blood Bank","ICU","24/7"],   trustScore:95, beds:80,  phone:"9876500003" },
];

const BABY_WEEKLY = {
  4:  { fruit:"Poppy Seed",     emoji:"🌱", size:"1 mm",    weight:"<1g",   desc:"Embryo implants. Neural tube forming." },
  6:  { fruit:"Sweet Pea",      emoji:"🫛", size:"6 mm",    weight:"<1g",   desc:"Heart begins to beat! Eyes & ears forming." },
  8:  { fruit:"Raspberry",      emoji:"🍓", size:"1.6 cm",  weight:"1g",    desc:"Fingers & toes distinct. Baby can move!" },
  10: { fruit:"Strawberry",     emoji:"🍓", size:"3 cm",    weight:"4g",    desc:"Baby can swallow. Fingernails growing." },
  12: { fruit:"Lime",           emoji:"🍋", size:"5.4 cm",  weight:"14g",   desc:"First trimester ends! Risk drops significantly." },
  14: { fruit:"Lemon",          emoji:"🍋", size:"8.7 cm",  weight:"43g",   desc:"Baby can squint, frown. Sucking reflex present." },
  16: { fruit:"Avocado",        emoji:"🥑", size:"11.6 cm", weight:"100g",  desc:"Baby hears sounds. Skeleton hardening." },
  18: { fruit:"Bell Pepper",    emoji:"🫑", size:"14 cm",   weight:"190g",  desc:"Baby yawns! You may feel first movements." },
  20: { fruit:"Banana",         emoji:"🍌", size:"16.5 cm", weight:"300g",  desc:"Halfway! Baby hears your voice." },
  24: { fruit:"Corn",           emoji:"🌽", size:"30 cm",   weight:"600g",  desc:"Brain growing fast. Responds to touch." },
  28: { fruit:"Eggplant",       emoji:"🍆", size:"37.6 cm", weight:"1kg",   desc:"Third trimester! REM sleep begins." },
  32: { fruit:"Squash",         emoji:"🎃", size:"42 cm",   weight:"1.7kg", desc:"Practices breathing. Fingernails grown." },
  36: { fruit:"Honeydew Melon", emoji:"🍈", size:"47 cm",   weight:"2.6kg", desc:"Full-term soon! Head may engage in pelvis." },
  40: { fruit:"Watermelon",     emoji:"🍉", size:"51 cm",   weight:"3.4kg", desc:"Full term! Baby ready to meet the world. 💕" },
};

function getBabyData(weeks) {
  const w = Number(weeks);
  const keys = Object.keys(BABY_WEEKLY).map(Number).sort((a,b)=>a-b);
  let best = keys[0];
  for (const k of keys) { if (w >= k) best = k; }
  return BABY_WEEKLY[best];
}

const WEEKLY_TIPS = {
  1:  { title:"Week 1–4 — Very Early Pregnancy!", tip:"Start folic acid immediately. Avoid alcohol, smoking, raw meat. Rest well.", warning:"Any bleeding or severe cramps? See doctor immediately." },
  5:  { title:"Week 5–8 — Baby's Heart Beating!", tip:"Take folic acid & IFA daily. Eat small meals if nauseous. Avoid stress.", warning:"Heavy bleeding or severe pain? Emergency care needed." },
  9:  { title:"Week 9–12 — First Trimester End!", tip:"Risk drops now. Get NT scan done. Continue folic acid daily.", warning:"Bleeding or fever? Emergency care needed." },
  13: { title:"Week 13–20 — Halfway There!", tip:"Get anomaly scan. Sleep on left side. Eat iron-rich foods.", warning:"No fetal movement felt? Visit hospital." },
  21: { title:"Week 21–28 — Third Trimester!", tip:"Monitor kicks daily. Get TT booster if not done.", warning:"Swelling in face or headache? Check BP immediately." },
  29: { title:"Week 29–36 — Nearly Ready!", tip:"Pack hospital bag. Know your nearest hospital route.", warning:"Contractions or water breaking — go to hospital NOW." },
  37: { title:"Week 37+ — Due Any Day!", tip:"Stay calm. Baby is fully ready. Stay near hospital.", warning:"Any sign of labor — go to hospital immediately." },
};

function getWeeklyTip(weeks) {
  const w = Number(weeks);
  if (w <= 4)  return WEEKLY_TIPS[1];
  if (w <= 8)  return WEEKLY_TIPS[5];
  if (w <= 12) return WEEKLY_TIPS[9];
  if (w <= 20) return WEEKLY_TIPS[13];
  if (w <= 28) return WEEKLY_TIPS[21];
  if (w <= 36) return WEEKLY_TIPS[29];
  return WEEKLY_TIPS[37];
}

// ── Tab components ───────────────────────────────────────────

function OverviewTab({ profile, user }) {
  const risk = profile.risk ? RISK_META[profile.risk] : null;
  const tip  = getWeeklyTip(profile.weeks);
  const [emergency, setEmergency] = useState(false);
  const [showFamilySync, setShowFamilySync] = useState(false);
  const [familyPhone, setFamilyPhone] = useState(localStorage.getItem("ms_family_phone") || "");

  const p = {
    ...profile,
    bpSys:         profile.bp_sys       ?? profile.bpSys,
    bpDia:         profile.bp_dia       ?? profile.bpDia,
    bloodGroup:    profile.blood_group  ?? profile.bloodGroup,
    pregnancyType: profile.pregnancy_type ?? profile.pregnancyType,
    ancDone:       profile.anc_done     ?? profile.ancDone,
    ashaName:      profile.asha_name    ?? profile.ashaName,
    riskScore:     profile.risk_score   ?? profile.riskScore,
    riskFlags:     profile.risk_flags   ?? profile.riskFlags ?? [],
  };

  return (
    <div>
      <div style={{ background:risk?`linear-gradient(135deg,${risk.bg},${C.white})`:`linear-gradient(135deg,${C.tealPale},${C.white})`, border:`2px solid ${risk?.color||C.teal}`, borderRadius:18, padding:"24px 28px", marginBottom:18, boxShadow:`0 8px 32px ${risk?.glow||"rgba(13,110,110,0.12)"}`, display:"flex", alignItems:"center", gap:24 }}>
        {p.riskScore > 0 && (
          <div style={{ position:"relative", width:96, height:96, flexShrink:0 }}>
            <svg width="96" height="96" style={{ transform:"rotate(-90deg)" }}>
              <circle cx="48" cy="48" r="40" fill="none" stroke="#E5E7EB" strokeWidth="8"/>
              <circle cx="48" cy="48" r="40" fill="none" stroke={risk?.color||C.teal} strokeWidth="8" strokeDasharray={`${(p.riskScore/100)*251} 251`} strokeLinecap="round"/>
            </svg>
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:20, fontWeight:800, color:risk?.color||C.teal, lineHeight:1 }}>{p.riskScore}</span>
              <span style={{ fontSize:9, color:C.muted, fontWeight:600 }}>SCORE</span>
            </div>
          </div>
        )}
        <div style={{ flex:1 }}>
          {risk ? (
            <>
              <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:risk.color, marginBottom:4 }}>AI Risk Assessment</div>
              <div style={{ fontSize:26, fontWeight:900, color:risk.color, fontFamily:"Georgia,serif", lineHeight:1 }}>{risk.emoji} {risk.label}</div>
              <div style={{ fontSize:13, color:C.charcoal, marginTop:8, lineHeight:1.6 }}>
                {profile.risk==="HIGH"   && "⚠ Multiple indicators need attention. Visit hospital today."}
                {profile.risk==="MEDIUM" && "Consult doctor within 48 hours. Monitor symptoms."}
                {profile.risk==="LOW"    && "✓ Vitals normal. Continue routine ANC visits."}
              </div>
              {p.riskFlags?.length > 0 && (
                <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:10 }}>
                  {p.riskFlags.map(f=><span key={f} style={{ fontSize:10, padding:"2px 9px", borderRadius:20, background:C.redPale, color:C.red, fontWeight:600 }}>⚠ {f}</span>)}
                </div>
              )}
            </>
          ) : <div style={{ fontSize:16, color:C.muted }}>⏳ Complete health profile for AI assessment</div>}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <button onClick={()=>{setEmergency(true);setTimeout(()=>setEmergency(false),4000);}}
            style={{ background:emergency?C.muted:C.red, color:"white", border:"none", borderRadius:12, padding:"14px 18px", fontSize:12, fontWeight:800, cursor:"pointer", minWidth:100 }}>
            {emergency?"🚨 Alerting...":"🆘 Emergency\nHelp"}
          </button>
          <button onClick={()=>setShowFamilySync(true)} style={{ fontSize:11, color:C.teal, background:"none", border:`1px solid ${C.teal}`, borderRadius:8, padding:"5px 10px", cursor:"pointer", fontWeight:600 }}>
            👨‍👩‍👧 Family Sync
          </button>
        </div>
      </div>

      {showFamilySync && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
          <div style={{ background:C.white, borderRadius:16, padding:28, width:380 }}>
            <div style={{ fontSize:17, fontWeight:700, marginBottom:6 }}>👨‍👩‍👧 Family Sync</div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:16 }}>Link a family member — they get alert if you press Emergency.</div>
            <input type="tel" value={familyPhone} onChange={e=>setFamilyPhone(e.target.value)} placeholder="10-digit mobile"
              style={{ width:"100%", padding:"10px 13px", borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginBottom:16 }}/>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setShowFamilySync(false)} style={{ flex:1, padding:10, borderRadius:9, border:`1.5px solid ${C.border}`, background:C.white, cursor:"pointer" }}>Cancel</button>
              <button onClick={()=>{ localStorage.setItem("ms_family_phone",familyPhone); setShowFamilySync(false); alert("Family member linked!"); }}
                style={{ flex:1, padding:10, borderRadius:9, border:"none", background:C.teal, color:"white", cursor:"pointer", fontWeight:700 }}>Save</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:18 }}>
        {[
          { label:"Blood Pressure", value:`${p.bpSys||"—"}/${p.bpDia||"—"}`, unit:"mmHg", warn:Number(p.bpSys)>=140, icon:"💓" },
          { label:"Hemoglobin",     value:p.hb||"—",     unit:"g/dL",  warn:Number(p.hb)<9&&!!p.hb,   icon:"🩸" },
          { label:"Weight",         value:p.weight||"—", unit:"kg",    warn:false,                     icon:"⚖️" },
          { label:"Blood Sugar",    value:p.sugar||"—",  unit:"mg/dL", warn:Number(p.sugar)>140&&!!p.sugar, icon:"🧪" },
          { label:"Pregnancy Week", value:p.weeks||"—",  unit:"wks",   warn:false,                     icon:"🤰" },
        ].map(v=>(
          <div key={v.label} style={{ background:C.white, borderRadius:12, padding:"14px 12px", border:`1px solid ${v.warn?C.red+"60":C.border}`, textAlign:"center" }}>
            <div style={{ fontSize:18, marginBottom:4 }}>{v.icon}</div>
            <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:0.5 }}>{v.label}</div>
            <div style={{ fontSize:16, fontWeight:800, color:v.warn?C.red:C.green, marginTop:4 }}>{v.value}<span style={{ fontSize:9, fontWeight:400, color:C.muted }}> {v.unit}</span></div>
            <div style={{ fontSize:10, marginTop:3, color:v.warn?C.red:C.green, fontWeight:600 }}>{v.warn?"⚠ Monitor":"✓ OK"}</div>
          </div>
        ))}
      </div>

      {tip && (
        <div style={{ background:`linear-gradient(135deg,${C.teal},${C.tealDark})`, borderRadius:14, padding:"18px 22px", marginBottom:18, color:"white" }}>
          <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:"rgba(255,255,255,0.6)", marginBottom:6 }}>This Week's Tip</div>
          <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>{tip.title}</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.7, marginBottom:10 }}>💡 {tip.tip}</div>
          <div style={{ background:"rgba(220,38,38,0.3)", borderRadius:8, padding:"8px 12px", fontSize:12, color:"#FCA5A5" }}>⚠ {tip.warning}</div>
        </div>
      )}

      <div style={{ background:C.white, borderRadius:14, padding:20, border:`1px solid ${C.border}` }}>
        <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, color:C.muted, marginBottom:14 }}>Pregnancy Details</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 20px" }}>
          {[["Gestational Age",p.weeks+" weeks"],["Type",p.pregnancyType],["ANC Done",p.ancDone],["Blood Group",p.bloodGroup],["Anemia",p.anemia],["HIV",p.hiv],["LMP",p.lmp],["ASHA Worker",p.ashaName||"—"]].map(([k,v])=>v&&(
            <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:13, padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
              <span style={{ color:C.muted }}>{k}</span>
              <span style={{ fontWeight:600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HealthWalletTab() {
  const docs = [
    { name:"ANC Card",          type:"Card",       date:"2025-02-01" },
    { name:"Blood Test Report", type:"Lab Report", date:"2025-02-14" },
    { name:"Ultrasound Report", type:"Scan",       date:"2025-01-20" },
  ];
  const vaccines = [
    { name:"TT1",         done:true,  date:"2024-12-10", due:"—"         },
    { name:"TT2",         done:true,  date:"2025-01-10", due:"—"         },
    { name:"IFA Tablets", done:true,  date:"2024-12-10", due:"Ongoing"   },
    { name:"Calcium",     done:false, date:"—",          due:"2025-03-10"},
    { name:"Hepatitis B", done:false, date:"—",          due:"2025-04-01"},
  ];
  return (
    <div>
      <div style={{ background:C.white, borderRadius:14, padding:22, border:`1px solid ${C.border}`, marginBottom:18 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, color:C.muted }}>Health Documents</div>
          <button style={{ fontSize:12, color:C.teal, background:C.tealPale, border:"none", borderRadius:7, padding:"5px 12px", fontWeight:600, cursor:"pointer" }}>+ Upload</button>
        </div>
        {docs.map((d,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:10, background:C.cream, border:`1px solid ${C.border}`, marginBottom:8 }}>
            <span style={{ fontSize:24 }}>📄</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:600 }}>{d.name}</div>
              <div style={{ fontSize:12, color:C.muted }}>{d.type} · {d.date}</div>
            </div>
            <span style={{ fontSize:11, padding:"2px 9px", borderRadius:20, background:C.greenPale, color:C.green, fontWeight:600 }}>✓ Verified</span>
            <button style={{ fontSize:12, color:C.teal, background:"none", border:`1px solid ${C.teal}`, borderRadius:7, padding:"4px 12px", cursor:"pointer" }}>View</button>
          </div>
        ))}
      </div>
      <div style={{ background:C.white, borderRadius:14, padding:22, border:`1px solid ${C.border}` }}>
        <div style={{ fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, color:C.muted, marginBottom:16 }}>Vaccination Tracker</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {vaccines.map((v,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderRadius:10, background:v.done?C.greenPale:C.yellowPale, border:`1px solid ${v.done?C.green+"40":C.yellow+"40"}` }}>
              <span style={{ fontSize:20 }}>{v.done?"✅":"⏰"}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700 }}>{v.name}</div>
                <div style={{ fontSize:11, color:C.muted }}>{v.done?"Done: "+v.date:"Due: "+v.due}</div>
              </div>
              <span style={{ fontSize:10, fontWeight:700, color:v.done?C.green:C.yellow }}>{v.done?"DONE":"PENDING"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BabyTrackerTab({ profile }) {
  const weeks    = Number(profile.weeks) || 20;
  const baby     = getBabyData(weeks);
  const lmp      = profile.lmp ? new Date(profile.lmp) : null;
  const edd      = lmp ? new Date(lmp.getTime() + 280*24*60*60*1000) : null;
  const daysLeft = edd ? Math.max(0, Math.round((edd - new Date()) / (24*60*60*1000))) : null;
  const progress = Math.min(100, Math.round((weeks/40)*100));
  const trim     = weeks<=12 ? { label:"First Trimester",  color:C.green,  tip:"Most critical. Folic acid daily." }
                 : weeks<=26 ? { label:"Second Trimester", color:C.teal,   tip:"Comfortable phase. Get anomaly scan." }
                 :             { label:"Third Trimester",  color:C.saffron,tip:"Pack hospital bag. Monitor kicks." };
  const milestones = [
    { week:8,  label:"First Heartbeat", done:weeks>=8  },
    { week:12, label:"NT Scan",         done:weeks>=12 },
    { week:16, label:"First Movements", done:weeks>=16 },
    { week:20, label:"Anomaly Scan",    done:weeks>=20 },
    { week:28, label:"Third Trimester", done:weeks>=28 },
    { week:36, label:"Full Term Soon",  done:weeks>=36 },
    { week:40, label:"Due Date 🎉",     done:weeks>=40 },
  ];
  return (
    <div>
      <div style={{ background:`linear-gradient(135deg,${C.saffronPale},#fff8f0)`, border:`2px solid ${C.saffron}40`, borderRadius:18, padding:"24px 28px", marginBottom:18, display:"flex", gap:24, alignItems:"center" }}>
        <div style={{ textAlign:"center", minWidth:110 }}>
          <div style={{ fontSize:68, lineHeight:1, marginBottom:8 }}>{baby.emoji}</div>
          <div style={{ fontSize:13, fontWeight:700, color:C.saffron }}>{baby.fruit}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Your baby</div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:C.saffron, marginBottom:4 }}>Week {weeks} of 40</div>
          <div style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:700, marginBottom:8 }}>Size of a {baby.fruit}!</div>
          <div style={{ display:"flex", gap:16, marginBottom:10 }}>
            <span style={{ fontSize:13, color:C.muted }}>📏 {baby.size}</span>
            <span style={{ fontSize:13, color:C.muted }}>⚖️ {baby.weight}</span>
          </div>
          <div style={{ fontSize:13, lineHeight:1.7 }}>{baby.desc}</div>
        </div>
        {daysLeft !== null && (
          <div style={{ textAlign:"center", background:C.white, borderRadius:14, padding:"16px 20px", border:`2px solid ${C.saffron}30`, minWidth:100 }}>
            <div style={{ fontSize:34, fontWeight:900, color:C.saffron, lineHeight:1 }}>{daysLeft}</div>
            <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginTop:4 }}>DAYS LEFT</div>
          </div>
        )}
      </div>
      <div style={{ background:C.white, borderRadius:14, padding:"18px 22px", marginBottom:18, border:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
          <span style={{ fontSize:13, fontWeight:700 }}>Pregnancy Progress</span>
          <span style={{ fontSize:13, fontWeight:700, color:C.saffron }}>{progress}%</span>
        </div>
        <div style={{ height:12, background:C.cream, borderRadius:8, overflow:"hidden", marginBottom:10 }}>
          <div style={{ height:"100%", width:progress+"%", background:`linear-gradient(90deg,${C.green},${C.saffron})`, borderRadius:8 }}/>
        </div>
        <div style={{ background:trim.color+"20", borderRadius:9, padding:"8px 14px", fontSize:13, color:trim.color, fontWeight:600 }}>{trim.label} — {trim.tip}</div>
      </div>
      <div style={{ background:C.white, borderRadius:14, padding:"18px 22px", border:`1px solid ${C.border}` }}>
        <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, color:C.muted, marginBottom:16 }}>Milestones</div>
        <div style={{ position:"relative", paddingLeft:28 }}>
          <div style={{ position:"absolute", left:10, top:0, bottom:0, width:2, background:C.border }}/>
          {milestones.map((m,i)=>(
            <div key={i} style={{ position:"relative", marginBottom:14, display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ position:"absolute", left:-22, width:16, height:16, borderRadius:"50%", background:m.done?C.green:C.border, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"white", fontWeight:700 }}>{m.done?"✓":""}</div>
              <span style={{ fontSize:13, fontWeight:m.done?600:400, color:m.done?C.charcoal:C.muted }}>Week {m.week} — {m.label}</span>
              {weeks===m.week && <span style={{ fontSize:10, background:C.saffron, color:"white", padding:"1px 7px", borderRadius:20, fontWeight:700 }}>NOW</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MedicineTab({ profile }) {
  const MEDICINES = [
    { id:"ifa",     name:"IFA Tablet",         icon:"💊", color:C.red,    bg:C.redPale,    dose:"1 daily",  time:"After dinner",    why:"Prevents anemia — most important!", critical:true  },
    { id:"calcium", name:"Calcium Supplement", icon:"🦴", color:C.teal,   bg:C.tealPale,   dose:"1 twice",  time:"Morning & Night", why:"Baby bones & teeth",                critical:false },
    { id:"folic",   name:"Folic Acid",         icon:"🌿", color:C.green,  bg:C.greenPale,  dose:"1 daily",  time:"Morning",         why:"Prevents brain defects",            critical:Number(profile.weeks)<14 },
    { id:"vitd",    name:"Vitamin D",          icon:"☀️", color:C.yellow, bg:C.yellowPale, dose:"1 weekly", time:"Sunday morning",  why:"Bone strength & immunity",          critical:false },
  ];
  const KEY   = "ms_med_"+(profile.id||"pat");
  const today = new Date().toISOString().split("T")[0];
  const [taken, setTaken] = useState(()=>{ try { return JSON.parse(localStorage.getItem(KEY)||"{}"); } catch { return {}; } });
  const toggle = (id) => {
    const k = today+"_"+id;
    const u = { ...taken, [k]:!taken[k] };
    setTaken(u); localStorage.setItem(KEY, JSON.stringify(u));
  };
  const isTaken   = (id) => !!taken[today+"_"+id];
  const doneCount = MEDICINES.filter(m=>isTaken(m.id)).length;
  return (
    <div>
      <div style={{ background:`linear-gradient(135deg,${C.teal},${C.tealDark})`, borderRadius:14, padding:"18px 22px", marginBottom:18, color:"white", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:"rgba(255,255,255,0.6)", marginBottom:4 }}>Today's Medicines</div>
          <div style={{ fontSize:20, fontWeight:700 }}>{doneCount}/{MEDICINES.length} taken ✓</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginTop:4 }}>{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}</div>
        </div>
        <div style={{ width:64, height:64, borderRadius:"50%", border:"4px solid rgba(255,255,255,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:"white", background:"rgba(255,255,255,0.1)" }}>
          {Math.round((doneCount/MEDICINES.length)*100)}%
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:18 }}>
        {MEDICINES.map(m => {
          const done = isTaken(m.id);
          return (
            <div key={m.id} style={{ background:done?m.bg:C.white, borderRadius:14, padding:"16px 20px", border:`1.5px solid ${done?m.color+"60":C.border}`, display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ width:46, height:46, borderRadius:12, background:m.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>{m.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:15, fontWeight:700 }}>{m.name}</span>
                  {m.critical && <span style={{ fontSize:10, fontWeight:700, background:C.redPale, color:C.red, padding:"2px 8px", borderRadius:20 }}>CRITICAL</span>}
                </div>
                <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>💊 {m.dose} · ⏰ {m.time}</div>
                <div style={{ fontSize:12, color:m.color, marginTop:3 }}>{m.why}</div>
              </div>
              <button onClick={()=>toggle(m.id)} style={{ width:44, height:44, borderRadius:"50%", border:`2px solid ${done?m.color:C.border}`, background:done?m.color:C.white, color:done?"white":C.muted, fontSize:18, cursor:"pointer" }}>
                {done?"✓":"○"}
              </button>
            </div>
          );
        })}
      </div>
      <div style={{ background:C.yellowPale, border:`1px solid ${C.yellow}40`, borderRadius:12, padding:"14px 18px" }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.yellow, marginBottom:6 }}>⚠ Important</div>
        <div style={{ fontSize:13, lineHeight:1.8 }}>
          • IFA ke baad green/black stool normal hai — ghabrao mat<br/>
          • Calcium aur IFA ek saath mat lo — 2 ghante gap rakho<br/>
          • Koi bhi medicine band mat karo bina doctor se puche
        </div>
      </div>
    </div>
  );
}

function HospitalTab() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [fetched, setFetched]     = useState(false);
  const [sortBy, setSortBy]       = useState("nearest");
  const [filterTag, setFilterTag] = useState("ALL");
  const [error, setError]         = useState("");

  const fetchHospitals = () => {
    setLoading(true); setError("");
    if (!navigator.geolocation) { setHospitals(MOCK_HOSPITALS); setFetched(true); setLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const query = `[out:json][timeout:25];(node["amenity"="hospital"](around:10000,${latitude},${longitude});way["amenity"="hospital"](around:10000,${latitude},${longitude}););out body center 10;`;
          const res  = await fetch("https://overpass-api.de/api/interpreter", { method:"POST", body:query });
          const data = await res.json();
          if (data.elements?.length > 0) {
            const mapped = data.elements.filter(e=>e.tags?.name).slice(0,8).map(e=>{
              const lat=e.lat||e.center?.lat, lon=e.lon||e.center?.lon;
              const R=6371, dLat=(lat-latitude)*Math.PI/180, dLon=(lon-longitude)*Math.PI/180;
              const a=Math.sin(dLat/2)**2+Math.cos(latitude*Math.PI/180)*Math.cos(lat*Math.PI/180)*Math.sin(dLon/2)**2;
              const dist=(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))).toFixed(1);
              const tags=e.tags||{}, ftags=[];
              if(tags.emergency==="yes") ftags.push("24/7");
              if(ftags.length===0) ftags.push("Hospital");
              return { name:tags.name, type:tags["operator:type"]==="government"?"Government":"Hospital", distance:dist+" km", cost:tags.fee==="no"?"Free":"Contact", rating:0, tags:ftags, trustScore:Math.round(65+Math.random()*25), beds:tags["capacity:beds"]||"—", phone:tags.phone||"—", lat, lon };
            }).sort((a,b)=>parseFloat(a.distance)-parseFloat(b.distance));
            setHospitals(mapped.length>0?mapped:MOCK_HOSPITALS);
          } else { setHospitals(MOCK_HOSPITALS); setError("No hospitals found nearby. Showing demo data."); }
        } catch { setHospitals(MOCK_HOSPITALS); }
        setFetched(true); setLoading(false);
      },
      ()=>{ setHospitals(MOCK_HOSPITALS); setFetched(true); setLoading(false); setError("Location denied. Showing demo hospitals."); }
    );
  };

  const ALL_TAGS = ["ALL","NICU","Blood Bank","24/7","ICU","C-Section","ANC"];
  const sorted   = [...hospitals].filter(h=>filterTag==="ALL"||h.tags.includes(filterTag)).sort((a,b)=>{
    if(sortBy==="nearest") return parseFloat(a.distance)-parseFloat(b.distance);
    if(sortBy==="rating")  return b.rating-a.rating;
    return b.trustScore-a.trustScore;
  });

  if (!fetched) return (
    <div style={{ background:C.white, borderRadius:16, padding:"48px 32px", textAlign:"center", border:`1px solid ${C.border}` }}>
      <div style={{ fontSize:52, marginBottom:16 }}>🏥</div>
      <div style={{ fontFamily:"Georgia,serif", fontSize:20, fontWeight:700, marginBottom:8 }}>Find Nearby Hospitals</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:24 }}>Compare by distance, cost, NICU availability & trust score.</div>
      <button onClick={fetchHospitals} style={{ background:C.saffron, color:"white", border:"none", borderRadius:12, padding:"14px 32px", fontSize:15, fontWeight:700, cursor:"pointer" }}>📍 Find Hospitals Near Me</button>
    </div>
  );

  if (loading) return <div style={{ textAlign:"center", padding:"60px 0", color:C.muted }}>Finding hospitals...</div>;

  return (
    <div>
      {error && <div style={{ background:C.yellowPale, border:`1px solid ${C.yellow}`, borderRadius:9, padding:"9px 14px", fontSize:12, color:C.yellow, marginBottom:14 }}>⚠ {error}</div>}
      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
        {ALL_TAGS.map(t=>(
          <button key={t} onClick={()=>setFilterTag(t)} style={{ padding:"5px 12px", borderRadius:20, border:`1.5px solid ${filterTag===t?C.teal:C.border}`, background:filterTag===t?C.tealPale:C.white, color:filterTag===t?C.teal:C.muted, fontSize:11, fontWeight:600, cursor:"pointer" }}>{t}</button>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
          {["nearest","rating","trust"].map(s=>(
            <button key={s} onClick={()=>setSortBy(s)} style={{ padding:"5px 12px", borderRadius:7, border:`1.5px solid ${sortBy===s?C.saffron:C.border}`, background:sortBy===s?C.saffronPale:C.white, color:sortBy===s?C.saffron:C.muted, fontSize:12, fontWeight:600, cursor:"pointer" }}>
              {s==="nearest"?"📍 Nearest":s==="rating"?"⭐ Rating":"🏆 Trust"}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {sorted.map((h,i)=>(
          <div key={i} style={{ background:C.white, borderRadius:14, padding:"18px 22px", border:`1.5px solid ${i===0?C.teal:C.border}` }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
              <div style={{ width:46, height:46, borderRadius:12, background:h.type==="Government"?C.tealPale:C.saffronPale, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🏥</div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:15, fontWeight:700 }}>{h.name}</span>
                  {i===0&&<span style={{ fontSize:10, fontWeight:700, background:C.teal, color:"white", padding:"2px 8px", borderRadius:20 }}>NEAREST</span>}
                </div>
                <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>{h.type} · 📍 {h.distance} · 💰 {h.cost}</div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {h.tags.map(t=><span key={t} style={{ fontSize:10, padding:"2px 9px", borderRadius:20, background:C.tealPale, color:C.teal, fontWeight:600 }}>{t}</span>)}
                </div>
              </div>
              <a href={"tel:"+h.phone} style={{ padding:"7px 16px", borderRadius:8, background:C.green, color:"white", fontSize:12, fontWeight:700, textDecoration:"none" }}>📞 Call</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AppointmentsTab({ profile }) {
  const KEY = "ms_appt_"+(profile.id||"pat");
  const [appts, setAppts]       = useState(()=>{ try { return JSON.parse(localStorage.getItem(KEY)||"[]"); } catch { return []; } });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ hospital:"", doctor:"", date:"", time:"", type:"ANC Visit" });

  const save = () => {
    if (!form.hospital||!form.date) return;
    const updated = [{ ...form, id:Date.now() }, ...appts];
    setAppts(updated); localStorage.setItem(KEY, JSON.stringify(updated));
    setShowForm(false); setForm({ hospital:"", doctor:"", date:"", time:"", type:"ANC Visit" });
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700 }}>My Appointments</div>
        <button onClick={()=>setShowForm(true)} style={{ background:C.saffron, color:"white", border:"none", borderRadius:9, padding:"9px 20px", fontSize:13, fontWeight:700, cursor:"pointer" }}>+ Book</button>
      </div>
      {showForm && (
        <div style={{ background:C.white, borderRadius:14, padding:22, border:`2px solid ${C.saffron}`, marginBottom:18 }}>
          <div style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>📅 New Appointment</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
            {[["Hospital","hospital"],["Doctor","doctor"]].map(([l,k])=>(
              <div key={k} style={{ marginBottom:14 }}>
                <label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:5 }}>{l}</label>
                <input value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}
                  style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"inherit", outline:"none", background:C.cream, boxSizing:"border-box" }}/>
              </div>
            ))}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:5 }}>Date</label>
              <input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"inherit", outline:"none", background:C.cream, boxSizing:"border-box" }}/>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:5 }}>Time</label>
              <input type="time" value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))}
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"inherit", outline:"none", background:C.cream, boxSizing:"border-box" }}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setShowForm(false)} style={{ padding:"9px 20px", borderRadius:9, border:`1.5px solid ${C.border}`, background:C.white, cursor:"pointer", fontSize:13 }}>Cancel</button>
            <button onClick={save} style={{ padding:"9px 24px", borderRadius:9, border:"none", background:C.saffron, color:"white", fontSize:13, fontWeight:700, cursor:"pointer" }}>Book</button>
          </div>
        </div>
      )}
      {appts.length===0 ? (
        <div style={{ background:C.white, borderRadius:14, padding:"48px 32px", textAlign:"center", border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📅</div>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>No appointments yet</div>
          <div style={{ fontSize:13, color:C.muted }}>Book your next ANC visit or specialist consultation</div>
        </div>
      ) : appts.map(a=>(
        <div key={a.id} style={{ background:C.white, borderRadius:12, padding:"16px 20px", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:14, marginBottom:10 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:C.tealPale, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>📅</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700 }}>{a.hospital}{a.doctor&&" · Dr. "+a.doctor}</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{a.date}{a.time&&" at "+a.time} · {a.type}</div>
          </div>
          <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:C.tealPale, color:C.teal }}>Upcoming</span>
        </div>
      ))}
    </div>
  );
}

function LearningTab({ profile }) {
  const [open, setOpen] = useState(null);
  const content = [
    { title:"Warning Signs — When to Go to Hospital", icon:"🚨", color:C.red,    bg:C.redPale,    body:"Go IMMEDIATELY if: Heavy bleeding, Severe headache, Blurred vision, Fits/Convulsions, No fetal movement 12h, Water breaking, High fever, Chest pain." },
    { title:"Nutrition During Pregnancy",             icon:"🥗", color:C.green,  bg:C.greenPale,  body:"Eat: Dal, spinach, methi, citrus, milk, eggs, bananas. Avoid: Raw meat, alcohol, excess tea/coffee, papaya, pineapple. Drink 8-10 glasses water daily." },
    { title:"Iron & Folic Acid — Why It Matters",    icon:"💊", color:C.teal,   bg:C.tealPale,   body:"Take IFA daily — do NOT skip. Iron prevents anemia. Folic acid prevents brain defects. Take after meals to reduce nausea." },
    { title:"Mental Health During Pregnancy",         icon:"🧘", color:C.purple, bg:C.purplePale, body:"Anxiety during pregnancy is common. Talk to ASHA or doctor. Rest 8 hours. Light walking helps. Family support is important." },
    { title:"ANC Visits Schedule",                    icon:"📅", color:C.saffron,bg:C.saffronPale,body:"Visit 1: Before 12 weeks. Visit 2: 14-26 weeks. Visit 3: 28-34 weeks. Visit 4: 36+ weeks. Each visit: BP, weight, Hb + baby growth check." },
  ];
  return (
    <div>
      <div style={{ background:`linear-gradient(135deg,${C.teal},${C.tealDark})`, borderRadius:14, padding:"18px 22px", marginBottom:18, color:"white" }}>
        <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:"rgba(255,255,255,0.6)", marginBottom:4 }}>Learning Center</div>
        <div style={{ fontSize:18, fontWeight:700 }}>Week {profile.weeks} — Know Your Pregnancy 📚</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {content.map((c,i)=>(
          <div key={i} style={{ background:C.white, borderRadius:12, border:`1px solid ${C.border}`, overflow:"hidden" }}>
            <div onClick={()=>setOpen(open===i?null:i)} style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 18px", cursor:"pointer", background:open===i?c.bg:C.white }}>
              <div style={{ width:38, height:38, borderRadius:10, background:c.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{c.icon}</div>
              <span style={{ flex:1, fontSize:14, fontWeight:600 }}>{c.title}</span>
              <span style={{ color:C.muted, fontSize:16, display:"inline-block", transform:open===i?"rotate(180deg)":"none", transition:"transform 0.2s" }}>▾</span>
            </div>
            {open===i && <div style={{ padding:"14px 18px 18px", borderTop:`1px solid ${C.border}`, fontSize:13, lineHeight:1.8, background:c.bg+"60" }}>{c.body}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Patient Portal ──────────────────────────────────────
export default function PatientPortal() {
  const navigate = useNavigate();
  const user     = getCurrentUser();
  const [profile, setProfile]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [noRecord, setNoRecord]   = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!user || !getToken()) {
      navigate("/login");
      return;
    }
    apiCall("/records/me")
      .then(data => setProfile(data))
      .catch(err => {
        if (err.status === 401) {
          localStorage.removeItem("ms_token");
          localStorage.removeItem("ms_currentUser");
          navigate("/login");
        } else if (err.status === 404) {
          // No record yet — show empty state instead of redirecting
          setNoRecord(true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("ms_token");
    localStorage.removeItem("ms_currentUser");
    navigate("/login");
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:C.cream, flexDirection:"column", gap:12, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ fontSize:32 }}>🌸</div>
      <div style={{ fontSize:14, color:C.muted }}>Loading your health profile...</div>
    </div>
  );

  // ✅ No record found — show helpful message, do NOT redirect
  if (noRecord) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:C.cream, flexDirection:"column", gap:16, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ fontSize:52 }}>🌸</div>
      <div style={{ fontSize:22, fontWeight:700, color:C.charcoal }}>No Health Record Found</div>
      <div style={{ fontSize:14, color:C.muted, textAlign:"center", maxWidth:320 }}>
        Your health profile hasn't been created yet. Please go to the dashboard and fill in your details.
      </div>
      <button
        onClick={() => navigate("/dashboard")}
        style={{ marginTop:8, background:C.saffron, color:"white", border:"none", borderRadius:12, padding:"13px 32px", fontSize:15, fontWeight:700, cursor:"pointer" }}>
        Go to Dashboard →
      </button>
      <button onClick={handleLogout} style={{ fontSize:13, color:C.muted, background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}>
        Logout
      </button>
    </div>
  );

  if (!profile) return null;

  const risk = profile.risk ? RISK_META[profile.risk] : null;

  const TABS = [
    { id:"overview",     label:"Overview",      icon:"🏠" },
    { id:"wallet",       label:"Health Wallet", icon:"💼" },
    { id:"baby",         label:"Baby Tracker",  icon:"🍉" },
    { id:"medicine",     label:"Medicines",     icon:"💊" },
    { id:"hospitals",    label:"Hospitals",     icon:"🏥" },
    { id:"appointments", label:"Appointments",  icon:"📅" },
    { id:"learn",        label:"Learn",         icon:"📚" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.cream, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      {/* Topbar */}
      <div style={{ background:`linear-gradient(135deg,${C.saffron},${C.saffronDark})`, padding:"0 28px", height:62, display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 2px 12px rgba(232,98,26,0.25)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:20 }}>🌸</span>
          <span style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"white" }}>Matriseva</span>
          <span style={{ background:"rgba(255,255,255,0.2)", color:"white", fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:20 }}>MY HEALTH</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {risk && <span style={{ background:risk.bg, color:risk.color, fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:20 }}>{risk.emoji} {risk.label}</span>}
          <span style={{ fontSize:13, color:"rgba(255,255,255,0.9)", fontWeight:600 }}>👋 {user?.name}</span>
          <button onClick={handleLogout} style={{ background:"rgba(255,255,255,0.2)", color:"white", border:"none", borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>Logout</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background:C.white, borderBottom:`1px solid ${C.border}`, padding:"0 20px", display:"flex", gap:0, overflowX:"auto" }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            style={{ padding:"13px 16px", border:"none", borderBottom:`3px solid ${activeTab===t.id?C.saffron:"transparent"}`, background:"transparent", color:activeTab===t.id?C.saffron:C.muted, fontSize:12, fontWeight:activeTab===t.id?700:500, cursor:"pointer", display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap", fontFamily:"inherit" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Patient strip */}
      <div style={{ background:C.white, borderBottom:`1px solid ${C.border}`, padding:"10px 28px", display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ width:38, height:38, borderRadius:"50%", background:`linear-gradient(135deg,${C.saffron},${C.saffronDark})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>👩</div>
        <div>
          <div style={{ fontSize:14, fontWeight:700 }}>{profile.name}</div>
          <div style={{ fontSize:12, color:C.muted }}>
            Age {profile.age} · Week {profile.weeks} · {profile.village}, {profile.district}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:960, margin:"0 auto", padding:"22px 20px" }}>
        {activeTab==="overview"     && <OverviewTab     profile={profile} user={user}/>}
        {activeTab==="wallet"       && <HealthWalletTab profile={profile}/>}
        {activeTab==="baby"         && <BabyTrackerTab  profile={profile}/>}
        {activeTab==="medicine"     && <MedicineTab     profile={profile}/>}
        {activeTab==="hospitals"    && <HospitalTab     profile={profile}/>}
        {activeTab==="appointments" && <AppointmentsTab profile={profile}/>}
        {activeTab==="learn"        && <LearningTab     profile={profile}/>}
      </div>
    </div>
  );
}