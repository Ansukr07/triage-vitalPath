import React from 'react';
import './DualRiskCard.css';

// ── Severity config ──────────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
    LOW:      { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'LOW',      ring: '#10b981' },
    MODERATE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'MODERATE', ring: '#f59e0b' },
    HIGH:     { color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'HIGH',      ring: '#f97316' },
    CRITICAL: { color: '#ef4444', bg: 'rgba(239,68,68,0.14)',  label: 'CRITICAL', ring: '#ef4444' },
};

function getSeverityConfig(severity) {
    return SEVERITY_CONFIG[severity?.toUpperCase()] || SEVERITY_CONFIG.LOW;
}

// ── SVG Gauge ────────────────────────────────────────────────────────────────
function ScoreGauge({ score = 0, color }) {
    const radius       = 28;
    const stroke       = 5;
    const circumference = 2 * Math.PI * radius;
    const offset       = circumference - (Math.min(score, 100) / 100) * circumference;

    return (
        <div className="drc-gauge-wrap">
            <svg width="72" height="72" viewBox="0 0 72 72">
                <circle
                    cx="36" cy="36" r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={stroke}
                />
                <circle
                    cx="36" cy="36" r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 36 36)"
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
            </svg>
            <div className="drc-gauge-value" style={{ color }}>
                {score}<span className="drc-gauge-unit">%</span>
            </div>
        </div>
    );
}

// ── Single Risk Card ─────────────────────────────────────────────────────────
function RiskCard({ type, icon, label, score, severity, reasons = [] }) {
    const cfg = getSeverityConfig(severity);

    return (
        <div className="drc-card" style={{ borderColor: cfg.color }}>
            {/* Header */}
            <div className="drc-card-header">
                <div className="drc-icon-wrap" style={{ background: cfg.bg, color: cfg.color }}>
                    {icon}
                </div>
                <div className="drc-card-meta">
                    <span className="drc-card-label">{label}</span>
                    <span className="drc-severity-pill" style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                    </span>
                </div>
                <ScoreGauge score={score} color={cfg.color} />
            </div>

            {/* Reasons */}
            <div className="drc-reasons">
                {reasons.length > 0 ? (
                    <ul className="drc-reason-list">
                        {reasons.slice(0, 3).map((r, i) => (
                            <li key={i} className="drc-reason-item">
                                <span className="drc-reason-dot" style={{ background: cfg.color }} />
                                {r}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="drc-no-reasons">
                        <span className="drc-reason-dot" style={{ background: cfg.color }} />
                        No significant risk factors detected
                    </p>
                )}
            </div>
        </div>
    );
}

// ── Physical Icon ────────────────────────────────────────────────────────────
const HeartIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
);

// ── Brain Icon ───────────────────────────────────────────────────────────────
const BrainIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.88A2.5 2.5 0 0 1 9.5 2Z"/>
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.88A2.5 2.5 0 0 0 14.5 2Z"/>
    </svg>
);

// ── Main Export ───────────────────────────────────────────────────────────────
/**
 * DualRiskCard — shows Physical and Mental health risk cards side by side.
 *
 * Props:
 *   physicalRiskScore  {number}   0–100
 *   mentalRiskScore    {number}   0–100
 *   physicalSeverity   {string}   LOW | MODERATE | HIGH | CRITICAL
 *   mentalSeverity     {string}   LOW | MODERATE | HIGH | CRITICAL
 *   physicalReasons    {string[]}
 *   mentalReasons      {string[]}
 *   compact            {boolean}  if true, reduces padding
 */
export default function DualRiskCard({
    physicalRiskScore = 0,
    mentalRiskScore   = 0,
    physicalSeverity  = 'LOW',
    mentalSeverity    = 'LOW',
    physicalReasons   = [],
    mentalReasons     = [],
    compact           = false,
}) {
    return (
        <div className={`drc-root ${compact ? 'drc-compact' : ''}`}>
            <div className="drc-header-row">
                <span className="drc-section-label">Clinical Risk Assessment</span>
                <span className="drc-section-sub">AI · Rule Engine · ClinicalBERT</span>
            </div>
            <div className="drc-cards-grid">
                <RiskCard
                    type="physical"
                    icon={<HeartIcon />}
                    label="Physical Health Risk"
                    score={physicalRiskScore}
                    severity={physicalSeverity}
                    reasons={physicalReasons}
                />
                <RiskCard
                    type="mental"
                    icon={<BrainIcon />}
                    label="Mental Health Risk"
                    score={mentalRiskScore}
                    severity={mentalSeverity}
                    reasons={mentalReasons}
                />
            </div>
            <p className="drc-disclaimer">
                Decision-support tool only. Not a clinical diagnosis. Always consult a licensed clinician.
            </p>
        </div>
    );
}
