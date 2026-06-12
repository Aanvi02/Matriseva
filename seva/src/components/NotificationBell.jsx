import { useState, useEffect } from "react";

const C = {
  purple: "#7C3AED", purplePale: "#F5F3FF",
  red: "#DC2626", redPale: "#FEE2E2",
  yellow: "#D97706", yellowPale: "#FEF3C7",
  green: "#16A34A", greenPale: "#DCFCE7",
  teal: "#0D6E6E", muted: "#6B6260",
  border: "#E0D8D0", white: "#FFFFFF", charcoal: "#1C1C2E",
};

function generatePatientNotifications(profile) {
  const notifications = [];
  const now = new Date();
  const ancDone = Number(profile?.anc_done ?? profile?.ancDone ?? 0);
  const weeks = Number(profile?.weeks ?? 0);

  // High Risk Alert
  if (profile?.risk === "HIGH")
    notifications.push({ id: "risk_high", icon: "🔴", title: "High Risk Alert!", body: "Your risk level is HIGH. Please see a doctor today.", color: C.red, bg: C.redPale, time: "Urgent" });

  // ANC Reminders
  if (weeks >= 12 && ancDone < 1)
    notifications.push({ id: "anc1", icon: "📅", title: "ANC Visit Due", body: "First ANC visit not done yet. Book today.", color: C.red, bg: C.redPale, time: "Overdue" });
  else if (weeks >= 26 && ancDone < 2)
    notifications.push({ id: "anc2", icon: "📅", title: "2nd ANC Visit Due", body: "Second ANC visit is due. Please see your doctor.", color: C.red, bg: C.redPale, time: "Overdue" });
  else if (weeks >= 34 && ancDone < 3)
    notifications.push({ id: "anc3", icon: "📅", title: "3rd ANC Visit Due", body: "Third ANC visit is due. Book soon.", color: C.yellow, bg: C.yellowPale, time: "Due Soon" });

  // Medicine Reminders
  const today = now.toISOString().split("T")[0];
  const medKey = "ms_med_" + (profile?.id || "pat");
  let taken = {};
  try { taken = JSON.parse(localStorage.getItem(medKey) || "{}"); } catch {}
  [
    { id: "ifa", name: "IFA Tablet", critical: true },
    { id: "calcium", name: "Calcium Supplement", critical: false },
  ].forEach(m => {
    if (!taken[today + "_" + m.id])
      notifications.push({ id: "med_" + m.id, icon: "💊", title: m.name + " — Not taken today!", body: m.critical ? "⚠ Critical — take today after dinner." : "Today's dose is pending.", color: m.critical ? C.red : C.yellow, bg: m.critical ? C.redPale : C.yellowPale, time: "Today" });
  });

  return notifications;
}

function generateASHANotifications(patients = []) {
  const notifications = [];

  // High risk patients
  const highRisk = patients.filter(p => p.risk === "HIGH");
  if (highRisk.length > 0)
    notifications.push({ id: "asha_highrisk", icon: "🔴", title: `${highRisk.length} High Risk Patient(s)!`, body: highRisk.slice(0, 3).map(p => p.name).join(", ") + (highRisk.length > 3 ? ` +${highRisk.length - 3} more` : ""), color: C.red, bg: C.redPale, time: "Urgent" });

  // Unassigned patients
  const unassigned = patients.filter(p => !p.doctor_id);
  if (unassigned.length > 0)
    notifications.push({ id: "asha_unassigned", icon: "👨‍⚕️", title: `${unassigned.length} Patient(s) Without Doctor`, body: "These patients need a doctor assigned.", color: C.yellow, bg: C.yellowPale, time: "Action Needed" });

  // Overdue ANC
  const overdueANC = patients.filter(p => {
    const weeks = Number(p.weeks ?? 0);
    const ancDone = Number(p.anc_done ?? 0);
    return (weeks >= 12 && ancDone < 1) || (weeks >= 26 && ancDone < 2);
  });
  if (overdueANC.length > 0)
    notifications.push({ id: "asha_anc", icon: "📅", title: `${overdueANC.length} Overdue ANC Visit(s)`, body: "Some patients have missed their ANC schedule.", color: C.teal, bg: "#E8F5F5", time: "Overdue" });

  return notifications;
}

