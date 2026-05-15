import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardList, Activity, FileText, MessageSquare, BarChart2, Heart, ArrowLeft, Download, RefreshCw } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import HealthTimeline from '../../components/EHR/HealthTimeline';
import RiskTrendChart from '../../components/EHR/RiskTrendChart';
import PatientProfileCard from '../../components/EHR/PatientProfileCard';
import AIHealthSummary from '../../components/EHR/AIHealthSummary';
import DoctorNotes from '../../components/EHR/DoctorNotes';
import '../../components/EHR/EHR.css';
import api from '../../api/axios';

const TABS = [
    { id: 'overview', label: 'Overview', icon: ClipboardList },
    { id: 'timeline', label: 'Timeline', icon: Activity },
    { id: 'triage', label: 'Triage', icon: Heart },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'notes', label: 'Clinical Notes', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
];

function fmt(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function Badge({ p }) {
    if (!p) return null;
    return <span className={`badge badge-${p}`}>{p}</span>;
}

export default function PatientEHRDoctorView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tab, setTab] = useState('overview');
    const [ehr, setEhr] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [risk, setRisk] = useState(null);
    const [summary, setSummary] = useState(null);
    const [triage, setTriage] = useState([]);
    const [reports, setReports] = useState([]);
    const [days, setDays] = useState(90);
    const [loading, setLoading] = useState({ ehr: true, timeline: false, risk: false, summary: false, triage: false, reports: false });

    const setL = (k, v) => setLoading(p => ({ ...p, [k]: v }));

    const fetchEHR = useCallback(async () => {
        setL('ehr', true);
        try { const { data } = await api.get(`/ehr/patients/${id}`); setEhr(data.data); }
        catch (e) { console.error(e); } finally { setL('ehr', false); }
    }, [id]);

    const fetchTimeline = useCallback(async () => {
        if (timeline.length) return;
        setL('timeline', true);
        try { const { data } = await api.get(`/ehr/patients/${id}/timeline`, { params: { limit: 100 } }); setTimeline(data.data || []); }
        catch (e) { console.error(e); } finally { setL('timeline', false); }
    }, [id, timeline.length]);

    const fetchRisk = useCallback(async (d) => {
        setL('risk', true);
        try { const { data } = await api.get(`/ehr/patients/${id}/risk-trend`, { params: { days: d } }); setRisk(data.data); }
        catch (e) { console.error(e); } finally { setL('risk', false); }
    }, [id]);

    const fetchSummary = useCallback(async () => {
        setL('summary', true);
        try { const { data } = await api.get(`/ehr/patients/${id}/summary`); setSummary(data.data); }
        catch (e) { setSummary({ error: e.response?.data?.message || e.message }); } finally { setL('summary', false); }
    }, [id]);

    const fetchTriage = useCallback(async () => {
        if (triage.length) return;
        setL('triage', true);
        try { const { data } = await api.get(`/triage/${id}/history`); setTriage(data.data || []); }
        catch (e) { console.error(e); } finally { setL('triage', false); }
    }, [id, triage.length]);

    const fetchReports = useCallback(async () => {
        if (reports.length) return;
        setL('reports', true);
        try { const { data } = await api.get('/reports', { params: { patient: id } }); setReports(data.data || []); }
        catch (e) { console.error(e); } finally { setL('reports', false); }
    }, [id, reports.length]);

    const addNote = async (nd) => { await api.post(`/ehr/patients/${id}/notes`, nd); await fetchEHR(); };
    const delNote = async (nid) => { await api.delete(`/ehr/patients/${id}/notes/${nid}`); await fetchEHR(); };

    useEffect(() => { fetchEHR(); }, [fetchEHR]);
    useEffect(() => {
        if (tab === 'timeline') fetchTimeline();
        if (tab === 'analytics') fetchRisk(days);
        if (tab === 'triage') fetchTriage();
        if (tab === 'reports') fetchReports();
    }, [tab]);

    const profile = ehr?.profile;
    const stats = ehr?.stats;

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <div className="ehr-header">
                    <div className="ehr-header-left">
                        <button className="btn btn-outline btn-sm" style={{ marginBottom: '0.5rem', width: 'fit-content' }} onClick={() => navigate(-1)}>
                            <ArrowLeft size={14} /> Back
                        </button>
                        <div className="ehr-header-title"><ClipboardList size={22} />
                            {profile?.user ? `${profile.user.firstName} ${profile.user.lastName}` : 'Patient'} — EHR
                        </div>
                        <div className="ehr-header-meta">
                            {profile?.user?.email && <span>{profile.user.email}</span>}
                            {stats?.lastTriageAt && <span>Last triage: {fmt(stats.lastTriageAt)}</span>}
                            {stats?.currentRisk && <Badge p={stats.currentRisk} />}
                        </div>
                    </div>
                    <div className="ehr-header-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/doctor/patient/${id}`)}>
                            <Heart size={14} /> Override Triage
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => window.print()}><Download size={14} /> Export</button>
                        <button className="btn btn-outline btn-sm" onClick={fetchEHR}><RefreshCw size={14} /></button>
                    </div>
                </div>

                <div className="ehr-tabs">
                    {TABS.map(t => {
                        const Icon = t.icon;
                        return (
                            <button key={t.id} className={`ehr-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                                <Icon size={15} /> {t.label}
                                {t.id === 'notes' && profile?.doctorNotes?.length > 0 && (
                                    <span className="ehr-tab-count">{profile.doctorNotes.length}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="ehr-body">
                    {tab === 'overview' && (
                        <>
                            {!loading.ehr && stats && (
                                <div className="ehr-stats-row">
                                    {[['🩺', stats.totalTriageSessions, 'Triage'], ['📋', stats.totalReports, 'Reports'],
                                      ['💬', stats.totalChatSessions, 'AI Sessions'], ['🚨', stats.totalEmergencies, 'Emergencies'],
                                      ['📝', profile?.doctorNotes?.length || 0, 'Notes']].map(([icon, val, lbl]) => (
                                        <div key={lbl} className="ehr-stat">
                                            <span className="ehr-stat-icon">{icon}</span>
                                            <span className="ehr-stat-value">{val}</span>
                                            <span className="ehr-stat-label">{lbl}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {loading.ehr ? <div className="ehr-loading"><div className="spinner" /></div> : (
                                <div className="ehr-grid-2">
                                    <PatientProfileCard profile={profile} />
                                    <div>
                                        <AIHealthSummary summary={summary} loading={loading.summary} onRegenerate={fetchSummary} />
                                        {ehr?.latestTriage && (
                                            <div className="ehr-card">
                                                <div className="ehr-card-title" style={{ marginBottom: '1rem' }}>🩺 Current Triage</div>
                                                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Risk</div><Badge p={ehr.latestTriage.finalPriority} /></div>
                                                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Score</div><div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{ehr.latestTriage.finalScore ?? '—'}/100</div></div>
                                                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Updated</div><div style={{ fontSize: '0.88rem' }}>{fmt(ehr.latestTriage.createdAt)}</div></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {tab === 'timeline' && <HealthTimeline events={timeline} loading={loading.timeline} />}

                    {tab === 'triage' && (
                        <div className="ehr-card">
                            <div className="ehr-card-header"><div className="ehr-card-title"><Heart size={16} /> Triage History</div></div>
                            {loading.triage ? <div className="ehr-loading"><div className="spinner" /></div>
                                : triage.length === 0 ? <div className="ehr-empty"><div className="ehr-empty-icon">🩺</div><div className="ehr-empty-text">No triage sessions.</div></div>
                                    : (<div>
                                        <div className="ehr-triage-row header"><span>#</span><span>Date</span><span>Priority</span><span>Score</span><span>Source</span></div>
                                        {triage.map((t, i) => (
                                            <div key={t._id} className="ehr-triage-row">
                                                <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{i + 1}</span>
                                                <span>{fmt(t.createdAt)}</span>
                                                <Badge p={t.finalPriority} />
                                                <span style={{ fontWeight: 700 }}>{t.finalScore ?? '—'}</span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{t.prioritySource}</span>
                                            </div>
                                        ))}
                                    </div>)}
                        </div>
                    )}

                    {tab === 'reports' && (
                        loading.reports ? <div className="ehr-loading"><div className="spinner" /></div>
                            : reports.length === 0 ? <div className="ehr-empty"><div className="ehr-empty-icon">📋</div><div className="ehr-empty-text">No reports.</div></div>
                                : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {reports.map(r => (
                                        <div key={r._id} className="ehr-timeline-event">
                                            <div className="ehr-event-icon report"><FileText size={16} /></div>
                                            <div className="ehr-event-body">
                                                <div className="ehr-event-title">{r.originalName}</div>
                                                <div className="ehr-event-summary">{r.parsedData?.summary || 'AI summary pending...'}</div>
                                                {r.parsedData?.flaggedItems?.length > 0 && (
                                                    <div style={{ marginTop: '0.3rem', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                                        {r.parsedData.flaggedItems.slice(0, 3).map((f, fi) => <span key={fi} className="ehr-tag danger">{f}</span>)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ehr-event-meta">
                                                <span className="ehr-event-time">{fmt(r.reportDate || r.createdAt)}</span>
                                                <span className="ehr-tag info">{r.reportType?.replace(/_/g, ' ')}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                    )}

                    {tab === 'notes' && (
                        <div className="ehr-card">
                            <div className="ehr-card-header"><div className="ehr-card-title"><MessageSquare size={16} /> Clinical Notes</div></div>
                            <DoctorNotes notes={profile?.doctorNotes || []} patientId={id} canAdd={true} canDelete={true} onAdd={addNote} onDelete={delNote} />
                        </div>
                    )}

                    {tab === 'analytics' && (
                        <RiskTrendChart data={risk} loading={loading.risk} days={days} onDaysChange={(d) => { setDays(d); fetchRisk(d); }} />
                    )}
                </div>
            </div>
        </div>
    );
}
