import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { patientService } from '../../api/services';
import {
    Activity,
    Home,
    Hospital,
    Siren,
    CheckCircle2,
    Clock,
    AlertTriangle,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import './PatientDashboard.css';

const RECOMMENDATION_LEVELS = [
    {
        id: 'Home Care',
        title: 'Home Care',
        icon: Home,
        color: '#10b981', // Emerald
        bg: '#ecfdf5',
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        description: 'Minor symptoms. Basic guidance and monitoring recommendations.',
        action: 'Monitor Symptoms',
        steps: [
            'Rest and stay hydrated.',
            'Use over-the-counter medication if appropriate.',
            'Monitor symptoms for 24-48 hours.',
            'Log any changes in your condition using the dashboard.'
        ]
    },
    {
        id: 'Clinic Visit',
        title: 'Clinic Visit',
        icon: Hospital,
        color: '#f59e0b', // Amber
        bg: '#fffbeb',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        description: 'Moderate symptoms requiring doctor consultation.',
        action: 'Schedule Appointment',
        steps: [
            'Schedule a consultation with your primary care physician.',
            'Avoid strenuous activities until evaluated.',
            'Prepare a list of your current symptoms and their duration.',
            'If symptoms worsen suddenly, escalate to emergency care.'
        ]
    },
    {
        id: 'Emergency Room',
        title: 'Emergency Room',
        icon: Siren,
        color: '#ef4444', // Red
        bg: '#fef2f2',
        gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        description: 'High-risk or emergency symptoms requiring immediate medical attention.',
        action: 'Seek Immediate Care',
        steps: [
            'Call emergency services or proceed to the nearest ER immediately.',
            'Do not attempt to drive yourself if experiencing severe chest pain or dizziness.',
            'Keep your ID and medical records accessible.',
            'Notify your emergency contact.'
        ]
    }
];

export default function CareRecommendation() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [latestPriority, setLatestPriority] = useState('Home Care'); // default
    const [score, setScore] = useState(0);
    const [showEmergency, setShowEmergency] = useState(false);

    const handleEmergencyAlert = async () => {
        try {
            // Trigger actual telegram alert via backend
            const res = await patientService.sendEmergencyAlert();
            if (res.data.success) {
                alert('Telegram alert successfully sent to emergency contacts!');
            } else {
                alert('Warning: Config or network issue sending alert.');
            }
            // Show the numbers globally
            setShowEmergency(true);
        } catch (err) {
            console.error('Failed to send telegram emergency alert:', err);
            setShowEmergency(true);
        }
    };

    useEffect(() => {
        const fetchTriage = async () => {
            try {
                const res = await patientService.getTriageHistory();
                if (res.data.success && res.data.data.length > 0) {
                    const latest = res.data.data[0];
                    setScore(latest.finalScore || 0);
                    
                    if (latest.finalPriority === 'critical') setLatestPriority('Emergency Room');
                    else if (latest.finalPriority === 'high' || latest.finalPriority === 'moderate') setLatestPriority('Clinic Visit');
                    else setLatestPriority('Home Care');
                }
            } catch (err) {
                console.error('Failed to load triage history:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTriage();
    }, []);

    if (loading) return (
        <div className="pd-wrapper">
            <Sidebar />
            <div className="pd-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" />
            </div>
        </div>
    );

    const activeLevelData = RECOMMENDATION_LEVELS.find(l => l.id === latestPriority);

    return (
        <div className="pd-wrapper">
            <Sidebar />
            <main className="pd-content" style={{ background: '#f8fafc' }}>
                
                {/* ── Dynamic Header ── */}
                <header style={{ 
                    background: activeLevelData.gradient, 
                    margin: '-2rem -2rem 2rem -2rem', 
                    padding: '3rem 2rem 4rem 2rem',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
                            <Sparkles size={14} /> AI Triage Engine
                        </div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                            {activeLevelData.title} Recommended
                        </h1>
                        <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6 }}>
                            Based on your latest assessment (Risk Score: {score}/100), our clinical AI recommends <strong>{activeLevelData.title.toLowerCase()}</strong>. Please follow the guidance below.
                        </p>
                    </div>
                    
                    {/* Background Icon Watermark */}
                    <activeLevelData.icon size={200} style={{ position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)', opacity: 0.1 }} />
                </header>

                <div style={{ maxWidth: '1200px', margin: '0 auto', marginTop: '-3rem', position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        
                        {RECOMMENDATION_LEVELS.map((level) => {
                            const isActive = level.id === latestPriority;
                            const Icon = level.icon;
                            
                            return (
                                <div key={level.id} style={{
                                    background: 'white',
                                    borderRadius: '16px',
                                    padding: '2rem',
                                    border: isActive ? `2px solid ${level.color}` : '1px solid #e2e8f0',
                                    boxShadow: isActive ? `0 10px 30px -10px ${level.color}40` : '0 4px 6px -1px rgba(0,0,0,0.05)',
                                    transform: isActive ? 'scale(1.02)' : 'scale(1)',
                                    opacity: isActive ? 1 : 0.6,
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <div style={{ 
                                        width: '50px', height: '50px', 
                                        background: level.bg, color: level.color, 
                                        borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: '1.5rem'
                                    }}>
                                        <Icon size={24} />
                                    </div>
                                    
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                                        {level.title}
                                    </h3>
                                    <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5, marginBottom: '2rem', flex: 1 }}>
                                        {level.description}
                                    </p>
                                    
                                    <div style={{ marginBottom: '2rem' }}>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>
                                            Action Steps
                                        </h4>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {level.steps.map((step, idx) => (
                                                <li key={idx} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.9rem', color: '#334155', alignItems: 'flex-start' }}>
                                                    {isActive ? (
                                                        <CheckCircle2 size={16} color={level.color} style={{ flexShrink: 0, marginTop: '2px' }} />
                                                    ) : (
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cbd5e1', marginTop: '7px', flexShrink: 0 }} />
                                                    )}
                                                    {step}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    
                                    {isActive && level.id === 'Emergency Room' && showEmergency ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                                            <a href="tel:911" style={{ width: '100%', padding: '0.85rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                                                <Activity size={16} /> Call 911 (US/Canada)
                                            </a>
                                            <a href="tel:112" style={{ width: '100%', padding: '0.85rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                                                <Activity size={16} /> Call 112 (Europe/Global)
                                            </a>
                                            <a href="tel:108" style={{ width: '100%', padding: '0.85rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                                                <Activity size={16} /> Call 108 (India)
                                            </a>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => {
                                                if (isActive && level.id === 'Clinic Visit') {
                                                    navigate('/patient/appointments');
                                                } else if (isActive && level.id === 'Home Care') {
                                                    navigate('/patient/monitor');
                                                } else if (isActive && level.id === 'Emergency Room') {
                                                    handleEmergencyAlert();
                                                }
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '0.85rem',
                                                background: isActive ? level.color : '#f1f5f9',
                                                color: isActive ? 'white' : '#64748b',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem',
                                                cursor: isActive ? 'pointer' : 'default',
                                                pointerEvents: isActive ? 'auto' : 'none'
                                            }}>
                                            {isActive ? <Activity size={16} /> : <Clock size={16} />}
                                            {isActive ? level.action : 'Not Required'}
                                        </button>
                                    )}
                                    
                                    {isActive && (
                                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: level.bg, color: level.color, padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: level.color, animation: 'pulse 2s infinite' }} />
                                            ACTIVE
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        
                    </div>
                </div>
            </main>
        </div>
    );
}
