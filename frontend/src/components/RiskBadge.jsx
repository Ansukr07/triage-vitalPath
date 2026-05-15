const PRIORITY_DOT = { critical: '🔴', high: '🟠', moderate: '🟡', stable: '🟢', unknown: '⚪' };

export default function RiskBadge({ priority, size = 'md', showDot = true }) {
    const level = (priority || 'unknown').toLowerCase();
    const cls = `badge badge-${level}`;

    return (
        <span className={cls} style={size === 'lg' ? { fontSize: '0.9rem', padding: '0.4rem 1rem' } : {}}>
            {showDot && PRIORITY_DOT[level]} {level.toUpperCase()}
        </span>
    );
}
