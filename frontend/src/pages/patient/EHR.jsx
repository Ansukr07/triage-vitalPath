import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ClipboardList, Activity, FileText, MessageSquare, BarChart2, User, Search,
    Download, RefreshCw, Heart
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import HealthTimeline from '../../components/EHR/HealthTimeline';
import RiskTrendChart from '../../components/EHR/RiskTrendChart';
import PatientProfileCard from '../../components/EHR/PatientProfileCard';
import AIHealthSummary from '../../components/EHR/AIHealthSummary';
import DoctorNotes from '../../components/EHR/DoctorNotes';
import EHRSearch from '../../components/EHR/EHRSearch';
import '../../components/EHR/EHR.css';
import api from '../../api/axios';

const TABS = [
    { id: 'overview', label: 'Overview', icon: ClipboardList },
    { id: 'timeline', label: 'Timeline', icon: Activity },
    { id: 'triage', label: 'Triage History', icon: Heart },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'notes', label: 'Doctor Notes', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'search', label: 'Search', icon: Search },
];

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function PriorityBadge({ priority }) {
    if (!priority) return null;
    return <span className={`badge badge-${priority}`}>{priority}</span>;
}

export default function PatientEHRPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');

    // Data states
    const [ehrData, setEhrData] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [riskTrend, setRiskTrend] = useState(null);
    const [summary, setSummary] = useState(null);
    const [triage, setTriage] = useState([]);
    const [reports, setReports] = useState([]);
    const [searchResults, setSearchResults] = useState([]);

    // Loading states
    const [loadingEhr, setLoadingEhr] = useState(true);
    const [loadingTimeline, setLoadingTimeline] = useState(false);
    const [loadingRisk, setLoadingRisk] = useState(false);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [loadingTriage, setLoadingTriage] = useState(false);
    const [loadingReports, setLoadingReports] = useState(false);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [riskDays, setRiskDays] = useState(90);

    // ── Fetch EHR overview ────────────────────────────────────────────
    const fetchEHR = useCallback(async () => {
        setLoadingEhr(true);
        try {
            const { data } = await api.get('/ehr/me');
            setEhrData(data.data);
        } catch (err) {
            console.error('EHR fetch error:', err);
        } finally {
            setLoadingEhr(false);
        }
    }, []);

    // ── Fetch Timeline ────────────────────────────────────────────────
    const fetchTimeline = useCallback(async () => {
        if (timeline.length) return; // cached
        setLoadingTimeline(true);
        try {
            const { data } = await api.get('/ehr/timeline', { params: { limit: 100 } });
            setTimeline(data.data || []);
        } catch (err) {
            console.error('Timeline fetch error:', err);
        } finally {
            setLoadingTimeline(false);
        }
    }, [timeline.length]);

    // ── Fetch Risk Trend ──────────────────────────────────────────────
    const fetchRiskTrend = useCallback(async (days = 90) => {
        setLoadingRisk(true);
        try {
            const { data } = await api.get('/ehr/risk-trend', { params: { days } });
            setRiskTrend(data.data);
        } catch (err) {
            console.error('Risk trend error:', err);
        } finally {
            setLoadingRisk(false);
        }
    }, []);

    // ── Fetch AI Summary ─────────────────────────────────────────────
    const fetchSummary = useCallback(async () => {
        setLoadingSummary(true);
        try {
            const { data } = await api.get('/ehr/summary');
            setSummary(data.data);
        } catch (err) {
            setSummary({ error: err.response?.data?.message || err.message });
        } finally {
            setLoadingSummary(false);
        }
    }, []);

    // ── Fetch Triage History ─────────────────────────────────────────
    const fetchTriage = useCallback(async () => {
        if (triage.length) return;
        setLoadingTriage(true);
        try {
            const { data } = await api.get('/patients/triage/history');
            setTriage(data.data || []);
        } catch (err) {
            console.error('Triage fetch error:', err);
        } finally {
            setLoadingTriage(false);
        }
    }, [triage.length]);

    // ── Fetch Reports ────────────────────────────────────────────────
    const fetchReports = useCallback(async () => {
        if (reports.length) return;
        setLoadingReports(true);
        try {
            const { data } = await api.get('/reports');
            setReports(data.data || []);
        } catch (err) {
            console.error('Reports fetch error:', err);
        } finally {
            setLoadingReports(false);
        }
    }, [reports.length]);

    // ── Search ───────────────────────────────────────────────────────
    const handleSearch = async (params) => {
        setLoadingSearch(true);
        try {
            const { data } = await api.get('/ehr/search', { params });
            setSearchResults(data.data || []);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoadingSearch(false);
        }
    };

    // ── Tab change handler ────────────────────────────────────────────
    useEffect(() => {
        fetchEHR();
    }, [fetchEHR]);

    useEffect(() => {
        if (activeTab === 'timeline') fetchTimeline();
        if (activeTab === 'analytics') fetchRiskTrend(riskDays);
        if (activeTab === 'triage') fetchTriage();
        if (activeTab === 'reports') fetchReports();
    }, [activeTab]);

    const handleDaysChange = (d) => {
        setRiskDays(d);
        fetchRiskTrend(d);
    };

    const stats = ehrData?.stats;
    const profile = ehrData?.profile;

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                {/* ── EHR Header ── */}
                <div className="ehr-header">
                    <div className="ehr-header-left">
                        <div className="ehr-header-title">
                            <ClipboardList size={22} />
                            Electronic Health Record
                        </div>
                        <div className="ehr-header-meta">
                            {profile?.user && (
                                <span>
                                    {profile.user.firstName} {profile.user.lastName}
                                </span>
                            )}
                            {stats?.lastTriageAt && (
                                <span>Last triage: {formatDate(stats.lastTriageAt)}</span>
                            )}
                            {stats?.currentRisk && (
                                <PriorityBadge priority={stats.currentRisk} />
                            )}
                        </div>
                    </div>
                    <div className="ehr-header-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
                            <Download size={14} /> Export PDF
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={fetchEHR}>
                            <RefreshCw size={14} /> Refresh
                        </button>
                    </div>
                </div>

                {/* ── Tab Navigation ── */}
                <div className="ehr-tabs">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                className={`ehr-tab ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <Icon size={15} />
                                {tab.label}
                                {tab.id === 'triage' && stats?.totalTriageSessions > 0 && (
                                    <span className="ehr-tab-count">{stats.totalTriageSessions}</span>
                                )}
                                {tab.id === 'reports' && stats?.totalReports > 0 && (
                                    <span className="ehr-tab-count">{stats.totalReports}</span>
                                )}
                                {tab.id === 'notes' && profile?.doctorNotes?.length > 0 && (
                                    <span className="ehr-tab-count">{profile.doctorNotes.length}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ── Body ── */}
                <div className="ehr-body">

                    {/* ── OVERVIEW TAB ── */}
                    {activeTab === 'overview' && (
                        <>
                            {/* Stats Row */}
                            {!loadingEhr && stats && (
                                <div className="ehr-stats-row">
                                    <div className="ehr-stat">
                                        <span className="ehr-stat-icon">🩺</span>
                                        <span className="ehr-stat-value">{stats.totalTriageSessions}</span>
                                        <span className="ehr-stat-label">Triage Sessions</span>
                                    </div>
                                    <div className="ehr-stat">
                                        <span className="ehr-stat-icon">📋</span>
                                        <span className="ehr-stat-value">{stats.totalReports}</span>
                                        <span className="ehr-stat-label">Reports</span>
                                    </div>
                                    <div className="ehr-stat">
                                        <span className="ehr-stat-icon">💬</span>
                                        <span className="ehr-stat-value">{stats.totalChatSessions}</span>
                                        <span className="ehr-stat-label">AI Sessions</span>
                                    </div>
                                    <div className="ehr-stat">
                                        <span className="ehr-stat-icon">🚨</span>
                                        <span className="ehr-stat-value">{stats.totalEmergencies}</span>
                                        <span className="ehr-stat-label">Emergencies</span>
                                    </div>
                                    <div className="ehr-stat">
                                        <span className="ehr-stat-icon">📝</span>
                                        <span className="ehr-stat-value">{profile?.doctorNotes?.length || 0}</span>
                                        <span className="ehr-stat-label">Doctor Notes</span>
                                    </div>
                                </div>
                            )}

                            {loadingEhr ? (
                                <div className="ehr-loading"><div className="spinner" /></div>
                            ) : (
                                <div className="ehr-grid-2">
                                    <PatientProfileCard profile={profile} />
                                    <div>
                                        <AIHealthSummary
                                            summary={summary}
                                            loading={loadingSummary}
                                            onRegenerate={fetchSummary}
                                        />
                                        {/* Latest Triage */}
                                        {ehrData?.latestTriage && (
                                            <div className="ehr-card">
                                                <div className="ehr-card-title" style={{ marginBottom: '1rem' }}>
                                                    🩺 Current Triage Status
                                                </div>
                                                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk Level</div>
                                                        <PriorityBadge priority={ehrData.latestTriage.finalPriority} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score</div>
                                                        <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{ehrData.latestTriage.finalScore ?? '—'}/100</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Updated</div>
                                                        <div style={{ fontSize: '0.88rem' }}>{formatDate(ehrData.latestTriage.createdAt)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── TIMELINE TAB ── */}
                    {activeTab === 'timeline' && (
                        <HealthTimeline events={timeline} loading={loadingTimeline} />
                    )}

                    {/* ── TRIAGE HISTORY TAB ── */}
                    {activeTab === 'triage' && (
                        <div className="ehr-card">
                            <div className="ehr-card-header">
                                <div className="ehr-card-title"><Heart size={16} /> Triage History</div>
                            </div>
                            {loadingTriage ? (
                                <div className="ehr-loading"><div className="spinner" /></div>
                            ) : triage.length === 0 ? (
                                <div className="ehr-empty">
                                    <div className="ehr-empty-icon">🩺</div>
                                    <div className="ehr-empty-text">No triage sessions recorded.</div>
                                </div>
                            ) : (
                                <div>
                                    <div className="ehr-triage-row header">
                                        <span>#</span>
                                        <span>Date</span>
                                        <span>Priority</span>
                                        <span>Score</span>
                                        <span>Source</span>
                                    </div>
                                    {triage.map((t, i) => (
                                        <div key={t._id} className="ehr-triage-row">
                                            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{i + 1}</span>
                                            <span>{formatDate(t.createdAt)}</span>
                                            <PriorityBadge priority={t.finalPriority} />
                                            <span style={{ fontWeight: 700 }}>{t.finalScore ?? '—'}</span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{t.prioritySource || 'rule_engine'}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── REPORTS TAB ── */}
                    {activeTab === 'reports' && (
                        <div>
                            {loadingReports ? (
                                <div className="ehr-loading"><div className="spinner" /></div>
                            ) : reports.length === 0 ? (
                                <div className="ehr-empty">
                                    <div className="ehr-empty-icon">📋</div>
                                    <div className="ehr-empty-text">No reports uploaded yet.</div>
                                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/patient/reports')}>
                                        Upload Report
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {reports.map(r => (
                                        <div
                                            key={r._id}
                                            className="ehr-timeline-event"
                                            onClick={() => navigate(`/patient/reports/${r._id}`)}
                                        >
                                            <div className="ehr-event-icon report">
                                                <FileText size={16} />
                                            </div>
                                            <div className="ehr-event-body">
                                                <div className="ehr-event-title">{r.originalName}</div>
                                                <div className="ehr-event-summary">
                                                    {r.parsedData?.summary || 'AI summary pending...'}</div>
                                                {r.parsedData?.flaggedItems?.length > 0 && (
                                                    <div style={{ marginTop: '0.3rem', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                                        {r.parsedData.flaggedItems.slice(0, 3).map((f, i) => (
                                                            <span key={i} className="ehr-tag danger">{f}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ehr-event-meta">
                                                <span className="ehr-event-time">{formatDate(r.reportDate || r.createdAt)}</span>
                                                <span className="ehr-tag info">{r.reportType?.replace(/_/g, ' ')}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── DOCTOR NOTES TAB ── */}
                    {activeTab === 'notes' && (
                        <div className="ehr-card">
                            <div className="ehr-card-header">
                                <div className="ehr-card-title"><MessageSquare size={16} /> Clinical Notes</div>
                            </div>
                            <DoctorNotes
                                notes={profile?.doctorNotes?.filter(n => !n.isPrivate) || []}
                                canAdd={false}
                                canDelete={false}
                            />
                        </div>
                    )}

                    {/* ── ANALYTICS TAB ── */}
                    {activeTab === 'analytics' && (
                        <div>
                            <RiskTrendChart
                                data={riskTrend}
                                loading={loadingRisk}
                                days={riskDays}
                                onDaysChange={handleDaysChange}
                            />
                        </div>
                    )}

                    {/* ── SEARCH TAB ── */}
                    {activeTab === 'search' && (
                        <div>
                            <EHRSearch onSearch={handleSearch} loading={loadingSearch} />
                            {loadingSearch ? (
                                <div className="ehr-loading"><div className="spinner" /></div>
                            ) : searchResults.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {searchResults.map((r, i) => (
                                        <div key={i} className="ehr-timeline-event">
                                            <div className={`ehr-event-icon ${r.type || 'report'}`}>
                                                {r.type === 'report' ? <FileText size={15} /> : r.type === 'triage' ? <Activity size={15} /> : <MessageSquare size={15} />}
                                            </div>
                                            <div className="ehr-event-body">
                                                <div className="ehr-event-title">
                                                    [{r.type?.toUpperCase()}] {r.originalName || r.title || `Triage — ${r.finalPriority}`}
                                                </div>
                                                <div className="ehr-event-summary">
                                                    {r.parsedData?.summary || r.aiSummary || formatDate(r.createdAt)}
                                                </div>
                                            </div>
                                            <div className="ehr-event-meta">
                                                <span className="ehr-event-time">{formatDate(r.createdAt)}</span>
                                                {r.finalPriority && <PriorityBadge priority={r.finalPriority} />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="ehr-empty">
                                    <div className="ehr-empty-icon">🔍</div>
                                    <div className="ehr-empty-text">Enter a search term to find records.</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
