import { useNavigate } from "react-router-dom";

export default function Result() {
  const navigate = useNavigate(); // ← andar hona chahiye

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>✅ Result Page</h2>
      <button onClick={() => navigate("/dashboard")}>
        Go to Dashboard
      </button>
    </div>
  );
}