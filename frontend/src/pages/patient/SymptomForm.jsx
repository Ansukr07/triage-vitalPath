import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import RiskScorecard from '../../components/RiskScorecard';
import { patientService } from '../../api/services';
import {
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    MoveLeft,
    MoveRight,
    Plus,
    Trash2,
    ShieldAlert,
    Check,
    Send,
    Activity,
    Thermometer,
    Heart,
    Wind,
    Droplet,
    Stethoscope
} from 'lucide-react';
import './PatientDashboard.css';

const COMMON_SYMPTOMS = [
    'Headache', 'Chest Pain', 'Shortness of Breath', 'Fever', 'Fatigue',
    'Nausea', 'Dizziness', 'Abdominal Pain', 'Back Pain', 'Joint Pain',
    'Cough', 'Sore Throat', 'Vomiting', 'Diarrhea', 'Muscle Pain',
];

const STEPS = ['Symptoms', 'Vitals', 'Review'];

const emptySymptom = () => ({ name: '', severity: 5, duration: '1 day', frequency: 'occasional', bodyPart: '', notes: '' });

export default function SymptomForm() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [symptoms, setSymptoms] = useState([emptySymptom()]);
    const [vitals, setVitals] = useState({
        bloodPressureSystolic: '', bloodPressureDiastolic: '', heartRate: '',
        temperature: '', oxygenSaturation: '', respiratoryRate: '', bloodGlucose: '',
    });
    const [additionalNotes, setAdditionalNotes] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const addSymptom = () => setSymptoms([...symptoms, emptySymptom()]);
    const removeSymptom = (i) => setSymptoms(symptoms.filter((_, idx) => idx !== i));
    const updateSym = (i, field, val) => {
        const updated = [...symptoms];
        updated[i] = { ...updated[i], [field]: val };
        setSymptoms(updated);
    };
    const setV = (k) => (e) => setVitals({ ...vitals, [k]: e.target.value });

    const handleSubmit = async () => {
        if (symptoms.every((s) => !s.name.trim())) { setError('Please enter at least one symptom.'); return; }
        setError('');
        setLoading(true);
        try {
            const currentVitals = {};
            Object.entries(vitals).forEach(([k, v]) => { if (v) currentVitals[k] = parseFloat(v); });
            const res = await patientService.submitSymptoms({ symptoms, currentVitals: Object.keys(currentVitals).length > 0 ? currentVitals : undefined, additionalNotes });
            setResult(res.data.data.triage);
        } catch (err) {
            setError(err.response?.data?.message || 'Submission failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (result) {
        const sc = { critical: '#ef4444', high: '#f97316', moderate: '#eab308', stable: '#22c55e' };
        const ResultIcon = result.finalPriority === 'critical' ? AlertCircle : result.finalPriority === 'high' ? AlertTriangle : CheckCircle2;

        return (
            <div className="pd-wrapper">
                <Sidebar />
                <main className="pd-content">
                    <header className="pd-page-header">
                        <h1 className="pd-page-title">Triage Assessment Result</h1>
                        <p className="pd-page-desc">AI-generated decision support based on your reported symptoms.</p>
                    </header>

                    <div className="pd-section-card">
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <div style={{ color: sc[result.finalPriority], marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                                <ResultIcon size={80} strokeWidth={1.5} />
                            </div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Assessment Complete</h2>
                            <div style={{ display: 'inline-block', padding: '0.5rem 1.5rem', borderRadius: '30px', background: `${sc[result.finalPriority]}20`, color: sc[result.finalPriority], fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem', border: `1px solid ${sc[result.finalPriority]}40` }}>
                                {result.finalPriority.toUpperCase()} PRIORITY
                            </div>
                            <p style={{ color: 'var(--pd-text-muted)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto 2rem' }}>
                                {result.explanation?.message || "Our assessment engine has processed your data. Please review the detailed breakdown below."}
                            </p>
                        </div>

                        {/* Risk Scorecard UI */}
                        <div style={{ marginBottom: '2.5rem' }}>
                            <RiskScorecard triage={result} />
                        </div>

                        <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '16px', padding: '1.5rem', marginBottom: '2.5rem', fontSize: '0.9rem', color: '#92400e', lineHeight: 1.6, display: 'flex', gap: '1rem' }}>
                            <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                                <strong>Medical Disclaimer:</strong> This assessment is for informational support only and does not constitute a diagnosis. Always follow the guidance of your primary healthcare provider. In an emergency, contact local emergency services immediately.
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="pd-urgent-btn" style={{ flex: 1, margin: 0, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={() => navigate('/patient')}>
                                <MoveLeft size={18} /> Back to Dashboard
                            </button>
                            <button className="pd-urgent-btn" style={{ flex: 1, margin: 0, background: 'transparent', border: '1px solid #cbd5e1', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={() => { setResult(null); setStep(0); setSymptoms([emptySymptom()]); }}>
                                <Plus size={18} /> Report New Symptom
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="pd-wrapper">
            <Sidebar />
            <main className="pd-content">
                <header className="pd-page-header">
                    <h1 className="pd-page-title">Symptom Reporting</h1>
                    <p className="pd-page-desc">Tell us what you're feeling. Our engine uses your data to provide decision support to your medical team.</p>
                </header>

                <div className="pd-section-card">
                    {/* Step indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3rem' }}>
                        {STEPS.map((s, i) => (
                            <div key={s} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                                    <div style={{
                                        width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 800, fontSize: '1rem',
                                        background: i === step ? 'var(--pd-accent)' : i < step ? '#22c55e' : '#f1f5f9',
                                        color: i <= step ? '#fff' : '#94a3b8',
                                        boxShadow: i === step ? '0 8px 15px rgba(59, 130, 246, 0.3)' : 'none',
                                        transition: 'all 0.4s'
                                    }}>
                                        {i < step ? <Check size={20} strokeWidth={3} /> : i + 1}
                                    </div>
                                    <span style={{ position: 'absolute', top: 54, fontSize: '0.85rem', fontWeight: 700, color: i === step ? 'var(--pd-text)' : '#94a3b8', whiteSpace: 'nowrap' }}>{s}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div style={{ flex: 1, height: 4, background: i < step ? '#22c55e' : '#f1f5f9', margin: '0 1rem 0 2rem', borderRadius: 2 }} />
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '4rem' }}>
                        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem 1.5rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid #fecaca', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={20} /> {error}
                        </div>}

                        {/* STEP 0: Symptoms */}
                        {step === 0 && (
                            <div className="fade-in">
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Stethoscope size={24} color="var(--pd-accent)" /> Current Symptoms
                                </h2>

                                <div style={{ marginBottom: '2rem' }}>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--pd-text-muted)', marginBottom: '1rem', fontWeight: 600 }}>Quick Selection</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                        {COMMON_SYMPTOMS.map((s) => (
                                            <button key={s} type="button"
                                                className="pd-session-item"
                                                style={{ padding: '0.6rem 1.25rem', borderRadius: '30px', fontSize: '0.85rem', border: '1px solid #e2e8f0', background: symptoms.some(sym => sym.name === s) ? '#dbeafe' : '#fff', color: symptoms.some(sym => sym.name === s) ? '#1e40af' : '#64748b', boxShadow: 'none' }}
                                                onClick={() => { if (!symptoms.some(sym => sym.name === s)) { const last = symptoms[symptoms.length - 1]; last.name ? setSymptoms([...symptoms, { ...emptySymptom(), name: s }]) : updateSym(symptoms.length - 1, 'name', s); } }}
                                            >{s}</button>
                                        ))}
                                    </div>
                                </div>

                                {symptoms.map((sym, idx) => (
                                    <div key={idx} style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '20px', padding: '2rem', marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Symptom #{idx + 1}</h3>
                                            {symptoms.length > 1 && <button type="button" onClick={() => removeSymptom(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                <Trash2 size={20} />
                                            </button>}
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                                <label className="pd-app-role" style={{ marginBottom: '0.5rem', display: 'block' }}>Search or enter symptom</label>
                                                <input className="pd-urgent-btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', textAlign: 'left', width: '100%', borderRadius: '12px' }} placeholder="e.g. Sharp abdominal pain" value={sym.name} onChange={(e) => updateSym(idx, 'name', e.target.value)} />
                                            </div>

                                            <div className="form-group">
                                                <label className="pd-app-role" style={{ marginBottom: '0.5rem', display: 'block' }}>Severity: <strong style={{ color: sym.severity >= 8 ? '#ef4444' : '#1e293b' }}>{sym.severity}/10</strong></label>
                                                <input type="range" min="1" max="10" value={sym.severity} onChange={(e) => updateSym(idx, 'severity', parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--pd-accent)' }} />
                                            </div>

                                            <div className="form-group">
                                                <label className="pd-app-role" style={{ marginBottom: '0.5rem', display: 'block' }}>Duration</label>
                                                <select className="pd-urgent-btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', width: '100%', borderRadius: '12px', padding: '0 1rem' }} value={sym.duration} onChange={(e) => updateSym(idx, 'duration', e.target.value)}>
                                                    {['A few hours', '1 day', '2 days', '3 days', '1 week', '2 weeks', '1 month', 'More than 1 month'].map(d => <option key={d}>{d}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button type="button" style={{ background: 'transparent', border: '2px dashed #e2e8f0', color: '#64748b', padding: '1rem', width: '100%', borderRadius: '16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={addSymptom}>
                                    <Plus size={20} /> Add another symptom
                                </button>

                                <div style={{ marginTop: '2.5rem' }}>
                                    <button className="pd-urgent-btn" style={{ margin: 0, width: '200px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }} onClick={() => setStep(1)}>
                                        Next: Vitals <MoveRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 1: Vitals */}
                        {step === 1 && (
                            <div className="fade-in">
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Activity size={24} color="var(--pd-accent)" /> Current Vitals
                                </h2>
                                <p style={{ color: 'var(--pd-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Providing vitals improves the accuracy of our assessment engine.</p>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    {[
                                        { key: 'bloodPressureSystolic', label: 'Systolic BP', unit: 'mmHg', icon: <Droplet size={16} color="#94a3b8" /> },
                                        { key: 'bloodPressureDiastolic', label: 'Diastolic BP', unit: 'mmHg', icon: <Droplet size={16} color="#94a3b8" /> },
                                        { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', icon: <Heart size={16} color="#ef4444" /> },
                                        { key: 'temperature', label: 'Temperature', unit: '°C', icon: <Thermometer size={16} color="#f97316" /> },
                                        { key: 'oxygenSaturation', label: 'SpO₂', unit: '%', icon: <Wind size={16} color="#3b82f6" /> },
                                        { key: 'respiratoryRate', label: 'Resp. Rate', unit: '/min', icon: <Activity size={16} color="#10b981" /> },
                                    ].map(({ key, label, unit, icon }) => (
                                        <div key={key} className="form-group">
                                            <label className="pd-app-role" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                {icon} {label} ({unit})
                                            </label>
                                            <input className="pd-urgent-btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', textAlign: 'left', width: '100%', borderRadius: '12px' }} type="number" value={vitals[key]} onChange={setV(key)} />
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                                    <button className="pd-urgent-btn" style={{ margin: 0, width: '150px', background: 'transparent', border: '1px solid #e2e8f0', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={() => setStep(0)}>
                                        <MoveLeft size={18} /> Back
                                    </button>
                                    <button className="pd-urgent-btn" style={{ margin: 0, width: '200px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={() => setStep(2)}>
                                        Next: Review <MoveRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Review */}
                        {step === 2 && (
                            <div className="fade-in">
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckCircle2 size={24} color="var(--pd-accent)" /> Confirm & Submit
                                </h2>

                                <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '2rem' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Stethoscope size={16} /> Symptoms
                                    </h3>
                                    {symptoms.filter(s => s.name).map((s, idx) => (
                                        <div key={idx} style={{ padding: '0.75rem 0', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: 600 }}>{s.name}</span>
                                            <span style={{ color: '#64748b' }}>Severity {s.severity}/10 · {s.duration}</span>
                                        </div>
                                    ))}

                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginTop: '2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <ShieldAlert size={16} /> Disclaimers
                                    </h3>
                                    <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>By submitting this report, you acknowledge that this is a decision support tool and not a medical diagnosis. Your data will be transmitted securely to your registered care provider.</p>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                                    <button className="pd-urgent-btn" style={{ margin: 0, width: '150px', background: 'transparent', border: '1px solid #e2e8f0', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={() => setStep(1)}>
                                        <MoveLeft size={18} /> Back
                                    </button>
                                    <button className="pd-urgent-btn" style={{ margin: 0, flex: 1, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }} onClick={handleSubmit} disabled={loading}>
                                        {loading ? <><div className="rd-spin"><Activity size={18} /></div> Processing Assessment...</> : <><Send size={18} /> Submit Report</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
