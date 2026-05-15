import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { patientService, reportService, reminderService, ehrService } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import {
    Bell,
    Settings,
    CheckCircle2,
    PenLine,
    Stethoscope,
    Pill,
    Hospital,
    FileText,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    Activity,
    Files,
    AlertCircle,
    Send,
    ArrowUpRight
} from 'lucide-react';
import AIChatbot from '../../components/AI/AIChatbot';
import LanguagePicker from '../../components/LanguagePicker';
import RiskTrendChart from '../../components/EHR/RiskTrendChart';
import T from '../../components/T';
import './PatientDashboard.css';

export default function PatientDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        profile: null,
        triageHistory: [],
        symptoms: [],
        reminders: [],
        reports: [],
        riskTrend: null
    });
    const [error, setError] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toDateString());


    useEffect(() => {
        const fetchData = async () => {
            try {
                const results = await Promise.allSettled([
                    patientService.getProfile(),
                    patientService.getTriageHistory(),
                    patientService.getSymptomHistory(),
                    reminderService.list({ status: 'upcoming' }),
                    reportService.list(),
                    ehrService.getMyRiskTrend(30)
                ]);

                const getValue = (result, fallback = []) =>
                    result.status === 'fulfilled' ? result.value.data.data : fallback;

                const failedCount = results.filter(r => r.status === 'rejected').length;
                if (failedCount > 0) {
                    console.warn(`${failedCount} dashboard request(s) failed:`,
                        results.filter(r => r.status === 'rejected').map(r => r.reason?.message));
                }

                setStats({
                    profile: getValue(results[0], null),
                    triageHistory: getValue(results[1]),
                    symptoms: getValue(results[2]),
                    reminders: getValue(results[3]),
                    reports: getValue(results[4]),
                    riskTrend: getValue(results[5], null)
                });
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError('Failed to load some dashboard data.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);



    // ── Data Mapping Helpers ──
    const latestTriage = stats.triageHistory[0];
    const completedTriageCount = stats.triageHistory.length;

    // Calculate trend percentage (comparing last two scores if available)
    const calculateTrend = () => {
        if (stats.triageHistory.length < 2) return '+0%';
        const current = stats.triageHistory[0].finalScore || 0;
        const previous = stats.triageHistory[1].finalScore || 0;
        if (previous === 0) return '+0%';
        const diff = ((current - previous) / previous) * 100;
        return `${diff >= 0 ? '+' : ''}${diff.toFixed(0)}%`;
    };

    // Map triage history to chart (last 7 entries, dual scores)
    const chartData = stats.triageHistory.slice(0, 7).reverse().map(t => ({
        day:           new Date(t.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' }),
        physicalScore: t.physicalRiskScore ?? (t.finalScore || 0),
        mentalScore:   t.mentalRiskScore   ?? 0,
        score:         t.finalScore || 0,
        unfilled:      Math.max(0, 100 - Math.max(t.physicalRiskScore ?? t.finalScore ?? 0, t.mentalRiskScore ?? 0)),
    }));

    const getCareCategory = (triage) => {
        if (!triage) return 'No Data';
        // If the backend provided a priority string, map it to a readable category
        const priorityMap = {
            'critical': 'Emergency Room',
            'high': 'Clinic Visit',
            'moderate': 'Clinic Visit',
            'stable': 'Home Care'
        };
        if (triage.finalPriority && priorityMap[triage.finalPriority]) {
            return priorityMap[triage.finalPriority];
        }
        // Fallback to score-based calculation
        const score = triage.finalScore || 0;
        if (score >= 75) return 'Emergency Room';
        if (score > 20) return 'Clinic Visit';
        return 'Home Care';
    };

    const latestCategory = getCareCategory(latestTriage);

    if (loading) return (
        <div className="pd-wrapper">
            <Sidebar />
            <div className="pd-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" />
            </div>
        </div>
    );

    const isTrendUp = calculateTrend().startsWith('+');

    return (
        <div className="pd-wrapper">
            <Sidebar />
            <main className="pd-content">
                {/* ── Header ── */}
                <header className="pd-header">
                    <h1 className="pd-greeting">
                        <T>Hey</T>, {user.firstName || 'User'}! <T>Glad to have you back</T>
                    </h1>
                    <div className="pd-top-actions">
                        {error && <span style={{ color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><AlertCircle size={14} /> {error}</span>}
                        <LanguagePicker />
                        <div className="pd-icon-btn"><Bell size={18} /></div>
                        <div className="pd-icon-btn" style={{ padding: 0, overflow: 'hidden', background: '#3b82f6', color: '#fff', fontWeight: 600 }}>
                            <div className="user-avatar" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="pd-main-grid">
                    {/* ── Left Column ── */}
                    <div className="pd-left-column">

                        {/* Stat Cards Row */}
                        <div className="pd-stats-row">
                            <div className="pd-card pd-stat-widget">
                                <span className="pd-card-title"><T>Progress Tracking</T></span>
                                <div className="pd-stat-value-row">
                                    <span className="pd-stat-number">{completedTriageCount}</span>
                                    <span className={`pd-stat-trend ${isTrendUp ? 'pd-trend-up' : 'pd-trend-down'}`}>
                                        {isTrendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                        {calculateTrend()}
                                    </span>
                                </div>
                                <p className="pd-stat-desc"><T>Triage assessments completed to date</T></p>
                                <div className="pd-progress-track">
                                    <div className="pd-progress-fill" style={{ width: `${Math.min(completedTriageCount * 10, 100)}%` }}></div>
                                </div>
                            </div>

                            <div className="pd-card pd-stat-widget" style={{ borderLeft: `4px solid ${latestCategory === 'Emergency Room' ? '#ef4444' : latestCategory === 'Clinic Visit' ? '#f59e0b' : '#10b981'}` }}>
                                <span className="pd-card-title"><T>Care Recommendation</T></span>
                                <div className="pd-stat-value-row">
                                    <span className="pd-stat-number" style={{ fontSize: '1.1rem', color: latestCategory === 'Emergency Room' ? '#ef4444' : latestCategory === 'Clinic Visit' ? '#f59e0b' : '#10b981' }}>
                                        <T>{latestCategory}</T>
                                    </span>
                                    <Hospital size={20} style={{ opacity: 0.3 }} />
                                </div>
                                <p className="pd-stat-desc"><T>Based on your latest health assessment</T></p>
                            </div>

                            <div className="pd-card pd-stat-widget">
                                <span className="pd-card-title"><T>Symptom Logs</T></span>
                                <div className="pd-stat-value-row">
                                    <span className="pd-stat-number">{stats.symptoms.length}</span>
                                    <span className="pd-stat-trend" style={{ background: '#f1f5f9', color: '#64748b' }}><T>Total</T></span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                        <strong><T>Last Logged:</T></strong> {stats.symptoms[0]?.symptoms[0]?.name || 'None'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                        <CheckCircle2 size={14} style={{ color: '#3b82f6' }} /> <T>Regular tracking</T>
                                    </div>
                                </div>
                            </div>

                            <div className="pd-card pd-stat-widget">
                                <span className="pd-card-title"><T>Medical Documents</T></span>
                                <div className="pd-stat-value-row">
                                    <span className="pd-stat-number">{stats.reports.length}</span>
                                    <span className="pd-stat-trend pd-trend-up"><Files size={12} /> <T>Files</T></span>
                                </div>
                                <p className="pd-stat-desc"><T>Securely stored in your vault</T></p>
                                <div className="pd-progress-track">
                                    <div className="pd-progress-fill" style={{ width: `${Math.min(stats.reports.length * 20, 100)}%` }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Middle Row: Chart & Urgent */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div className="pd-card" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
                                    <div style={{ padding: '1.5rem 1.5rem 0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <span className="pd-card-title"><T>Health Stability Trend</T></span>
                                            <button 
                                                className="btn btn-outline btn-sm" 
                                                style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px' }}
                                                onClick={() => navigate('/patient/ehr')}
                                            >
                                                Full Report <ArrowUpRight size={12} />
                                            </button>
                                        </div>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                            <T>Your longitudinal health score over the last 30 days</T>
                                        </p>
                                    </div>

                                    <div style={{ padding: '0 0.75rem 0.75rem' }}>
                                        <div className="pd-graph-wrapper" style={{ minHeight: '280px' }}>
                                            <RiskTrendChart 
                                                data={stats.riskTrend} 
                                                days={30} 
                                                onDaysChange={(d) => {
                                                    ehrService.getMyRiskTrend(d).then(res => {
                                                        setStats(prev => ({ ...prev, riskTrend: res.data.data }));
                                                    });
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ── Mock Wearable / Vitals Section ── */}
                                <div className="pd-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <span className="pd-card-title"><Activity size={18} style={{ color: '#ef4444' }} /> <T>Live Vitals (Syncing)</T></span>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ef4444', background: '#fee2e2', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase' }}><T>Live</T></span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}><T>Heart Rate</T></span>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444' }}>72 <small style={{ fontSize: '0.75rem' }}>BPM</small></span>
                                        </div>
                                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}><T>SpO2</T></span>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3b82f6' }}>98 <small style={{ fontSize: '0.75rem' }}>%</small></span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.75rem', textAlign: 'center' }}>
                                        <T>Syncing from connected wearable device...</T>
                                    </p>
                                </div>
                            </div>

                            <div className="pd-urgent-card" style={{
                                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '1.5rem',
                                height: '540px'
                            }}>
                                <AIChatbot />
                            </div>
                        </div>

                    </div>

                    {/* ── Right Column ── */}
                    <div className="pd-right-column">

                        {/* Upcoming Reminders Section */}
                        <div className="pd-card pd-calendar-widget">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <span className="pd-card-title"><T>Consultations & Schedule</T></span>
                                <AlertCircle size={14} style={{ color: '#94a3b8' }} />
                            </div>
                            <div className="pd-days-row" style={{ marginTop: '0.5rem' }}>
                                {[...Array(7)].map((_, i) => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + i);
                                    const dateStr = d.toDateString();
                                    const isSelected = selectedDate === dateStr;
                                    
                                    return (
                                        <div 
                                            key={i} 
                                            className={`pd-day ${isSelected ? 'active' : ''}`}
                                            onClick={() => setSelectedDate(dateStr)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <span className="pd-day-name">{d.toLocaleDateString([], { weekday: 'short' })}</span>
                                            <span className="pd-day-number">{d.getDate()}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pd-appointments-list" style={{ marginTop: '1rem' }}>
                                {stats.reminders.filter(r => new Date(r.scheduledAt).toDateString() === selectedDate).length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                                        No tasks for this day.
                                    </div>
                                ) : (
                                    stats.reminders
                                        .filter(r => new Date(r.scheduledAt).toDateString() === selectedDate)
                                        .slice(0, 4)
                                        .map((r) => (
                                    <div key={r._id} className="pd-appointment">
                                        <div className="pd-avatar" style={{ background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pd-accent)' }}>
                                            {r.type === 'medication' ? <Pill size={18} /> : <Hospital size={18} />}
                                        </div>
                                        <div className="pd-app-info">
                                            <div className="pd-app-name">{r.title}</div>
                                            <div className="pd-app-role">{r.doctorName ? r.doctorName : (r.type === 'medication' ? 'Medication' : 'Clinical Visit')}</div>
                                        </div>
                                        <div className="pd-app-time">
                                            {new Date(r.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            <div className="pd-app-date">{new Date(r.scheduledAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}</div>
                                        </div>
                                    </div>
                                        ))
                                    )}
                                </div>

                                <button className="pd-urgent-btn" style={{ background: '#1e293b', width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={() => navigate('/patient/consultations')}>
                                    <Activity size={16} /> Manage Schedule
                                </button>
                        </div>

                        {/* Recent Reports Section */}
                        <div className="pd-card">
                            <span className="pd-card-title"><T>Latest Medical Reports</T></span>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
                                <T>Access your securely stored diagnostic results and documents</T>
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {stats.reports.slice(0, 3).map((rep) => (
                                    <div key={rep._id} className="pd-session-item" onClick={() => navigate(`/patient/reports/${rep._id}`)}>
                                        <div className="pd-play-btn" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                                            <FileText size={16} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{rep.originalName}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                {rep.reportType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} • {new Date(rep.reportDate || rep.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {stats.reports.length === 0 && (
                                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>No reports uploaded yet.</p>
                                )}
                            </div>
                            <button className="pd-urgent-btn" style={{ background: 'transparent', border: '1px solid #e2e8f0', color: '#1e293b', width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={() => navigate('/patient/reports')}>
                                <Files size={16} /> View all reports
                            </button>
                        </div>

                        {/* Triage History Summary */}
                        <div className="pd-card">
                            <span className="pd-card-title"><T>Symptom Logs & Triage</T></span>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '2rem' }}>
                                <T>Recent AI-powered health assessments and recommendations</T>
                            </p>

                            <div className="pd-exercise-list">
                                {stats.triageHistory.slice(0, 3).map((t, idx) => (
                                    <div key={t._id} className="pd-exercise-item" style={{ gridTemplateColumns: '40px 1fr auto', cursor: 'pointer' }} onClick={() => navigate('/patient/assistant')}>
                                        <div className="pd-exercise-icon" style={{
                                            width: '40px',
                                            height: '40px',
                                            background: t.finalPriority === 'critical' ? '#fee2e2' : t.finalPriority === 'high' ? '#fff7ed' : '#f0fdf4',
                                            color: t.finalPriority === 'critical' ? '#ef4444' : t.finalPriority === 'high' ? '#f59e0b' : '#10b981'
                                        }}>
                                            <Activity size={16} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span className="pd-exercise-name" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                                                {t.symptomLog?.symptoms?.map(s => s.name).join(', ') || 'AI Consultation'}
                                            </span>
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{new Date(t.createdAt).toLocaleDateString()}</span>
                                                {t.physicalRiskScore !== undefined && (
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: '8px', background: '#dbeafe', color: '#1d4ed8' }}>
                                                        🫀 {t.physicalRiskScore}%
                                                    </span>
                                                )}
                                                {t.mentalRiskScore !== undefined && (
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: '8px', background: '#ede9fe', color: '#6d28d9' }}>
                                                        🧠 {t.mentalRiskScore}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ color: '#3b82f6', fontWeight: 600, fontSize: '0.85rem' }}>{t.finalScore || 0}%</div>
                                    </div>
                                ))}

                                {stats.triageHistory.length === 0 && (
                                    <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No assessments yet.</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
