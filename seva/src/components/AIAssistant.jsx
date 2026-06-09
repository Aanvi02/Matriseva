import { useState, useRef, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const QUICK_QUESTIONS = [
  "Mujhe chakkar aa rahe hain",
  "Hb 8.5 hai, kya karun?",
  "BP high hai, kya khaun?",
  "IFA tablet kab leni chahiye?",
  "Baby movement kam lag rahi hai",
];

export default function AIAssistant({ userRole = "patient" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Namaste! 🌸 Main Matriseva AI hun. Aap apni health ke baare mein kuch bhi pooch sakti hain — Hindi, English, ya Hinglish mein!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("ms_token");
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userText,
          history: messages.slice(-6).map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, abhi connection issue hai. Thodi der baad try karein. 🙏" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Sab purple
  const roleColor = "#7C3AED";
  const rolePale  = "#F5F3FF";

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 1000,
          width: "60px", height: "60px", borderRadius: "50%",
          background: `linear-gradient(135deg, #7C3AED, #5B21B6)`,
          border: "none", cursor: "pointer",
          boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
          fontSize: "28px", display: "flex", alignItems: "center",
          justifyContent: "center", transition: "transform 0.2s",
        }}
        title="AI Health Assistant"
      >
        {isOpen ? "✕" : "🌸"}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: "fixed", bottom: "96px", right: "24px", zIndex: 999,
          width: "360px", height: "500px", borderRadius: "16px",
          background: "#fff", boxShadow: "0 8px 40px rgba(124,58,237,0.2)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            background: `linear-gradient(135deg, #7C3AED, #5B21B6)`,
            padding: "14px 16px",
            color: "#fff", display: "flex", alignItems: "center", gap: "10px",
          }}>
            <span style={{ fontSize: "22px" }}>🌸</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "15px" }}>Matriseva AI</div>
              <div style={{ fontSize: "11px", opacity: 0.85 }}>
                Maternal Health Assistant • Hindi / English
              </div>
            </div>
            <div style={{
              marginLeft: "auto", width: "8px", height: "8px",
              borderRadius: "50%", background: "#4caf50",
            }} />
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "12px",
            display: "flex", flexDirection: "column", gap: "8px",
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "80%", padding: "10px 13px",
                  borderRadius: msg.role === "user"
                    ? "16px 16px 4px 16px"
                    : "16px 16px 16px 4px",
                  background: msg.role === "user" ? roleColor : "#f5f5f5",
                  color: msg.role === "user" ? "#fff" : "#222",
                  fontSize: "13px", lineHeight: "1.5",
                  whiteSpace: "pre-wrap",
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "10px 14px", borderRadius: "16px 16px 16px 4px",
                  background: "#f5f5f5", fontSize: "20px",
                }}>
                  <span>🌸</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div style={{ padding: "8px 12px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {QUICK_QUESTIONS.slice(0, 3).map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)} style={{
                  background: rolePale, border: `1px solid ${roleColor}`,
                  borderRadius: "20px", padding: "4px 10px",
                  fontSize: "11px", color: roleColor, cursor: "pointer",
                }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: "10px 12px", borderTop: "1px solid #eee",
            display: "flex", gap: "8px",
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Kuch bhi poochein..."
              style={{
                flex: 1, border: `1px solid #ddd`, borderRadius: "20px",
                padding: "8px 14px", fontSize: "13px", outline: "none",
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                background: `linear-gradient(135deg, #7C3AED, #5B21B6)`,
                border: "none", borderRadius: "50%",
                width: "36px", height: "36px", cursor: "pointer",
                color: "#fff", fontSize: "16px",
                opacity: loading || !input.trim() ? 0.5 : 1,
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}