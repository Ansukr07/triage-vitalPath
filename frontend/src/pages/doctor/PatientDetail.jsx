import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import RiskBadge from '../../components/RiskBadge';
import RiskScorecard from '../../components/RiskScorecard';
import { doctorService, triageService } from '../../api/services';
import { Video } from 'lucide-react';

export default function PatientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [summary, setSummary] = useState('');
    const [triage, setTriage] = useState(null);
    const [override, setOverride] = useState({ priority: '', reason: '', notes: '' });
    const [loading, setLoading] = useState(true);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [overriding, setOverriding] = useState(false);
    const [overrideSuccess, setOverrideSuccess] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        (async () => {
            try {
                const [patRes, triageRes] = await Promise.all([
                    doctorService.getPatientDetail(id),
                    triageService.getLatest(id),
                ]);
                setPatient(patRes.data.data);
                setTriage(triageRes.data.data);
                setOverride(prev => ({ ...prev, priority: triageRes.data.data?.finalPriority || '' }));
            } catch { setError('Unable to load patient data.'); }
            finally { setLoading(false); }
        })();
    }, [id]);

    const loadSummary = async () => {
        setSummaryLoading(true);
        try {
            const res = await doctorService.getPatientSummary(id);
            setSummary(res.data.data.summary);
            setActiveTab('summary');
        } catch { setError('Could not generate summary.'); }
        finally { setSummaryLoading(false); }
    };

    const handleOverride = async (e) => {
        e.preventDefault();
        if (!override.reason) { setError('Please provide an override reason.'); return; }
        setOverriding(true); setError('');
        try {
            await doctorService.overrideTriage(id, override);
            setOverrideSuccess(`✅ Triage overridden to ${override.priority.toUpperCase()}`);
            // Refresh triage
            const t = await triageService.getLatest(id);
            setTriage(t.data.data);
        } catch (err) { setError(err.response?.data?.message || 'Override failed.'); }
        finally { setOverriding(false); }
    };

    if (loading) return <div className="app-layout"><Sidebar /><div className="main-content"><div className="spinner" /></div></div>;
    if (!patient) return <div className="app-layout"><Sidebar /><div className="main-content"><div className="page-body"><div className="alert alert-critical">Patient not found.</div></div></div></div>;

    const v = patient.latestVitals || {};
    const u = patient.user || {};

    const scoreColor = (s) => s >= 75 ? 'var(--critical)' : s >= 50 ? 'var(--high)' : s >= 25 ? 'var(--moderate)' : 'var(--stable)';

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <div className="topbar">
                    <div className="topbar-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => navigate('/doctor')}>← Back</button>
                    </div>
                    <div className="topbar-title" style={{ flex: 1, marginLeft: '1rem' }}>
                        {u.firstName} {u.lastName}
                    </div>
                    <div className="topbar-actions" style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/doctor/patient/${id}/ehr`)}>
                            📋 Full EHR
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={loadSummary} disabled={summaryLoading}>
                            {summaryLoading ? '⏳ Generating…' : '🤖 AI Clinical Summary'}
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => {
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
                        }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', boxShadow: '0 2px 8px rgba(124,58,237,0.35)' }}>
                            <Video size={14} /> Start Video Consultation
                        </button>
                    </div>
                </div>

                <div className="page-body">
                    {error && <div className="alert alert-critical">{error}</div>}
                    {overrideSuccess && <div className="alert alert-success">{overrideSuccess}</div>}

                    {/* Patient header */}
                    <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>
                                {u.firstName?.[0]}{u.lastName?.[0]}
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{u.firstName} {u.lastName}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{u.email} · {u.phone || 'No phone'}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                                    {patient.bloodType && <span>🩸 {patient.bloodType} · </span>}
                                    {patient.dateOfBirth && <span>Born {new Date(patient.dateOfBirth).toLocaleDateString()}</span>}
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <RiskBadge priority={triage?.finalPriority || patient.triageStatus} size="lg" />
                            {triage?.finalScore !== undefined && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Decision Score</span>
                                        <span style={{ color: scoreColor(triage.finalScore), fontWeight: 700 }}>{triage.finalScore}/100</span>
                                    </div>
                                    <div className="risk-bar-track" style={{ width: 160 }}>
                                        <div className="risk-bar-fill" style={{ width: `${triage.finalScore}%`, background: scoreColor(triage.finalScore) }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        {['overview', 'vitals', 'symptoms', 'triage', 'summary', 'override'].map(tab => (
                            <button key={tab} className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-outline'} btn-sm`}
                                onClick={() => setActiveTab(tab)} style={{ textTransform: 'capitalize' }}>
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                            <div className="glass-card">
                                <h3 style={{ marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase' }}>Medical History</h3>
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>ALLERGIES</div>
                                    {patient.allergies?.length ? patient.allergies.map((a, i) => <span key={i} style={{ display: 'inline-block', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '20px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', margin: '0.2rem' }}>{a}</span>) : <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>None on record</span>}
                                </div>
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>CONDITIONS</div>
                                    {patient.conditions?.length ? patient.conditions.map((c, i) => <span key={i} style={{ display: 'inline-block', background: 'rgba(167,139,250,0.1)', color: 'var(--primary-light)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: '20px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', margin: '0.2rem' }}>{c}</span>) : <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>None on record</span>}
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>MEDICATIONS</div>
                                    {patient.medications?.length ? patient.medications.map((m, i) => <span key={i} style={{ display: 'inline-block', background: 'rgba(34,197,94,0.08)', color: 'var(--stable)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '20px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', margin: '0.2rem' }}>{m}</span>) : <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>None on record</span>}
                                </div>
                            </div>

                            <div className="glass-card">
                                <h3 style={{ marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase' }}>Emergency Contact</h3>
                                {patient.emergencyContact?.name ? (
                                    <div>
                                        <div style={{ fontWeight: 700 }}>{patient.emergencyContact.name}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{patient.emergencyContact.relationship}</div>
                                        <div style={{ color: 'var(--primary-light)', fontSize: '0.85rem', marginTop: '0.3rem' }}>{patient.emergencyContact.phone}</div>
                                    </div>
                                ) : <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Not provided</span>}
                            </div>
                        </div>
                    )}

                    {/* VITALS */}
                    {activeTab === 'vitals' && (
                        <div className="glass-card">
                            <h3 style={{ marginBottom: '1rem', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Current Vitals</h3>
                            {Object.keys(v).length === 0 ? (
                                <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '2rem' }}>No vitals recorded yet.</div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                                    {[
                                        { label: 'Heart Rate', key: 'heartRate', unit: 'bpm', icon: '❤️', normal: [60, 100] },
                                        { label: 'SpO₂', key: 'oxygenSaturation', unit: '%', icon: '🫁', normal: [95, 100] },
                                        { label: 'BP Systolic', key: 'bloodPressureSystolic', unit: 'mmHg', icon: '💉', normal: [90, 140] },
                                        { label: 'BP Diastolic', key: 'bloodPressureDiastolic', unit: 'mmHg', icon: '💉', normal: [60, 90] },
                                        { label: 'Temperature', key: 'temperature', unit: '°C', icon: '🌡️', normal: [36, 37.5] },
                                        { label: 'Respiratory Rate', key: 'respiratoryRate', unit: 'br/min', icon: '🌬️', normal: [12, 20] },
                                        { label: 'Blood Glucose', key: 'bloodGlucose', unit: 'mg/dL', icon: '🩸', normal: [70, 140] },
                                        { label: 'Weight', key: 'weight', unit: 'kg', icon: '⚖️', normal: [40, 150] },
                                    ].filter(item => v[item.key] !== undefined).map(({ label, key, unit, icon, normal }) => {
                                        const val = v[key];
                                        const inRange = val >= normal[0] && val <= normal[1];
                                        return (
                                            <div key={key} style={{ background: inRange ? 'rgba(34,197,94,0.06)' : 'rgba(249,115,22,0.08)', border: `1px solid ${inRange ? 'rgba(34,197,94,0.2)' : 'rgba(249,115,22,0.3)'}`, borderRadius: '10px', padding: '0.85rem' }}>
                                                <div style={{ fontSize: '1.2rem', marginBottom: '0.3rem' }}>{icon}</div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '0.15rem' }}>{label}</div>
                                                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: inRange ? 'var(--stable)' : 'var(--high)' }}>{val} <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>{unit}</span></div>
                                                <div style={{ fontSize: '0.68rem', marginTop: '0.2rem', color: inRange ? 'var(--stable)' : 'var(--high)' }}>{inRange ? '✓ Normal' : '⚠ Out of range'}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <div className="disclaimer">
                                <strong>⚕️ Note:</strong> Vital ranges shown are general reference ranges. Clinical interpretation must account for the patient's individual history and context.
                            </div>
                        </div>
                    )}

                    {/* SYMPTOMS */}
                    {activeTab === 'symptoms' && (
                        <div className="glass-card">
                            <h3 style={{ marginBottom: '1rem', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Recent Symptom Submissions</h3>
                            {!patient.recentSymptoms?.length ? (
                                <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '2rem' }}>No symptom records.</div>
                            ) : patient.recentSymptoms.map((s) => (
                                <div key={s._id} style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(s.createdAt).toLocaleString()}</div>
                                        <span className={`badge badge-${s.status === 'reviewed' ? 'stable' : 'moderate'}`}>{s.status}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {s.symptoms?.map((sym, i) => (
                                            <span key={i} style={{ fontSize: '0.8rem', background: sym.severity >= 7 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.06)', border: `1px solid ${sym.severity >= 7 ? 'rgba(239,68,68,0.3)' : 'var(--border-light)'}`, borderRadius: '6px', padding: '0.2rem 0.6rem', color: sym.severity >= 7 ? '#fca5a5' : 'var(--text-muted)' }}>
                                                {sym.name} ({sym.severity}/10)
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* TRIAGE */}
                    {activeTab === 'triage' && triage && (
                        <div className="glass-card" style={{ padding: '0', background: 'transparent', border: 'none', boxShadow: 'none' }}>
                            <RiskScorecard triage={triage} />

                            <div className="disclaimer">
                                <strong>⚕️ Decision Support Only:</strong> Triage scores are generated by rule-based and ML models. All clinical decisions and treatment must be determined by a licensed medical professional.
                            </div>
                        </div>
                    )}

                    {/* AI SUMMARY */}
                    {activeTab === 'summary' && (
                        <div className="glass-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ fontSize: '1.5rem' }}>🤖</div>
                                <div>
                                    <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>AI-Generated Clinical Summary</h3>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Generated by LLM — Doctor review required</div>
                                </div>
                            </div>
                            {summaryLoading ? (
                                <div className="spinner" />
                            ) : summary ? (
                                <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '10px', padding: '1.25rem', lineHeight: 1.7, fontSize: '0.92rem', color: 'var(--text-muted)' }}>
                                    {summary}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    <button className="btn btn-primary" onClick={loadSummary}>Generate Clinical Summary</button>
                                </div>
                            )}
                            <div className="disclaimer" style={{ marginTop: '1rem' }}>
                                <strong>⚕️ AI Output — Not a Diagnosis:</strong> This summary was generated by an LLM from structured patient data. It is a decision-support aid only. The attending doctor must independently assess and decide on treatment.
                            </div>
                        </div>
                    )}

                    {/* OVERRIDE */}
                    {activeTab === 'override' && (
                        <div className="glass-card">
                            <h3 style={{ marginBottom: '0.5rem' }}>Override Triage Level</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                                As the attending doctor, you can override the system's triage assessment. Your decision will be logged for audit.
                            </p>

                            <form onSubmit={handleOverride}>
                                <div className="form-group">
                                    <label className="form-label">New Priority Level</label>
                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        {['critical', 'high', 'moderate', 'stable'].map(p => (
                                            <button key={p} type="button"
                                                className={`btn btn-sm ${override.priority === p ? 'btn-primary' : 'btn-outline'}`}
                                                onClick={() => setOverride({ ...override, priority: p })}
                                                style={{ borderRadius: '8px', textTransform: 'capitalize' }}>
                                                <RiskBadge priority={p} showDot={false} /> {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Override Reason <span style={{ color: 'var(--critical)' }}>*</span></label>
                                    <select className="form-input" value={override.reason} onChange={(e) => setOverride({ ...override, reason: e.target.value })} required>
                                        <option value="">Select reason…</option>
                                        <option value="clinical_assessment">Clinical assessment overrides rule engine</option>
                                        <option value="patient_context">Patient context not captured in data</option>
                                        <option value="medication_interaction">Medication/treatment interaction</option>
                                        <option value="false_positive">Rule engine false positive</option>
                                        <option value="false_negative">Rule engine false negative</option>
                                        <option value="other">Other (specify in notes)</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Clinical Notes</label>
                                    <textarea className="form-input" rows={3} placeholder="Document your clinical reasoning…" value={override.notes} onChange={(e) => setOverride({ ...override, notes: e.target.value })} style={{ resize: 'vertical' }} />
                                </div>

                                <div className="disclaimer" style={{ marginBottom: '1rem' }}>
                                    <strong>⚕️ Doctor Authority:</strong> This override applies your clinical judgment over the system's assessment. Your name and reasoning will be logged in the audit trail.
                                </div>

                                <button type="submit" className="btn btn-primary" disabled={overriding || !override.priority}>
                                    {overriding ? 'Applying Override…' : '✅ Apply Doctor Override'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
