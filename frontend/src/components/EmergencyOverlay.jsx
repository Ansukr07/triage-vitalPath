import React, { useEffect, useState } from 'react';
import './EmergencyOverlay.css';

const EMERGENCY_CONTACTS = {
    suicide:   { icon: '🧠', title: 'Mental Health Emergency', helpline: 'iCall: 9152987821', who: 'Vandrevala Foundation: 1860-2662-345' },
    cardiac:   { icon: '🫀', title: 'Cardiac Emergency',       helpline: 'National Emergency: 112', who: 'Ambulance: 108' },
    stroke:    { icon: '🧠', title: 'Stroke Emergency',        helpline: 'National Emergency: 112', who: 'Ambulance: 108' },
    seizure:   { icon: '⚡', title: 'Seizure Emergency',       helpline: 'National Emergency: 112', who: 'Ambulance: 108' },
    breathing: { icon: '🫁', title: 'Breathing Emergency',     helpline: 'National Emergency: 112', who: 'Ambulance: 108' },
    trauma:    { icon: '🩸', title: 'Severe Bleeding/Trauma',  helpline: 'National Emergency: 112', who: 'Ambulance: 108' },
    critical:  { icon: '🚨', title: 'Critical Emergency',      helpline: 'National Emergency: 112', who: 'Ambulance: 108' },
};

export default function EmergencyOverlay({ emergency, onDismiss }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (emergency?.isEmergency) {
            setVisible(true);
            // Play alert sound
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(880, ctx.currentTime);
                gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.8);
            } catch (e) {
                // AudioContext may be blocked
            }
        }
    }, [emergency]);

    if (!visible || !emergency?.isEmergency) return null;

    const contact = EMERGENCY_CONTACTS[emergency.type] || EMERGENCY_CONTACTS.critical;

    return (
        <div className="em-overlay-root">
            <div className="em-overlay-card">
                {/* Header */}
                <div className="em-overlay-header">
                    <span className="em-overlay-pulse-ring" />
                    <span className="em-overlay-icon">{contact.icon}</span>
                    <div>
                        <h2 className="em-overlay-title">⚠️ EMERGENCY DETECTED</h2>
                        <p className="em-overlay-subtitle">{contact.title}</p>
                    </div>
                    <button className="em-overlay-close" onClick={() => { setVisible(false); onDismiss?.(); }}>✕</button>
                </div>

                {/* Alert band */}
                <div className="em-overlay-band">
                    🚨 Help is being notified. Alerts have been sent to your care team.
                </div>

                {/* Body */}
                <div className="em-overlay-body">
                    <div className="em-overlay-reason">
                        <strong>Detected concern:</strong><br />
                        {emergency.reason}
                    </div>

                    {emergency.detectedSymptoms?.length > 0 && (
                        <div className="em-overlay-symptoms">
                            <strong>Flagged symptoms:</strong>
                            <ul>
                                {emergency.detectedSymptoms.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    )}

                    <div className="em-overlay-contacts">
                        <div className="em-overlay-contact-title">📞 Emergency Helplines</div>
                        <div className="em-overlay-contact-row">
                            <span className="em-badge em-badge-red">{contact.helpline}</span>
                            <span className="em-badge em-badge-orange">{contact.who}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="em-overlay-footer">
                    <span className="em-disclaimer">
                        ⚕️ This is a <em>preliminary risk assessment</em> — not a diagnosis. Always verify with a licensed medical professional. Do not rely solely on this alert.
                    </span>
                    <button className="em-overlay-dismiss-btn" onClick={() => { setVisible(false); onDismiss?.(); }}>
                        I understand — Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
}