function generateDoctorNotifications(patients = [], appointments = []) {
  const notifications = [];
  const today = new Date().toISOString().split("T")[0];

  // High risk patients
  const highRisk = patients.filter(p => p.risk === "HIGH");
  if (highRisk.length > 0)
    notifications.push({ id: "doc_highrisk", icon: "🔴", title: `${highRisk.length} High Risk Patient(s)`, body: highRisk.slice(0, 3).map(p => p.name).join(", ") + (highRisk.length > 3 ? ` +${highRisk.length - 3} more` : ""), color: C.red, bg: C.redPale, time: "Urgent" });

  // Pending reviews
  const pending = patients.filter(p => p.status === "pending");
  if (pending.length > 0)
    notifications.push({ id: "doc_pending", icon: "⏳", title: `${pending.length} Patient(s) Pending Review`, body: "These patients are waiting for your review.", color: C.yellow, bg: C.yellowPale, time: "Action Needed" });

  // Today's appointments
  const todayAppts = appointments.filter(a => a.date === today && a.status !== "cancelled");
  if (todayAppts.length > 0)
    notifications.push({ id: "doc_appts", icon: "📅", title: `${todayAppts.length} Appointment(s) Today`, body: todayAppts.slice(0, 2).map(a => `${a.patient_name} at ${a.time || "—"}`).join(", "), color: C.teal, bg: "#E8F5F5", time: "Today" });

  return notifications;
}

export default function NotificationBell({ profile, userRole = "patient", patients = [], appointments = [] }) {
  const [open, setOpen] = useState(false);
  const storageKey = `ms_dismissed_notifs_${userRole}`;
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { return []; }
  });

  // Generate notifications based on role
  const allNotifs =
    userRole === "asha"   ? generateASHANotifications(patients) :
    userRole === "doctor" ? generateDoctorNotifications(patients, appointments) :
    generatePatientNotifications(profile);

  const visible = allNotifs.filter(n => !dismissed.includes(n.id));
  const unread = visible.length;

  const dismiss = (id) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const dismissAll = () => {
    const updated = [...dismissed, ...visible.map(n => n.id)];
    setDismissed(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setOpen(false);
  };

  useEffect(() => {
    const lastReset = localStorage.getItem(`ms_notif_reset_${userRole}`);
    const today = new Date().toISOString().split("T")[0];
    if (lastReset !== today) {
      localStorage.removeItem(storageKey);
      localStorage.setItem(`ms_notif_reset_${userRole}`, today);
      setDismissed([]);
    }
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "10px", padding: "6px 10px", cursor: "pointer", fontSize: "20px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }} title="Notifications">
        🔔
        {unread > 0 && (
          <span style={{ position: "absolute", top: "-4px", right: "-4px", background: C.red, color: "white", borderRadius: "50%", width: "18px", height: "18px", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", top: "44px", right: 0, zIndex: 500, width: "340px", maxHeight: "420px", overflowY: "auto", background: C.white, borderRadius: "14px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", border: `1px solid ${C.border}` }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: "14px" }}>🔔 Notifications {unread > 0 && <span style={{ color: C.red }}>({unread})</span>}</span>
            {unread > 0 && <button onClick={dismissAll} style={{ fontSize: "11px", color: C.muted, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Clear all</button>}
          </div>

          {visible.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: C.muted }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>✅</div>
              <div style={{ fontSize: "13px" }}>All clear! No pending reminders.</div>
            </div>
          ) : visible.map(n => (
            <div key={n.id} style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: "12px", alignItems: "flex-start", background: n.bg + "60" }}>
              <span style={{ fontSize: "20px", marginTop: "2px" }}>{n.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: n.color }}>{n.title}</div>
                <div style={{ fontSize: "12px", color: C.charcoal, marginTop: "3px", lineHeight: 1.5 }}>{n.body}</div>
                <div style={{ fontSize: "10px", color: C.muted, marginTop: "4px", fontWeight: 600 }}>{n.time}</div>
              </div>
              <button onClick={() => dismiss(n.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: "16px", padding: "0" }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {open && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 499 }} />}
    </div>
  );
}