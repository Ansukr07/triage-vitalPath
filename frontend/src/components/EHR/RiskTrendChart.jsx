import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, Area, AreaChart, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const RISK_COLORS = {
    critical: '#ef4444',
    high: '#f97316',
    moderate: '#eab308',
    stable: '#22c55e',
};

const BAND_COLORS = [
    { min: 0, max: 20, color: 'rgba(34,197,94,0.06)', label: 'Stable' },
    { min: 21, max: 50, color: 'rgba(234,179,8,0.06)', label: 'Moderate' },
    { min: 51, max: 74, color: 'rgba(249,115,22,0.06)', label: 'High' },
    { min: 75, max: 100, color: 'rgba(239,68,68,0.08)', label: 'Critical' },
];

function formatDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getScoreColor(score) {
    if (score >= 75) return RISK_COLORS.critical;
    if (score >= 51) return RISK_COLORS.high;
    if (score >= 21) return RISK_COLORS.moderate;
    return RISK_COLORS.stable;
}

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const point = payload[0]?.payload;
    const color = getScoreColor(point?.score || 0);
    return (
        <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            fontSize: '0.82rem',
            boxShadow: 'var(--shadow)',
        }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{label}</div>
            <div style={{ color, fontWeight: 700, fontSize: '1.1rem' }}>
                Score: {point?.score ?? 0}
            </div>
            {point?.label && (
                <div style={{ color: 'var(--text-dim)', marginTop: '0.2rem', maxWidth: 180 }}>{point.label}</div>
            )}
            <div style={{ color: 'var(--text-dim)', marginTop: '0.2rem', textTransform: 'capitalize' }}>
                Source: {point?.source}
            </div>
        </div>
    );
}

export default function RiskTrendChart({ data, loading = false, days = 90, onDaysChange }) {
    if (loading) {
        return (
            <div className="ehr-chart-container">
                <div className="ehr-loading"><div className="spinner" /><span>Loading risk trend...</span></div>
            </div>
        );
    }

    const points = (data?.points || []).map(p => ({
        ...p,
        date: formatDate(p.date),
        rawDate: p.date,
    }));

    const stats = data?.stats || { avg: 0, max: 0, min: 0, trend: 'stable' };

    const trendIcon = stats.trend === 'worsening'
        ? <TrendingUp size={16} color="#ef4444" />
        : stats.trend === 'improving'
            ? <TrendingDown size={16} color="#22c55e" />
            : <Minus size={16} color="var(--text-muted)" />;

    const trendColor = stats.trend === 'worsening' ? '#ef4444' : stats.trend === 'improving' ? '#22c55e' : 'var(--text-muted)';

    return (
        <div className="ehr-chart-container">
            <div className="ehr-chart-header">
                <div className="ehr-card-title">
                    📈 Risk Score Trend
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[30, 60, 90].map(d => (
                        <button
                            key={d}
                            className={`ehr-filter-chip ${days === d ? 'active' : ''}`}
                            onClick={() => onDaysChange?.(d)}
                        >
                            {d}d
                        </button>
                    ))}
                </div>
            </div>

            <div className="ehr-chart-stats">
                <div className="ehr-chart-stat">
                    <div className="ehr-chart-stat-value" style={{ color: getScoreColor(stats.avg) }}>{stats.avg}</div>
                    <div className="ehr-chart-stat-label">Avg Score</div>
                </div>
                <div className="ehr-chart-stat">
                    <div className="ehr-chart-stat-value" style={{ color: getScoreColor(stats.max) }}>{stats.max}</div>
                    <div className="ehr-chart-stat-label">Peak Score</div>
                </div>
                <div className="ehr-chart-stat">
                    <div className="ehr-chart-stat-value" style={{ color: getScoreColor(stats.min) }}>{stats.min}</div>
                    <div className="ehr-chart-stat-label">Min Score</div>
                </div>
                <div className="ehr-chart-stat">
                    <div className="ehr-chart-stat-value" style={{ color: trendColor, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                        {trendIcon} <span style={{ fontSize: '1rem', textTransform: 'capitalize' }}>{stats.trend}</span>
                    </div>
                    <div className="ehr-chart-stat-label">Trend</div>
                </div>
            </div>

            {points.length === 0 ? (
                <div className="ehr-empty" style={{ padding: '2rem' }}>
                    <div className="ehr-empty-icon">📊</div>
                    <div className="ehr-empty-text">No risk data in the last {days} days.</div>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={points} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: 'var(--text-dim)', fontSize: 11 }}
                            axisLine={{ stroke: 'var(--border-light)' }}
                            tickLine={false}
                        />
                        <YAxis
                            domain={[0, 100]}
                            tick={{ fill: 'var(--text-dim)', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {/* Risk band reference lines */}
                        <ReferenceLine y={20} stroke="rgba(34,197,94,0.2)" strokeDasharray="3 3" />
                        <ReferenceLine y={50} stroke="rgba(234,179,8,0.2)" strokeDasharray="3 3" />
                        <ReferenceLine y={74} stroke="rgba(249,115,22,0.2)" strokeDasharray="3 3" />
                        <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            fill="url(#riskGrad)"
                            dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: '#60a5fa', strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}

            <div className="ehr-chart-legend">
                {BAND_COLORS.map(b => (
                    <div key={b.label} className="ehr-chart-legend-item">
                        <div className="ehr-chart-legend-dot" style={{ background: Object.values(RISK_COLORS)[BAND_COLORS.indexOf(b)] }} />
                        {b.label} ({b.min}–{b.max})
                    </div>
                ))}
            </div>
        </div>
    );
}
