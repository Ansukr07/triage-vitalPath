import React from 'react';
import RiskBadge from './RiskBadge';
import { ShieldAlert, Activity, CheckCircle2 } from 'lucide-react';
import './RiskScorecard.css';

export default function RiskScorecard({ triage }) {
    if (!triage) return null;

    const score = triage.finalScore || 0;
    const priority = triage.finalPriority || 'unknown';
    const reasons = triage.ruleEngine?.reasoning || [];
    const mlConfidence = triage.mlModel?.available ? Math.round(triage.mlModel.riskScore * 100) : null;

    // Determine colors
    const colors = {
        critical: '#ef4444',
        high: '#f97316',
        moderate: '#eab308',
        stable: '#22c55e',
        unknown: '#94a3b8'
    };
    const mainColor = colors[priority.toLowerCase()] || colors.unknown;

    // SVG Gauge calculation
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="risk-scorecard">
            <div className="risk-scorecard-header">
                <div className="risk-gauge-container">
                    <svg className="risk-gauge" viewBox="0 0 100 100">
                        <circle
                            className="risk-gauge-bg"
                            cx="50" cy="50" r={radius}
                        />
                        <circle
                            className="risk-gauge-fill"
                            cx="50" cy="50" r={radius}
                            stroke={mainColor}
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                        />
                    </svg>
                    <div className="risk-gauge-value" style={{ color: mainColor }}>
                        {score}<span className="risk-gauge-percent">%</span>
                    </div>
                </div>
                <div className="risk-scorecard-meta">
                    <h3 className="risk-scorecard-title">Risk Score Assessment</h3>
                    <div className="risk-scorecard-badges">
                        <RiskBadge priority={priority} size="lg" />
                        {mlConfidence !== null && (
                            <span className="risk-confidence-badge" title="ML Model Confidence">
                                <Activity size={14} /> Confidence: {mlConfidence}%
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="risk-explainability">
                <h4 className="risk-reasons-title">
                    <ShieldAlert size={16} /> Explainability Factors
                </h4>
                {reasons.length > 0 ? (
                    <ul className="risk-reasons-list">
                        {reasons.map((r, i) => (
                            <li key={i} className="risk-reason-item">
                                <span className="risk-reason-factor">{r.factor}</span>
                                <span className="risk-reason-value">{r.value}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="risk-no-reasons">
                        <CheckCircle2 size={16} /> No specific risk factors identified.
                    </div>
                )}
            </div>
        </div>
    );
}
