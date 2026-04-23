import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";

const BASE_URL = "http://127.0.0.1:8000";
const C = {
  saffron:"#E8621A", saffronPale:"#FDF0E8", saffronDark:"#C04B2D",
  teal:"#0D6E6E", tealPale:"#E8F5F5", tealDark:"#094f4f",
  cream:"#F4F0EB", charcoal:"#1C1C1C", muted:"#6B6260", border:"#E0D8D0",
  red:"#DC2626", redPale:"#FEE2E2", yellow:"#D97706", yellowPale:"#FEF3C7",
  green:"#16A34A", greenPale:"#DCFCE7", white:"#FFFFFF",
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

// ── Reusable field components ────────────────────────────────

function F({ label, required, type="text", value, onChange, placeholder, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ fontSize:13, fontWeight:600, color:C.charcoal, display:"block", marginBottom:5 }}>
        {label}{required && <span style={{ color:C.red }}> *</span>}
      </label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width:"100%", padding:"10px 13px", borderRadius:9, fontSize:13, border:`1.5px solid ${error?C.red:focused?C.teal:C.border}`, outline:"none", fontFamily:"inherit", background:focused?C.white:C.cream, transition:"all 0.2s", boxSizing:"border-box" }}/>
      {error && <div style={{ fontSize:11, color:C.red, marginTop:3 }}>⚠ {error}</div>}
    </div>
  );
}

function S({ label, required, value, onChange, options, error }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ fontSize:13, fontWeight:600, color:C.charcoal, display:"block", marginBottom:5 }}>
        {label}{required && <span style={{ color:C.red }}> *</span>}
      </label>
      <select value={value} onChange={onChange}
        style={{ width:"100%", padding:"10px 13px", borderRadius:9, fontSize:13, border:`1.5px solid ${error?C.red:C.border}`, outline:"none", fontFamily:"inherit", background:C.cream, cursor:"pointer", boxSizing:"border-box" }}>
        <option value="">— Select —</option>
        {options.map(o => <option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
      </select>
      {error && <div style={{ fontSize:11, color:C.red, marginTop:3 }}>⚠ {error}</div>}
    </div>
  );
}

function R({ label, required, options, value, onChange, error }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ fontSize:13, fontWeight:600, color:C.charcoal, display:"block", marginBottom:6 }}>
        {label}{required && <span style={{ color:C.red }}> *</span>}
      </label>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {options.map(o => (
          <button key={o} onClick={() => onChange(o)}
            style={{ padding:"7px 14px", borderRadius:8, border:`1.5px solid ${value===o?C.teal:C.border}`, background:value===o?C.tealPale:C.white, color:value===o?C.teal:C.muted, fontSize:13, fontWeight:value===o?600:400, cursor:"pointer" }}>
            {value===o?"●":"○"} {o}
          </button>
        ))}
      </div>
      {error && <div style={{ fontSize:11, color:C.red, marginTop:4 }}>⚠ {error}</div>}
    </div>
  );
}

// ── Multi-step form ──────────────────────────────────────────

const STEPS = [
  { id:1, label:"Personal",  icon:"👩" },
  { id:2, label:"Pregnancy", icon:"🤰" },
  { id:3, label:"Health",    icon:"🩺" },
  { id:4, label:"Location",  icon:"📍" },
];

