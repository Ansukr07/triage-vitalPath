import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { patientService } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import './PatientDashboard.css';

export default function PatientProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState({});
    const [vitals, setVitals] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        patientService.getProfile().then(res => {
            const p = res.data.data;
            setProfile(p);
            setForm({
                dateOfBirth: p.dateOfBirth?.split('T')[0] || '',
                gender: p.gender || '',
                bloodType: p.bloodType || '',
                allergies: (p.allergies || []).join(', '),
                conditions: (p.conditions || []).join(', '),
                medications: (p.medications || []).join(', '),
                emergencyName: p.emergencyContact?.name || '',
                emergencyPhone: p.emergencyContact?.phone || '',
                emergencyRelationship: p.emergencyContact?.relationship || '',
                city: p.address?.city || '',
                state: p.address?.state || '',
            });
            if (p.latestVitals) {
                const { bloodPressureSystolic, bloodPressureDiastolic, heartRate, temperature, oxygenSaturation, respiratoryRate, bloodGlucose, weight, height } = p.latestVitals;
                setVitals({ bloodPressureSystolic: bloodPressureSystolic || '', bloodPressureDiastolic: bloodPressureDiastolic || '', heartRate: heartRate || '', temperature: temperature || '', oxygenSaturation: oxygenSaturation || '', respiratoryRate: respiratoryRate || '', bloodGlucose: bloodGlucose || '', weight: weight || '', height: height || '' });
            }
        }).catch(() => setError('Could not load profile.'))
            .finally(() => setLoading(false));
    }, []);

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
    const setV = (k) => (e) => setVitals({ ...vitals, [k]: e.target.value });

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true); setError(''); setSuccess('');
        try {
            const payload = {
                dateOfBirth: form.dateOfBirth || undefined,
                gender: form.gender || undefined,
                bloodType: form.bloodType || undefined,
                allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
                conditions: form.conditions ? form.conditions.split(',').map(s => s.trim()).filter(Boolean) : [],
                medications: form.medications ? form.medications.split(',').map(s => s.trim()).filter(Boolean) : [],
                emergencyContact: { name: form.emergencyName, phone: form.emergencyPhone, relationship: form.emergencyRelationship },
                address: { city: form.city, state: form.state },
            };
            const v = {};
            Object.entries(vitals).forEach(([k, val]) => { if (val) v[k] = parseFloat(val); });
            if (Object.keys(v).length > 0) payload.latestVitals = v;

            await patientService.updateProfile(payload);
            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) { setError(err.response?.data?.message || 'Update failed.'); }
        finally { setSaving(false); }
    };

    if (loading) return (
        <div className="pd-wrapper">
            <Sidebar />
            <main className="pd-content">
                <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem' }}><div className="spinner" /></div>
            </main>
        </div>
    );

    return (
        <div className="pd-wrapper">
            <Sidebar />
            <main className="pd-content">
                <header className="pd-page-header">
                    <h1 className="pd-page-title">Personal Identity</h1>
                    <p className="pd-page-desc">Manage your health records, personal details, and emergency contact information.</p>
                </header>

                <div> {/* Removed maxWidth: '900px' */}
                    {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem 1.5rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid #fecaca', fontWeight: 600 }}>⚠️ {error}</div>}
                    {success && <div style={{ background: '#dcfce7', color: '#166534', padding: '1rem 1.5rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid #bbf7d0', fontWeight: 600 }}>✅ {success}</div>}

                    {/* Identity Banner */}
                    <div className="pd-section-card" style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '2.5rem', background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: '#fff', border: 'none' }}>
                        <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800, border: '4px solid rgba(255,255,255,0.2)' }}>
                            {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '1.75rem', marginBottom: '0.25rem' }}>{user.firstName} {user.lastName}</div>
                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>{user.email}</div>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.45rem 1rem', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Patient Member</span>
                                <span style={{ background: 'rgba(59,130,246,0.3)', color: '#93c5fd', padding: '0.45rem 1rem', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Verified Profile</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSave}>
                        {/* Basic Info */}
                        <div style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Basic Health Info</h2>
                            <div className="pd-section-card">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="pd-app-role" style={{ marginBottom: '0.5rem', display: 'block' }}>Date of Birth</label>
                                        <input className="pd-urgent-btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', width: '100%', textAlign: 'left', borderRadius: '12px' }} type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
                                    </div>
                                    <div className="form-group">
                                        <label className="pd-app-role" style={{ marginBottom: '0.5rem', display: 'block' }}>Gender Identity</label>
                                        <select className="pd-urgent-btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', width: '100%', borderRadius: '12px', padding: '0 1rem' }} value={form.gender} onChange={set('gender')}>
                                            <option value="">Select</option>
                                            {['male', 'female', 'other', 'prefer_not_to_say'].map(g => <option key={g} value={g}>{g.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="pd-app-role" style={{ marginBottom: '0.5rem', display: 'block' }}>Blood Group</label>
                                        <select className="pd-urgent-btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', width: '100%', borderRadius: '12px', padding: '0 1rem' }} value={form.bloodType} onChange={set('bloodType')}>
                                            <option value="">Unknown</option>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="pd-app-role" style={{ marginBottom: '0.5rem', display: 'block' }}>Current City</label>
                                        <input className="pd-urgent-btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', width: '100%', textAlign: 'left', borderRadius: '12px' }} placeholder="e.g. Bangalore" value={form.city} onChange={set('city')} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="pd-app-role" style={{ marginBottom: '0.5rem', display: 'block' }}>Known Allergies</label>
                                        <input className="pd-urgent-btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', width: '100%', textAlign: 'left', borderRadius: '12px' }} placeholder="Penicillin, Peanuts, etc. (comma separated)" value={form.allergies} onChange={set('allergies')} />
                                    </div>
                                    <div className="form-group">
                                        <label className="pd-app-role" style={{ marginBottom: '0.5rem', display: 'block' }}>Chronic Conditions</label>
                                        <input className="pd-urgent-btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', width: '100%', textAlign: 'left', borderRadius: '12px' }} placeholder="Hypertension, Diabetes, etc. (comma separated)" value={form.conditions} onChange={set('conditions')} />
                                    </div>
                                    <div className="form-group">
                                        <label className="pd-app-role" style={{ marginBottom: '0.5rem', display: 'block' }}>Active Medications</label>
                                        <input className="pd-urgent-btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', width: '100%', textAlign: 'left', borderRadius: '12px' }} placeholder="Metformin, Atorvastatin, etc. (comma separated)" value={form.medications} onChange={set('medications')} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Vitals */}
                        <div style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Update Latest Vitals</h2>
                            <div className="pd-section-card">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                                    {[
                                        { k: 'bloodPressureSystolic', label: 'BP Systolic', unit: 'mmHg' },
                                        { k: 'bloodPressureDiastolic', label: 'BP Diastolic', unit: 'mmHg' },
                                        { k: 'heartRate', label: 'Heart Rate', unit: 'bpm' },
                                        { k: 'temperature', label: 'Body Temp', unit: '°C' },
                                        { k: 'oxygenSaturation', label: 'SpO₂', unit: '%' },
                                        { k: 'weight', label: 'Weight', unit: 'kg' },
                                        { k: 'height', label: 'Height', unit: 'cm' },
                                    ].map(({ k, label, unit }) => (
                                        <div key={k} className="form-group">
                                            <label className="pd-app-role" style={{ marginBottom: '0.5rem', display: 'block' }}>{label} ({unit})</label>
                                            <input className="pd-urgent-btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', width: '100%', textAlign: 'left', borderRadius: '12px' }} type="number" placeholder="--" value={vitals[k]} onChange={setV(k)} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Emergency */}
                        <div style={{ marginBottom: '4rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Emergency Contact</h2>
                            <div className="pd-section-card">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="pd-app-role" style={{ marginBottom: '0.5rem', display: 'block' }}>Full Name</label>
                                        <input className="pd-urgent-btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', width: '100%', textAlign: 'left', borderRadius: '12px' }} placeholder="Contact name" value={form.emergencyName} onChange={set('emergencyName')} />
                                    </div>
                                    <div className="form-group">
                                        <label className="pd-app-role" style={{ marginBottom: '0.5rem', display: 'block' }}>Relationship</label>
                                        <input className="pd-urgent-btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', width: '100%', textAlign: 'left', borderRadius: '12px' }} placeholder="e.g. Spouse / Parent" value={form.emergencyRelationship} onChange={set('emergencyRelationship')} />
                                    </div>
                                    <div className="form-group">
                                        <label className="pd-app-role" style={{ marginBottom: '0.5rem', display: 'block' }}>Mobile Number</label>
                                        <input className="pd-urgent-btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', width: '100%', textAlign: 'left', borderRadius: '12px' }} placeholder="+91 00000 00000" value={form.emergencyPhone} onChange={set('emergencyPhone')} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ position: 'sticky', bottom: '2rem', zIndex: 10, display: 'flex', justifyContent: 'center' }}>
                            <button type="submit" className="pd-urgent-btn" style={{ margin: 0, width: '300px', height: '60px', borderRadius: '30px', background: 'var(--pd-accent)', color: '#fff', fontSize: '1.1rem', fontWeight: 700, boxShadow: '0 10px 25px rgba(59,130,246,0.3)' }} disabled={saving}>
                                {saving ? 'Syncing...' : 'Update Health Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
