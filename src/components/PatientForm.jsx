import { useState } from "react";

const C = {
  saffron: "#E8621A",
  teal: "#0D6E6E",
  tealPale: "#E8F5F5",
  saffronPale: "#FDF0E8",
  cream: "#FBF6EF",
  charcoal: "#1C1C1C",
  muted: "#6B6260",
  border: "#E0D8D0",
  white: "#FFFFFF",
  red: "#DC2626",
  green: "#16A34A",
};

const STEPS = [
  { id: 1, label: "Personal Info",   icon: "👩" },
  { id: 2, label: "Pregnancy Info",  icon: "🤰" },
  { id: 3, label: "Health Details",  icon: "🩺" },
  { id: 4, label: "ASHA & Location", icon: "📍" },
];

/* ── reusable field components ── */
function Label({ children, required }) {
  return (
    <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, marginBottom: 6, display: "block" }}>
      {children} {required && <span style={{ color: C.red }}>*</span>}
    </label>
  );
}

function Input({ label, required, type = "text", placeholder, value, onChange, error, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 20 }}>
      <Label required={required}>{label}</Label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
        style={{
          width: "100%", padding: "11px 14px",
          borderRadius: 10, fontSize: 14,
          border: `1.5px solid ${error ? C.red : focused ? C.teal : C.border}`,
          outline: "none", background: focused ? "#fff" : C.cream,
          transition: "all 0.2s", color: C.charcoal,
          fontFamily: "inherit",
          boxShadow: focused ? `0 0 0 3px ${C.teal}18` : "none",
        }}
      />
      {error && <div style={{ fontSize: 12, color: C.red, marginTop: 5 }}>⚠ {error}</div>}
    </div>
  );
}

function Select({ label, required, options, value, onChange, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 20 }}>
      <Label required={required}>{label}</Label>
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", padding: "11px 14px",
          borderRadius: 10, fontSize: 14,
          border: `1.5px solid ${error ? C.red : focused ? C.teal : C.border}`,
          outline: "none", background: focused ? "#fff" : C.cream,
          color: value ? C.charcoal : C.muted,
          transition: "all 0.2s", cursor: "pointer",
          fontFamily: "inherit",
          boxShadow: focused ? `0 0 0 3px ${C.teal}18` : "none",
        }}
      >
        <option value="">— Select —</option>
        {options.map(o => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
      {error && <div style={{ fontSize: 12, color: C.red, marginTop: 5 }}>⚠ {error}</div>}
    </div>
  );
}

function RadioGroup({ label, required, options, value, onChange }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <Label required={required}>{label}</Label>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {options.map(o => (
          <label key={o} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "9px 16px", borderRadius: 8, cursor: "pointer",
            border: `1.5px solid ${value === o ? C.teal : C.border}`,
            background: value === o ? C.tealPale : C.cream,
            fontSize: 13, fontWeight: value === o ? 600 : 400,
            color: value === o ? C.teal : C.muted,
            transition: "all 0.2s",
          }}>
            <input type="radio" value={o} checked={value === o} onChange={() => onChange(o)}
              style={{ display: "none" }} />
            {value === o ? "●" : "○"} {o}
          </label>
        ))}
      </div>
    </div>
  );
}

function Textarea({ label, required, placeholder, value, onChange, rows = 3 }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 20 }}>
      <Label required={required}>{label}</Label>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", padding: "11px 14px",
          borderRadius: 10, fontSize: 14, resize: "vertical",
          border: `1.5px solid ${focused ? C.teal : C.border}`,
          outline: "none", background: focused ? "#fff" : C.cream,
          transition: "all 0.2s", color: C.charcoal,
          fontFamily: "inherit", lineHeight: 1.6,
          boxShadow: focused ? `0 0 0 3px ${C.teal}18` : "none",
        }}
      />
    </div>
  );
}

