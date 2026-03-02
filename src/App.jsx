import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Login   from "./pages/Login";
import Signup  from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import PatientForm from "./components/PatientForm";
import Result  from "./pages/Result";

// Protected Route — agar login nahi toh /login pe bhejo
function Protected({ children }) {
  const user = localStorage.getItem("ms_currentUser");
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Dashboard wrapper — logout + register pass karo
function DashboardWrapper() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("ms_currentUser");
    navigate("/login");
  };
  return (
    <Dashboard
      onRegister={() => navigate("/register")}
      onLogout={handleLogout}
      onViewPatient={(p) => navigate("/result", { state: { patient: p } })}
    />
  );
}

export default function App() {
  const isLoggedIn = !!localStorage.getItem("ms_currentUser");

  return (
    <BrowserRouter>
      <Routes>

        {/* Root redirect */}
        <Route path="/" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />} />

        {/* Auth pages */}
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected pages */}
        <Route path="/dashboard" element={<Protected><DashboardWrapper /></Protected>} />
        <Route path="/register"  element={<Protected><PatientForm /></Protected>} />
        <Route path="/result"    element={<Protected><Result /></Protected>} />

        {/* 404 */}
        <Route path="*" element={
          <div style={{ textAlign: "center", marginTop: 100, fontFamily: "sans-serif" }}>
            <h2>404 — Page Not Found</h2>
            <a href="/dashboard" style={{ color: "#E8621A" }}>← Go to Dashboard</a>
          </div>
        } />

      </Routes>
    </BrowserRouter>
  );
}