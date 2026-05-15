import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Mic, MessageSquare, Activity, Video } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { translateText } from '../../utils/translate';
import { chatService } from '../../api/services';
import EmergencyOverlay from '../../components/EmergencyOverlay';
import LanguagePicker from '../../components/LanguagePicker';
import DualRiskCard from '../../components/DualRiskCard';
import T from '../../components/T';
import './Assistant.css';

// ── Icons ───────────────────────────────────────────────────────────────────
const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const SidebarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>
);
const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const OrbAvatar = ({ size = 32 }) => (
  <div className="vpa-orb-container" style={{ width: size, height: size }}>
    <video
      src="/orb.mp4"
      autoPlay
      loop
      muted
      playsInline
      className="vpa-orb-video"
    />
  </div>
);

// ── Helpers ──────────────────────────────────────────────────────────────────
function groupByDate(sessions) {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now - 864e5).toDateString();
  const groups = { Today: [], Yesterday: [], Earlier: [] };
  sessions.forEach(s => {
    const d = new Date(s.createdAt).toDateString();
    if (d === today) groups.Today.push(s);
    else if (d === yesterday) groups.Yesterday.push(s);
    else groups.Earlier.push(s);
  });
  return groups;
}

// ── Emergency Detection ──────────────────────────────────────────────────────
function checkEmergency(text) {
  const keywords = ['chest pain', 'stroke', 'suicid', 'kill myself', 'can\'t breathe', 'difficulty breathing', 'unconscious', 'severe bleeding', 'heart attack'];
  const lowerText = text.toLowerCase();
  return keywords.some(k => lowerText.includes(k));
}

function EmergencyAlert() {
  return (
    <div className="vpa-emergency-alert">
      <AlertTriangle className="vpa-emergency-icon" size={28} />
      <div className="vpa-emergency-content">
        <h4 className="vpa-emergency-title">⚠️ EMERGENCY DETECTED</h4>
        <p className="vpa-emergency-text">
          If you are experiencing a life-threatening medical emergency (e.g., chest pain, stroke signs, severe breathing issues, suicidal intent), 
          <strong> please call your local emergency services immediately.</strong>
        </p>
      </div>
    </div>
  );
}

// ── Typing dots ──────────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="vpa-msg-row vpa-msg-bot">
      <div className="vpa-avatar-col">
        <OrbAvatar size={44} />
      </div>
      <div className="vpa-msg-content">
        <div className="vpa-typing-dots">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

