import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { patientService } from '../../api/services';
import { 
    Activity, 
    Thermometer, 
    Heart, 
    Calendar,
    Save,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowLeft
} from 'lucide-react';
import './PatientDashboard.css';

export default function MonitorSymptoms() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    
    // Form state
    const [temperature, setTemperature] = useState('');
    const [painLevel, setPainLevel] = useState(5);
    const [feeling, setFeeling] = useState('same');
    const [notes, setNotes] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await patientService.getTriageHistory();
            if (res.data?.success) {
                // Just use triage history for now as a makeshift log
                setHistory(res.data.data.slice(0, 5));
            }
        } catch (err) {
            console.error('Failed to load history', err);
        }
    };

    const handleSaveLog = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Re-use symptom submission as a log entry
            await patientService.submitSymptoms({
                symptoms: [{
                    name: 'Daily Check-in',
                    severity: painLevel,
                    duration: 'Today',
                    frequency: 'constant',
                    notes: `Feeling: ${feeling}. ${notes}`
                }],
                currentVitals: temperature ? { temperature: parseFloat(temperature) } : undefined
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            fetchHistory();
            setTemperature('');
            setPainLevel(5);
            setFeeling('same');
            setNotes('');
        } catch (err) {
            console.error('Failed to save log', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pd-wrapper">
            <Sidebar />
            <main className="pd-content" style={{ background: '#f8fafc' }}>
                <header className="pd-page-header" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button 
                            onClick={() => navigate('/patient/suggestions')}
                            style={{ background: 'white', border: '1px solid #e2e8f0', p: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ArrowLeft size={20} color="#64748b" />
                        </button>
                        <div>
                            <h1 className="pd-page-title">Monitor Symptoms</h1>
                            <p className="pd-page-desc">Track your daily progress while on Home Care.</p>
                        </div>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                    
                    {/* Log Form */}
                    <div className="pd-section-card" style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ background: '#ecfdf5', color: '#10b981', padding: '0.5rem', borderRadius: '8px' }}>
                                <Activity size={20} />
                            </div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Daily Check-in</h2>
                        </div>
                        
                        <form onSubmit={handleSaveLog}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                                    How are you feeling today?
                                </label>
                                <select 
                                    value={feeling} 
                                    onChange={(e) => setFeeling(e.target.value)}
                                    style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.95rem' }}
                                >
                                    <option value="better">Better than yesterday</option>
                                    <option value="same">About the same</option>
                                    <option value="worse">Worse than yesterday</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                                    <Thermometer size={16} /> Temperature (°F)
                                </label>
                                <input 
                                    type="number" step="0.1" 
                                    placeholder="e.g. 98.6"
                                    value={temperature}
                                    onChange={(e) => setTemperature(e.target.value)}
                                    style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.95rem' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Heart size={16} /> Pain Level ({painLevel}/10)</div>
                                </label>
                                <input 
                                    type="range" min="1" max="10" 
                                    value={painLevel} 
                                    onChange={(e) => setPainLevel(e.target.value)}
                                    style={{ width: '100%', cursor: 'pointer' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                    <span>Mild</span>
                                    <span>Severe</span>
                                </div>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                                    Additional Notes (optional)
                                </label>
                                <textarea 
                                    rows="3" 
                                    placeholder="Any new symptoms or changes..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.95rem', resize: 'vertical' }}
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                style={{ 
                                    width: '100%', padding: '1rem', background: '#10b981', color: 'white', 
                                    border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '1rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: loading ? 0.7 : 1 
                                }}>
                                {saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
                                {loading ? 'Saving...' : saved ? 'Saved Successfully!' : 'Log Check-in'}
                            </button>
                            
                            {feeling === 'worse' && (
                                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', padding: '1rem', background: '#fffbeb', color: '#d97706', borderRadius: '8px', fontSize: '0.85rem' }}>
                                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                                    <span>If you're feeling worse, consider scheduling a <strong>Clinic Visit</strong> or consulting your doctor.</span>
                                </div>
                            )}
                        </form>
                    </div>
                    
                    {/* Log History */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ background: '#f1f5f9', color: '#475569', padding: '0.5rem', borderRadius: '8px' }}>
                                <Calendar size={20} />
                            </div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Recent Logs</h2>
                        </div>
                        
                        {history.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {history.map((entry, idx) => (
                                    <div key={idx} style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Clock size={14} /> {new Date(entry.createdAt).toLocaleDateString()} at {new Date(entry.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px' }}>
                                                Score: {entry.finalScore || 'N/A'}
                                            </div>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.5 }}>
                                            {entry.symptoms?.[0]?.notes || `${entry.symptoms?.[0]?.name || 'Symptom log'} via Engine.`}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ background: 'white', borderRadius: '12px', padding: '3rem 2rem', border: '1px dashed #e2e8f0', textAlign: 'center' }}>
                                <Activity size={32} color="#cbd5e1" style={{ marginBottom: '1rem', display: 'inline-block' }} />
                                <h3 style={{ fontSize: '1rem', color: '#475569', margin: '0 0 0.5rem 0' }}>No logs yet</h3>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>Your daily symptom logs will appear here.</p>
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
