import { User, Droplet, Phone, MapPin, Briefcase, Shield, Scissors } from 'lucide-react';

function calcAge(dob) {
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d)) return null;
    return Math.floor((Date.now() - d) / (365.25 * 24 * 3600 * 1000));
}

function Field({ label, value, children }) {
    return (
        <div className="ehr-profile-field">
            <span className="ehr-profile-field-label">{label}</span>
            <span className="ehr-profile-field-value">{children || value || '—'}</span>
        </div>
    );
}

function TagList({ items = [], variant = '' }) {
    if (!items.length) return <span className="ehr-profile-field-value" style={{ color: 'var(--text-dim)' }}>None recorded</span>;
    return (
        <div className="ehr-tag-list">
            {items.map((item, i) => (
                <span key={i} className={`ehr-tag ${variant}`}>{item}</span>
            ))}
        </div>
    );
}

export default function PatientProfileCard({ profile }) {
    if (!profile) return null;
    const { user, dateOfBirth, gender, bloodType, allergies, conditions, medications, surgeries, emergencyContact, address, occupation, insuranceInfo, triageStatus } = profile;

    const age = calcAge(dateOfBirth);
    const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '—';

    return (
        <div className="ehr-card">
            {/* ── Header ── */}
            <div className="ehr-card-header" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: 52, height: 52, borderRadius: '50%',
                        background: 'rgba(59,130,246,0.15)',
                        border: '2px solid rgba(59,130,246,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem', fontWeight: 800, color: '#93c5fd',
                    }}>
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{fullName}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {age ? `${age} years` : '—'} · {gender || 'Gender not specified'} · {user?.email}
                        </div>
                    </div>
                </div>
                <div>
                    <span className={`badge badge-${triageStatus || 'unknown'}`}>
                        Current Risk: {(triageStatus || 'unknown').toUpperCase()}
                    </span>
                </div>
            </div>

            {/* ── Basic Info Grid ── */}
            <div className="ehr-profile-grid" style={{ marginBottom: '1.5rem' }}>
                <Field label="Date of Birth">{dateOfBirth ? new Date(dateOfBirth).toLocaleDateString('en-IN') : '—'}</Field>
                <Field label="Age">{age ? `${age} years` : '—'}</Field>
                <Field label="Gender" value={gender ? gender.replace(/_/g, ' ') : '—'} />
                <Field label="Occupation" value={occupation || '—'} />
                <Field label="Phone" value={user?.phone || '—'} />
                <Field label="Member Since">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : '—'}</Field>
            </div>

            {/* ── Blood & Medical ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                    <div className="ehr-profile-field-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                        <Droplet size={12} /> Blood Type
                    </div>
                    <span className={`ehr-tag ${bloodType && bloodType !== 'unknown' ? 'danger' : ''}`} style={{ fontSize: '1rem', padding: '0.3rem 0.9rem' }}>
                        {bloodType || '?'}
                    </span>
                </div>

                <div>
                    <div className="ehr-profile-field-label" style={{ marginBottom: '0.5rem' }}>Allergies</div>
                    <TagList items={allergies || []} variant="danger" />
                </div>

                <div>
                    <div className="ehr-profile-field-label" style={{ marginBottom: '0.5rem' }}>Chronic Conditions</div>
                    <TagList items={conditions || []} variant="warning" />
                </div>
            </div>

            {/* ── Medications ── */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div className="ehr-profile-field-label" style={{ marginBottom: '0.5rem' }}>Current Medications</div>
                <TagList items={medications || []} variant="info" />
            </div>

            {/* ── Surgeries ── */}
            {surgeries?.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="ehr-profile-field-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                        <Scissors size={12} /> Past Surgeries
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {surgeries.map((s, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.65rem 0.9rem', border: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
                                <div style={{ fontWeight: 600 }}>{s.name}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    {s.date ? new Date(s.date).toLocaleDateString('en-IN') : ''}{s.hospital ? ` · ${s.hospital}` : ''}{s.surgeon ? ` · Dr. ${s.surgeon}` : ''}
                                </div>
                                {s.notes && <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: '0.2rem' }}>{s.notes}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Emergency Contact ── */}
            {emergencyContact?.name && (
                <div style={{ marginBottom: '1.25rem' }}>
                    <div className="ehr-profile-field-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                        <Phone size={12} /> Emergency Contact
                    </div>
                    <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', padding: '0.65rem 1rem', fontSize: '0.88rem' }}>
                        <span style={{ fontWeight: 600 }}>{emergencyContact.name}</span>
                        {emergencyContact.relationship && <span style={{ color: 'var(--text-muted)' }}> · {emergencyContact.relationship}</span>}
                        {emergencyContact.phone && <span style={{ color: '#fca5a5' }}> · {emergencyContact.phone}</span>}
                    </div>
                </div>
            )}

            {/* ── Insurance ── */}
            {insuranceInfo?.provider && (
                <div style={{ marginBottom: '1.25rem' }}>
                    <div className="ehr-profile-field-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                        <Shield size={12} /> Insurance
                    </div>
                    <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '8px', padding: '0.65rem 1rem', fontSize: '0.88rem' }}>
                        <span style={{ fontWeight: 600 }}>{insuranceInfo.provider}</span>
                        {insuranceInfo.policyNumber && <span style={{ color: 'var(--text-muted)' }}> · #{insuranceInfo.policyNumber}</span>}
                        {insuranceInfo.coverageType && <span className="ehr-tag success" style={{ marginLeft: '0.5rem' }}>{insuranceInfo.coverageType}</span>}
                        {insuranceInfo.expiryDate && (
                            <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                                Expires: {new Date(insuranceInfo.expiryDate).toLocaleDateString('en-IN')}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Address ── */}
            {address?.city && (
                <div>
                    <div className="ehr-profile-field-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                        <MapPin size={12} /> Address
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {[address.line1, address.city, address.state, address.pincode, address.country].filter(Boolean).join(', ')}
                    </div>
                </div>
            )}
        </div>
    );
}
