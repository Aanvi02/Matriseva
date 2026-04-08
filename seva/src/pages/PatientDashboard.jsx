import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = "http://127.0.0.1:8000";

const C = {
  saffron: "#E8621A", saffronPale: "#FDF0E8", saffronDark: "#C04B2D",
  teal: "#0D6E6E", tealPale: "#E8F5F5",
  cream: "#F4F0EB", charcoal: "#1C1C1C",
  muted: "#6B6260", border: "#E0D8D0",
  red: "#DC2626", redPale: "#FEE2E2",
  yellow: "#D97706", yellowPale: "#FEF3C7",
  green: "#16A34A", greenPale: "#DCFCE7",
  white: "#FFFFFF",
};

// ── API helpers ──────────────────────────────────────────────
const getToken = () => localStorage.getItem("ms_token");
const getCurrentUser = () => JSON.parse(localStorage.getItem("ms_currentUser") || "null");

const apiCall = async (endpoint, method = "GET", body = null) => {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Something went wrong");
  return data;
};

const RISK = {
  HIGH:   { color: C.red,    bg: C.redPale,    emoji: "🔴", label: "High Risk" },
  MEDIUM: { color: C.yellow, bg: C.yellowPale, emoji: "🟡", label: "Moderate"  },
  LOW:    { color: C.green,  bg: C.greenPale,  emoji: "🟢", label: "Low Risk"  },
};

// ── Risk engine ──────────────────────────────────────────────
function computeRisk(d) {
  let score = 0; const flags = [];
  const bp = Number(d.bpSys), bpD = Number(d.bpDia), hb = Number(d.hb), age = Number(d.age);
  if (bp >= 160 || bpD >= 110) { score += 40; flags.push("Severe Hypertension"); }
  else if (bp >= 140 || bpD >= 90) { score += 25; flags.push("High Blood Pressure"); }
  if (hb > 0 && hb < 7)  { score += 35; flags.push("Severe Anemia"); }
  else if (hb > 0 && hb < 9) { score += 20; flags.push("Moderate Anemia"); }
  if (age < 18) { score += 20; flags.push("Teenage Pregnancy"); }
  else if (age > 35) { score += 15; flags.push("Advanced Maternal Age"); }
  if (d.pregnancyType === "Twin" || d.pregnancyType === "Triplet") { score += 20; flags.push("Multiple Pregnancy"); }
  if (d.hiv === "Positive") { score += 30; flags.push("HIV Positive"); }
  if (d.anemia === "Severe") { score += 20; }
  else if (d.anemia === "Moderate") { score += 10; }
  let level = score >= 45 ? "HIGH" : score >= 20 ? "MEDIUM" : "LOW";
  return { level, score: Math.min(score, 100), flags };
}

// ── Small field components ───────────────────────────────────
function F({ label, required, type = "text", value, onChange, placeholder, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, display: "block", marginBottom: 5 }}>
        {label}{required && <span style={{ color: C.red }}> *</span>}
      </label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", padding: "10px 13px", borderRadius: 9, fontSize: 13, border: "1.5px solid " + (error ? C.red : focused ? C.teal : C.border), outline: "none", fontFamily: "inherit", background: focused ? C.white : C.cream, transition: "all 0.2s", boxSizing: "border-box" }}
      />
      {error && <div style={{ fontSize: 11, color: C.red, marginTop: 3 }}>⚠ {error}</div>}
    </div>
  );
}

function S({ label, required, value, onChange, options, error }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, display: "block", marginBottom: 5 }}>
        {label}{required && <span style={{ color: C.red }}> *</span>}
      </label>
      <select value={value} onChange={onChange}
        style={{ width: "100%", padding: "10px 13px", borderRadius: 9, fontSize: 13, border: "1.5px solid " + (error ? C.red : C.border), outline: "none", fontFamily: "inherit", background: C.cream, cursor: "pointer", boxSizing: "border-box" }}>
        <option value="">— Select —</option>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
      {error && <div style={{ fontSize: 11, color: C.red, marginTop: 3 }}>⚠ {error}</div>}
    </div>
  );
}

