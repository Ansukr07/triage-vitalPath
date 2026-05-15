import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { patientService, reminderService } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import {
    Calendar,
    TestTubes,
    RefreshCw,
    Pill,
    Leaf,
    Bell,
    Plus,
    X,
    AlertCircle,
    Check,
    Trash2,
    MapPin,
    CalendarOff,
    CheckCircle2,
    Activity,
    FileText,
    Video
} from 'lucide-react';
import './PatientDashboard.css';

const TYPE_ICONS = {
    appointment: Calendar,
    test: TestTubes,
    medication: Pill,
    lifestyle: Leaf,
    follow_up: RefreshCw,
    other: Bell
};

export default function Consultations() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [medicationOptions, setMedicationOptions] = useState([]);
    const notificationSupported = typeof window !== 'undefined' && 'Notification' in window;
    const [notifPermission, setNotifPermission] = useState(notificationSupported ? window.Notification.permission : 'unsupported');
    const [form, setForm] = useState({
        title: '',
        description: '',
        type: 'appointment',
        scheduledAt: '',
        location: '',
        doctorName: '',
    });
    const [saving, setSaving] = useState(false);

    const fetchReminders = async () => {
        try {
            const res = await reminderService.list({ status: 'upcoming' });
            setReminders(res.data.data);
        } catch { setError('Unable to load consultations.'); }
        finally { setLoading(false); }
    };

    const loadMedications = async () => {
        try {
            const res = await patientService.getProfile();
            const meds = res.data.data?.medications || [];
            setMedicationOptions(meds);
        } catch {
            setMedicationOptions([]);
        }
    };

    const requestNotificationPermission = async () => {
        if (!notificationSupported) return;
        const permission = await window.Notification.requestPermission();
        setNotifPermission(permission);
    };

    useEffect(() => {
        fetchReminders();
        loadMedications();
    }, []);

    useEffect(() => {
        if (notifPermission !== 'granted') return;

        const now = Date.now();
        const windowStart = now - 5 * 60 * 1000;
        const windowEnd = now + 5 * 60 * 1000;

        const due = reminders.filter((r) => {
            if (r.notificationSent) return false;
            const t = new Date(r.scheduledAt).getTime();
            return t >= windowStart && t <= windowEnd;
        });

        if (due.length === 0) return;

        due.forEach(async (r) => {
            const when = new Date(r.scheduledAt);
            const timeLabel = when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            new window.Notification('Upcoming Consultation', {
                body: `${r.title} at ${timeLabel}`
            });
            try {
                await reminderService.update(r._id, { notificationSent: true });
                setReminders((prev) => prev.map((item) => (item._id === r._id ? { ...item, notificationSent: true } : item)));
            } catch { /* ignore */ }
        });
    }, [reminders, notifPermission]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.scheduledAt) { setError('Date and time are required.'); return; }

        if (!form.title && form.type !== 'medication') {
            setError('Title is required.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...form,
                title: form.title || (form.type === 'medication' ? `Medication: ${form.medicationName || 'Reminder'}` : 'Health Task')
            };
            await reminderService.create(payload);
            setShowForm(false);
            setForm({
                title: '',
                description: '',
                type: 'appointment',
                scheduledAt: '',
                location: '',
                doctorName: '',
            });
            fetchReminders();
        } catch (err) { setError(err.response?.data?.message || 'Failed to save reminder.'); }
        finally { setSaving(false); }
    };

    const handleMarkDone = async (id) => {
        try {
            await reminderService.update(id, { status: 'completed' });
            setReminders(reminders.filter(r => r._id !== id));
        } catch { setError('Update failed.'); }
    };

    const handleDelete = async (id) => {
        try {
            await reminderService.delete(id);
            setReminders(reminders.filter(r => r._id !== id));
        } catch { setError('Delete failed.'); }
    };

    const set = (k) => (e) => {
        const value = e.target?.value !== undefined ? e.target.value : e;
        setForm((prev) => ({ ...prev, [k]: value }));
    };

    const sortedReminders = [...reminders].sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    const overdue = sortedReminders.filter(r => new Date(r.scheduledAt) < new Date());
    const upcoming = sortedReminders.filter(r => new Date(r.scheduledAt) >= new Date());

    return (
        <div className="pd-wrapper">
            <Sidebar />
            <main className="pd-content">
                <header className="pd-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <div>
                        <h1 className="pd-page-title" style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px' }}>Consultations & Medical Reminders</h1>
                        <p className="pd-page-desc" style={{ fontSize: '1.1rem', color: '#64748b' }}>Your personal health timeline and medical appointments.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            className="pd-urgent-btn"
                            style={{
                                margin: 0, width: 'auto', background: 'var(--pd-accent)', color: '#fff',
                                padding: '0.8rem 1.5rem', borderRadius: '14px', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
                            }}
                            onClick={() => navigate('/patient/appointments')}
                        >
                            <Calendar size={20} /> Book Doctor
                        </button>
                        <button
                            className="pd-urgent-btn"
                            style={{
                                margin: 0, width: 'auto', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff',
                                padding: '0.8rem 1.5rem', borderRadius: '14px', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 10px 15px -3px rgba(124, 58, 237, 0.3)',
                                border: 'none', cursor: 'pointer'
                            }}
                            onClick={() => {
                                const roomId = `consult-${user?._id || 'guest'}-${Date.now()}`;
                                navigate(`/patient/consultation/${roomId}`, {
                                    state: {
                                        patientName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
                                    }
                                });
                            }}
                        >
                            <Video size={20} /> Video Call
                        </button>
                        <button
                            className="pd-urgent-btn"
                            style={{
                                margin: 0, width: 'auto', background: showForm ? '#1e293b' : '#fff',
                                color: showForm ? '#fff' : '#1e293b', border: '1px solid #e2e8f0',
                                padding: '0.8rem 1.5rem', borderRadius: '14px', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: '0.6rem'
                            }}
                            onClick={() => setShowForm(!showForm)}
                        >
                            {showForm ? <><X size={20} /> Cancel</> : <><Plus size={20} /> Add Reminders</>}
                        </button>
                    </div>
                </header>

                {error && (
                    <div className="fade-in" style={{ background: '#fef2f2', color: '#b91c1c', padding: '1.25rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 500 }}>
                        <AlertCircle size={20} /> {error}
                    </div>
                )}

                {showForm && (
                    <div className="pd-section-card fade-in" style={{ marginBottom: '3rem', padding: '2.5rem', borderRadius: '24px', background: '#fff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)' }}>
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0f172a' }}>Add New Health Task</h2>
                            <p style={{ color: '#64748b' }}>Log appointments, medications, or health routines to stay on track.</p>
                        </div>

                        <form onSubmit={handleCreate}>
                            <div style={{ marginBottom: '2.5rem' }}>
                                <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: '1rem', display: 'block' }}>Select Category</label>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    {Object.entries(TYPE_ICONS).map(([type, Icon]) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => set('type')(type)}
                                            style={{
                                                padding: '0.75rem 1.25rem',
                                                borderRadius: '12px',
                                                border: form.type === type ? '2px solid var(--pd-accent)' : '1px solid #e2e8f0',
                                                background: form.type === type ? '#eff6ff' : '#fff',
                                                color: form.type === type ? 'var(--pd-accent)' : '#64748b',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <Icon size={18} />
                                            {type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                                <div className="form-group">
                                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: '0.75rem', display: 'block' }}>Task Title</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' }}
                                            placeholder="e.g. Annual Checkup, Morning Walk"
                                            value={form.title}
                                            onChange={set('title')}
                                            required={form.type !== 'medication'}
                                        />
                                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                            <Activity size={20} />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: '0.75rem', display: 'block' }}>Scheduled At</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="datetime-local"
                                            style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' }}
                                            value={form.scheduledAt}
                                            onChange={set('scheduledAt')}
                                            required
                                        />
                                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                            <Calendar size={20} />
                                        </div>
                                    </div>
                                </div>

                                {form.type === 'medication' && (
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: '0.75rem', display: 'block' }}>Choose Medication</label>
                                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            {medicationOptions.map(med => (
                                                <button
                                                    key={med}
                                                    type="button"
                                                    onClick={() => set('medicationName')(med)}
                                                    style={{
                                                        padding: '0.6rem 1rem',
                                                        borderRadius: '30px',
                                                        border: form.medicationName === med ? '2px solid var(--pd-accent)' : '1px solid #e2e8f0',
                                                        background: form.medicationName === med ? '#eff6ff' : '#f8fafc',
                                                        color: form.medicationName === med ? 'var(--pd-accent)' : '#64748b',
                                                        fontWeight: 600,
                                                        fontSize: '0.85rem'
                                                    }}
                                                >
                                                    {med}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => navigate('/patient/profile')}
                                                style={{ padding: '0.6rem 1rem', borderRadius: '30px', border: '1px dashed #cbd5e1', background: 'transparent', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}
                                            >
                                                + Add more in Profile
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: '0.75rem', display: 'block' }}>Location / Provider (Optional)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' }}
                                            placeholder="e.g. City General, Dr. Sarah"
                                            value={form.doctorName}
                                            onChange={set('doctorName')}
                                        />
                                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                            <MapPin size={20} />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: '0.75rem', display: 'block' }}>Notes</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' }}
                                            placeholder="Any special instructions..."
                                            value={form.description}
                                            onChange={set('description')}
                                        />
                                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                            <FileText size={20} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                style={{
                                    width: '100%', padding: '1.25rem', borderRadius: '14px',
                                    background: 'var(--pd-accent)', color: '#fff', fontSize: '1.1rem', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                                    border: 'none', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.4)',
                                    transition: 'all 0.2s'
                                }}
                                disabled={saving}
                            >
                                {saving ? <><RefreshCw size={20} className="rd-spin" /> Saving Task...</> : <><CheckCircle2 size={20} /> Add to Schedule</>}
                            </button>
                        </form>
                    </div>
                )}

                <div>
                    {overdue.length > 0 && (
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertCircle size={20} /> Overdue <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>({overdue.length})</span>
                            </h2>
                            <ReminderList items={overdue} onDone={handleMarkDone} onDelete={handleDelete} status="overdue" />
                        </div>
                    )}

                    <div style={{ marginTop: overdue.length > 0 ? '3rem' : 0 }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                            {upcoming.length > 0 ? 'Upcoming Schedule' : 'No Upcoming Tasks'}
                        </h2>
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>
                        ) : upcoming.length === 0 ? (
                            <div className="pd-section-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', opacity: 0.3, color: '#94a3b8' }}>
                                    <CalendarOff size={48} />
                                </div>
                                <p style={{ color: 'var(--pd-text-muted)', fontWeight: 600 }}>You're all caught up! No upcoming reminders.</p>
                            </div>
                        ) : (
                            <ReminderList items={upcoming} onDone={handleMarkDone} onDelete={handleDelete} status="upcoming" />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function ReminderList({ items, onDone, onDelete, status }) {
    const navigate = useNavigate();
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {items.map((r) => {
                const d = new Date(r.scheduledAt);
                const isToday = d.toDateString() === new Date().toDateString();
                const Icon = TYPE_ICONS[r.type] || Bell;
                const timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const doneLabel = r.type === 'medication' ? 'Taken' : 'Complete';

                return (
                    <div key={r._id} className="pd-section-card fade-in" style={{ padding: '1.75rem', border: isToday ? '2px solid var(--pd-accent)' : '1px solid #f1f5f9', borderRadius: '20px', background: '#fff', boxShadow: isToday ? '0 10px 15px -3px rgba(59, 130, 246, 0.1)' : 'none' }}>
                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                            <div style={{ width: 64, height: 64, borderRadius: '18px', background: isToday ? '#eff6ff' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isToday ? 'var(--pd-accent)' : '#94a3b8', flexShrink: 0 }}>
                                <Icon size={32} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>{r.title}</h3>
                                        <div style={{ fontSize: '0.9rem', color: status === 'overdue' ? '#ef4444' : '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Calendar size={16} />
                                            {isToday ? 'TODAY at ' : ''}
                                            {d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} • {timeLabel}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button
                                            onClick={() => onDone(r._id)}
                                            style={{
                                                border: '1px solid #e2e8f0', background: '#fff', padding: '0.6rem 1.2rem',
                                                borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700,
                                                color: '#475569', cursor: 'pointer', transition: 'all 0.2s',
                                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                                            }}
                                            onMouseEnter={(e) => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = 'var(--pd-accent)'; e.target.style.color = 'var(--pd-accent)'; }}
                                            onMouseLeave={(e) => { e.target.style.background = '#fff'; e.target.style.borderColor = '#e2e8f0'; e.target.style.color = '#475569'; }}
                                        >
                                            <Check size={18} /> {doneLabel}
                                        </button>
                                        <button
                                            onClick={() => onDelete(r._id)}
                                            style={{ border: 'none', background: 'transparent', color: '#cbd5e1', cursor: 'pointer', padding: '0.5rem', transition: 'color 0.2s' }}
                                            onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                                            onMouseLeave={(e) => e.target.style.color = '#cbd5e1'}
                                        >
                                            <Trash2 size={22} />
                                        </button>
                                    </div>
                                </div>
                                {(r.doctorName || r.location) && (
                                    <div style={{ fontSize: '0.9rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.75rem', fontWeight: 500 }}>
                                        <MapPin size={16} style={{ color: '#94a3b8' }} /> {r.doctorName || r.location}
                                    </div>
                                )}
                                {r.description && (
                                    <div style={{
                                        fontSize: '0.95rem', color: '#64748b', lineHeight: 1.6,
                                        background: '#f8fafc', padding: '1rem', borderRadius: '12px',
                                        marginTop: '1rem', borderLeft: '4px solid #e2e8f0'
                                    }}>
                                        {r.description}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
