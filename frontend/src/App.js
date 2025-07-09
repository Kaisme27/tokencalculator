import React, { useState } from 'react';
import { useRef, useEffect } from "react";

const MODES = [
  {
    label: "Basic",
    value: "basic",
    description: "Estimate tokens for the current page only (all text, structure, and features)."
  },
  {
    label: "Smart",
    value: "smart",
    description: "Estimate tokens for the current page and all user-added related pages (e.g. login, register, feature pages, etc.)."
  },
  {
    label: "Full",
    value: "full",
    description: "Estimate tokens for the entire website (current page + all discovered pages)."
  }
];

const FUN_MESSAGES = [
  "AI is crawling your website's secret corners...",
  "Counting tokens like a squirrel counts nuts...",
  "Exploring every page, even the hidden ones!",
  "Analyzing forms, buttons, and mysterious features...",
  "Almost there, don't blink!",
  "AI is working hard, please grab a coffee ☕",
  "Mapping the digital universe...",
  "Summoning token wizards...",
  "Calculating, calculating, calculating...",
  "This is not magic, it's just a lot of math!"
];

function App() {
  const [mode, setMode] = useState("basic");
  const [mainUrl, setMainUrl] = useState("");
  const [otherUrls, setOtherUrls] = useState([""]);
  const [batchInput, setBatchInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [funMsg, setFunMsg] = useState(FUN_MESSAGES[0]);
  const progressRef = useRef();
  const funMsgRef = useRef();

  // 去重并过滤空URL
  const getAllUrls = () => {
    let urls = [mainUrl.trim()];
    if (mode === "smart") {
      const manualUrls = otherUrls.map(u => u.trim()).filter(Boolean);
      const batchUrls = batchInput
        .split(/\r?\n/)
        .map(u => u.trim())
        .filter(Boolean);
      urls = urls.concat(manualUrls, batchUrls);
    }
    // 去重
    return Array.from(new Set(urls.filter(Boolean)));
  };

  const handleOtherUrlChange = (idx, value) => {
    setOtherUrls(urls => urls.map((u, i) => i === idx ? value : u));
  };
  const addOtherUrl = () => setOtherUrls(urls => [...urls, ""]);
  const removeOtherUrl = idx => setOtherUrls(urls => urls.length === 1 ? urls : urls.filter((_, i) => i !== idx));

  // 进度条动画
  useEffect(() => {
    if (loading && mode === "full") {
      setProgress(0);
      progressRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) return prev + Math.random() * 3 + 1;
          return prev;
        });
      }, 400);
      funMsgRef.current = setInterval(() => {
        setFunMsg(FUN_MESSAGES[Math.floor(Math.random() * FUN_MESSAGES.length)]);
      }, 1800);
    } else {
      clearInterval(progressRef.current);
      clearInterval(funMsgRef.current);
    }
    return () => {
      clearInterval(progressRef.current);
      clearInterval(funMsgRef.current);
    };
    // eslint-disable-next-line
  }, [loading, mode]);

  useEffect(() => {
    if (!loading && mode === "full") {
      setProgress(100);
      setTimeout(() => setProgress(0), 1200);
    }
  }, [loading, mode]);

  const analyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const allUrls = getAllUrls();
      if (!allUrls.length) throw new Error("Please enter at least one valid URL.");
      const body = { mode, main_url: allUrls[0] };
      if (mode === "smart") {
        body.other_urls = allUrls.slice(1);
      }
      const res = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message || "Analysis failed. Please check the backend service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#f8fafc 60%,#e6f0ff 100%)',
      padding: 0,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 左右装饰性渐变圆/模糊色块 */}
      <div style={{
        position: 'absolute',
        left: -180,
        top: 120,
        width: 340,
        height: 340,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 60% 40%, #1677ff33 60%, transparent 100%)',
        filter: 'blur(12px)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        right: -160,
        top: 320,
        width: 320,
        height: 320,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 40% 60%, #52c41a33 60%, transparent 100%)',
        filter: 'blur(14px)',
        zIndex: 0
      }} />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: '48px 0 32px 0', position: 'relative', zIndex: 1 }}>
        <div style={{marginBottom: 40, background: '#fff', borderRadius: 18, boxShadow: '0 4px 32px #e6f0ff', padding: '40px 36px 32px 36px', textAlign: 'center', maxWidth: 1000, margin: '0 auto'}}>
          <h1 style={{fontSize: 38, fontWeight: 900, marginBottom: 12, letterSpacing: 1, color: '#222'}}>Website Token Estimator</h1>
          <h2 style={{fontSize: 22, fontWeight: 500, color: '#555', marginBottom: 22, letterSpacing: 0.5}}>
            Instantly estimate how many tokens to rebuild a website.<br />Fast, accurate, and free for web development, website cloning, and SaaS projects.
          </h2>
          <div style={{display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 24}}>
            <div style={{background: '#f6faff', borderRadius: 12, boxShadow: '0 2px 8px #e6f0ff', padding: '18px 28px', minWidth: 120}}>
              <div style={{fontWeight: 700, fontSize: 18, color: '#1677ff'}}>Fast</div>
              <div style={{fontSize: 15, color: '#444'}}>Get results in seconds</div>
            </div>
            <div style={{background: '#f6faff', borderRadius: 12, boxShadow: '0 2px 8px #e6f0ff', padding: '18px 28px', minWidth: 120}}>
              <div style={{fontWeight: 700, fontSize: 18, color: '#52c41a'}}>Accurate</div>
              <div style={{fontSize: 15, color: '#444'}}>AI-powered analysis</div>
            </div>
            <div style={{background: '#f6faff', borderRadius: 12, boxShadow: '0 2px 8px #e6f0ff', padding: '18px 28px', minWidth: 120}}>
              <div style={{fontWeight: 700, fontSize: 18, color: '#fa541c'}}>Free</div>
              <div style={{fontSize: 15, color: '#444'}}>No login, no cost</div>
            </div>
          </div>
          <button onClick={() => window.scrollTo({top: 400, behavior: 'smooth'})} style={{padding: '16px 44px', fontSize: 20, borderRadius: 10, background: 'linear-gradient(90deg,#1677ff,#52c41a)', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 12px #e6f0ff', marginTop: 8, letterSpacing: 1}}>Start Estimating Now</button>
        </div>
        <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 2px 16px #e6f0ff', padding: '36px 32px', marginBottom: 36, maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ marginBottom: 32 }}>
            <b style={{fontSize: 18, color: '#222'}}>Estimation Mode:</b>
            <div style={{ display: "flex", flexDirection: "row", gap: 24, marginTop: 18 }}>
              {MODES.map(opt => (
                <label
                  key={opt.value}
                  style={{
                    userSelect: "none",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    minWidth: 180,
                    maxWidth: 220,
                    padding: 18,
                    borderRadius: 12,
                    border: mode === opt.value ? "2.5px solid #1677ff" : "1.5px solid #e6f0ff",
                    background: mode === opt.value ? "#f0f7ff" : "#fafbfc",
                    boxShadow: mode === opt.value ? "0 2px 8px #e6f0ff" : "none",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onClick={() => setMode(opt.value)}
                >
                  <span style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                    <input
                      type="radio"
                      name="mode"
                      value={opt.value}
                      checked={mode === opt.value}
                      onChange={() => setMode(opt.value)}
                      style={{ marginRight: 8 }}
                    />
                    <b style={{ fontSize: 17 }}>{opt.label}</b>
                  </span>
                  <span style={{ fontSize: 14, color: "#555", marginLeft: 26, lineHeight: 1.5 }}>{opt.description}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <b style={{fontSize: 17}}>Page URL:</b><br />
            <input
              value={mainUrl}
              onChange={e => setMainUrl(e.target.value)}
              placeholder="Enter main page URL, e.g. https://www.example.com"
              style={{ width: 420, padding: 12, marginTop: 10, borderRadius: 8, border: "1.5px solid #e6f0ff", fontSize: 16, boxShadow: '0 1px 4px #f0f7ff', outline: 'none' }}
            />
          </div>
          {mode === "smart" && (
            <div style={{ marginTop: 24 }}>
              <b style={{fontSize: 17}}>Other Related Page URLs:</b>
              {otherUrls.map((url, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", marginTop: 10 }}>
                  <input
                    value={url}
                    onChange={e => handleOtherUrlChange(idx, e.target.value)}
                    placeholder="Enter related page URL"
                    style={{ width: 340, padding: 10, borderRadius: 8, border: "1.5px solid #e6f0ff", fontSize: 15, boxShadow: '0 1px 4px #f0f7ff', outline: 'none' }}
                  />
                  {otherUrls.length > 1 && (
                    <button onClick={() => removeOtherUrl(idx)} style={{ marginLeft: 8, color: "#f5222d", border: "none", background: "none", fontWeight: 700, fontSize: 22, cursor: "pointer" }}>×</button>
                  )}
                </div>
              ))}
              <button onClick={addOtherUrl} style={{ padding: "7px 18px", borderRadius: 6, background: "#52c41a", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 15, marginTop: 12, boxShadow: '0 1px 4px #e6f0ff' }}>+ Add Page</button>
              <div style={{ marginTop: 18 }}>
                <b style={{fontSize: 16}}>Batch Import URLs (one per line):</b><br />
                <textarea
                  value={batchInput}
                  onChange={e => setBatchInput(e.target.value)}
                  placeholder="Paste or type multiple URLs, one per line"
                  rows={4}
                  style={{ width: 420, marginTop: 8, borderRadius: 8, border: "1.5px solid #e6f0ff", padding: 10, fontSize: 15, boxShadow: '0 1px 4px #f0f7ff', outline: 'none' }}
                />
              </div>
            </div>
          )}
          <button onClick={analyze} disabled={loading || !mainUrl} style={{ marginTop: 36, padding: "14px 38px", borderRadius: 10, background: 'linear-gradient(90deg,#1677ff,#52c41a)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 20, boxShadow: '0 2px 12px #e6f0ff', letterSpacing: 1 }}>
            {loading ? (mode === "full" ? "Analyzing Full Site..." : "Analyzing...") : "Estimate Token"}
          </button>
          {/* full模式下的进度条和趣味提示 */}
          {loading && mode === "full" && (
            <div style={{ marginTop: 36, width: 420, marginLeft: 'auto', marginRight: 'auto' }}>
              <div style={{ height: 20, background: "#e6f4ff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 4px #e6f0ff" }}>
                <div style={{ width: `${Math.min(progress, 100)}%`, height: 20, background: "linear-gradient(90deg,#1677ff,#52c41a)", transition: "width 0.4s" }} />
              </div>
              <div style={{ marginTop: 14, color: "#888", fontSize: 16, minHeight: 24, fontStyle: "italic" }}>{funMsg}</div>
            </div>
          )}
          {error && <div style={{ color: "red", marginTop: 18, fontSize: 16 }}>{error}</div>}
          {result && (
            <div style={{ marginTop: 38, fontSize: 17, background: '#f8fafc', borderRadius: 14, boxShadow: '0 2px 8px #e6f0ff', padding: '28px 24px', maxWidth: 1000, margin: '0 auto' }}>
              <b>Total Token Estimate:</b> <span style={{ color: "#1677ff", fontWeight: 700, fontSize: 22 }}>{result.total_min_token} ~ {result.total_max_token}</span>
              <div style={{ fontSize: 15, color: "#888", marginTop: 4, marginBottom: 8, maxWidth: 600 }}>
                This is the total token range for all pages actually analyzed in this run (main page + all pages crawled or specified). It reflects the minimum token cost for the pages currently covered by the analysis.
              </div>
              {mode === "full" && (
                <div style={{ marginTop: 8, fontSize: 16 }}>
                  <b>Full Website Estimate:</b> <span style={{ color: "#fa541c", fontWeight: 700 }}>{result.full_min_token} ~ {result.full_max_token}</span>
                  <div style={{ fontSize: 15, color: "#888", marginTop: 4, maxWidth: 600 }}>
                    This is an experience-based estimate for the entire website, extrapolated from the analyzed pages. It reflects the likely total token cost if you were to rebuild or migrate the whole site, including pages not directly crawled in this run.
                  </div>
                </div>
              )}
              <div style={{ marginTop: 22 }}>
                <b>Details:</b>
                {Array.isArray(result?.pages) && result.pages.map((p, i) => (
                  <div key={i} style={{ marginTop: 16, padding: 16, border: "1.5px solid #e6f0ff", borderRadius: 10, background: "#fff" }}>
                    <b>Page:</b> <a href={p.url} target="_blank" rel="noopener noreferrer">{p.url}</a><br />
                    <span style={{ color: "#1677ff" }}>Token Range: {p.min_token} ~ {p.max_token}</span>
                    <div style={{ fontSize: 15, color: "#444", marginTop: 6 }}>
                      Text Token: {p.details?.text_token ? `${p.details.text_token[0]} ~ ${p.details.text_token[1]}` : "N/A"}<br />
                      Form Token: {p.details?.form_token ? `${p.details.form_token[0]} ~ ${p.details.form_token[1]}` : "N/A"}<br />
                      Button Token: {p.details?.button_token ? `${p.details.button_token[0]} ~ ${p.details.button_token[1]}` : "N/A"}<br />
                      Feature Token: {p.details?.feature_token ? `${p.details.feature_token[0]} ~ ${p.details.feature_token[1]}` : "N/A"}<br />
                      Features: {p.details?.features && p.details.features.length > 0 ? p.details.features.join(", ") : "None"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{marginTop: 56, background: '#fff', padding: 32, borderRadius: 16, boxShadow: '0 2px 12px #e6f0ff', maxWidth: 1000, marginLeft: 'auto', marginRight: 'auto'}}>
          <h3 style={{fontSize: 22, fontWeight: 700, marginBottom: 18, color: '#222'}}>Frequently Asked Questions</h3>
          <b style={{fontSize: 17}}>What is a website token estimator?</b>
          <p style={{fontSize: 15, color: '#444'}}>This tool helps you estimate the number of tokens required to rebuild, clone, or migrate a website using AI models like GPT-4, so you can predict costs and plan development efficiently.</p>
          <b style={{fontSize: 17}}>Why is token estimation important?</b>
          <p style={{fontSize: 15, color: '#444'}}>Knowing token usage helps you control AI costs, optimize prompts, and avoid unexpected expenses in AI-driven web projects.</p>
          <b style={{fontSize: 17}}>Can I analyze a full website?</b>
          <p style={{fontSize: 15, color: '#444'}}>Yes! Use the Full mode to crawl and estimate the entire site’s token usage.</p>
        </div>
      </div>
    </div>
  );
}

export default App;
