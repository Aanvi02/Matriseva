import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const BASE_URL = "http://localhost:8000";

const C = {
  saffron: "#E8621A", saffronPale: "#FDF0E8", saffronDark: "#C04B2D",
  teal: "#0D6E6E", tealPale: "#E8F5F5",
  cream: "#F4F0EB", charcoal: "#1C1C1C",
  muted: "#6B6260", border: "#E0D8D0",
  red: "#DC2626", redPale: "#FEE2E2",
  green: "#16A34A", greenPale: "#DCFCE7",
  white: "#FFFFFF",
};

const ROLES = [
  { id: "asha",    label: "ASHA Worker", icon: "🏃‍♀️", desc: "Register & monitor patients" },
  { id: "doctor",  label: "Doctor",      icon: "👨‍⚕️", desc: "Review cases & risk reports" },
  { id: "admin",   label: "Admin",       icon: "🏛️",  desc: "Full system access" },
  { id: "patient", label: "Patient",     icon: "🤰",  desc: "View your health records" },
];

// Role → backend role mapping
const ROLE_MAP = {
  asha:    "asha_worker",
  doctor:  "doctor",
  admin:   "admin",
  patient: "patient",
};

// Role → dashboard route mapping
const ROLE_ROUTES = {
  patient:     "/dashboard/patient",
  doctor:      "/dashboard/doctor",
  asha_worker: "/dashboard/asha",
  admin:       "/dashboard/admin",
};

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole]     = useState("asha");
  const [email, setEmail]   = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Invalid email or password");
        return;
      }

      // Check if selected role matches actual role
      const expectedBackendRole = ROLE_MAP[role];
      if (data.user.role !== expectedBackendRole) {
        setError(`This account is registered as a ${data.user.role.replace("_", " ")}. Please select the correct role.`);
        return;
      }

      // Save to localStorage
      localStorage.setItem("ms_token", data.access_token);
      localStorage.setItem("ms_currentUser", JSON.stringify(data.user));

      // Navigate to correct dashboard
      navigate(ROLE_ROUTES[data.user.role] || "/dashboard");

    } catch (err) {
      setError("Cannot connect to server. Make sure backend is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.cream, display: "flex", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      {/* Left panel */}
      <div style={{ flex: 1, background: `linear-gradient(160deg, ${C.teal} 0%, #094f4f 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ fontSize: 64, marginBottom: 20 }}>🌸</div>
        <div style={{ fontFamily: "'Georgia',serif", fontSize: 38, fontWeight: 700, color: "white", marginBottom: 12 }}>
          Matri<span style={{ color: "#F4894A" }}>seva</span>
        </div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", textAlign: "center", lineHeight: 1.8, maxWidth: 280 }}>
          AI-powered maternal healthcare for rural India. Every mother. Every risk. Every village.
        </div>
        <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 14 }}>
          {["📊 Smart risk prediction", "🏥 Hospital comparison", "🚨 Emergency alerts", "📋 Digital health records"].map(f => (
            <div key={f} style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#F4894A", flexShrink: 0 }} />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: 480, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 48px", overflowY: "auto" }}>
        <div style={{ width: "100%" }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: C.charcoal, fontFamily: "'Georgia',serif" }}>Welcome back</div>
            <div style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>Sign in to your Matriseva account</div>
          </div>

          {/* Role tabs */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: C.muted, marginBottom: 10 }}>Sign in as</div>
            <div style={{ display: "flex", gap: 8 }}>
              {ROLES.map(r => (
                <button key={r.id} onClick={() => { setRole(r.id); setError(""); }} style={{
                  flex: 1, padding: "10px 8px", borderRadius: 10, cursor: "pointer",
                  border: "2px solid " + (role === r.id ? C.saffron : C.border),
                  background: role === r.id ? C.saffronPale : C.white,
                  transition: "all 0.2s", textAlign: "center",
                }}>
                  <div style={{ fontSize: 20 }}>{r.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: role === r.id ? C.saffron : C.muted, marginTop: 4 }}>{r.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Email */}
          <Field label="Email" type="email" value={email}
            onChange={e => { setEmail(e.target.value); setError(""); }}
            placeholder="your@email.com" onEnter={handleLogin} />

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, display: "block", marginBottom: 6 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="Enter your password"
                style={{ width: "100%", padding: "11px 42px 11px 14px", borderRadius: 10, fontSize: 14, border: "1.5px solid " + (error ? C.red : C.border), outline: "none", fontFamily: "inherit", background: C.cream, boxSizing: "border-box" }}
              />
              <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.muted }}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: C.redPale, color: C.red, padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16, fontWeight: 500 }}>
              ⚠ {error}
            </div>
          )}

          <button onClick={handleLogin} disabled={loading} style={{
            width: "100%", padding: 13, borderRadius: 10, border: "none",
            background: loading ? C.muted : C.saffron, color: "white",
            fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 4px 16px rgba(232,98,26,0.3)",
            transition: "all 0.2s", marginBottom: 16,
          }}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>

          <div style={{ textAlign: "center", fontSize: 13, color: C.muted }}>
            Don't have an account?{" "}
            <Link to="/signup" style={{ color: C.saffron, fontWeight: 700, textDecoration: "none" }}>Create account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = "text", value, onChange, placeholder, onEnter }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, display: "block", marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        onKeyDown={e => e.key === "Enter" && onEnter?.()}
        style={{ width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14, border: "1.5px solid " + (focused ? C.teal : C.border), outline: "none", fontFamily: "inherit", background: focused ? C.white : C.cream, transition: "all 0.2s", boxSizing: "border-box" }}
      />
    </div>
  );
}