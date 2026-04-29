import { useState, useRef, useEffect } from "react";

const LANGUAGES = ["JavaScript", "TypeScript", "Python", "Java", "C++", "Go", "Rust", "C#"];
const REVIEW_TYPES = ["Full Review", "Security", "Performance", "Style & Readability", "Logic Bugs"];

const SAMPLE_CODE = `function processUserData(users) {
  var result = [];
  for (var i = 0; i < users.length; i++) {
    var user = users[i];
    if (user.age > 18) {
      var name = user.firstName + " " + user.lastName;
      result.push({
        name: name,
        email: user.email,
        password: user.password,
        age: user.age
      });
    }
  }
  return result;
}

function fetchUserById(id) {
  const query = "SELECT * FROM users WHERE id = " + id;
  return db.execute(query);
}`;

const SEVERITY_CONFIG = {
  critical: { color: "#ff4757", bg: "#ff475715", label: "Critical" },
  warning: { color: "#ffa502", bg: "#ffa50215", label: "Warning" },
  info: { color: "#3db8f5", bg: "#3db8f515", label: "Info" },
  success: { color: "#2ed573", bg: "#2ed57315", label: "Good" },
};

const METRICS_MOCK = [
  { label: "Security Score", value: 42, max: 100, color: "#ff4757" },
  { label: "Performance", value: 78, max: 100, color: "#ffa502" },
  { label: "Readability", value: 65, max: 100, color: "#3db8f5" },
  { label: "Best Practices", value: 55, max: 100, color: "#a55eea" },
];

export default function CodeReviewAssistant() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [language, setLanguage] = useState("JavaScript");
  const [reviewType, setReviewType] = useState("Full Review");
  const [isReviewing, setIsReviewing] = useState(false);
  const [review, setReview] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [activeTab, setActiveTab] = useState("editor");
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState(null);
  const reviewRef = useRef(null);

