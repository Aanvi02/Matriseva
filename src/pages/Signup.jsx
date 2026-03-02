import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const C = {
  saffron: "#E8621A", saffronPale: "#FDF0E8",
  teal: "#0D6E6E", tealPale: "#E8F5F5",
  cream: "#F4F0EB", charcoal: "#1C1C1C",
  muted: "#6B6260", border: "#E0D8D0",
  red: "#DC2626", redPale: "#FEE2E2",
  green: "#16A34A", greenPale: "#DCFCE7",
  white: "#FFFFFF",
};

const ROLES = [
  { id: "asha",    label: "ASHA Worker", icon: "🏃‍♀️", desc: "Register & monitor patients" },
  { id: "doctor",  label: "Doctor",      icon: "👨‍⚕️", desc: "Review and manage cases" },
  { id: "admin",   label: "Admin",       icon: "🏛️",  desc: "Full system access" },
  { id: "patient", label: "Patient",     icon: "🤰",  desc: "View your health records" },
];

function validate(form) {
  const errors = {};
  if (!form.name.trim())                                  errors.name     = "Full name is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))   errors.email    = "Enter a valid email address";
  if (!/^[6-9]\d{9}$/.test(form.phone))                 errors.phone    = "Enter valid 10-digit mobile number";
  if (form.password.length < 6)                          errors.password = "Password must be at least 6 characters";
  if (!/[A-Z]/.test(form.password))                      errors.password = "Include at least one uppercase letter";
  if (!/\d/.test(form.password))                         errors.password = "Include at least one number";
  if (form.password !== form.confirmPassword)            errors.confirmPassword = "Passwords do not match";
  return errors;
}