/* ── Step 1: Personal Info ── */
function Step1({ data, set, errors }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <Input label="Full Name" required placeholder="e.g. Priya Devi"
          value={data.name} onChange={e => set("name", e.target.value)} error={errors.name} />
        <Input label="Age" required type="number" placeholder="e.g. 24"
          value={data.age} onChange={e => set("age", e.target.value)} error={errors.age} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <Input label="Mobile Number" required type="tel" placeholder="10-digit number"
          value={data.phone} onChange={e => set("phone", e.target.value)} error={errors.phone} />
        <Input label="Aadhaar Number" placeholder="XXXX XXXX XXXX"
          value={data.aadhaar} onChange={e => set("aadhaar", e.target.value)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <Select label="Religion" options={["Hindu", "Muslim", "Christian", "Sikh", "Other"]}
          value={data.religion} onChange={e => set("religion", e.target.value)} />
        <Select label="Caste Category" options={["General", "OBC", "SC", "ST"]}
          value={data.caste} onChange={e => set("caste", e.target.value)} />
      </div>
      <RadioGroup label="Education Level" required
        options={["Illiterate", "Primary", "Secondary", "Graduate"]}
        value={data.education} onChange={v => set("education", v)} />
      <Input label="Husband / Guardian Name" placeholder="Full name"
        value={data.guardian} onChange={e => set("guardian", e.target.value)} />
    </div>
  );
}

/* ── Step 2: Pregnancy Info ── */
function Step2({ data, set, errors }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <Input label="Last Menstrual Period (LMP)" required type="date"
          value={data.lmp} onChange={e => set("lmp", e.target.value)} error={errors.lmp} />
        <Input label="Expected Delivery Date (EDD)" type="date"
          value={data.edd} onChange={e => set("edd", e.target.value)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <Select label="Gestational Age (Weeks)" required
          options={Array.from({ length: 42 }, (_, i) => ({ value: `${i + 1}`, label: `${i + 1} weeks` }))}
          value={data.weeks} onChange={e => set("weeks", e.target.value)} error={errors.weeks} />
        <Select label="Gravida (Total Pregnancies)" required
          options={["1", "2", "3", "4", "5+"]}
          value={data.gravida} onChange={e => set("gravida", e.target.value)} error={errors.gravida} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 20px" }}>
        <Select label="Para (Live Births)" options={["0", "1", "2", "3", "4+"]}
          value={data.para} onChange={e => set("para", e.target.value)} />
        <Select label="Abortions" options={["0", "1", "2", "3+"]}
          value={data.abortions} onChange={e => set("abortions", e.target.value)} />
        <Select label="Living Children" options={["0", "1", "2", "3", "4+"]}
          value={data.living} onChange={e => set("living", e.target.value)} />
      </div>
      <RadioGroup label="ANC Registration Done?" required
        options={["Yes", "No"]}
        value={data.ancDone} onChange={v => set("ancDone", v)} />
      <RadioGroup label="Type of Pregnancy" required
        options={["Singleton", "Twin", "Triplet"]}
        value={data.pregnancyType} onChange={v => set("pregnancyType", v)} />
      <Textarea label="Previous Complications (if any)"
        placeholder="e.g. Preeclampsia, C-section, Stillbirth..."
        value={data.prevComplications} onChange={e => set("prevComplications", e.target.value)} />
    </div>
  );
}

/* ── Step 3: Health Details ── */
function Step3({ data, set, errors }) {
  return (
    <div>
      <div style={{
        background: C.saffronPale, border: `1px solid #f0c090`,
        borderRadius: 10, padding: "12px 16px", marginBottom: 22, fontSize: 13, color: "#a05010"
      }}>
        💡 Enter latest readings from the most recent checkup.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <Input label="Blood Pressure (Systolic)" required placeholder="e.g. 120" type="number"
          value={data.bpSys} onChange={e => set("bpSys", e.target.value)} error={errors.bpSys} />
        <Input label="Blood Pressure (Diastolic)" required placeholder="e.g. 80" type="number"
          value={data.bpDia} onChange={e => set("bpDia", e.target.value)} error={errors.bpDia} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <Input label="Hemoglobin (g/dL)" required placeholder="e.g. 11.5" type="number"
          value={data.hb} onChange={e => set("hb", e.target.value)} error={errors.hb} />
        <Input label="Weight (kg)" required placeholder="e.g. 58" type="number"
          value={data.weight} onChange={e => set("weight", e.target.value)} error={errors.weight} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <Input label="Blood Sugar (mg/dL)" placeholder="e.g. 95" type="number"
          value={data.sugar} onChange={e => set("sugar", e.target.value)} />
        <Select label="Blood Group" required
          options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]}
          value={data.bloodGroup} onChange={e => set("bloodGroup", e.target.value)} error={errors.bloodGroup} />
      </div>
      <RadioGroup label="Anemia Status" required
        options={["None", "Mild", "Moderate", "Severe"]}
        value={data.anemia} onChange={v => set("anemia", v)} />
      <RadioGroup label="HIV Status" required
        options={["Negative", "Positive", "Not Tested"]}
        value={data.hiv} onChange={v => set("hiv", v)} />
      <Textarea label="Current Symptoms / Complaints"
        placeholder="e.g. Swelling in feet, headache, reduced fetal movement..."
        value={data.symptoms} onChange={e => set("symptoms", e.target.value)} />
    </div>
  );
}

