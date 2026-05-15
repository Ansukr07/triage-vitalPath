import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { patientService, reminderService } from '../../api/services';
import {
    Calendar,
    Clock,
    User,
    Stethoscope,
    MapPin,
    CheckCircle2,
    ChevronLeft,
    Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './PatientDashboard.css';

export default function Appointments() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [bookingStatus, setBookingStatus] = useState('idle'); // idle, loading, success

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await patientService.getDoctors();
                if (res.data.success) {
                    setDoctors(res.data.data);
                }
            } catch (err) {
                console.error('Failed to load doctors:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDoctors();
    }, []);

    // Generate next 14 days
    const getNextDays = (availableDays) => {
        const days = [];
        let d = new Date();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        for (let i = 0; i < 14; i++) {
            const date = new Date(d);
            date.setDate(d.getDate() + i);
            const dayName = dayNames[date.getDay()];
            
            // Only add if doctor works on this day
            if (availableDays?.includes(dayName)) {
                days.push({
                    date: date,
                    formatted: date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
                });
            }
        }
        return days;
    };

    // Generate time slots based on start/end
    const getTimeSlots = (start, end) => {
        if (!start || !end) return ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'];
        
        const slots = [];
        let current = parseInt(start.split(':')[0]);
        const endHour = parseInt(end.split(':')[0]);
        
        while (current < endHour) {
            const period = current >= 12 ? 'PM' : 'AM';
            let hour = current % 12;
            if (hour === 0) hour = 12;
            slots.push(`${hour}:00 ${period}`);
            current++;
        }
        return slots;
    };

    const handleBook = async () => {
        if (!selectedDoctor || !selectedDate || !selectedTime) return;
        
        setBookingStatus('loading');
        
        try {
            // Parse time (e.g., "10:00 AM")
            const [time, period] = selectedTime.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;

            const scheduledAt = new Date(selectedDate.date);
            scheduledAt.setHours(hours, minutes, 0, 0);

            await reminderService.create({
                title: `Consultation: Dr. ${selectedDoctor.user.lastName}`,
                description: `Specialty: ${selectedDoctor.specializations?.join(', ')}`,
                type: 'appointment',
                scheduledAt: scheduledAt.toISOString(),
                doctorName: `Dr. ${selectedDoctor.user.firstName} ${selectedDoctor.user.lastName}`,
                location: selectedDoctor.hospitalAffiliation || 'VitalPath Clinic'
            });

            setBookingStatus('success');
        } catch (err) {
            console.error('Booking failed:', err);
            setBookingStatus('idle');
            alert('Failed to book appointment. Please try again.');
        }
    };

    if (loading) return (
        <div className="pd-wrapper">
            <Sidebar />
            <div className="pd-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" />
            </div>
        </div>
    );

    return (
        <div className="pd-wrapper">
            <Sidebar />
            <main className="pd-content" style={{ background: '#f8fafc' }}>
                
                <header className="pd-page-header" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <button onClick={() => navigate('/patient/suggestions')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                            <ChevronLeft size={24} />
                        </button>
                        <h1 className="pd-page-title" style={{ margin: 0 }}>Schedule Appointment</h1>
                    </div>
                    <p className="pd-page-desc" style={{ marginLeft: '2.5rem' }}>Select a specialist and book your clinical visit.</p>
                </header>

                <div style={{ display: 'flex', gap: '2rem', height: 'calc(100vh - 180px)' }}>
                    
                    {/* Left: Doctor List */}
                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '1rem' }}>
                        {doctors.map(doc => {
                            const isSelected = selectedDoctor?._id === doc._id;
                            return (
                                <div key={doc._id} onClick={() => {
                                    setSelectedDoctor(doc);
                                    setSelectedDate(null);
                                    setSelectedTime(null);
                                    setBookingStatus('idle');
                                }} style={{
                                    background: 'white',
                                    borderRadius: '16px',
                                    padding: '1.5rem',
                                    border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                    boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.1)' : '0 2px 4px rgba(0,0,0,0.02)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                            {doc.user.firstName[0]}{doc.user.lastName[0]}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#1e293b' }}>Dr. {doc.user.firstName} {doc.user.lastName}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                                <Stethoscope size={14} /> {doc.specializations?.join(', ') || 'General'}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={12} /> {doc.hospitalAffiliation || 'VitalPath Clinic'}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#eab308' }}><Star size={12} fill="currentColor" /> {doc.yearsOfExperience || 5} Yrs Exp</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {doctors.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                No doctors available at the moment.
                            </div>
                        )}
                    </div>

                    {/* Right: Scheduling Pane */}
                    <div style={{ flex: '1.2', background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {!selectedDoctor ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>
                                <Calendar size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <h3>Select a Doctor</h3>
                                <p style={{ fontSize: '0.9rem' }}>Choose a specialist from the list to view their available schedule.</p>
                            </div>
                        ) : bookingStatus === 'success' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#10b981', padding: '2rem', textAlign: 'center', background: '#ecfdf5' }}>
                                <CheckCircle2 size={64} style={{ marginBottom: '1.5rem', animation: 'scaleIn 0.5s ease-out' }} />
                                <h2 style={{ color: '#065f46', marginBottom: '0.5rem' }}>Appointment Confirmed!</h2>
                                <p style={{ color: '#047857', marginBottom: '2rem' }}>You are scheduled to see Dr. {selectedDoctor.user.lastName} on {selectedDate?.formatted} at {selectedTime}.</p>
                                <button onClick={() => navigate('/patient')} style={{ padding: '0.75rem 2rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                                    Return to Dashboard
                                </button>
                            </div>
                        ) : (
                            <div style={{ padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#1e293b' }}>Select Date & Time</h2>
                                
                                {/* Date Selection */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '1rem' }}>Available Days</label>
                                    <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }} className="hide-scrollbar">
                                        {getNextDays(selectedDoctor.availability?.days).map((day, idx) => {
                                            const isSel = selectedDate?.formatted === day.formatted;
                                            return (
                                                <button key={idx} onClick={() => setSelectedDate(day)} style={{
                                                    padding: '0.75rem 1rem',
                                                    background: isSel ? '#3b82f6' : '#f8fafc',
                                                    color: isSel ? 'white' : '#475569',
                                                    border: isSel ? 'none' : '1px solid #e2e8f0',
                                                    borderRadius: '12px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    whiteSpace: 'nowrap',
                                                    minWidth: '100px',
                                                    transition: 'all 0.2s'
                                                }}>
                                                    {day.formatted}
                                                </button>
                                            );
                                        })}
                                        {getNextDays(selectedDoctor.availability?.days).length === 0 && (
                                            <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>No availability found for the next 14 days.</span>
                                        )}
                                    </div>
                                </div>

                                {/* Time Selection */}
                                {selectedDate && (
                                    <div style={{ marginBottom: '2rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '1rem' }}>Available Times</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                            {getTimeSlots(selectedDoctor.availability?.startTime, selectedDoctor.availability?.endTime).map((time, idx) => {
                                                const isSel = selectedTime === time;
                                                return (
                                                    <button key={idx} onClick={() => setSelectedTime(time)} style={{
                                                        padding: '0.5rem 1rem',
                                                        background: isSel ? '#3b82f6' : 'transparent',
                                                        color: isSel ? 'white' : '#64748b',
                                                        border: `1px solid ${isSel ? '#3b82f6' : '#cbd5e1'}`,
                                                        borderRadius: '8px',
                                                        fontWeight: 500,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}>
                                                        {time}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div style={{ flex: 1 }}></div>

                                {/* Booking Summary & Action */}
                                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginTop: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Consultation Fee</div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>$150.00</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Selected Slot</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#3b82f6' }}>
                                                {selectedDate && selectedTime ? `${selectedDate.formatted}, ${selectedTime}` : 'Not selected'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={handleBook}
                                        disabled={!selectedDate || !selectedTime || bookingStatus === 'loading'}
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            background: (!selectedDate || !selectedTime) ? '#cbd5e1' : '#3b82f6',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: 600,
                                            fontSize: '1rem',
                                            cursor: (!selectedDate || !selectedTime || bookingStatus === 'loading') ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {bookingStatus === 'loading' ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : 'Confirm Appointment'}
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
