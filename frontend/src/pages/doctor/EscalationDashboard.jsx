import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { chatService } from '../../api/services';

const TYPE_COLORS = {
    suicide:   { bg: '#fdf2f8', border: '#e879f9', text: '#86198f', icon: '🧠' },
    cardiac:   { bg: '#fef2f2', border: '#f87171', text: '#b91c1c', icon: '🫀' },
    stroke:    { bg: '#fef2f2', border: '#f87171', text: '#b91c1c', icon: '🧠' },
    seizure:   { bg: '#fffbeb', border: '#fbbf24', text: '#92400e', icon: '⚡' },
    breathing: { bg: '#eff6ff', border: '#60a5fa', text: '#1e40af', icon: '🫁' },
    trauma:    { bg: '#fff7ed', border: '#fb923c', text: '#9a3412', icon: '🩸' },
    critical:  { bg: '#fef2f2', border: '#ef4444', text: '#7f1d1d', icon: '🚨' },
};

function EscalationCard({ log, onAcknowledge }) {
    const [acknowledging, setAcknowledging] = useState(false);
    const [note, setNote] = useState('');
    const [showNote, setShowNote] = useState(false);
    const style = TYPE_COLORS[log.emergencyType] || TYPE_COLORS.critical;
    const ts = new Date(log.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const handleAck = async () => {
        setAcknowledging(true);
        try {
            await chatService.acknowledgeEscalation(log._id, note);
            onAcknowledge(log._id);
        } finally {
            setAcknowledging(false);
            setShowNote(false);
        }
    };

    return (
        <div style={{
            background: style.bg,
            border: `2px solid ${style.border}`,
            borderRadius: '14px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1rem',
            position: 'relative',
        }}>
            {/* Status badge */}
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {log.telegramAlertSent ? (
                    <span style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #86efac', borderRadius: '20px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700 }}>📨 Telegram Sent</span>
                ) : (
                    <span style={{ background: '#fef9c3', color: '#a16207', border: '1px solid #fde047', borderRadius: '20px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700 }}>⚠️ Alert Pending</span>
                )}
                {log.acknowledged ? (
                    <span style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd', borderRadius: '20px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700 }}>✅ Acknowledged</span>
                ) : (
                    <span style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '20px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700 }}>🔴 Unacknowledged</span>
                )}
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.75rem' }}>{style.icon}</span>
                <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: style.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {log.emergencyType.replace('_', ' ')} — {log.severity.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                        Patient: <strong>{log.user?.firstName} {log.user?.lastName}</strong> · {ts}
                    </div>
                </div>
            </div>

            {/* Reason */}
            <div style={{ fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                <strong>Reason:</strong> {log.reason}
            </div>

            {/* Symptoms */}
            {log.detectedSymptoms?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    {log.detectedSymptoms.map((s, i) => (
                        <span key={i} style={{ background: style.border + '20', color: style.text, border: `1px solid ${style.border}`, borderRadius: '20px', padding: '3px 10px', fontSize: '0.78rem', fontWeight: 600 }}>{s}</span>
                    ))}
                </div>
            )}

            {/* Conversation summary */}
            {log.conversationSummary && (
                <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '10px', padding: '0.75rem', fontSize: '0.82rem', color: '#334155', lineHeight: 1.5, marginBottom: '0.75rem', whiteSpace: 'pre-wrap' }}>
                    <strong>Conversation Snapshot:</strong>
                    <div style={{ marginTop: '0.4rem' }}>{log.conversationSummary}</div>
                </div>
            )}

            {/* Location */}
            {log.location?.latitude && (
                <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.75rem' }}>
                    📍 <a href={`https://maps.google.com/?q=${log.location.latitude},${log.location.longitude}`} target="_blank" rel="noreferrer" style={{ color: '#1d4ed8' }}>View on Google Maps</a>
                </div>
            )}

            {/* Acknowledge action */}
            {!log.acknowledged && (
                <div style={{ marginTop: '0.75rem' }}>
                    {showNote ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <textarea
                                style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '8px', fontSize: '0.85rem', resize: 'vertical' }}
                                rows={2}
                                placeholder="Add acknowledgment note (optional)..."
                                value={note}
                                onChange={e => setNote(e.target.value)}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={handleAck} disabled={acknowledging} style={{ padding: '8px 20px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                                    {acknowledging ? '...' : '✅ Acknowledge'}
                                </button>
                                <button onClick={() => setShowNote(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setShowNote(true)} style={{ padding: '8px 20px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                            ✅ Acknowledge Alert
                        </button>
                    )}
                </div>
            )}

            {log.acknowledged && log.acknowledgeNote && (
                <div style={{ fontSize: '0.8rem', color: '#475569', fontStyle: 'italic', marginTop: '0.5rem' }}>
                    Note: {log.acknowledgeNote}
                </div>
            )}
        </div>
    );
}

export default function EscalationDashboard() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all' | 'unacknowledged'
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const { data } = await chatService.getEscalations();
                setLogs(data.data || []);
            } catch (err) {
                setError('Failed to load escalation logs.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleAcknowledge = (id) => {
        setLogs(prev => prev.map(l => l._id === id ? { ...l, acknowledged: true } : l));
    };

    const filtered = filter === 'all' ? logs : logs.filter(l => !l.acknowledged);
    const unackCount = logs.filter(l => !l.acknowledged).length;

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <div className="topbar">
                    <div className="topbar-title">🚨 Emergency Escalation Dashboard</div>
                    <div className="topbar-actions">
                        {unackCount > 0 && (
                            <span style={{ background: '#ef4444', color: '#fff', borderRadius: '20px', padding: '4px 12px', fontSize: '0.8rem', fontWeight: 700 }}>
                                {unackCount} unacknowledged
                            </span>
                        )}
                    </div>
                </div>

                <div className="page-body">
                    {error && <div className="alert alert-critical">{error}</div>}

                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        {['all', 'unacknowledged'].map(f => (
                            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>{f}</button>
                        ))}
                        <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-muted)', alignSelf: 'center' }}>{filtered.length} alert{filtered.length !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Log cards */}
                    {loading ? (
                        <div className="spinner" />
                    ) : filtered.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            ✅ No escalation alerts {filter === 'unacknowledged' ? 'pending acknowledgment' : 'recorded'}.
                        </div>
                    ) : (
                        filtered.map(log => <EscalationCard key={log._id} log={log} onAcknowledge={handleAcknowledge} />)
                    )}

                    <div className="disclaimer">
                        <strong>⚕️ Alert Notice:</strong> These are AI-generated preliminary risk assessments based on conversation keyword matching. All clinical decisions must be made by a licensed medical professional. Do not contact emergency services based solely on these alerts.
                    </div>
                </div>
            </div>
        </div>
    );
}