function PasswordStrength({ password }) {
  const checks = [
    { label: "6+ characters",  ok: password.length >= 6 },
    { label: "Uppercase",      ok: /[A-Z]/.test(password) },
    { label: "Number",         ok: /\d/.test(password) },
    { label: "Special char",   ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ["#DC2626","#D97706","#D97706","#16A34A","#16A34A"];
  const labels = ["","Weak","Fair","Good","Strong"];
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= score ? colors[score] : C.border, transition: "background 0.3s" }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 10 }}>
          {checks.map(c => (
            <span key={c.label} style={{ fontSize: 11, color: c.ok ? C.green : C.muted }}>
              {c.ok ? "✓" : "○"} {c.label}
            </span>
          ))}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: colors[score] }}>{labels[score]}</span>
      </div>
    </div>
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "", role: "asha" });
  const [errors, setErrors]   = useState({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]  = useState(false);
  const [success, setSuccess]  = useState(false);

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  };

  const handleSignup = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    await new Promise(r => setTimeout(r, 900));

    const stored = JSON.parse(localStorage.getItem("ms_users") || "[]");

    if (stored.find(u => u.email === form.email)) {
      setErrors({ email: "This email is already registered. Please log in." });
      setLoading(false);
      return;
    }

    const newUser = { name: form.name, email: form.email, phone: form.phone, password: form.password, role: form.role, createdAt: new Date().toISOString() };
    stored.push(newUser);
    localStorage.setItem("ms_users", JSON.stringify(stored));
    localStorage.setItem("ms_currentUser", JSON.stringify(newUser));

    setSuccess(true);
    setLoading(false);
    setTimeout(() => navigate("/dashboard"), 1800);
  };

  if (success) return (
    <div style={{ minHeight: "100vh", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <div style={{ fontFamily: "'Georgia',serif", fontSize: 24, fontWeight: 700, color: C.charcoal, marginBottom: 8 }}>Account Created!</div>
        <div style={{ fontSize: 14, color: C.muted }}>Redirecting to dashboard...</div>
        <div style={{ marginTop: 20, width: 40, height: 4, borderRadius: 4, background: C.saffron, margin: "20px auto 0", animation: "grow 1.8s ease forwards" }} />
        <style>{`@keyframes grow { from{width:0} to{width:200px} }`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.cream, display: "flex", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      {/* Left panel */}
      <div style={{ flex: 1, background: `linear-gradient(160deg, ${C.teal} 0%, #094f4f 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ fontSize: 56, marginBottom: 18 }}>🌸</div>
        <div style={{ fontFamily: "'Georgia',serif", fontSize: 34, fontWeight: 700, color: "white", marginBottom: 12 }}>
          Join Matri<span style={{ color: "#F4894A" }}>seva</span>
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", textAlign: "center", lineHeight: 1.8, maxWidth: 280 }}>
          Create your account and start making a difference in maternal healthcare across rural India.
        </div>
        <div style={{ marginTop: 40, background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 24px", width: "100%", maxWidth: 300 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Platform stats</div>
          {[["247", "Active patients"], ["12", "ASHA workers"], ["3", "Linked hospitals"]].map(([n, l]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{l}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#F4894A" }}>{n}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: 520, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 48px", overflowY: "auto" }}>
        <div style={{ width: "100%" }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.charcoal, fontFamily: "'Georgia',serif" }}>Create your account</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>Join the Matriseva healthcare network</div>
          </div>

          {/* Role selector */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: C.muted, marginBottom: 10 }}>I am a</div>
            <div style={{ display: "flex", gap: 8 }}>
              {ROLES.map(r => (
                <button key={r.id} onClick={() => set("role", r.id)} style={{
                  flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer",
                  border: "2px solid " + (form.role === r.id ? C.saffron : C.border),
                  background: form.role === r.id ? C.saffronPale : C.white,
                  transition: "all 0.2s", textAlign: "center",
                }}>
                  <div style={{ fontSize: 20 }}>{r.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: form.role === r.id ? C.saffron : C.muted, marginTop: 4 }}>{r.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Name + Phone */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <FormField label="Full Name" value={form.name} onChange={v => set("name", v)} placeholder="Sunita Sharma" error={errors.name} />
            <FormField label="Mobile Number" value={form.phone} onChange={v => set("phone", v)} placeholder="9876543210" error={errors.phone} type="tel" />
          </div>

          <FormField label="Email Address" value={form.email} onChange={v => set("email", v)} placeholder="sunita@example.com" error={errors.email} type="email" />

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, display: "block", marginBottom: 6 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input type={showPass ? "text" : "password"} value={form.password}
                onChange={e => set("password", e.target.value)}
                placeholder="Min 6 chars, 1 uppercase, 1 number"
                style={{ width: "100%", padding: "11px 42px 11px 14px", borderRadius: 10, fontSize: 14, border: "1.5px solid " + (errors.password ? C.red : C.border), outline: "none", fontFamily: "inherit", background: C.cream, boxSizing: "border-box" }}
              />
              <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && <div style={{ fontSize: 12, color: C.red, marginTop: 4 }}>⚠ {errors.password}</div>}
            <PasswordStrength password={form.password} />
          </div>

          {/* Confirm password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, display: "block", marginBottom: 6 }}>Confirm Password</label>
            <input type="password" value={form.confirmPassword}
              onChange={e => set("confirmPassword", e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSignup()}
              placeholder="Re-enter password"
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14, border: "1.5px solid " + (errors.confirmPassword ? C.red : form.confirmPassword && form.confirmPassword === form.password ? C.green : C.border), outline: "none", fontFamily: "inherit", background: C.cream, boxSizing: "border-box" }}
            />
            {errors.confirmPassword && <div style={{ fontSize: 12, color: C.red, marginTop: 4 }}>⚠ {errors.confirmPassword}</div>}
            {form.confirmPassword && form.confirmPassword === form.password && <div style={{ fontSize: 12, color: C.green, marginTop: 4 }}>✓ Passwords match</div>}
          </div>

          <button onClick={handleSignup} disabled={loading} style={{
            width: "100%", padding: 13, borderRadius: 10, border: "none",
            background: loading ? C.muted : C.saffron, color: "white",
            fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 4px 16px rgba(232,98,26,0.3)", marginBottom: 16,
          }}>
            {loading ? "Creating account..." : "Create Account →"}
          </button>

          <div style={{ textAlign: "center", fontSize: 13, color: C.muted }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: C.saffron, fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, error, type = "text" }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, display: "block", marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14, border: "1.5px solid " + (error ? C.red : focused ? C.teal : C.border), outline: "none", fontFamily: "inherit", background: focused ? C.white : C.cream, transition: "all 0.2s", boxSizing: "border-box" }}
      />
      {error && <div style={{ fontSize: 12, color: C.red, marginTop: 4 }}>⚠ {error}</div>}
    </div>
  );
}