// ── Markdown Parser ──────────────────────────────────────────────────────────
function parseMarkdown(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

// ── Message bubble ───────────────────────────────────────────────────────────
function Message({ msg, onOptionClick }) {
  const isUser = msg.role === 'user';

  const options = [];
  let displayContent = msg.content;
  if (!isUser) {
    const optionRegex = /\[Option:\s*(.*?)\]/gi;
    let match;
    while ((match = optionRegex.exec(displayContent)) !== null) {
      options.push(match[1]);
    }
    displayContent = displayContent.replace(/\[Option:\s*.*?\]/gi, '');
    displayContent = displayContent.replace(/(?:\r?\n\s*){3,}/g, '\n\n').trim();
  }

  return (
    <div className={`vpa-msg-row ${isUser ? 'vpa-msg-user' : 'vpa-msg-bot'}`}>
      {!isUser && (
        <div className="vpa-avatar-col">
          <OrbAvatar size={44} />
        </div>
      )}
      <div className={`vpa-msg-content ${isUser ? 'vpa-content-user' : 'vpa-content-bot'}`}>
        {displayContent.split('\n').map((line, i) => (
          <p key={i} className={line === '' ? 'vpa-para-space' : ''}>{parseMarkdown(line)}</p>
        ))}
        {options.length > 0 && (
          <div className="vpa-msg-options">
            {options.map((opt, i) => (
              <button key={i} className="vpa-chip vpa-option-chip" onClick={() => onOptionClick(opt)}>
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function Assistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { langCode, lang } = useLanguage();

  const [sessions, setSessions]       = useState([]);
  const [activeId, setActiveId]       = useState(null);   // DB _id string
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [userLocation, setUserLocation]   = useState(null);
  const [physicalRisk, setPhysicalRisk] = useState({ score: 0, severity: 'LOW', reasons: [] });
  const [mentalRisk,   setMentalRisk]   = useState({ score: 0, severity: 'LOW', reasons: [] });
  const [careCategory, setCareCategory] = useState(null);
  const [showRiskScore, setShowRiskScore] = useState(false);
  const [assessingRisk, setAssessingRisk] = useState(false);
  const assessingRiskRef = useRef(false); // ref so assessRisk always reads latest value

  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Auto-resize textarea ───────────────────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, [input]);

  // ── Request geolocation on mount ───────────────────────────────────────────
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        ()    => console.warn('[Assistant] Geolocation denied or unavailable.')
      );
    }
  }, []);

  // ── Load sessions from DB on mount ────────────────────────────────────────
  useEffect(() => {
    async function fetchSessions() {
      try {
        const { data } = await chatService.getSessions();
        setSessions(data.data || []);
      } catch (err) {
        console.error('[Assistant] Failed to load sessions:', err);
      } finally {
        setSessionsLoading(false);
      }
    }
    fetchSessions();
  }, []);

  // ── Sync messages and risk metadata when active session changes ───────────
  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    const s = sessions.find(s => s._id === activeId);
    if (s) {
      setMessages(s.messages || []);
      // Restore triage metadata
      setPhysicalRisk({
        score:    s.latestPhysicalRiskScore || 0,
        severity: s.latestPhysicalSeverity  || 'LOW',
        reasons:  s.latestPhysicalReasons   || [],
      });
      setMentalRisk({
        score:    s.latestMentalRiskScore || 0,
        severity: s.latestMentalSeverity  || 'LOW',
        reasons:  s.latestMentalReasons   || [],
      });
      setCareCategory(s.latestCareCategory || null);
      setActiveEmergency(s.latestEmergency || null);
      // Auto-show risk if it's significant
      if ((s.latestPhysicalRiskScore || 0) > 0 || (s.latestMentalRiskScore || 0) > 0) {
        setShowRiskScore(true);
      } else {
        setShowRiskScore(false);
      }
    }
  }, [activeId, sessions]);

  // ── New chat ───────────────────────────────────────────────────────────────
  const startNewChat = useCallback(() => {
    setActiveId(null);
    setMessages([]);
    setInput('');
    setEmergencyMode(false);
    setActiveEmergency(null);
    setPhysicalRisk({ score: 0, severity: 'LOW', reasons: [] });
    setMentalRisk({   score: 0, severity: 'LOW', reasons: [] });
    setShowRiskScore(false);
    textareaRef.current?.focus();
  }, []);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (directText) => {
    const text = (typeof directText === 'string' ? directText : input).trim();
    if (!text || loading) return;
    if (typeof directText !== 'string') setInput('');

    // ── Translate user input to English before sending to AI ──
    const textForAI = langCode !== 'en' ? await translateText(text, langCode, 'en') : text;

    const userMsg = { role: 'user', content: text, ts: new Date().toISOString() }; // store original language
    let currentSessionId = activeId;

    // ── Create a new session if none is active ──────────────────────────────
    if (!currentSessionId) {
      const title = text.slice(0, 80) + (text.length > 80 ? '…' : '');
      try {
        const { data } = await chatService.createSession(title, [userMsg]);
        const newSession = data.data;
        currentSessionId = newSession._id;
        setSessions(prev => [newSession, ...prev]);
        setActiveId(currentSessionId);
        setMessages([userMsg]);
      } catch (err) {
        console.error('[Assistant] Failed to create session:', err);
        return;
      }
    } else {
      // ── Append userMsg to existing session ──────────────────────────────
      const updatedMsgs = [...messages, userMsg];
      setMessages(updatedMsgs);
      try {
        await chatService.updateSession(currentSessionId, { messages: updatedMsgs });
      } catch (err) {
        console.error('[Assistant] Failed to persist user message:', err);
      }
    }

    if (checkEmergency(text)) {
      setEmergencyMode(true);
    } else {
      setEmergencyMode(false);
    }

    setLoading(true);

    try {
      // Build history for LLM (everything except the just-sent message)
      const historyForApi = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const { data } = await chatService.sendMessage(textForAI, historyForApi, userLocation);
      const replyEn = data?.data?.reply || data?.reply || data?.message || null;
      if (!replyEn) throw new Error('Empty response from server.');

      // ── Translate AI reply back to user's language ──
      const reply = langCode !== 'en' ? await translateText(replyEn, 'en', langCode) : replyEn;

      const botMsg = { role: 'assistant', content: reply, ts: new Date().toISOString() };

      // Persist full updated message list to DB (no risk scores — those come from assess-risk)
      const latestMsgs = activeId
        ? [...messages, userMsg, botMsg]
        : [userMsg, botMsg];

      try {
        const { data: updated } = await chatService.updateSession(currentSessionId, { messages: latestMsgs });
        setSessions(prev =>
          prev.map(s => s._id === currentSessionId ? updated.data : s)
        );
      } catch (err) {
        console.error('[Assistant] Failed to persist bot message:', err);
        setSessions(prev =>
          prev.map(s =>
            s._id === currentSessionId
              ? { ...s, messages: latestMsgs }
              : s
          )
        );
      }

      setMessages(latestMsgs);
    } catch (err) {
      const errMsg = {
        role: 'assistant',
        content: `Something went wrong: ${err?.response?.data?.message || err.message}`,
        ts: new Date().toISOString(),
        error: true,
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, activeId, messages]);

  // ── On-Demand Clinical Risk Assessment ─────────────────────────────────
  const assessRisk = useCallback(async () => {
    // Use ref as guard to avoid stale closure on assessingRisk state
    if (assessingRiskRef.current) return;
    const currentMessages = messages; // capture latest messages
    if (currentMessages.length === 0) return;

    assessingRiskRef.current = true;
    setAssessingRisk(true);
    try {
      const historyForApi = currentMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));
      const { data } = await chatService.assessRisk(historyForApi, userLocation);
      const d = data?.data;
      if (d) {
        // Update scores in place — card stays visible if it was open
        setPhysicalRisk({ score: d.physicalRiskScore || 0, severity: d.physicalSeverity || 'LOW', reasons: d.physicalReasons || [] });
        setMentalRisk({   score: d.mentalRiskScore   || 0, severity: d.mentalSeverity   || 'LOW', reasons: d.mentalReasons   || [] });
        setCareCategory(d.careCategory || null);
        if (d.emergency?.isEmergency) setActiveEmergency(d.emergency);
        // Always open the risk card after assessment so the user sees the result
        setShowRiskScore(true);
        // Persist to session so history restores correctly
        if (activeId) {
          chatService.updateSession(activeId, {
            latestPhysicalRiskScore: d.physicalRiskScore, latestMentalRiskScore: d.mentalRiskScore,
            latestPhysicalSeverity:  d.physicalSeverity,  latestMentalSeverity:  d.mentalSeverity,
            latestPhysicalReasons:   d.physicalReasons,   latestMentalReasons:   d.mentalReasons,
            latestCareCategory:      d.careCategory,      latestEmergency:       d.emergency,
          }).catch(e => console.error('[Assistant] Failed to persist risk scores:', e));
        }
      }
    } catch (err) {
      console.error('[Assistant] assessRisk failed:', err);
    } finally {
      assessingRiskRef.current = false;
      setAssessingRisk(false);
    }
  }, [messages, activeId, userLocation]); // removed assessingRisk from deps — using ref instead

  // ── Delete session ─────────────────────────────────────────────────────────
  const deleteSession = useCallback(async (e, id) => {
    e.stopPropagation();
    try {
      await chatService.deleteSession(id);
    } catch (err) {
      console.error('[Assistant] Failed to delete session:', err);
    }
    setSessions(prev => prev.filter(s => s._id !== id));
    if (activeId === id) startNewChat();
  }, [activeId, startNewChat]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Start Video Consultation ───────────────────────────────────
  const startConsultation = useCallback(() => {
    const roomId = `consult-${user?._id || 'guest'}-${Date.now()}`;
    navigate(`/patient/consultation/${roomId}`, {
      state: { physicalRisk, mentalRisk, careCategory,
        patientName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() }
    });
  }, [user, physicalRisk, mentalRisk, careCategory, navigate]);

  const groups = groupByDate(sessions);

  return (
    <div className="vpa-root">
      {/* ── Emergency Overlay (server-detected) ────────────────── */}
      {activeEmergency?.isEmergency && (
        <EmergencyOverlay
          emergency={activeEmergency}
          onDismiss={() => setActiveEmergency(null)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className={`vpa-sidebar ${sidebarOpen ? 'vpa-sidebar-open' : 'vpa-sidebar-closed'}`}>
        <div className="vpa-sidebar-header">
          <div className="vpa-brand">
            <div className="vpa-brand-icon">
              <Activity size={20} />
            </div>
            VitalPath
          </div>
          <button className="vpa-icon-btn" onClick={() => setSidebarOpen(o => !o)} title="Toggle sidebar">
            <SidebarIcon />
          </button>
        </div>

        <div className="vpa-sidebar-actions">
          <button className="vpa-new-chat-btn" onClick={startNewChat}>
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> New chat
          </button>
          <div className="vpa-search-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Search" />
          </div>
        </div>

        <div className="vpa-nav-links">
          <button className="vpa-nav-link" style={{ background: 'transparent', border: 'none', width: '100%' }} onClick={() => navigate('/patient')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            Dashboard
          </button>
          <button className="vpa-nav-link" style={{ background: 'transparent', border: 'none', width: '100%' }} onClick={() => navigate('/patient/reports')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Reports
          </button>
          <div className="vpa-nav-link" style={{ background: 'transparent', border: 'none', width: '100%' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            History
          </div>
        </div>

        <div className="vpa-history">
          {sessionsLoading ? (
            <p className="vpa-history-label" style={{ opacity: 0.5 }}>Loading…</p>
          ) : (
            Object.entries(groups).map(([label, group]) =>
              group.length > 0 && (
                <div key={label} className="vpa-history-group">
                  <p className="vpa-history-label"><T>{label}</T></p>
                  {group.map(s => (
                    <div
                      key={s._id}
                      className={`vpa-history-item ${activeId === s._id ? 'vpa-history-item-active' : ''}`}
                      onClick={() => setActiveId(s._id)}
                    >
                      <T>{s.title}</T>
                    </div>
                  ))}
                </div>
              )
            )
          )}
        </div>

        <div className="vpa-sidebar-footer">
          <div className="vpa-user-pill">
            <div className="vpa-user-info">
              <div className="vpa-user-avatar" style={{ background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                {(user?.firstName?.[0] || '?').toUpperCase()}
              </div>
              <div className="vpa-user-text">
                <span className="vpa-user-name">{user?.firstName || 'User'}</span>
                <span className="vpa-user-email">{user?.email || 'patient@vitalpath.com'}</span>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
        </div>
      </aside>

      {/* ── Main Area (Card) ────────────────────────────────────────── */}
      <main className="vpa-main-card">
        {/* Topbar inside card */}
        <div className="vpa-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {!sidebarOpen && (
              <button className="vpa-icon-btn" onClick={() => setSidebarOpen(true)}>
                <SidebarIcon />
              </button>
            )}
            <div className="vpa-model-selector">
              <div style={{ width: 16, height: 16, background: '#e9d5ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '10px', color: '#9333ea' }}>✦</span>
              </div>
              VitalPath AI <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          <div className="vpa-topbar-actions">
            <LanguagePicker />
            {messages.length > 0 && showRiskScore && careCategory && (
              <span style={{
                fontSize: '0.8rem', fontWeight: 700, color: '#fff',
                background: careCategory === 'Emergency Room' ? '#ef4444' : careCategory === 'Clinic Visit' ? '#f59e0b' : '#10b981',
                padding: '4px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                <T>{careCategory}</T>
              </span>
            )}
            {messages.length > 0 && (
              <div style={{ position: 'relative' }}>
                <button className="vpa-action-btn" onClick={() => setShowRiskScore(!showRiskScore)}>
                  <AlertTriangle size={14} /> Risk
                </button>
                {showRiskScore && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 100, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.15))' }}>
                    <DualRiskCard compact physicalRiskScore={physicalRisk.score} mentalRiskScore={mentalRisk.score} physicalSeverity={physicalRisk.severity} mentalSeverity={mentalRisk.severity} physicalReasons={physicalRisk.reasons} mentalReasons={mentalRisk.reasons} />
                    {careCategory && careCategory !== 'Home Care' && (
                      <button
                        onClick={startConsultation}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          width: '100%', padding: '11px 16px',
                          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                          color: '#fff', border: 'none', borderRadius: '0 0 14px 14px',
                          fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                          justifyContent: 'center', letterSpacing: '0.01em',
                          boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      >
                        <Video size={15} /> Start Video Consultation
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {emergencyMode && <div className="vpa-emergency-alert"><EmergencyAlert /></div>}

        {messages.length === 0 && !loading ? (
          /* Empty State */
          <div className="vpa-empty-state">
            <div className="vpa-hero-orb">
              <video src="/orb.mp4" autoPlay loop muted playsInline />
            </div>
            <div className="vpa-welcome-heading">
              <h1 className="vpa-welcome-name">Hello, {user?.firstName || 'Jackson'}</h1>
              <h2 className="vpa-welcome-question">How can I assist you today?</h2>
            </div>

            {/* Unified Input Box (Centered) */}
            <div className="vpa-input-container">
              <textarea
                ref={textareaRef}
                className="vpa-textarea"
                placeholder={langCode === 'hi' ? 'VitalPath को संदेश भेजें...' : langCode === 'kn' ? 'VitalPath ಗೆ ಸಂದೇಶ ಕಳಿಸಿ...' : 'Ask me anything...'}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <div className="vpa-input-toolbar">
                <div className="vpa-toolbar-left">
                  <button
                    className={`vpa-tool-btn ${assessingRisk ? 'vpa-tool-btn-active' : ''}`}
                    onClick={assessRisk}
                    disabled={messages.length === 0 || assessingRisk}
                    title="Run Clinical Risk Assessment on this conversation"
                  >
                    {assessingRisk
                      ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Analyzing...</>
                      : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>Assess Risk</>}
                  </button>
                  <button className="vpa-tool-btn vpa-icon-only-btn" title="Upload Report" onClick={() => navigate('/patient/reports')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></button>
                  <button className="vpa-tool-btn vpa-icon-only-btn" title="View Dashboard" onClick={() => navigate('/patient')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></button>
                </div>
                <div className="vpa-toolbar-right">
                  <button className="vpa-tool-btn" onClick={() => navigate('/patient/voice', { state: { userLocation } })}>
                    <Mic size={14} style={{ marginRight: '4px' }} /> Voice Mode
                  </button>
                  <button className="vpa-send-btn" onClick={sendMessage} disabled={!input.trim() || loading}>
                    <SendIcon />
                  </button>
                </div>
              </div>
            </div>

            <div className="vpa-starter-cards">
              <div className="vpa-starter-card" onClick={() => { setInput('Tell me about your symptoms'); setTimeout(() => textareaRef.current?.focus(), 50); }}>
                <Activity size={20} className="vpa-sc-icon" />
                <h3 className="vpa-sc-title">Check Symptoms</h3>
                <p className="vpa-sc-desc">Run a quick AI triage on what you're feeling right now.</p>
              </div>
              <div className="vpa-starter-card" onClick={() => { setInput('Help me understand my latest medical report'); setTimeout(() => textareaRef.current?.focus(), 50); }}>
                <UploadIcon className="vpa-sc-icon" />
                <h3 className="vpa-sc-title">Analyze Report</h3>
                <p className="vpa-sc-desc">Explain complex medical jargon from your lab tests.</p>
              </div>
              <div className="vpa-starter-card" onClick={() => { setInput('What do my test results mean?'); setTimeout(() => textareaRef.current?.focus(), 50); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="vpa-sc-icon"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                <h3 className="vpa-sc-title">Review Vitals</h3>
                <p className="vpa-sc-desc">Check your recent health stability trend.</p>
              </div>
            </div>
          </div>
        ) : (
          /* Active Chat State */
          <>
            <div className="vpa-messages-area">
              <div className="vpa-messages-container">
                {messages.map((msg, i) => <Message key={i} msg={msg} onOptionClick={(opt) => sendMessage(opt)} />)}
                {loading && <TypingIndicator />}
                <div ref={bottomRef} style={{ height: '80px' }} />
              </div>
            </div>

            {/* Docked Input Box */}
            <div className="vpa-input-container vpa-input-container-docked">
              <textarea
                ref={textareaRef}
                className="vpa-textarea vpa-textarea-docked"
                placeholder={langCode === 'hi' ? 'VitalPath को संदेश भेजें...' : langCode === 'kn' ? 'VitalPath ಗೆ ಸಂದೇಶ ಕಳಿಸಿ...' : 'Ask me anything...'}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <div className="vpa-input-toolbar">
                <div className="vpa-toolbar-left">
                  <button className="vpa-tool-btn" onClick={() => navigate('/patient/reports')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Attach file</button>
                  <button
                    className={`vpa-tool-btn ${assessingRisk ? 'vpa-tool-btn-active' : ''}`}
                    onClick={assessRisk}
                    disabled={assessingRisk}
                    title="Run Clinical Risk Assessment on this conversation"
                  >
                    {assessingRisk
                      ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Analyzing...</>
                      : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>Assess Risk</>}
                  </button>
                </div>
                <div className="vpa-toolbar-right">
                  <button className="vpa-tool-btn" onClick={() => navigate('/patient/voice', { state: { userLocation } })}>
                    <Mic size={14} style={{ marginRight: '4px' }} /> Voice
                  </button>
                  <button className="vpa-send-btn" onClick={sendMessage} disabled={!input.trim() || loading}>
                    <SendIcon />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