function R({ label, required, options, value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, display: "block", marginBottom: 6 }}>
        {label}{required && <span style={{ color: C.red }}> *</span>}
      </label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {options.map(o => (
          <button key={o} onClick={() => onChange(o)} style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid " + (value === o ? C.teal : C.border), background: value === o ? C.tealPale : C.white, color: value === o ? C.teal : C.muted, fontSize: 13, fontWeight: value === o ? 600 : 400, cursor: "pointer", transition: "all 0.15s" }}>
            {value === o ? "●" : "○"} {o}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 4-step self-registration form ────────────────────────────
const STEPS = [
  { id: 1, label: "Personal",  icon: "👩" },
  { id: 2, label: "Pregnancy", icon: "🤰" },
  { id: 3, label: "Health",    icon: "🩺" },
  { id: 4, label: "Location",  icon: "📍" },
];

function SelfRegistrationForm({ user, onDone }) {
  const [step, setStep]     = useState(1);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [d, setD] = useState({
    age: user.age || "", name: user.name || "", phone: user.phone || "",
    guardian: "", religion: "", caste: "", education: "",
    lmp: "", weeks: "", gravida: "1", para: "0", abortions: "0", ancDone: "", pregnancyType: "Singleton", prevComplications: "",
    bpSys: "", bpDia: "", hb: "", weight: "", sugar: "", bloodGroup: "", anemia: "", hiv: "", symptoms: "",
    ashaName: "", ashaMobile: "", district: user.district || "", block: "", village: user.village || "", hospital: "", transport: "",
  });

  const set = (k, v) => { setD(p => ({ ...p, [k]: v })); setErrors(e => { const n = { ...e }; delete n[k]; return n; }); };

  const validate = () => {
    const e = {};
    if (step === 1) { if (!d.age || d.age < 10 || d.age > 60) e.age = "Valid age required"; if (!d.education) e.education = "Required"; }
    if (step === 2) { if (!d.lmp) e.lmp = "LMP required"; if (!d.weeks) e.weeks = "Required"; if (!d.ancDone) e.ancDone = "Required"; }
    if (step === 3) { if (!d.bpSys) e.bpSys = "Required"; if (!d.bpDia) e.bpDia = "Required"; if (!d.hb || d.hb < 1 || d.hb > 25) e.hb = "Valid Hb required"; if (!d.weight) e.weight = "Required"; if (!d.bloodGroup) e.bloodGroup = "Required"; if (!d.anemia) e.anemia = "Required"; if (!d.hiv) e.hiv = "Required"; }
    if (step === 4) { if (!d.district) e.district = "Required"; if (!d.village.trim()) e.village = "Required"; if (!d.hospital) e.hospital = "Required"; if (!d.transport) e.transport = "Required"; }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    if (step < 4) { setStep(step + 1); window.scrollTo({ top: 0 }); }
    else handleSubmit();
  };

  // ── BACKEND INTEGRATED handleSubmit ──
  const handleSubmit = async () => {
    setSaving(true);
    setSubmitError("");
    try {
      const risk = computeRisk(d);

      // First save health record to backend
      const record = await apiCall("/records/create", "POST", {
        ...d,
        risk: risk.level,
        riskScore: risk.score,
        riskFlags: risk.flags,
      });

      // Then get ML risk prediction from backend
      let mlRisk = null;
      try {
        mlRisk = await apiCall("/ml/predict", "POST", {
          age: Number(d.age),
          bpSys: Number(d.bpSys),
          bpDia: Number(d.bpDia),
          hb: Number(d.hb),
          weight: Number(d.weight),
          sugar: Number(d.sugar) || 0,
          weeks: Number(d.weeks),
          gravida: Number(d.gravida),
        });
      } catch (_) {
        // ML endpoint optional — won't block registration
      }

      onDone({ ...record, mlRisk });

    } catch (err) {
      setSubmitError(err.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const progress = ((step - 1) / 4) * 100;

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'DM Sans','Segoe UI',sans-serif", padding: "28px 16px" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontFamily: "'Georgia',serif", fontSize: 22, fontWeight: 700, color: C.charcoal }}>
          Welcome, {user.name}! 🌸
        </div>
        <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>Please complete your health profile to get started</div>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", background: C.white, borderRadius: 18, boxShadow: "0 8px 36px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        {/* Progress bar */}
        <div style={{ height: 4, background: "#EDE8E3" }}>
          <div style={{ height: "100%", width: progress + "%", background: `linear-gradient(90deg, ${C.saffron}, ${C.teal})`, transition: "width 0.4s" }} />
        </div>

        {/* Step tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid " + C.border, padding: "0 24px" }}>
          {STEPS.map(s => (
            <div key={s.id} onClick={() => s.id < step && setStep(s.id)}
              style={{ flex: 1, padding: "14px 8px", textAlign: "center", borderBottom: "3px solid " + (step === s.id ? C.saffron : "transparent"), cursor: s.id < step ? "pointer" : "default" }}>
              <div style={{ fontSize: 16, marginBottom: 2 }}>{s.id < step ? "✅" : s.icon}</div>
              <div style={{ fontSize: 11, fontWeight: step === s.id ? 700 : 500, color: step === s.id ? C.saffron : s.id < step ? C.green : C.muted }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: "26px 32px" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.charcoal, marginBottom: 20 }}>
            {STEPS[step - 1].icon} {STEPS[step - 1].label} · Step {step} of 4
          </div>

          {step === 1 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
                <F label="Full Name" required value={d.name} onChange={e => set("name", e.target.value)} error={errors.name} />
                <F label="Age" required type="number" value={d.age} onChange={e => set("age", e.target.value)} error={errors.age} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
                <F label="Mobile Number" type="tel" value={d.phone} onChange={e => set("phone", e.target.value)} placeholder="10-digit" />
                <F label="Husband / Guardian" value={d.guardian} onChange={e => set("guardian", e.target.value)} placeholder="Name" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
                <S label="Religion" value={d.religion} onChange={e => set("religion", e.target.value)} options={["Hindu", "Muslim", "Christian", "Sikh", "Other"]} />
                <S label="Caste Category" value={d.caste} onChange={e => set("caste", e.target.value)} options={["General", "OBC", "SC", "ST"]} />
              </div>
              <R label="Education Level" required options={["Illiterate", "Primary", "Secondary", "Graduate"]} value={d.education} onChange={v => set("education", v)} />
              {errors.education && <div style={{ fontSize: 11, color: C.red, marginTop: -10, marginBottom: 10 }}>⚠ {errors.education}</div>}
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
                <F label="Last Menstrual Period (LMP)" required type="date" value={d.lmp} onChange={e => set("lmp", e.target.value)} error={errors.lmp} />
                <F label="Expected Delivery Date" type="date" value={d.edd} onChange={e => set("edd", e.target.value)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
                <S label="Gestational Age (Weeks)" required value={d.weeks} onChange={e => set("weeks", e.target.value)} options={Array.from({ length: 42 }, (_, i) => ({ value: `${i + 1}`, label: `${i + 1} weeks` }))} error={errors.weeks} />
                <S label="Gravida (Total Pregnancies)" required value={d.gravida} onChange={e => set("gravida", e.target.value)} options={["1", "2", "3", "4", "5+"]} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 18px" }}>
                <S label="Para (Live Births)" value={d.para} onChange={e => set("para", e.target.value)} options={["0", "1", "2", "3", "4+"]} />
                <S label="Abortions" value={d.abortions} onChange={e => set("abortions", e.target.value)} options={["0", "1", "2", "3+"]} />
                <S label="Living Children" value={d.living} onChange={e => set("living", e.target.value)} options={["0", "1", "2", "3", "4+"]} />
              </div>
              <R label="ANC Registration Done?" required options={["Yes", "No"]} value={d.ancDone} onChange={v => set("ancDone", v)} />
              <R label="Type of Pregnancy" required options={["Singleton", "Twin", "Triplet"]} value={d.pregnancyType} onChange={v => set("pregnancyType", v)} />
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, display: "block", marginBottom: 5 }}>Previous Complications</label>
                <textarea value={d.prevComplications} onChange={e => set("prevComplications", e.target.value)} rows={2}
                  placeholder="e.g. Preeclampsia, C-section..."
                  style={{ width: "100%", padding: "10px 13px", borderRadius: 9, fontSize: 13, border: "1.5px solid " + C.border, outline: "none", fontFamily: "inherit", background: C.cream, resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ background: C.saffronPale, border: "1px solid #f0c090", borderRadius: 9, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: "#a05010" }}>
                💡 Enter your latest readings from recent checkup
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
                <F label="Blood Pressure Systolic" required type="number" placeholder="e.g. 120" value={d.bpSys} onChange={e => set("bpSys", e.target.value)} error={errors.bpSys} />
                <F label="Blood Pressure Diastolic" required type="number" placeholder="e.g. 80" value={d.bpDia} onChange={e => set("bpDia", e.target.value)} error={errors.bpDia} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
                <F label="Hemoglobin (g/dL)" required type="number" placeholder="e.g. 11.5" value={d.hb} onChange={e => set("hb", e.target.value)} error={errors.hb} />
                <F label="Weight (kg)" required type="number" placeholder="e.g. 58" value={d.weight} onChange={e => set("weight", e.target.value)} error={errors.weight} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
                <F label="Blood Sugar (mg/dL)" type="number" placeholder="e.g. 95" value={d.sugar} onChange={e => set("sugar", e.target.value)} />
                <S label="Blood Group" required value={d.bloodGroup} onChange={e => set("bloodGroup", e.target.value)} options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]} error={errors.bloodGroup} />
              </div>
              <R label="Anemia Status" required options={["None", "Mild", "Moderate", "Severe"]} value={d.anemia} onChange={v => set("anemia", v)} />
              <R label="HIV Status" required options={["Negative", "Positive", "Not Tested"]} value={d.hiv} onChange={v => set("hiv", v)} />
            </>
          )}

          {step === 4 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
                <F label="ASHA Worker Name" value={d.ashaName} onChange={e => set("ashaName", e.target.value)} placeholder="Name if known" />
                <F label="ASHA Mobile" type="tel" value={d.ashaMobile} onChange={e => set("ashaMobile", e.target.value)} placeholder="ASHA's number" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
                <S label="District" required value={d.district} onChange={e => set("district", e.target.value)} options={["Saharanpur", "Muzaffarnagar", "Shamli", "Haridwar", "Dehradun", "Other"]} error={errors.district} />
                <S label="Block / Tehsil" value={d.block} onChange={e => set("block", e.target.value)} options={["Behat", "Nakur", "Sarsawa", "Deoband", "Rampur Maniharan", "Other"]} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
                <F label="Village / Mohalla" required value={d.village} onChange={e => set("village", e.target.value)} placeholder="e.g. Gangoh" error={errors.village} />
                <F label="PIN Code" type="number" value={d.pin} onChange={e => set("pin", e.target.value)} placeholder="6-digit" />
              </div>
              <S label="Nearest Hospital" required value={d.hospital} onChange={e => set("hospital", e.target.value)} options={["Govt. District Hospital, Saharanpur", "PHC Behat", "CHC Nakur", "PHC Sarsawa", "Other"]} error={errors.hospital} />
              <R label="Transport Available" required options={["Walking", "Auto/Rickshaw", "Private Vehicle", "None"]} value={d.transport} onChange={v => set("transport", v)} />
            </>
          )}

          {/* Submit error */}
          {submitError && (
            <div style={{ background: C.redPale, color: C.red, padding: "10px 14px", borderRadius: 8, fontSize: 13, marginTop: 8, fontWeight: 500 }}>
              ⚠ {submitError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", borderTop: "1px solid " + C.border, background: C.cream }}>
          <button onClick={() => { if (step > 1) { setStep(step - 1); setErrors({}); } }} disabled={step === 1}
            style={{ padding: "10px 22px", borderRadius: 9, border: "1.5px solid " + C.border, background: "white", color: step === 1 ? C.muted : C.charcoal, fontSize: 14, fontWeight: 600, cursor: step === 1 ? "not-allowed" : "pointer", opacity: step === 1 ? 0.5 : 1 }}>
            ← Back
          </button>
          <span style={{ fontSize: 12, color: C.muted }}>Step {step} of 4</span>
          <button onClick={handleNext} disabled={saving}
            style={{ padding: "10px 26px", borderRadius: 9, border: "none", background: saving ? C.muted : C.saffron, color: "white", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", boxShadow: saving ? "none" : "0 4px 12px rgba(232,98,26,0.3)" }}>
            {saving ? "Saving..." : step === 4 ? "✓ Submit →" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Patient Dashboard ───────────────────────────────────
export default function PatientDashboard() {
  const navigate = useNavigate();
  const user     = getCurrentUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    // Redirect to login if no token
    if (!user || !getToken()) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const data = await apiCall("/records/me");
        setProfile(data);
      } catch (err) {
        // 404 means no profile yet — show registration form
        if (err.message === "No record found") {
          setProfile(null);
        } else {
          setFetchError("Could not load your profile. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("ms_token");
    localStorage.removeItem("ms_currentUser");
    navigate("/login");
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream, flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 32 }}>🌸</div>
      <div style={{ fontSize: 14, color: C.muted, fontFamily: "'DM Sans',sans-serif" }}>Loading your health profile...</div>
    </div>
  );

  if (fetchError) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream }}>
      <div style={{ background: C.redPale, color: C.red, padding: 24, borderRadius: 12, fontSize: 14, textAlign: "center" }}>
        ⚠ {fetchError}<br />
        <button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: "8px 18px", borderRadius: 8, border: "none", background: C.red, color: "white", cursor: "pointer", fontSize: 13 }}>Retry</button>
      </div>
    </div>
  );

  // No profile yet → show 4-step registration form
  if (!profile) return (
    <SelfRegistrationForm
      user={user}
      onDone={(p) => { setProfile(p); navigate("/portal"); }}
    />
  );

  // Profile exists → go to full portal
  navigate("/portal");
  return null;

  const risk = profile.risk ? RISK[profile.risk] : null;

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      {/* Topbar */}
      <div style={{ background: `linear-gradient(135deg, ${C.saffron}, #c04b2d)`, padding: "0 28px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🌸</span>
          <span style={{ fontFamily: "'Georgia',serif", fontSize: 17, fontWeight: 700, color: "white" }}>Matriseva</span>
          <span style={{ background: "rgba(255,255,255,0.2)", color: "white", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>MY HEALTH</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>👋 {user?.name}</span>
          <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Logout</button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px" }}>

        {/* High risk alert */}
        {profile.risk === "HIGH" && (
          <div style={{ background: C.redPale, border: "2px solid " + C.red, borderRadius: 12, padding: "12px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22 }}>🚨</span>
            <div>
              <div style={{ fontWeight: 700, color: C.red }}>HIGH RISK — Visit hospital immediately</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Contact your ASHA: {profile.ashaName}</div>
            </div>
          </div>
        )}

        {/* Profile card */}
        <div style={{ background: C.white, borderRadius: 14, padding: "20px 24px", marginBottom: 16, border: "1px solid " + C.border, display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 58, height: 58, borderRadius: "50%", background: `linear-gradient(135deg, ${C.saffron}, #c04b2d)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>👩</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Georgia',serif" }}>{profile.name}</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>Age {profile.age} · {profile.weeks} weeks · G{profile.gravida}P{profile.para} · 📍 {profile.village}</div>
            {profile.ashaName && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>ASHA: {profile.ashaName} · {profile.district}, {profile.block}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            {risk ? (
              <span style={{ background: risk.bg, color: risk.color, padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>{risk.emoji} {risk.label}</span>
            ) : (
              <span style={{ background: C.cream, color: C.muted, padding: "6px 16px", borderRadius: 20, fontSize: 12 }}>⏳ Awaiting Assessment</span>
            )}
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>ID: {profile.id}</div>
          </div>
        </div>

        {/* Risk score bar */}
        {profile.riskScore > 0 && (
          <div style={{ background: C.white, borderRadius: 12, padding: "16px 20px", marginBottom: 16, border: "1px solid " + C.border }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
              <span style={{ fontWeight: 600, color: C.charcoal }}>Risk Score</span>
              <span style={{ fontWeight: 700, color: risk?.color }}>{profile.riskScore}/100</span>
            </div>
            <div style={{ height: 8, background: C.border, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", width: profile.riskScore + "%", background: `linear-gradient(90deg, ${C.green}, ${profile.riskScore > 60 ? C.red : profile.riskScore > 30 ? C.yellow : C.green})`, borderRadius: 8, transition: "width 1s" }} />
            </div>
            {profile.riskFlags?.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                {profile.riskFlags.map(f => <span key={f} style={{ fontSize: 11, padding: "2px 9px", borderRadius: 20, background: C.redPale, color: C.red, fontWeight: 600 }}>⚠ {f}</span>)}
              </div>
            )}
          </div>
        )}

        {/* Vitals */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Blood Pressure", value: `${profile.bpSys}/${profile.bpDia}`, unit: "mmHg", warn: Number(profile.bpSys) >= 140 },
            { label: "Hemoglobin",     value: profile.hb,     unit: "g/dL", warn: Number(profile.hb) < 9 },
            { label: "Weight",         value: profile.weight, unit: "kg",   warn: false },
            { label: "Blood Sugar",    value: profile.sugar || "—", unit: "mg/dL", warn: Number(profile.sugar) > 140 },
            { label: "Blood Group",    value: profile.bloodGroup, unit: "", warn: false },
          ].map(v => (
            <div key={v.label} style={{ background: C.white, borderRadius: 11, padding: "12px", border: "1px solid " + C.border, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>{v.label}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: v.warn ? C.red : C.green, marginTop: 5 }}>{v.value}<span style={{ fontSize: 10, color: C.muted, fontWeight: 400 }}> {v.unit}</span></div>
              <div style={{ fontSize: 10, marginTop: 2, color: v.warn ? C.red : C.green, fontWeight: 600 }}>{v.warn ? "⚠ Monitor" : "✓ OK"}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Pregnancy details */}
          <div style={{ background: C.white, borderRadius: 14, padding: 20, border: "1px solid " + C.border }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: C.muted, marginBottom: 14 }}>Pregnancy Details</div>
            {[
              ["Gestational Age", profile.weeks + " weeks"],
              ["Type",            profile.pregnancyType],
              ["ANC Done",        profile.ancDone],
              ["LMP",             profile.lmp],
              ["Anemia",          profile.anemia],
              ["HIV",             profile.hiv],
            ].map(([k, v]) => v && (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "7px 0", borderBottom: "1px solid " + C.border }}>
                <span style={{ color: C.muted }}>{k}</span>
                <span style={{ fontWeight: 600, color: C.charcoal }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Visit history */}
          <div style={{ background: C.white, borderRadius: 14, padding: 20, border: "1px solid " + C.border }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: C.muted, marginBottom: 14 }}>Visit History</div>
            {profile.visits?.length > 0 ? profile.visits.map((v, i) => (
              <div key={i} style={{ borderLeft: "3px solid " + (i === 0 ? C.saffron : C.border), paddingLeft: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{v.date}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>BP: {v.bp} · Hb: {v.hb} · Wt: {v.weight}kg</div>
                {v.note && <div style={{ fontSize: 12, color: C.teal, marginTop: 2 }}>📋 {v.note}</div>}
              </div>
            )) : (
              <div style={{ textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 13 }}>
                No visits recorded yet<br />
                <span style={{ fontSize: 12 }}>Your ASHA worker will update after visits</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}