/* ── Step 4: ASHA & Location ── */
function Step4({ data, set, errors }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <Input label="ASHA Worker Name" required placeholder="Name of assigned ASHA"
          value={data.ashaName} onChange={e => set("ashaName", e.target.value)} error={errors.ashaName} />
        <Input label="ASHA Mobile" required type="tel" placeholder="ASHA's 10-digit number"
          value={data.ashaMobile} onChange={e => set("ashaMobile", e.target.value)} error={errors.ashaMobile} />
      </div>
      <Input label="ASHA Worker ID" placeholder="e.g. UP-SHA-2024-0042"
        value={data.ashaId} onChange={e => set("ashaId", e.target.value)} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <Select label="District" required
          options={["Saharanpur", "Muzaffarnagar", "Shamli", "Haridwar", "Dehradun", "Other"]}
          value={data.district} onChange={e => set("district", e.target.value)} error={errors.district} />
        <Select label="Block / Tehsil" required
          options={["Saharanpur", "Behat", "Nakur", "Sarsawa", "Deoband", "Rampur Maniharan", "Other"]}
          value={data.block} onChange={e => set("block", e.target.value)} error={errors.block} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <Input label="Village / Mohalla" required placeholder="e.g. Gangoh"
          value={data.village} onChange={e => set("village", e.target.value)} error={errors.village} />
        <Input label="PIN Code" type="number" placeholder="6-digit PIN"
          value={data.pin} onChange={e => set("pin", e.target.value)} />
      </div>
      <Select label="Nearest Government Hospital" required
        options={["Govt. District Hospital, Saharanpur", "PHC Behat", "CHC Nakur", "PHC Sarsawa", "Other"]}
        value={data.hospital} onChange={e => set("hospital", e.target.value)} error={errors.hospital} />
      <RadioGroup label="Mode of Transport Available" required
        options={["Walking", "Auto/Rickshaw", "Private Vehicle", "None"]}
        value={data.transport} onChange={v => set("transport", v)} />
    </div>
  );
}

