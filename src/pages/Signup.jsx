import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const C = {
  saffron:"#E8621A", saffronPale:"#FDF0E8", saffronDark:"#C04B2D",
  teal:"#0D6E6E", tealPale:"#E8F5F5",
  cream:"#F4F0EB", charcoal:"#1C1C1C", muted:"#6B6260", border:"#E0D8D0",
  red:"#DC2626", redPale:"#FEE2E2", green:"#16A34A", greenPale:"#DCFCE7",
  white:"#FFFFFF",
};

const ROLES = [
  { id:"patient", label:"Patient",     icon:"👩", desc:"Track my pregnancy health" },
  { id:"asha",    label:"ASHA Worker", icon:"🏃‍♀️", desc:"Register & monitor patients" },
  { id:"doctor",  label:"Doctor",      icon:"👨‍⚕️", desc:"Review cases & reports" },
  { id:"admin",   label:"Admin",       icon:"🏛️",  desc:"Full system access" },
];

// ── Password strength ──────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    { label:"6+ chars",   ok: password.length >= 6 },
    { label:"Uppercase",  ok: /[A-Z]/.test(password) },
    { label:"Number",     ok: /\d/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ["","#DC2626","#D97706","#16A34A"];
  return (
    <div style={{ marginTop:6 }}>
      <div style={{ display:"flex", gap:4, marginBottom:4 }}>
        {[1,2,3].map(i => <div key={i} style={{ flex:1, height:3, borderRadius:4, background: i<=score ? colors[score] : C.border, transition:"background 0.3s" }} />)}
      </div>
      <div style={{ display:"flex", gap:10 }}>
        {checks.map(c => <span key={c.label} style={{ fontSize:10, color: c.ok ? C.green : C.muted }}>{c.ok?"✓":"○"} {c.label}</span>)}
      </div>
    </div>
  );
}

// ── Field components ───────────────────────────────────────────
function Field({ label, required, type="text", value, onChange, placeholder, error, children }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:13, fontWeight:600, color:C.charcoal, display:"block", marginBottom:5 }}>
        {label} {required && <span style={{ color:C.red }}>*</span>}
      </label>
      {children || (
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ width:"100%", padding:"10px 13px", borderRadius:9, fontSize:13, border:"1.5px solid "+(error?C.red:focused?C.teal:C.border), outline:"none", fontFamily:"inherit", background: focused?C.white:C.cream, transition:"all 0.2s", boxSizing:"border-box" }}
        />
      )}
      {error && <div style={{ fontSize:11, color:C.red, marginTop:3 }}>⚠ {error}</div>}
    </div>
  );
}

function SelectField({ label, required, value, onChange, options, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:13, fontWeight:600, color:C.charcoal, display:"block", marginBottom:5 }}>
        {label} {required && <span style={{ color:C.red }}>*</span>}
      </label>
      <select value={value} onChange={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width:"100%", padding:"10px 13px", borderRadius:9, fontSize:13, border:"1.5px solid "+(error?C.red:focused?C.teal:C.border), outline:"none", fontFamily:"inherit", background:focused?C.white:C.cream, cursor:"pointer", boxSizing:"border-box" }}>
        <option value="">— Select —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <div style={{ fontSize:11, color:C.red, marginTop:3 }}>⚠ {error}</div>}
    </div>
  );
}

