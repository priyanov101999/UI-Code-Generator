import React, { useState } from "react";
import GeneratedPreview from "./GeneratedPreview";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const extractCode = (llmResponse) => {
    const codeMatch = llmResponse.match(/```(?:jsx)?\s*([\s\S]*?)```/);
    return codeMatch?.[1]?.trim() ?? llmResponse.trim();
  };

  const generateUI = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: prompt }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setGeneratedCode(extractCode(data.answer || ""));
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>React UI Generator</h2>

      {/* FLEX ROW: Prompt + Generated Code */}
      <div
        style={{
          display: "flex",
          gap: 24, // better spacing
          marginTop: 20,
        }}
      >
        {/* LEFT SIDE — PROMPT */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            height: 300,           // equal height
          }}
        >
          <h3 style={{ marginBottom: 8 }}>Prompt</h3>

          <textarea
            style={{
              flex: 1,              // this makes it same height as the code box
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 14,
              resize: "none",
            }}
            value={prompt}
            placeholder="Describe your UI..."
            onChange={(e) => setPrompt(e.target.value)}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 12,
              gap: 12,
            }}
          >
            <button
              onClick={generateUI}
              disabled={loading || !prompt.trim()}
              style={{
                padding: "10px 20px",
                fontWeight: "bold",
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Generating..." : "Generate UI"}
            </button>

            {/* Loader spinner */}
            {loading && (
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: "3px solid #aaa",
                  borderTopColor: "transparent",
                  animation: "spin 0.7s linear infinite",
                }}
              />
            )}
          </div>

          {error && (
            <div style={{ color: "red", marginTop: 10 }}>{error}</div>
          )}
        </div>

        {/* RIGHT SIDE — GENERATED CODE */}
        <div
          style={{
            flex: 1,
            height: 300, // equal height with prompt area
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h3 style={{ marginBottom: 8 }}>Generated Code</h3>

          <pre
            style={{
              flex: 1,               // makes height match the left side
              background: "#111",
              color: "#0f0",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
              fontSize: 13,
              whiteSpace: "pre-wrap",
            }}
          >
            {generatedCode || "// Code will appear here"}
          </pre>
        </div>
      </div>

      {/* Live preview */}
      <h3 style={{ marginTop: 32 }}>Live Preview</h3>
      <div
        style={{
          border: "1px solid #ccc",
          padding: 20,
          minHeight: 250,
          borderRadius: 8,
        }}
      >
        <GeneratedPreview code={generatedCode} />
      </div>

      {/* Loader CSS */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
