import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login            from "./pages/Login";
import Signup           from "./pages/Signup";
import DoctorDashboard  from "./pages/DoctorDashboard";
import AdminDashboard   from "./pages/AdminDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import PatientPortal    from "./pages/PatientPortal";
import ASHAPortal       from "./pages/Ashaportal";
import PatientForm      from "./components/PatientForm";
import Result           from "./pages/Result";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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

  // Keep-alive: Render free plan pe backend so jaata hai
  // Har 10 min mein ping karo taaki cold start na ho
  useEffect(() => {
    fetch(`${BACKEND_URL}/`).catch(() => {});
    const id = setInterval(() => {
      fetch(`${BACKEND_URL}/`).catch(() => {});
    }, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

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