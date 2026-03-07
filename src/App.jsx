import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login              from "./pages/Login";
import Signup             from "./pages/Signup";
import ASHADashboard      from "./pages/ASHADashboard";
import DoctorDashboard    from "./pages/DoctorDashboard";
import AdminDashboard     from "./pages/AdminDashboard";
import PatientDashboard   from "./pages/PatientDashboard";   // 4-step self-registration
import PatientPortal      from "./pages/PatientPortal";      // full portal after registration
import ASHAPortal         from "./pages/ASHAPortal";           // full ASHA worker portal
import PatientForm        from "./components/PatientForm";
import Result             from "./pages/Result";

function Protected({ children }) {
  const user = localStorage.getItem("ms_currentUser");
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function DashboardRouter() {
  const navigate  = useNavigate();
  const user      = JSON.parse(localStorage.getItem("ms_currentUser") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("ms_currentUser");
    navigate("/login");
  };

  switch (user.role) {
    case "asha":    return <ASHAPortal />;
    case "doctor":  return <DoctorDashboard onLogout={handleLogout} />;
    case "admin":   return <AdminDashboard  onLogout={handleLogout} />;
    case "patient": return <PatientDashboard />;   // checks profile → form or portal
    default:        return <Navigate to="/login" replace />;
  }
}

export default function App() {
  const isLoggedIn = !!localStorage.getItem("ms_currentUser");
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/signup"    element={<Signup />} />
        <Route path="/dashboard" element={<Protected><DashboardRouter /></Protected>} />
        <Route path="/portal"    element={<Protected><PatientPortal /></Protected>} />
        <Route path="/asha"      element={<Protected><ASHAPortal /></Protected>} />
        <Route path="/register"  element={<Protected><PatientForm /></Protected>} />
        <Route path="/result"    element={<Protected><Result /></Protected>} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}