const parseReview = (text) => {
  const issues = [];
  const lines = text.split("\n");
  let summary = "";
  let currentIssue = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Grab first real paragraph as summary
    if (!summary && trimmed.length > 40 && !trimmed.startsWith("#") && !trimmed.startsWith("*") && !trimmed.match(/^\d+\./)) {
      summary = trimmed;
      continue;
    }

    // Detect severity from line content
    const isCritical = /critical|security|vulnerab|sql injection|password|exposed|danger/i.test(trimmed);
    const isWarning = /warning|performance|inefficient|deprecated|avoid|should|consider/i.test(trimmed);
    const isInfo = /info|style|readab|suggest|minor|tip|note/i.test(trimmed);

    // Detect issue headers (numbered, bullet, or bold)
    const isHeader =
      trimmed.match(/^\d+\.\s+\*\*(.+)\*\*/) ||
      trimmed.match(/^#{1,3}\s+(.+)/) ||
      trimmed.match(/^\*\*(.+)\*\*/) ||
      trimmed.match(/^-\s+\*\*(.+)\*\*/);

    if (isHeader) {
      if (currentIssue) issues.push(currentIssue);
      const title = trimmed.replace(/^[\d\.\-#*\s]+/, "").replace(/\*\*/g, "").trim();
      const severity = isCritical ? "critical" : isWarning ? "warning" : isInfo ? "info" : "warning";
      currentIssue = { severity, title: title.slice(0, 80), description: "", suggestion: "" };
    } else if (currentIssue) {
      if (/fix|suggest|recommend|solution|instead|use |replace/i.test(trimmed)) {
        currentIssue.suggestion += trimmed.replace(/\*\*/g, "") + " ";
      } else {
        currentIssue.description += trimmed.replace(/\*\*/g, "") + " ";
      }
    }
  }

  if (currentIssue) issues.push(currentIssue);

  // Fallback if nothing was parsed
  if (issues.length === 0) {
    text.split(/\n\n+/).slice(0, 6).forEach((block) => {
      if (block.trim().length < 20) return;
      const isCritical = /critical|security|sql|password|inject/i.test(block);
      const isWarning = /warning|performance|var |loop/i.test(block);
      issues.push({
        severity: isCritical ? "critical" : isWarning ? "warning" : "info",
        title: block.split("\n")[0].replace(/[#*\d\.\-]/g, "").trim().slice(0, 80),
        description: block.split("\n").slice(1).join(" ").trim().slice(0, 250),
        suggestion: "",
      });
    });
  }

  const critCount = issues.filter(i => i.severity === "critical").length;
  const warnCount = issues.filter(i => i.severity === "warning").length;

  return {
    summary: summary || "Review complete. See issues below.",
    issues: issues.slice(0, 8),
    metrics: [
      { label: "Security Score", value: Math.max(10, 100 - critCount * 25), max: 100, color: "#ff4757" },
      { label: "Performance", value: Math.max(20, 100 - warnCount * 15), max: 100, color: "#ffa502" },
      { label: "Readability", value: Math.min(90, 60 + issues.filter(i => i.severity === "info").length * 5), max: 100, color: "#3db8f5" },
      { label: "Best Practices", value: Math.max(30, 85 - issues.length * 8), max: 100, color: "#a55eea" },
    ],
  };
};


const runReview = async () => {
  if (!code.trim()) return;
  setIsReviewing(true);
  setReview(null);
  setStreamText("");
  setError(null);

  try {
    const response = await fetch("http://localhost:3001/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language, reviewType }),
    });

    const data = await response.json();
    const text = data.text || "";
    console.log("RAW RESPONSE:", text);
    setStreamText(text);
    const parsed = parseReview(text);
    setReview(parsed);
    setMetrics(parsed.metrics);
    setActiveTab("results");
  } catch (e) {
    setError("Failed to connect to review engine. Check your API access.");
  } finally {
    setIsReviewing(false);
  }
};

  const ScoreBar = ({ label, value, max, color }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "#8892a4", fontFamily: "'IBM Plex Mono', monospace" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'IBM Plex Mono', monospace" }}>{value}</span>
      </div>
      <div style={{ height: 6, background: "#1a2035", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${(value / max) * 100}%`, background: color,
          borderRadius: 3, transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: `0 0 8px ${color}80`
        }} />
      </div>
    </div>
  );

  const IssueCard = ({ issue, index }) => {
    const cfg = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.info;
    return (
      <div style={{
        background: cfg.bg, border: `1px solid ${cfg.color}30`,
        borderLeft: `3px solid ${cfg.color}`, borderRadius: 8,
        padding: "14px 16px", marginBottom: 10,
        animation: `slideIn 0.3s ease ${index * 0.08}s both`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: cfg.color, background: `${cfg.color}20`,
            padding: "2px 8px", borderRadius: 12, fontFamily: "'IBM Plex Mono', monospace",
            letterSpacing: 1, textTransform: "uppercase"
          }}>{cfg.label}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{issue.title.slice(0, 70)}</span>
        </div>
        {issue.description && (
          <p style={{ fontSize: 12.5, color: "#8892a4", margin: "6px 0 0", lineHeight: 1.6 }}>
            {issue.description.slice(0, 250)}
          </p>
        )}
        {issue.suggestion && (
          <p style={{ fontSize: 12, color: "#3db8f5", margin: "8px 0 0", lineHeight: 1.5, fontStyle: "italic" }}>
            💡 {issue.suggestion.slice(0, 200)}
          </p>
        )}
      </div>
    );
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0d1117", color: "#e2e8f0",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 10px #3db8f530; } 50% { box-shadow: 0 0 22px #3db8f560; } }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0d1117; }
        ::-webkit-scrollbar-thumb { background: #2a3550; border-radius: 3px; }
        textarea:focus { outline: none; }
        select:focus { outline: none; }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "18px 28px", borderBottom: "1px solid #1e2d40",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#0d1117",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #3db8f5, #a55eea)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: "0 0 16px #3db8f540"
          }}>⚡</div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: -0.5 }}>
              CodeReview<span style={{ color: "#3db8f5" }}>AI</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["editor", "results", "metrics"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 600,
              background: activeTab === tab ? "#1e2d40" : "transparent",
              color: activeTab === tab ? "#3db8f5" : "#4a5568",
              borderBottom: activeTab === tab ? "2px solid #3db8f5" : "2px solid transparent",
              transition: "all 0.2s",
            }}>{tab.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", gap: 0, overflow: "hidden" }}>

        {/* Left Panel - always visible */}
        <div style={{
          width: 260, borderRight: "1px solid #1e2d40", padding: 20,
          display: "flex", flexDirection: "column", gap: 20, overflowY: "auto",
          background: "#0b0f18",
        }}>
          <div>
            <label style={{ fontSize: 11, color: "#4a5568", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1, display: "block", marginBottom: 8 }}>LANGUAGE</label>
            <select value={language} onChange={e => setLanguage(e.target.value)} style={{
              width: "100%", background: "#1a2035", border: "1px solid #2a3550",
              color: "#e2e8f0", padding: "8px 10px", borderRadius: 6, fontSize: 13,
              fontFamily: "'IBM Plex Mono', monospace", cursor: "pointer",
            }}>
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, color: "#4a5568", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1, display: "block", marginBottom: 8 }}>REVIEW TYPE</label>
            {REVIEW_TYPES.map(rt => (
              <div key={rt} onClick={() => setReviewType(rt)} style={{
                padding: "8px 12px", borderRadius: 6, marginBottom: 4, cursor: "pointer",
                background: reviewType === rt ? "#1a2d40" : "transparent",
                border: `1px solid ${reviewType === rt ? "#3db8f530" : "transparent"}`,
                color: reviewType === rt ? "#3db8f5" : "#5a6a80", fontSize: 13,
                transition: "all 0.15s",
              }}>{rt}</div>
            ))}
          </div>

          {metrics && (
            <div>
              <label style={{ fontSize: 11, color: "#4a5568", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1, display: "block", marginBottom: 12 }}>QUICK METRICS</label>
              {metrics.map(m => <ScoreBar key={m.label} {...m} />)}
            </div>
          )}

          <button onClick={runReview} disabled={isReviewing || !code.trim()} style={{
            marginTop: "auto", padding: "12px", borderRadius: 8, border: "none",
            cursor: isReviewing ? "not-allowed" : "pointer",
            background: isReviewing ? "#1a2035" : "linear-gradient(135deg, #3db8f5, #2563eb)",
            color: isReviewing ? "#4a5568" : "#fff",
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14,
            letterSpacing: 0.5, transition: "all 0.2s",
            animation: !isReviewing && code.trim() ? "glow 2.5s ease infinite" : "none",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {isReviewing ? (
              <>
                <div style={{ width: 14, height: 14, border: "2px solid #4a5568", borderTopColor: "#3db8f5", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                Analyzing...
              </>
            ) : "▶ Run Review"}
          </button>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

          {activeTab === "editor" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: "#4a5568", fontFamily: "'IBM Plex Mono', monospace" }}>
                  {language.toLowerCase()} · {code.split("\n").length} lines
                </span>
                <button onClick={() => setCode("")} style={{
                  background: "none", border: "1px solid #2a3550", color: "#4a5568",
                  padding: "4px 10px", borderRadius: 5, cursor: "pointer", fontSize: 11,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}>Clear</button>
              </div>
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder={`// Paste your ${language} code here...\n// Or use the sample code already loaded`}
                style={{
                  flex: 1, background: "#0b0f18", border: "1px solid #1e2d40",
                  color: "#a8b2c1", padding: 20, borderRadius: 10, resize: "none",
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 13.5, lineHeight: 1.7,
                  minHeight: 400,
                }}
              />
            </div>
          )}

          {activeTab === "results" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 24 }} ref={reviewRef}>
              {!review && !isReviewing && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#2a3550" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, marginBottom: 8 }}>No review yet</div>
                  <div style={{ fontSize: 13, fontFamily: "'IBM Plex Mono', monospace" }}>Run a review from the editor tab</div>
                </div>
              )}
              {isReviewing && (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <div style={{ width: 40, height: 40, border: "3px solid #1e2d40", borderTopColor: "#3db8f5", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
                  <div style={{ color: "#3db8f5", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>Analyzing your code...</div>
                </div>
              )}
              {review && !isReviewing && (
                <>
                  <div style={{
                    background: "#0b1929", border: "1px solid #1e2d40", borderRadius: 10,
                    padding: 16, marginBottom: 20
                  }}>
                    <div style={{ fontSize: 11, color: "#4a5568", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 6, letterSpacing: 1 }}>SUMMARY</div>
                    <p style={{ fontSize: 14, color: "#8892a4", lineHeight: 1.7, margin: 0 }}>{review.summary}</p>
                  </div>
                  <div style={{ fontSize: 11, color: "#4a5568", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 12, letterSpacing: 1 }}>
                    ISSUES FOUND ({review.issues.length})
                  </div>
                  {review.issues.map((issue, i) => <IssueCard key={i} issue={issue} index={i} />)}
                  {error && <div style={{ color: "#ff4757", fontSize: 13, padding: 12, background: "#ff475710", borderRadius: 8 }}>{error}</div>}
                </>
              )}
            </div>
          )}

          {activeTab === "metrics" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
              {!metrics ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#2a3550" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, marginBottom: 8 }}>No metrics yet</div>
                  <div style={{ fontSize: 13, fontFamily: "'IBM Plex Mono', monospace" }}>Run a review to generate quality metrics</div>
                </div>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                    {metrics.map(m => (
                      <div key={m.label} style={{
                        background: "#0b0f18", border: "1px solid #1e2d40", borderRadius: 12,
                        padding: 20, position: "relative", overflow: "hidden"
                      }}>
                        <div style={{
                          position: "absolute", top: 0, left: 0, width: "100%", height: 3,
                          background: `linear-gradient(90deg, ${m.color}, transparent)`
                        }} />
                        <div style={{ fontSize: 32, fontWeight: 800, color: m.color, fontFamily: "'Space Grotesk', sans-serif" }}>{m.value}</div>
                        <div style={{ fontSize: 12, color: "#4a5568", fontFamily: "'IBM Plex Mono', monospace", marginTop: 4 }}>{m.label}</div>
                        <div style={{ height: 4, background: "#1a2035", borderRadius: 2, marginTop: 12, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${m.value}%`, background: m.color, borderRadius: 2, transition: "width 1.2s ease" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "#0b0f18", border: "1px solid #1e2d40", borderRadius: 12, padding: 20 }}>
                    <div style={{ fontSize: 11, color: "#4a5568", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1, marginBottom: 16 }}>ISSUE BREAKDOWN</div>
                    {["critical", "warning", "info", "success"].map(sev => {
                      const count = review?.issues.filter(i => i.severity === sev).length || 0;
                      const cfg = SEVERITY_CONFIG[sev];
                      return (
                        <div key={sev} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                          <span style={{ width: 70, fontSize: 11, color: cfg.color, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1 }}>{cfg.label.toUpperCase()}</span>
                          <div style={{ flex: 1, height: 8, background: "#1a2035", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.min(100, count * 20)}%`, background: cfg.color, borderRadius: 4, transition: "width 1s ease" }} />
                          </div>
                          <span style={{ width: 24, textAlign: "right", fontSize: 13, fontWeight: 700, color: cfg.color, fontFamily: "'IBM Plex Mono', monospace" }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