function RegistrationForm({ user }) {
  const navigate    = useNavigate();
  const [step, setStep]         = useState(1);
  const [errors, setErrors]     = useState({});
  const [saving, setSaving]     = useState(false);
  const [apiError, setApiError] = useState("");

  const [d, setD] = useState({
    // Personal
    name:user?.name||"", age:"", phone:user?.phone||"", guardian:"", religion:"", caste:"", education:"",
    // Pregnancy
    lmp:"", edd:"", weeks:"", gravida:"1", para:"0", abortions:"0", living:"0",
    ancDone:"", pregnancyType:"Singleton", prevComplications:"",
    // Health — added body_temp and heart_rate for ML model
    bpSys:"", bpDia:"", hb:"", weight:"", sugar:"", bloodGroup:"", anemia:"", hiv:"",
    body_temp:"", heart_rate:"",
    // Location
    ashaName:"", ashaMobile:"", district:"", block:"", village:"", pin:"", hospital:"", transport:"",
  });

  const set = (k, v) => {
    setD(p => ({ ...p, [k]:v }));
    setErrors(e => { const n={...e}; delete n[k]; return n; });
  };

  // Auto-calculate weeks + EDD from LMP
  useEffect(() => {
    if (!d.lmp) return;
    const w = Math.floor((new Date() - new Date(d.lmp)) / (7*24*60*60*1000));
    if (w >= 0 && w <= 45) set("weeks", String(w));
    const edd = new Date(new Date(d.lmp).getTime() + 280*24*60*60*1000);
    set("edd", edd.toISOString().split("T")[0]);
  }, [d.lmp]);

  const validate = () => {
    const e = {};
    if (step===1) {
      if (!d.age||Number(d.age)<10||Number(d.age)>60) e.age = "Valid age required";
      if (!d.education) e.education = "Required";
    }
    if (step===2) {
      if (!d.lmp)     e.lmp     = "LMP required";
      if (!d.weeks)   e.weeks   = "Required";
      if (!d.ancDone) e.ancDone = "Required";
    }
    if (step===3) {
      if (!d.bpSys)      e.bpSys      = "Required";
      if (!d.bpDia)      e.bpDia      = "Required";
      if (!d.hb)         e.hb         = "Required";
      if (!d.weight)     e.weight     = "Required";
      if (!d.bloodGroup) e.bloodGroup = "Required";
      if (!d.anemia)     e.anemia     = "Required";
      if (!d.hiv)        e.hiv        = "Required";
      if (!d.body_temp)  e.body_temp  = "Required";
      if (!d.heart_rate) e.heart_rate = "Required";
    }
    if (step===4) {
      if (!d.district)        e.district  = "Required";
      if (!d.village?.trim()) e.village   = "Required";
      if (!d.hospital)        e.hospital  = "Required";
      if (!d.transport)       e.transport = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;
    if (step < 4) { setStep(s => s+1); window.scrollTo({ top:0 }); return; }

    // Step 4 submit → ML risk computed on backend
    setSaving(true); setApiError("");
    try {
      await apiCall("/records/create", "POST", { ...d });
      navigate("/portal", { replace: true });
    } catch (err) {
      setApiError(err.message || "Failed to save. Please try again.");
      setSaving(false);
    }
  };

  const progress = ((step-1)/4)*100;

  return (
    <div style={{ minHeight:"100vh", background:C.cream, fontFamily:"'DM Sans','Segoe UI',sans-serif", padding:"28px 16px" }}>
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <div style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:700, color:C.charcoal }}>Welcome, {user?.name}! 🌸</div>
        <div style={{ fontSize:14, color:C.muted, marginTop:4 }}>Complete your health profile to get started</div>
      </div>

      <div style={{ maxWidth:700, margin:"0 auto", background:C.white, borderRadius:18, boxShadow:"0 8px 36px rgba(0,0,0,0.08)", overflow:"hidden" }}>

        {/* Progress bar */}
        <div style={{ height:4, background:"#EDE8E3" }}>
          <div style={{ height:"100%", width:progress+"%", background:`linear-gradient(90deg,${C.saffron},${C.teal})`, transition:"width 0.4s" }}/>
        </div>

        {/* Step tabs */}
        <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, padding:"0 24px" }}>
          {STEPS.map(s => (
            <div key={s.id} onClick={() => s.id < step && setStep(s.id)}
              style={{ flex:1, padding:"14px 8px", textAlign:"center", borderBottom:`3px solid ${step===s.id?C.saffron:"transparent"}`, cursor:s.id<step?"pointer":"default" }}>
              <div style={{ fontSize:16, marginBottom:2 }}>{s.id<step?"✅":s.icon}</div>
              <div style={{ fontSize:11, fontWeight:step===s.id?700:500, color:step===s.id?C.saffron:s.id<step?C.green:C.muted }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ padding:"26px 32px" }}>
          <div style={{ fontSize:16, fontWeight:700, color:C.charcoal, marginBottom:20 }}>
            {STEPS[step-1].icon} {STEPS[step-1].label} · Step {step} of 4
          </div>

          {apiError && (
            <div style={{ background:C.redPale, border:`1px solid ${C.red}`, borderRadius:9, padding:"10px 14px", marginBottom:16, fontSize:13, color:C.red }}>
              ⚠ {apiError}
            </div>
          )}

          {/* ── Step 1: Personal ── */}
          {step===1 && <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 18px" }}>
              <F label="Full Name" required value={d.name} onChange={e=>set("name",e.target.value)} error={errors.name}/>
              <F label="Age" required type="number" value={d.age} onChange={e=>set("age",e.target.value)} error={errors.age}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 18px" }}>
              <F label="Mobile Number" type="tel" value={d.phone} onChange={e=>set("phone",e.target.value)} placeholder="10-digit"/>
              <F label="Husband / Guardian" value={d.guardian} onChange={e=>set("guardian",e.target.value)} placeholder="Name"/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 18px" }}>
              <S label="Religion" value={d.religion} onChange={e=>set("religion",e.target.value)} options={["Hindu","Muslim","Christian","Sikh","Other"]}/>
              <S label="Caste Category" value={d.caste} onChange={e=>set("caste",e.target.value)} options={["General","OBC","SC","ST"]}/>
            </div>
            <R label="Education Level" required options={["Illiterate","Primary","Secondary","Graduate"]} value={d.education} onChange={v=>set("education",v)} error={errors.education}/>
          </>}

          {/* ── Step 2: Pregnancy ── */}
          {step===2 && <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 18px" }}>
              <F label="Last Menstrual Period (LMP)" required type="date" value={d.lmp} onChange={e=>set("lmp",e.target.value)} error={errors.lmp}/>
              <F label="Expected Delivery Date (auto)" type="date" value={d.edd} onChange={e=>set("edd",e.target.value)}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 18px" }}>
              <S label="Gestational Age (Weeks)" required value={d.weeks} onChange={e=>set("weeks",e.target.value)}
                options={Array.from({length:42},(_,i)=>({ value:`${i+1}`, label:`${i+1} weeks` }))} error={errors.weeks}/>
              <S label="Gravida (Total Pregnancies)" value={d.gravida} onChange={e=>set("gravida",e.target.value)} options={["1","2","3","4","5+"]}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0 18px" }}>
              <S label="Para (Live Births)"  value={d.para}      onChange={e=>set("para",e.target.value)}      options={["0","1","2","3","4+"]}/>
              <S label="Abortions"           value={d.abortions} onChange={e=>set("abortions",e.target.value)} options={["0","1","2","3+"]}/>
              <S label="Living Children"     value={d.living}    onChange={e=>set("living",e.target.value)}    options={["0","1","2","3","4+"]}/>
            </div>
            <R label="ANC Registration Done?" required options={["Yes","No"]} value={d.ancDone} onChange={v=>set("ancDone",v)} error={errors.ancDone}/>
            <R label="Type of Pregnancy" required options={["Singleton","Twin","Triplet"]} value={d.pregnancyType} onChange={v=>set("pregnancyType",v)}/>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:13, fontWeight:600, color:C.charcoal, display:"block", marginBottom:5 }}>Previous Complications</label>
              <textarea value={d.prevComplications} onChange={e=>set("prevComplications",e.target.value)} rows={2}
                placeholder="e.g. Preeclampsia, C-section..."
                style={{ width:"100%", padding:"10px 13px", borderRadius:9, fontSize:13, border:`1.5px solid ${C.border}`, outline:"none", fontFamily:"inherit", background:C.cream, resize:"vertical", boxSizing:"border-box" }}/>
            </div>
          </>}

          {/* ── Step 3: Health ── */}
          {step===3 && <>
            <div style={{ background:C.saffronPale, border:"1px solid #f0c090", borderRadius:9, padding:"10px 14px", marginBottom:18, fontSize:12, color:"#a05010" }}>
              💡 Enter your latest readings from your most recent checkup
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 18px" }}>
              <F label="BP Systolic (mmHg)"  required type="number" placeholder="e.g. 120" value={d.bpSys}   onChange={e=>set("bpSys",e.target.value)}   error={errors.bpSys}/>
              <F label="BP Diastolic (mmHg)" required type="number" placeholder="e.g. 80"  value={d.bpDia}   onChange={e=>set("bpDia",e.target.value)}   error={errors.bpDia}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 18px" }}>
              <F label="Hemoglobin (g/dL)" required type="number" placeholder="e.g. 11.5" value={d.hb}     onChange={e=>set("hb",e.target.value)}     error={errors.hb}/>
              <F label="Weight (kg)"        required type="number" placeholder="e.g. 58"   value={d.weight} onChange={e=>set("weight",e.target.value)} error={errors.weight}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 18px" }}>
              <F label="Blood Sugar (mg/dL)" type="number" placeholder="e.g. 95" value={d.sugar}      onChange={e=>set("sugar",e.target.value)}/>
              <S label="Blood Group" required value={d.bloodGroup} onChange={e=>set("bloodGroup",e.target.value)} options={["A+","A-","B+","B-","O+","O-","AB+","AB-"]} error={errors.bloodGroup}/>
            </div>

            {/* ── NEW: ML model inputs ── */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 18px" }}>
              <F label="Body Temperature (°F)" required type="number" placeholder="e.g. 98"
                value={d.body_temp} onChange={e=>set("body_temp",e.target.value)} error={errors.body_temp}/>
              <F label="Heart Rate (bpm)"      required type="number" placeholder="e.g. 75"
                value={d.heart_rate} onChange={e=>set("heart_rate",e.target.value)} error={errors.heart_rate}/>
            </div>

            <R label="Anemia Status" required options={["None","Mild","Moderate","Severe"]} value={d.anemia} onChange={v=>set("anemia",v)} error={errors.anemia}/>
            <R label="HIV Status"    required options={["Negative","Positive","Not Tested"]} value={d.hiv}   onChange={v=>set("hiv",v)}   error={errors.hiv}/>
          </>}

          {/* ── Step 4: Location ── */}
          {step===4 && <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 18px" }}>
              <F label="ASHA Worker Name" value={d.ashaName}   onChange={e=>set("ashaName",e.target.value)}   placeholder="Name if known"/>
              <F label="ASHA Mobile"      value={d.ashaMobile} onChange={e=>set("ashaMobile",e.target.value)} placeholder="ASHA's number" type="tel"/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 18px" }}>
              <S label="District" required value={d.district} onChange={e=>set("district",e.target.value)}
                options={["Saharanpur","Muzaffarnagar","Shamli","Haridwar","Dehradun","Other"]} error={errors.district}/>
              <S label="Block / Tehsil" value={d.block} onChange={e=>set("block",e.target.value)}
                options={["Behat","Nakur","Sarsawa","Deoband","Rampur Maniharan","Other"]}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 18px" }}>
              <F label="Village / Mohalla" required value={d.village} onChange={e=>set("village",e.target.value)} placeholder="e.g. Gangoh" error={errors.village}/>
              <F label="PIN Code" type="number" value={d.pin} onChange={e=>set("pin",e.target.value)} placeholder="6-digit"/>
            </div>
            <S label="Nearest Hospital" required value={d.hospital} onChange={e=>set("hospital",e.target.value)}
              options={["Govt. District Hospital, Saharanpur","PHC Behat","CHC Nakur","PHC Sarsawa","Other"]} error={errors.hospital}/>
            <R label="Transport Available" required options={["Walking","Auto/Rickshaw","Private Vehicle","None"]} value={d.transport} onChange={v=>set("transport",v)} error={errors.transport}/>
          </>}
        </div>

        {/* Footer */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 32px", borderTop:`1px solid ${C.border}`, background:C.cream }}>
          <button onClick={() => { if(step>1){ setStep(s=>s-1); setErrors({}); } }} disabled={step===1}
            style={{ padding:"10px 22px", borderRadius:9, border:`1.5px solid ${C.border}`, background:C.white, color:step===1?C.muted:C.charcoal, fontSize:14, fontWeight:600, cursor:step===1?"not-allowed":"pointer", opacity:step===1?0.5:1 }}>
            ← Back
          </button>
          <span style={{ fontSize:12, color:C.muted }}>Step {step} of 4</span>
          <button onClick={handleNext} disabled={saving}
            style={{ padding:"10px 26px", borderRadius:9, border:"none", background:saving?C.muted:C.saffron, color:"white", fontSize:14, fontWeight:700, cursor:saving?"not-allowed":"pointer", boxShadow:"0 4px 12px rgba(232,98,26,0.3)" }}>
            {saving?"⏳ Saving...":step===4?"✓ Submit →":"Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Default export ────────────────────────────────────────────

export default function PatientDashboard() {
  const navigate  = useNavigate();
  const user      = getCurrentUser();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user || !getToken()) { navigate("/login", { replace:true }); return; }
    apiCall("/records/me")
      .then(() => navigate("/portal", { replace:true }))
      .catch(err => {
        if (err.status === 404) setChecking(false);
        else navigate("/login", { replace:true });
      });
  }, []);

  if (checking) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:C.cream, flexDirection:"column", gap:12, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ fontSize:32 }}>🌸</div>
      <div style={{ fontSize:14, color:C.muted }}>Checking your profile...</div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace/>;
  return <RegistrationForm user={user}/>;
}