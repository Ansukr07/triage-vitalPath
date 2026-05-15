import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../api/services';
import {
    User,
    Mail,
    Phone,
    Lock,
    AlertCircle,
    Calendar,
    Dna,
    Medal,
    Stethoscope
} from 'lucide-react';
import './Auth.css';

export default function Register() {
    const [role, setRole] = useState('patient');
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        licenseNumber: '',
        dateOfBirth: '',
        gender: '',
        specialization: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
        setLoading(true);
        try {
            const res = await authService.register({ ...form, role });
            const { accessToken, refreshToken, user } = res.data.data;
            login(user, { accessToken, refreshToken });
            navigate(user.role === 'patient' ? '/patient' : '/doctor');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-container">
                {/* ── Left Side: Form ── */}
                <div className="auth-left-panel">


                    <h1 className="auth-main-title">Create Account</h1>
                    <p className="auth-main-desc">
                        Join VitalPath today. Professional decision support for modern clinical environments.
                    </p>

                    {/* Role selection row */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', maxWidth: '400px' }}>
                        <button
                            type="button"
                            className={`auth-tag ${role === 'patient' ? 'active' : ''}`}
                            style={{
                                flex: 1,
                                cursor: 'pointer',
                                border: '1px solid transparent',
                                borderColor: role === 'patient' ? '#d4f01e' : 'rgba(255,255,255,0.05)',
                                background: role === 'patient' ? 'rgba(212,240,30,0.1)' : '#111',
                                color: role === 'patient' ? '#d4f01e' : '#888',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem'
                            }}
                            onClick={() => setRole('patient')}
                        >
                            <User size={16} /> Patient
                        </button>
                        <button
                            type="button"
                            className={`auth-tag ${role === 'doctor' ? 'active' : ''}`}
                            style={{
                                flex: 1,
                                cursor: 'pointer',
                                border: '1px solid transparent',
                                borderColor: role === 'doctor' ? '#d4f01e' : 'rgba(255,255,255,0.05)',
                                background: role === 'doctor' ? 'rgba(212,240,30,0.1)' : '#111',
                                color: role === 'doctor' ? '#d4f01e' : '#888',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem'
                            }}
                            onClick={() => setRole('doctor')}
                        >
                            <Stethoscope size={16} /> Doctor
                        </button>
                    </div>

                    {error && (
                        <div className="alert alert-critical" style={{ marginBottom: '1.5rem', maxWidth: '400px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form" style={{ maxWidth: '440px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="auth-input-group">
                                <label className="auth-input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <User size={14} /> First Name
                                </label>
                                <input
                                    className="auth-field"
                                    placeholder="Jane"
                                    value={form.firstName}
                                    onChange={set('firstName')}
                                    required
                                />
                            </div>
                            <div className="auth-input-group">
                                <label className="auth-input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <User size={14} /> Last Name
                                </label>
                                <input
                                    className="auth-field"
                                    placeholder="Doe"
                                    value={form.lastName}
                                    onChange={set('lastName')}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: role === 'patient' ? '1fr 1fr' : '1fr', gap: role === 'patient' ? '1rem' : '0' }}>
                            <div className="auth-input-group">
                                <label className="auth-input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Mail size={14} /> Email
                                </label>
                                <input
                                    className="auth-field"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={form.email}
                                    onChange={set('email')}
                                    required
                                />
                            </div>
                            {role === 'patient' && (
                                <div className="auth-input-group">
                                    <label className="auth-input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Phone size={14} /> Phone
                                    </label>
                                    <input
                                        className="auth-field"
                                        placeholder="+91 98765 43210"
                                        value={form.phone}
                                        onChange={set('phone')}
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        {role === 'patient' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="auth-input-group">
                                    <label className="auth-input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Calendar size={14} /> Date of Birth
                                    </label>
                                    <input
                                        className="auth-field"
                                        type="date"
                                        value={form.dateOfBirth}
                                        onChange={set('dateOfBirth')}
                                        required
                                    />
                                </div>
                                <div className="auth-input-group">
                                    <label className="auth-input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Dna size={14} /> Gender
                                    </label>
                                    <select
                                        className="auth-field"
                                        value={form.gender}
                                        onChange={set('gender')}
                                        required
                                        style={{ appearance: 'none' }}
                                    >
                                        <option value="">Select</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {role === 'doctor' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="auth-input-group">
                                    <label className="auth-input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Medal size={14} /> Medical License
                                    </label>
                                    <input
                                        className="auth-field"
                                        placeholder="MH-2024-XXXXX"
                                        value={form.licenseNumber}
                                        onChange={set('licenseNumber')}
                                        required
                                    />
                                </div>
                                <div className="auth-input-group">
                                    <label className="auth-input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Stethoscope size={14} /> Specialization
                                    </label>
                                    <input
                                        className="auth-field"
                                        placeholder="Cardiology, etc."
                                        value={form.specialization}
                                        onChange={set('specialization')}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: role === 'doctor' ? '1fr 1fr' : '1fr', gap: role === 'doctor' ? '1rem' : '0' }}>
                            <div className="auth-input-group">
                                <label className="auth-input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Lock size={14} /> Password
                                </label>
                                <input
                                    className="auth-field"
                                    type="password"
                                    placeholder="Min 8 chars"
                                    value={form.password}
                                    onChange={set('password')}
                                    required
                                />
                            </div>
                            {role === 'doctor' && (
                                <div className="auth-input-group">
                                    <label className="auth-input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Phone size={14} /> Phone
                                    </label>
                                    <input
                                        className="auth-field"
                                        placeholder="+91 98765 43210"
                                        value={form.phone}
                                        onChange={set('phone')}
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : `Sign up as ${role === 'patient' ? 'Patient' : 'Doctor'}`}
                        </button>
                    </form>

                    <div className="auth-panel-footer">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </div>
                </div>

                {/* ── Right Side: Visual ── */}
                <div className="auth-right-panel">
                    <div className="auth-visual-card">
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="auth-video-bg"
                        >
                            <source src="/hand.mp4" type="video/mp4" />
                        </video>
                        <div className="auth-visual-bg"></div>

                        <div className="auth-tag-row">
                            <span className="auth-tag">Global Clinical Support</span>
                            <span className="auth-tag">HIPAA Compliant</span>
                        </div>

                        <div className="auth-testimonial-box">
                            <p className="auth-testimonial-text">
                                "The level of precision in VitalPath's triage engine is unmatched. It has become an essential part of my daily practice."
                            </p>
                            <span className="auth-author-name">Dr. Michael Chen</span>
                            <span className="auth-author-title">Senior Consultant, St. Jude Medical</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
