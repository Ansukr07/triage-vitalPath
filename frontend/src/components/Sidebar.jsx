import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Stethoscope,
    FileText,
    Sparkles,
    Bell,
    User,
    Hospital,
    AlertCircle,
    LogOut,
    Heart,
    MessageSquare,
    Calendar,
    ClipboardList,
    ShieldCheck,
    Map
} from 'lucide-react';
import T from './T';

const PATIENT_LINKS = [
    { icon: LayoutDashboard, label: 'Overview', path: '/patient', id: 'overview' },
    { icon: Stethoscope, label: 'Symptoms', path: '/patient/symptoms', id: 'symptoms' },
    { icon: FileText, label: 'Reports', path: '/patient/reports', id: 'reports' },
    { icon: Sparkles, label: 'Care Engine', path: '/patient/suggestions', id: 'suggestions' },
    { icon: MessageSquare, label: 'Assistant', path: '/patient/assistant', id: 'assistant' },
    { icon: Calendar, label: 'Consultations', path: '/patient/consultations', id: 'consultations' },
    { icon: ClipboardList, label: 'Health Record', path: '/patient/ehr', id: 'ehr' },
    { icon: User, label: 'Profile', path: '/patient/profile', id: 'profile' },
];

const DOCTOR_LINKS = [
    { icon: Hospital, label: 'Dashboard', path: '/doctor', id: 'dashboard' },
    { icon: AlertCircle, label: 'Escalations', path: '/doctor/escalations', id: 'escalations' },
    { icon: Map, label: 'Outbreak Radar', path: '/doctor/outbreaks', id: 'outbreaks' },
    { icon: ShieldCheck, label: 'Audit Logs', path: '/admin/audit', id: 'audit' },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const links = user?.role === 'doctor' || user?.role === 'admin' ? DOCTOR_LINKS : PATIENT_LINKS;
    const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` : '?';

    // Check if we are using the new Patient Dashboard redesign
    const isPatient = user?.role === 'patient';

    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <aside
            className={`${isPatient ? "pd-sidebar" : "sidebar"} ${isExpanded ? 'expanded' : ''}`}
            onMouseEnter={() => isPatient && setIsExpanded(true)}
            onMouseLeave={() => isPatient && setIsExpanded(false)}
        >
            {isPatient ? (
                <>
                    <nav className="pd-nav-list" style={{ marginTop: '1rem' }}>
                        {links.map((link) => {
                            const Icon = link.icon;
                            return (
                                <div
                                    key={link.path}
                                    className={`pd-nav-link ${location.pathname === link.path ? 'active' : ''}`}
                                    onClick={() => navigate(link.path)}
                                    title={!isExpanded ? link.label : ''}
                                >
                                    <Icon size={20} className="pd-icon-svg" />
                                    <span className="pd-nav-label"><T>{link.label}</T></span>
                                </div>
                            );
                        })}
                    </nav>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: 'auto', width: '100%' }}>
                        <div className="pd-nav-link" title={!isExpanded ? "Logout" : ""} onClick={() => { logout(); navigate('/login'); }} style={{ color: '#ef4444' }}>
                            <LogOut size={20} className="pd-icon-svg" />
                            <span className="pd-nav-label"><T>Logout</T></span>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="sidebar-logo">
                        <Heart size={24} color="var(--pd-accent)" style={{ marginBottom: '0.5rem' }} />
                        VitalPath
                        <span>Healthcare Decision Support</span>
                    </div>

                    <nav className="sidebar-nav">
                        {links.map((link) => {
                            const Icon = link.icon;
                            return (
                                <button
                                    key={link.path}
                                    className={`nav-item ${location.pathname === link.path ? 'active' : ''}`}
                                    onClick={() => navigate(link.path)}
                                >
                                    <span className="icon">
                                        <Icon size={18} />
                                    </span>
                                    {link.label}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="sidebar-footer">
                        <div className="user-chip">
                            <div className="user-avatar">{initials}</div>
                            <div>
                                <div className="user-name">{user?.firstName} {user?.lastName}</div>
                                <div className="user-role">{user?.role}</div>
                            </div>
                        </div>
                        <button
                            className="btn btn-outline btn-sm"
                            style={{ width: '100%', marginTop: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            onClick={() => { logout(); navigate('/login'); }}
                        >
                            <LogOut size={14} /> Sign out
                        </button>
                    </div>
                </>
            )}
        </aside>
    );
}
