import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import RiskBadge from '../../components/RiskBadge';
import { doctorService } from '../../api/services';
import {
    BellRing,
    Users,
    AlertCircle,
    ClipboardList,
    AlertTriangle,
    Activity,
    Heart,
    Thermometer,
    Droplet,
    Wind,
    MoveRight,
    CheckCircle2,
    Video
} from 'lucide-react';

export default function DoctorDashboard() {
    const navigate = useNavigate();
    const [queue, setQueue] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [activeTab, setActiveTab] = useState('queue');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const [queueRes, alertsRes] = await Promise.all([
                    doctorService.getQueue(),
                    doctorService.getAlerts(),
                ]);
                setQueue(queueRes.data.data);
                setAlerts(alertsRes.data.data);
            } catch { setError('Unable to load dashboard.'); }
            finally { setLoading(false); }
        })();
    }, []);

    const critical = queue.filter(p => p.triageStatus === 'critical');
    const high = queue.filter(p => p.triageStatus === 'high');
    const moderate = queue.filter(p => p.triageStatus === 'moderate');
    const stable = queue.filter(p => p.triageStatus === 'stable');

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <div className="topbar">
                    <div className="topbar-title">Doctor Dashboard</div>
                    <div className="topbar-actions">
                        {alerts.length > 0 && (
                            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px', padding: '0.4rem 0.85rem', fontSize: '0.8rem', color: '#fca5a5', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                onClick={() => setActiveTab('alerts')}>
                                <BellRing size={14} className="rd-spin" /> {alerts.length} Alert{alerts.length > 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                </div>

                <div className="page-body">
                    {error && <div className="alert alert-critical"><AlertCircle size={18} /> {error}</div>}

                    {/* Stats */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-label">Total Patients</div>
                            <div className="stat-value">{queue.length}</div>
                            <div className="stat-sub">In system</div>
                            <Users size={20} style={{ position: 'absolute', right: '1rem', top: '1rem', opacity: 0.2 }} />
                        </div>
                        <div className="stat-card" style={{ borderColor: critical.length > 0 ? 'rgba(239,68,68,0.4)' : 'var(--border-light)' }}>
                            <div className="stat-label">Critical</div>
                            <div className="stat-value" style={{ background: 'linear-gradient(135deg, #fca5a5, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{critical.length}</div>
                            <div className="stat-sub">Urgent attention</div>
                            <AlertCircle size={20} style={{ position: 'absolute', right: '1rem', top: '1rem', opacity: 0.2, color: '#ef4444' }} />
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">High Priority</div>
                            <div className="stat-value" style={{ background: 'linear-gradient(135deg, #fdba74, #ea580c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{high.length}</div>
                            <AlertTriangle size={20} style={{ position: 'absolute', right: '1rem', top: '1rem', opacity: 0.2, color: '#f97316' }} />
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Moderate / Stable</div>
                            <div className="stat-value">{moderate.length + stable.length}</div>
                            <div className="stat-sub">Lower priority</div>
                            <Activity size={20} style={{ position: 'absolute', right: '1rem', top: '1rem', opacity: 0.2 }} />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <button className={`btn ${activeTab === 'queue' ? 'btn-primary' : 'btn-outline'} btn-sm`} onClick={() => setActiveTab('queue')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ClipboardList size={16} /> Priority Queue
                        </button>
                        <button className={`btn ${activeTab === 'alerts' ? 'btn-primary' : 'btn-outline'} btn-sm`} onClick={() => setActiveTab('alerts')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BellRing size={16} /> High-Risk Alerts ({alerts.length})
                        </button>
                    </div>

                    {loading ? <div className="spinner" /> : (
                        <>
                            {activeTab === 'queue' && (
                                <>
                                    {queue.length === 0 && (
                                        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                            No patients in the system yet.
                                        </div>
                                    )}

                                    {/* Priority groups */}
                                    {[
                                        { label: 'Critical', group: critical, color: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', icon: <AlertCircle size={18} color="#ef4444" /> },
                                        { label: 'High Priority', group: high, color: 'rgba(249,115,22,0.06)', border: 'rgba(249,115,22,0.3)', icon: <AlertTriangle size={18} color="#f97316" /> },
                                        { label: 'Moderate', group: moderate, color: 'rgba(234,179,8,0.05)', border: 'var(--border-light)', icon: <Activity size={18} color="#eab308" /> },
                                        { label: 'Stable', group: stable, color: 'transparent', border: 'var(--border-light)', icon: <CheckCircle2 size={18} color="#22c55e" /> },
                                    ].filter(g => g.group.length > 0).map(({ label, group, color, border, icon }) => (
                                        <div key={label} style={{ marginBottom: '1.75rem' }}>
                                            <h2 className="section-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {icon} {label}
                                            </h2>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
                                                {group.map(patient => (
                                                <PatientCard key={patient._id} patient={patient} color={color} border={border} onClick={() => navigate(`/doctor/patient/${patient._id}`)} onStartConsult={() => {
                                                    const roomId = `consult-${patient._id}-${Date.now()}`;
                                                    navigate(`/doctor/consultation/${roomId}`, {
                                                        state: {
                                                            patientName: `${patient.user?.firstName || ''} ${patient.user?.lastName || ''}`.trim(),
                                                            patientId: patient._id,
                                                            physicalRisk: { score: 0, severity: patient.triageStatus?.toUpperCase() || 'LOW', reasons: [] },
                                                            mentalRisk:   { score: 0, severity: 'LOW', reasons: [] },
                                                            careCategory: patient.triageStatus === 'critical' ? 'Emergency Room' : 'Clinic Visit',
                                                            vitals: patient.latestVitals || null,
                                                        }
                                                    });
                                                }} />
                                            ))}
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}

                            {activeTab === 'alerts' && (
                                <>
                                    {alerts.length === 0 ? (
                                        <div className="alert alert-success"><CheckCircle2 size={18} /> No high-risk alerts at this time.</div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {alerts.map(patient => (
                                                <div key={patient._id} className="glass-card"
                                                    style={{ borderColor: patient.triageStatus === 'critical' ? 'rgba(239,68,68,0.5)' : 'rgba(249,115,22,0.4)', cursor: 'pointer', background: patient.triageStatus === 'critical' ? 'rgba(239,68,68,0.06)' : 'var(--glass)' }}
                                                    onClick={() => navigate(`/doctor/patient/${patient._id}`)}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                            <div style={{ background: patient.triageStatus === 'critical' ? '#ef4444' : '#f97316', color: '#fff', width: 40, height: 40, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                {patient.triageStatus === 'critical' ? <AlertCircle size={20} /> : <AlertTriangle size={20} />}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 700 }}>
                                                                    {patient.user?.firstName} {patient.user?.lastName}
                                                                </div>
                                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{patient.user?.email}</div>
                                                                {patient.lastTriageAt && <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>Triaged: {new Date(patient.lastTriageAt).toLocaleDateString()}</div>}
                                                            </div>
                                                        </div>
                                                        <RiskBadge priority={patient.triageStatus} size="lg" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function PatientCard({ patient, color, border, onClick, onStartConsult }) {
    const v = patient.latestVitals;
    const needsConsult = patient.triageStatus === 'critical' || patient.triageStatus === 'high';
    return (
        <div className="glass-card" style={{ background: color, borderColor: border, transition: 'all 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                    <div style={{ fontWeight: 700 }}>{patient.user?.firstName} {patient.user?.lastName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{patient.user?.email}</div>
                </div>
                <RiskBadge priority={patient.triageStatus} />
            </div>

            {v && (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                    {v.heartRate        && <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}><Heart size={14} color="#ef4444" /> {v.heartRate} bpm</div>}
                    {v.oxygenSaturation && <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}><Wind size={14} color="#3b82f6" /> SpO₂ {v.oxygenSaturation}%</div>}
                    {v.bloodPressureSystolic && <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}><Droplet size={14} color="#94a3b8" /> {v.bloodPressureSystolic}/{v.bloodPressureDiastolic}</div>}
                    {v.temperature     && <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}><Thermometer size={14} color="#f97316" /> {v.temperature}°C</div>}
                </div>
            )}

            {patient.lastTriageAt && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ClipboardList size={12} /> Last assessed: {new Date(patient.lastTriageAt).toLocaleDateString()}
                </div>
            )}

            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <button
                    style={{ fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    onClick={onClick}
                >
                    View Patient <MoveRight size={14} />
                </button>
                {needsConsult && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onStartConsult(); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                            color: '#fff', border: 'none', borderRadius: '8px',
                            padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700,
                            cursor: 'pointer', boxShadow: '0 2px 8px rgba(124,58,237,0.35)',
                            transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                        <Video size={12} /> Start Consultation
                    </button>
                )}
            </div>
        </div>
    );
}
