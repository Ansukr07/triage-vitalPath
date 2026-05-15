import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../api/services';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import './Auth.css';

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await authService.login(form);
            const { accessToken, refreshToken, user } = res.data.data;
            login(user, { accessToken, refreshToken });
            navigate(user.role === 'patient' ? '/patient' : '/doctor');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-container">
                {/* ── Left Side: Form ── */}
                <div className="auth-left-panel">


                    <h1 className="auth-main-title">Welcome back!</h1>
                    <p className="auth-main-desc">
                        We empower doctors and patients to create, simulate, and manage clinical workflows visually.
                    </p>

                    {error && (
                        <div className="alert alert-critical" style={{ marginBottom: '1.5rem', maxWidth: '400px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="auth-input-group">
                            <label className="auth-input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Mail size={14} /> Email
                            </label>
                            <input
                                className="auth-field"
                                type="email"
                                placeholder="youremail@yourdomain.com"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="auth-input-group">
                            <label className="auth-input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Lock size={14} /> Password
                            </label>
                            <input
                                className="auth-field"
                                type="password"
                                placeholder="Enter your password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <div className="auth-divider-line"></div>
                        <span className="auth-divider-text">or</span>
                        <div className="auth-divider-line"></div>
                    </div>

                    <div className="auth-social-row">
                        <button className="auth-social-btn">
                            <svg className="auth-social-icon" viewBox="0 0 24 24">
                                <path fill="#EA4335" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09c1.97 3.92 6.02 6.62 10.71 6.62z" />
                                <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.99 11.99 0 0 0 0 10.76l3.98-3.09z" />
                                <path fill="#4285F4" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
                            </svg>
                        </button>
                        <button className="auth-social-btn">
                            <svg className="auth-social-icon" fill="#1877F2" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.248h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                        </button>
                        <button className="auth-social-btn">
                            <svg className="auth-social-icon" fill="#fff" viewBox="0 0 24 24">
                                <path d="M17.057 1.258a5.16 5.16 0 0 0-2.316.32 4.49 4.49 0 0 0-2.091 1.94 5.343 5.343 0 0 0-.25 4.3c.312 1.326.96 2.503 1.92 3.491 1.282 1.322 2.923 2.162 4.814 2.378 1.178.134 2.327-.042 3.376-.525a5.532 5.532 0 0 0 2.645-3.081 5.343 5.343 0 0 0-.212-4.148c-.686-1.748-2.126-3.21-3.957-4.116a6.83 6.83 0 0 0-3.93-.559M13.25 10.42c-2.365.173-4.482 1.054-6.19 2.583-1.848 1.652-2.924 3.86-3.203 6.273a9.8 9.8 0 0 0 .193 3.471h4.085c-.09-.597-.13-1.192-.119-1.782.046-2.61.91-4.88 2.611-6.726.853-.925 1.873-1.666 3.024-2.203.882-.411 1.829-.701 2.825-.862-.355-.262-.725-.487-1.115-.688a4.912 4.912 0 0 0-2.121-.067" />
                            </svg>
                        </button>
                    </div>

                    <div className="auth-panel-footer">
                        Don't have an account? <Link to="/register">Sign up</Link>
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
                            <span className="auth-tag">Platform for Healthcare</span>
                            <span className="auth-tag">Decision Support</span>
                        </div>

                        <div className="auth-testimonial-box">
                            <p className="auth-testimonial-text">
                                "VitalPath has completely changed how we handle patient triage. What used to take hours every week is now streamlined and clinician-verified in minutes."
                            </p>
                            <span className="auth-author-name">Dr. Sarah Jenkins</span>
                            <span className="auth-author-title">Chief of Staff, Metro General</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