// ── Role-specific form fields ──────────────────────────────────
function PatientFields({ form, set, errors }) {
  return (
    <>
      <div style={{ background:C.tealPale, border:"1px solid "+C.teal+"40", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:12, color:C.teal }}>
        🤰 After signup, you'll fill your complete health & pregnancy details
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
        <Field label="Full Name" required value={form.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Priya Devi" error={errors.name} />
        <Field label="Age" required type="number" value={form.age} onChange={e=>set("age",e.target.value)} placeholder="e.g. 24" error={errors.age} />
      </div>
      <Field label="Mobile Number" required type="tel" value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="10-digit number" error={errors.phone} />
      <Field label="Email Address" required type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="your@email.com" error={errors.email} />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
        <SelectField label="District" required value={form.district} onChange={e=>set("district",e.target.value)} options={["Saharanpur","Muzaffarnagar","Shamli","Haridwar","Dehradun","Other"]} error={errors.district} />
        <Field label="Village / Mohalla" required value={form.village} onChange={e=>set("village",e.target.value)} placeholder="e.g. Gangoh" error={errors.village} />
      </div>
    </>
  );
}

function ASHAFields({ form, set, errors }) {
  return (
    <>
      <div style={{ background:C.tealPale, border:"1px solid "+C.teal+"40", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:12, color:C.teal }}>
        🏃‍♀️ ASHA worker account — you can register patients after login
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
        <Field label="Full Name" required value={form.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Sunita Sharma" error={errors.name} />
        <Field label="ASHA ID" required value={form.ashaId} onChange={e=>set("ashaId",e.target.value)} placeholder="e.g. UP-SHA-0042" error={errors.ashaId} />
      </div>
      <Field label="Mobile Number" required type="tel" value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="10-digit number" error={errors.phone} />
      <Field label="Email Address" required type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="your@email.com" error={errors.email} />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
        <SelectField label="District" required value={form.district} onChange={e=>set("district",e.target.value)} options={["Saharanpur","Muzaffarnagar","Shamli","Haridwar","Dehradun","Other"]} error={errors.district} />
        <SelectField label="Block / Tehsil" required value={form.block} onChange={e=>set("block",e.target.value)} options={["Behat","Nakur","Sarsawa","Deoband","Rampur Maniharan","Other"]} error={errors.block} />
      </div>
      <Field label="PHC / Sub-centre Name" value={form.phc} onChange={e=>set("phc",e.target.value)} placeholder="e.g. PHC Behat" />
    </>
  );
}

function DoctorFields({ form, set, errors }) {
  return (
    <>
      <div style={{ background:"#EEF2FF", border:"1px solid #8B9CF4", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:12, color:"#4338CA" }}>
        👨‍⚕️ Doctor account — review assigned patients after login
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
        <Field label="Full Name" required value={form.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Dr. Rajesh Kumar" error={errors.name} />
        <Field label="Doctor ID / Reg. No." required value={form.doctorId} onChange={e=>set("doctorId",e.target.value)} placeholder="e.g. MCI-2024-0123" error={errors.doctorId} />
      </div>
      <Field label="Mobile Number" required type="tel" value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="10-digit number" error={errors.phone} />
      <Field label="Email Address" required type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="your@email.com" error={errors.email} />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
        <SelectField label="Specialization" required value={form.specialization} onChange={e=>set("specialization",e.target.value)} options={["Gynecologist","Obstetrician","General Physician","Pediatrician","Other"]} error={errors.specialization} />
        <Field label="Hospital / Clinic" required value={form.hospital} onChange={e=>set("hospital",e.target.value)} placeholder="Hospital name" error={errors.hospital} />
      </div>
      <SelectField label="District" required value={form.district} onChange={e=>set("district",e.target.value)} options={["Saharanpur","Muzaffarnagar","Shamli","Haridwar","Dehradun","Other"]} error={errors.district} />
    </>
  );
}

function AdminFields({ form, set, errors }) {
  return (
    <>
      <div style={{ background:"#FFF7ED", border:"1px solid "+C.saffron+"60", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:12, color:C.saffronDark }}>
        🏛️ Admin account — full access to all data and analytics
      </div>
      <Field label="Full Name" required value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Admin name" error={errors.name} />
      <Field label="Email Address" required type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="admin@matriseva.in" error={errors.email} />
      <Field label="Admin Code" required value={form.adminCode} onChange={e=>set("adminCode",e.target.value)} placeholder="Enter admin access code" error={errors.adminCode} />
      <Field label="Mobile Number" required type="tel" value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="10-digit number" error={errors.phone} />
    </>
  );
}

// ── Main Signup ────────────────────────────────────────────────
export default function Signup() {
  const navigate = useNavigate();
  const [role, setRole]     = useState("patient");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [errors, setErrors]     = useState({});

  const [form, setForm] = useState({
    name:"", email:"", phone:"", password:"", confirmPassword:"",
    age:"", district:"", village:"", block:"", phc:"",
    ashaId:"", doctorId:"", specialization:"", hospital:"", adminCode:"",
  });

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                                e.name    = "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email   = "Valid email required";
    if (!/^[6-9]\d{9}$/.test(form.phone))               e.phone   = "Valid 10-digit mobile required";
    if (form.password.length < 6)                        e.password = "Min 6 characters";
    if (!/[A-Z]/.test(form.password))                    e.password = "Include 1 uppercase letter";
    if (!/\d/.test(form.password))                       e.password = "Include 1 number";
    if (form.password !== form.confirmPassword)          e.confirmPassword = "Passwords don't match";

    if (role === "patient") {
      if (!form.age || form.age < 10 || form.age > 60) e.age     = "Valid age required";
      if (!form.district)   e.district = "Required";
      if (!form.village.trim()) e.village = "Required";
    }
    if (role === "asha") {
      if (!form.ashaId.trim()) e.ashaId  = "ASHA ID required";
      if (!form.district)      e.district = "Required";
      if (!form.block)         e.block    = "Required";
    }
    if (role === "doctor") {
      if (!form.doctorId.trim())      e.doctorId      = "Doctor ID required";
      if (!form.specialization)       e.specialization = "Required";
      if (!form.hospital.trim())      e.hospital      = "Required";
      if (!form.district)             e.district      = "Required";
    }
    if (role === "admin") {
      if (form.adminCode !== "MATRISEVA2024") e.adminCode = "Invalid admin code";
    }
    return e;
  };

  const handleSignup = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    await new Promise(r => setTimeout(r, 900));

    const stored = JSON.parse(localStorage.getItem("ms_users") || "[]");
    if (stored.find(u => u.email === form.email)) {
      setErrors({ email: "Email already registered. Please log in." });
      setLoading(false);
      return;
    }

    const newUser = {
      name: form.name, email: form.email, phone: form.phone,
      password: form.password, role,
      // role-specific fields
      ...(role === "patient" && { age: form.age, district: form.district, village: form.village }),
      ...(role === "asha"    && { ashaId: form.ashaId, district: form.district, block: form.block, phc: form.phc }),
      ...(role === "doctor"  && { doctorId: form.doctorId, specialization: form.specialization, hospital: form.hospital, district: form.district }),
      createdAt: new Date().toISOString(),
    };

    stored.push(newUser);
    localStorage.setItem("ms_users", JSON.stringify(stored));
    localStorage.setItem("ms_currentUser", JSON.stringify(newUser));

    setSuccess(true);
    setLoading(false);
    setTimeout(() => navigate("/dashboard"), 1600);
  };

  // Success screen
  if (success) return (
    <div style={{ minHeight:"100vh", background:C.cream, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:60, marginBottom:14 }}>🎉</div>
        <div style={{ fontFamily:"'Georgia',serif", fontSize:22, fontWeight:700, color:C.charcoal, marginBottom:6 }}>Account Created!</div>
        <div style={{ fontSize:13, color:C.muted }}>Taking you to your dashboard...</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:C.cream, display:"flex", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>

      {/* Left panel */}
      <div style={{ flex:1, background:`linear-gradient(160deg, ${C.teal} 0%, #094f4f 100%)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:60, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-80, right:-80, width:300, height:300, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <div style={{ fontSize:52, marginBottom:16 }}>🌸</div>
        <div style={{ fontFamily:"'Georgia',serif", fontSize:32, fontWeight:700, color:"white", marginBottom:10 }}>
          Join Matri<span style={{ color:"#F4894A" }}>seva</span>
        </div>
        <div style={{ fontSize:14, color:"rgba(255,255,255,0.65)", textAlign:"center", lineHeight:1.8, maxWidth:260 }}>
          AI-powered maternal healthcare for rural India
        </div>

        {/* Role preview cards */}
        <div style={{ marginTop:40, display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:280 }}>
          {ROLES.map(r => (
            <div key={r.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, background: role===r.id ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)", border:"1px solid "+(role===r.id?"rgba(255,255,255,0.4)":"transparent"), transition:"all 0.2s" }}>
              <span style={{ fontSize:18 }}>{r.icon}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:"white" }}>{r.label}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>{r.desc}</div>
              </div>
              {role===r.id && <span style={{ marginLeft:"auto", fontSize:12, color:"#F4894A", fontWeight:700 }}>✓</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width:520, overflowY:"auto", padding:"36px 44px", display:"flex", flexDirection:"column", justifyContent:"center" }}>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:"'Georgia',serif", fontSize:22, fontWeight:700, color:C.charcoal }}>Create your account</div>
          <div style={{ fontSize:13, color:C.muted, marginTop:5 }}>Join the Matriseva healthcare network</div>
        </div>

        {/* Role tabs */}
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, color:C.muted, marginBottom:10 }}>I am a</div>
          <div style={{ display:"flex", gap:7 }}>
            {ROLES.map(r => (
              <button key={r.id} onClick={() => { setRole(r.id); setErrors({}); }} style={{
                flex:1, padding:"9px 6px", borderRadius:10, cursor:"pointer",
                border:"2px solid "+(role===r.id ? C.saffron : C.border),
                background: role===r.id ? C.saffronPale : C.white,
                transition:"all 0.2s", textAlign:"center",
              }}>
                <div style={{ fontSize:18 }}>{r.icon}</div>
                <div style={{ fontSize:10, fontWeight:600, color: role===r.id ? C.saffron : C.muted, marginTop:3 }}>{r.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Role-specific fields */}
        {role === "patient" && <PatientFields form={form} set={set} errors={errors} />}
        {role === "asha"    && <ASHAFields    form={form} set={set} errors={errors} />}
        {role === "doctor"  && <DoctorFields  form={form} set={set} errors={errors} />}
        {role === "admin"   && <AdminFields   form={form} set={set} errors={errors} />}

        {/* Password */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:13, fontWeight:600, color:C.charcoal, display:"block", marginBottom:5 }}>
            Password <span style={{ color:C.red }}>*</span>
          </label>
          <div style={{ position:"relative" }}>
            <input type={showPass?"text":"password"} value={form.password} onChange={e=>set("password",e.target.value)} placeholder="Min 6 chars, 1 uppercase, 1 number"
              style={{ width:"100%", padding:"10px 40px 10px 13px", borderRadius:9, fontSize:13, border:"1.5px solid "+(errors.password?C.red:C.border), outline:"none", fontFamily:"inherit", background:C.cream, boxSizing:"border-box" }} />
            <button onClick={()=>setShowPass(!showPass)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:15 }}>
              {showPass?"🙈":"👁️"}
            </button>
          </div>
          {errors.password && <div style={{ fontSize:11, color:C.red, marginTop:3 }}>⚠ {errors.password}</div>}
          <PasswordStrength password={form.password} />
        </div>

        {/* Confirm password */}
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:13, fontWeight:600, color:C.charcoal, display:"block", marginBottom:5 }}>
            Confirm Password <span style={{ color:C.red }}>*</span>
          </label>
          <input type="password" value={form.confirmPassword} onChange={e=>set("confirmPassword",e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleSignup()}
            placeholder="Re-enter password"
            style={{ width:"100%", padding:"10px 13px", borderRadius:9, fontSize:13, border:"1.5px solid "+(errors.confirmPassword?C.red:form.confirmPassword&&form.confirmPassword===form.password?C.green:C.border), outline:"none", fontFamily:"inherit", background:C.cream, boxSizing:"border-box" }} />
          {errors.confirmPassword && <div style={{ fontSize:11, color:C.red, marginTop:3 }}>⚠ {errors.confirmPassword}</div>}
          {form.confirmPassword && form.confirmPassword===form.password && <div style={{ fontSize:11, color:C.green, marginTop:3 }}>✓ Passwords match</div>}
        </div>

        <button onClick={handleSignup} disabled={loading} style={{
          width:"100%", padding:13, borderRadius:10, border:"none",
          background: loading ? C.muted : C.saffron, color:"white",
          fontSize:15, fontWeight:700, cursor: loading?"not-allowed":"pointer",
          boxShadow:"0 4px 16px rgba(232,98,26,0.3)", marginBottom:14,
        }}>
          {loading ? "Creating account..." : "Create Account →"}
        </button>

        <div style={{ textAlign:"center", fontSize:13, color:C.muted }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color:C.saffron, fontWeight:700, textDecoration:"none" }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}