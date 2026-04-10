import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login            from "./pages/Login";
import Signup           from "./pages/Signup";
import DoctorDashboard  from "./pages/DoctorDashboard";
import AdminDashboard   from "./pages/AdminDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import PatientPortal    from "./pages/PatientPortal";
import ASHAPortal       from "./pages/ASHAPortal";
import PatientForm      from "./components/PatientForm";
import Result           from "./pages/Result";

function Protected({ children }) {
  const user = localStorage.getItem("ms_currentUser");
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function DashboardRouter() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("ms_currentUser") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("ms_token");
    localStorage.removeItem("ms_currentUser");
    navigate("/login");
  };

  // ✅ FIX: backend returns "asha_worker" not "asha"
  switch (user.role) {
    case "asha_worker": return <ASHAPortal />;
    case "doctor":      return <DoctorDashboard onLogout={handleLogout} />;
    case "admin":       return <AdminDashboard  onLogout={handleLogout} />;
    case "patient":     return <PatientDashboard />;
    default:            return <Navigate to="/login" replace />;
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
        {/* ✅ FIX: /portal now renders PatientPortal directly, no more navigate() loop */}
        <Route path="/portal"    element={<Protected><PatientPortal /></Protected>} />
        <Route path="/asha"      element={<Protected><ASHAPortal /></Protected>} />
        <Route path="/register"  element={<Protected><PatientForm /></Protected>} />
        <Route path="/result"    element={<Protected><Result /></Protected>} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}