/* ── Summary ── */
function Summary({ allData }) {
  const sections = [
    { title: "Personal Info", icon: "👩", fields: [
      ["Name", allData[1].name], ["Age", allData[1].age], ["Phone", allData[1].phone],
      ["Education", allData[1].education], ["Guardian", allData[1].guardian],
    ]},
    { title: "Pregnancy Info", icon: "🤰", fields: [
      ["Gestational Age", allData[2].weeks ? `${allData[2].weeks} weeks` : ""],
      ["Gravida / Para", `G${allData[2].gravida || "-"} P${allData[2].para || "-"}`],
      ["LMP", allData[2].lmp], ["ANC Done", allData[2].ancDone],
      ["Pregnancy Type", allData[2].pregnancyType],
    ]},
    { title: "Health Details", icon: "🩺", fields: [
      ["Blood Pressure", allData[3].bpSys ? `${allData[3].bpSys}/${allData[3].bpDia} mmHg` : ""],
      ["Hemoglobin", allData[3].hb ? `${allData[3].hb} g/dL` : ""],
      ["Weight", allData[3].weight ? `${allData[3].weight} kg` : ""],
      ["Blood Group", allData[3].bloodGroup], ["Anemia", allData[3].anemia],
    ]},
    { title: "ASHA & Location", icon: "📍", fields: [
      ["ASHA Name", allData[4].ashaName], ["District", allData[4].district],
      ["Block", allData[4].block], ["Village", allData[4].village],
      ["Nearest Hospital", allData[4].hospital],
    ]},
  ];

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>✅</div>
        <div style={{ fontFamily: "'Georgia', serif", fontSize: 22, fontWeight: 700, color: C.charcoal }}>
          Review Registration
        </div>
        <div style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>Please verify all details before submitting.</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {sections.map(s => (
          <div key={s.title} style={{
            background: C.cream, borderRadius: 12, padding: "18px 20px",
            border: `1px solid ${C.border}`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.teal, marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}>
              {s.icon} {s.title}
            </div>
            {s.fields.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 7 }}>
                <span style={{ color: C.muted }}>{k}</span>
                <span style={{ fontWeight: 600, color: C.charcoal, textAlign: "right", maxWidth: "55%" }}>{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Success ── */
function Success({ patientId }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{ fontSize: 64, marginBottom: 16, animation: "bounceIn 0.5s ease" }}>🎉</div>
      <div style={{ fontFamily: "'Georgia', serif", fontSize: 26, fontWeight: 700, color: C.charcoal, marginBottom: 10 }}>
        Registration Successful!
      </div>
      <div style={{ fontSize: 15, color: C.muted, marginBottom: 28, lineHeight: 1.7 }}>
        Patient has been registered and assigned to the ASHA worker.<br />
        AI risk analysis will begin shortly.
      </div>
      <div style={{
        background: C.tealPale, border: `2px solid ${C.teal}`,
        borderRadius: 14, padding: "18px 32px", display: "inline-block", marginBottom: 32,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.teal }}>Patient ID</div>
        <div style={{ fontFamily: "monospace", fontSize: 26, fontWeight: 800, color: C.teal, marginTop: 4 }}>{patientId}</div>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button onClick={() => window.location.reload()} style={{
          background: C.saffron, color: "white",
          padding: "12px 28px", borderRadius: 10, border: "none",
          fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>+ Register Another Patient</button>
        <button style={{
          background: "white", color: C.teal,
          padding: "12px 28px", borderRadius: 10,
          border: `2px solid ${C.teal}`,
          fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>View Patient Profile →</button>
      </div>
    </div>
  );
}

/* ── MAIN FORM ── */
export default function PatientRegistrationForm() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [errors, setErrors] = useState({});

  const emptyStep = () => ({
    // step 1
    name: "", age: "", phone: "", aadhaar: "", religion: "",
    caste: "", education: "", guardian: "",
    // step 2
    lmp: "", edd: "", weeks: "", gravida: "", para: "",
    abortions: "", living: "", ancDone: "", pregnancyType: "", prevComplications: "",
    // step 3
    bpSys: "", bpDia: "", hb: "", weight: "", sugar: "",
    bloodGroup: "", anemia: "", hiv: "", symptoms: "",
    // step 4
    ashaName: "", ashaMobile: "", ashaId: "", district: "",
    block: "", village: "", pin: "", hospital: "", transport: "",
  });

  const [allData, setAllData] = useState({ 1: emptyStep(), 2: emptyStep(), 3: emptyStep(), 4: emptyStep() });

  const set = (key, value) => {
    setAllData(prev => ({ ...prev, [step]: { ...prev[step], [key]: value } }));
    if (errors[key]) setErrors(prev => { const e = { ...prev }; delete e[key]; return e; });
  };

  const validate = () => {
    const d = allData[step];
    const e = {};
    if (step === 1) {
      if (!d.name.trim()) e.name = "Name is required";
      if (!d.age || d.age < 10 || d.age > 60) e.age = "Enter valid age (10–60)";
      if (!/^[6-9]\d{9}$/.test(d.phone)) e.phone = "Enter valid 10-digit mobile number";
      if (!d.education) e.education = "Please select education level";
    }
    if (step === 2) {
      if (!d.lmp) e.lmp = "LMP date is required";
      if (!d.weeks) e.weeks = "Gestational age is required";
      if (!d.gravida) e.gravida = "Gravida is required";
      if (!d.ancDone) e.ancDone = "Required";
    }
    if (step === 3) {
      if (!d.bpSys) e.bpSys = "Required";
      if (!d.bpDia) e.bpDia = "Required";
      if (!d.hb || d.hb < 1 || d.hb > 25) e.hb = "Enter valid Hb (1–25)";
      if (!d.weight || d.weight < 20 || d.weight > 200) e.weight = "Enter valid weight";
      if (!d.bloodGroup) e.bloodGroup = "Required";
      if (!d.anemia) e.anemia = "Required";
      if (!d.hiv) e.hiv = "Required";
    }
    if (step === 4) {
      if (!d.ashaName.trim()) e.ashaName = "ASHA name required";
      if (!/^[6-9]\d{9}$/.test(d.ashaMobile)) e.ashaMobile = "Valid mobile required";
      if (!d.district) e.district = "Required";
      if (!d.block) e.block = "Required";
      if (!d.village.trim()) e.village = "Required";
      if (!d.hospital) e.hospital = "Required";
      if (!d.transport) e.transport = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    if (step < 4) { setStep(step + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else setStep(5);
  };

  const handleSubmit = () => {
    const id = "MAT-" + allData[4].district.slice(0, 3).toUpperCase() + "-" + Date.now().toString().slice(-6);
    setPatientId(id);
    setSubmitted(true);
  };

  const progress = submitted ? 100 : ((step - 1) / 4) * 100;

  const stepData = allData[step] || {};

  return (
    <div style={{ minHeight: "100vh", background: "#F4F0EB", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", padding: "32px 16px" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: C.saffron, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, boxShadow: "0 4px 10px rgba(232,98,26,0.3)" }}>🌸</div>
          <span style={{ fontFamily: "'Georgia', serif", fontSize: 20, fontWeight: 700, color: C.charcoal }}>
            Matri<span style={{ color: C.saffron }}>seva</span>
          </span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.charcoal, fontFamily: "'Georgia', serif" }}>
          Patient Registration
        </div>
        <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>Register a new pregnant patient into the Matriseva system</div>
      </div>

      {/* Card */}
      <div style={{ maxWidth: 780, margin: "0 auto", background: C.white, borderRadius: 20, boxShadow: "0 8px 40px rgba(0,0,0,0.09)", overflow: "hidden" }}>

        {/* Progress bar */}
        <div style={{ height: 4, background: "#EDE8E3" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${C.saffron}, ${C.teal})`, transition: "width 0.4s ease" }} />
        </div>

        {/* Step indicators */}
        {!submitted && (
          <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, padding: "0 32px" }}>
            {STEPS.map(s => (
              <div key={s.id} onClick={() => s.id < step && setStep(s.id)} style={{
                flex: 1, padding: "16px 8px", textAlign: "center",
                borderBottom: `3px solid ${step === s.id ? C.saffron : "transparent"}`,
                cursor: s.id < step ? "pointer" : "default",
                transition: "all 0.2s",
              }}>
                <div style={{ fontSize: 18, marginBottom: 3 }}>{s.id < step ? "✅" : s.icon}</div>
                <div style={{ fontSize: 11.5, fontWeight: step === s.id ? 700 : 500, color: step === s.id ? C.saffron : s.id < step ? C.green : C.muted }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div style={{ padding: "32px 36px" }}>
          {!submitted && step <= 4 && (
            <>
              <div style={{ marginBottom: 26 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.charcoal, display: "flex", alignItems: "center", gap: 8 }}>
                  {STEPS[step - 1].icon} {STEPS[step - 1].label}
                </div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Step {step} of 4</div>
              </div>

              {step === 1 && <Step1 data={stepData} set={set} errors={errors} />}
              {step === 2 && <Step2 data={stepData} set={set} errors={errors} />}
              {step === 3 && <Step3 data={stepData} set={set} errors={errors} />}
              {step === 4 && <Step4 data={stepData} set={set} errors={errors} />}
            </>
          )}

          {!submitted && step === 5 && <Summary allData={allData} />}
          {submitted && <Success patientId={patientId} />}
        </div>

        {/* Footer buttons */}
        {!submitted && (
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "20px 36px", borderTop: `1px solid ${C.border}`,
            background: C.cream,
          }}>
            <button
              onClick={() => { if (step > 1) { setStep(step - 1); setErrors({}); } }}
              disabled={step === 1}
              style={{
                padding: "11px 24px", borderRadius: 10, border: `1.5px solid ${C.border}`,
                background: "white", color: step === 1 ? C.muted : C.charcoal,
                fontSize: 14, fontWeight: 600, cursor: step === 1 ? "not-allowed" : "pointer",
                opacity: step === 1 ? 0.5 : 1, transition: "all 0.2s",
              }}
            >← Back</button>

            <div style={{ fontSize: 12, color: C.muted }}>
              {step <= 4 ? `${Object.keys(errors).length > 0 ? "⚠ Fix errors to continue" : `Step ${step} of 4`}` : "Review your details"}
            </div>

            {step < 5 ? (
              <button onClick={handleNext} style={{
                padding: "11px 28px", borderRadius: 10, border: "none",
                background: C.saffron, color: "white",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 14px rgba(232,98,26,0.3)", transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#C04B2D"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.saffron; e.currentTarget.style.transform = "none"; }}
              >
                {step === 4 ? "Review →" : "Next →"}
              </button>
            ) : (
              <button onClick={handleSubmit} style={{
                padding: "11px 28px", borderRadius: 10, border: "none",
                background: C.teal, color: "white",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 14px rgba(13,110,110,0.3)", transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#0a5252"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.teal; e.currentTarget.style.transform = "none"; }}
              >
                ✓ Confirm & Submit
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}