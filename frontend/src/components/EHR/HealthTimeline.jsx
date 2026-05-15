import { useState } from 'react';
import { Activity, FileText, MessageSquare, AlertTriangle, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';

const EVENT_ICONS = {
    triage: { icon: Activity, className: 'triage' },
    report: { icon: FileText, className: 'report' },
    chat: { icon: MessageSquare, className: 'chat' },
    emergency: { icon: AlertTriangle, className: 'emergency' },
    doctor_note: { icon: ClipboardList, className: 'doctor_note' },
};

function groupByDate(events) {
    const groups = {};
    events.forEach(e => {
        const d = new Date(e.date);
        const key = isNaN(d) ? 'Unknown' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        if (!groups[key]) groups[key] = [];
        groups[key].push(e);
    });
    return groups;
}

function formatTime(date) {
    const d = new Date(date);
    if (isNaN(d)) return '';
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function PriorityBadge({ priority }) {
    if (!priority) return null;
    const cls = `badge badge-${priority}`;
    return <span className={cls}>{priority}</span>;
}

function EventDetail({ event }) {
    const d = event.data || {};
    if (event.type === 'triage') {
        return (
            <div className="ehr-event-detail">
                <div className="ehr-event-detail-grid">
                    <div className="ehr-detail-item">
                        <span className="ehr-detail-label">Final Score</span>
                        <span className="ehr-detail-value">{d.finalScore ?? 'N/A'}</span>
                    </div>
                    <div className="ehr-detail-item">
                        <span className="ehr-detail-label">Priority</span>
                        <span className="ehr-detail-value" style={{ textTransform: 'capitalize' }}>{d.finalPriority}</span>
                    </div>
                    <div className="ehr-detail-item">
                        <span className="ehr-detail-label">Source</span>
                        <span className="ehr-detail-value">{d.source || 'Rule Engine'}</span>
                    </div>
                </div>
                {d.symptoms?.length > 0 && (
                    <div style={{ marginTop: '0.6rem' }}>
                        <span className="ehr-detail-label">Symptoms: </span>
                        {d.symptoms.map((s, i) => (
                            <span key={i} className="ehr-tag" style={{ marginRight: '0.3rem', marginTop: '0.3rem', display: 'inline-flex' }}>{s}</span>
                        ))}
                    </div>
                )}
                {d.doctorOverride && (
                    <div style={{ marginTop: '0.6rem', color: '#86efac', fontSize: '0.8rem' }}>
                        ✓ Doctor override: {d.doctorOverride.newPriority} — {d.doctorOverride.reason}
                    </div>
                )}
            </div>
        );
    }

    if (event.type === 'report') {
        return (
            <div className="ehr-event-detail">
                <div className="ehr-event-detail-grid">
                    <div className="ehr-detail-item">
                        <span className="ehr-detail-label">Type</span>
                        <span className="ehr-detail-value">{d.reportType?.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="ehr-detail-item">
                        <span className="ehr-detail-label">Parse Status</span>
                        <span className="ehr-detail-value">{d.parseStatus}</span>
                    </div>
                    <div className="ehr-detail-item">
                        <span className="ehr-detail-label">File</span>
                        <span className="ehr-detail-value" style={{ wordBreak: 'break-all', fontSize: '0.78rem' }}>{d.fileName}</span>
                    </div>
                </div>
                {d.flaggedItems?.length > 0 && (
                    <div style={{ marginTop: '0.6rem' }}>
                        <span className="ehr-detail-label">Flagged: </span>
                        {d.flaggedItems.slice(0, 4).map((f, i) => (
                            <span key={i} className="ehr-tag danger" style={{ marginRight: '0.3rem', marginTop: '0.3rem', display: 'inline-flex' }}>{f}</span>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (event.type === 'chat' || event.type === 'emergency') {
        return (
            <div className="ehr-event-detail">
                <div className="ehr-event-detail-grid">
                    <div className="ehr-detail-item">
                        <span className="ehr-detail-label">Risk Score</span>
                        <span className="ehr-detail-value">{d.riskScore ?? 0}/100</span>
                    </div>
                    <div className="ehr-detail-item">
                        <span className="ehr-detail-label">Messages</span>
                        <span className="ehr-detail-value">{d.messageCount ?? 0}</span>
                    </div>
                    <div className="ehr-detail-item">
                        <span className="ehr-detail-label">Mode</span>
                        <span className="ehr-detail-value" style={{ textTransform: 'capitalize' }}>{d.type || 'text'}</span>
                    </div>
                </div>
                {d.symptoms?.length > 0 && (
                    <div style={{ marginTop: '0.6rem' }}>
                        <span className="ehr-detail-label">Mentioned: </span>
                        {d.symptoms.slice(0, 5).map((s, i) => (
                            <span key={i} className="ehr-tag" style={{ marginRight: '0.3rem', marginTop: '0.3rem', display: 'inline-flex' }}>{s}</span>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (event.type === 'doctor_note') {
        return (
            <div className="ehr-event-detail">
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {event.summary}
                </div>
                <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Category: {d.category} · Added by: {d.addedBy?.firstName} {d.addedBy?.lastName}
                </div>
            </div>
        );
    }

    return null;
}

function TimelineEvent({ event }) {
    const [expanded, setExpanded] = useState(false);
    const cfg = EVENT_ICONS[event.type] || EVENT_ICONS.chat;
    const Icon = cfg.icon;

    return (
        <div className={`ehr-timeline-event ${expanded ? 'expanded' : ''}`} onClick={() => setExpanded(p => !p)}>
            <div className={`ehr-event-icon ${cfg.className}`}>
                <Icon size={16} />
            </div>
            <div className="ehr-event-body">
                <div className="ehr-event-title">{event.title}</div>
                <div className="ehr-event-summary">{event.summary}</div>
                {expanded && <EventDetail event={event} />}
            </div>
            <div className="ehr-event-meta">
                <span className="ehr-event-time">{formatTime(event.date)}</span>
                {event.priority && <PriorityBadge priority={event.priority} />}
                {expanded ? <ChevronUp size={14} style={{ color: 'var(--text-dim)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-dim)' }} />}
            </div>
        </div>
    );
}

export default function HealthTimeline({ events = [], loading = false }) {
    if (loading) {
        return (
            <div className="ehr-loading">
                <div className="spinner" />
                <span>Loading timeline...</span>
            </div>
        );
    }

    if (!events.length) {
        return (
            <div className="ehr-empty">
                <div className="ehr-empty-icon">📋</div>
                <div className="ehr-empty-text">No health events recorded yet.</div>
                <div style={{ fontSize: '0.82rem' }}>Your triage sessions, reports, and AI consultations will appear here.</div>
            </div>
        );
    }

    const groups = groupByDate(events);

    return (
        <div className="ehr-timeline">
            {Object.entries(groups).map(([date, evts]) => (
                <div key={date} className="ehr-timeline-group">
                    <div className="ehr-timeline-date-label">{date}</div>
                    <div className="ehr-timeline-events">
                        {evts.map((e, i) => <TimelineEvent key={`${e._id}-${i}`} event={e} />)}
                    </div>
                </div>
            ))}
        </div>
    );
}
