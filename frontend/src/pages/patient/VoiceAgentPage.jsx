import { useNavigate, useLocation } from 'react-router-dom';
import VoiceMode from '../../components/VoiceMode';
import EmergencyOverlay from '../../components/EmergencyOverlay';
import { useState } from 'react';

const VoiceAgentPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeEmergency, setActiveEmergency] = useState(null);

    // Location may have been passed from the Assistant page via navigate state
    const userLocation = location.state?.userLocation || null;

    const handleClose = () => {
        navigate('/patient/assistant');
    };

    const handleEmergency = (emergencyData) => {
        setActiveEmergency(emergencyData);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', background: '#000', overflow: 'hidden' }}>
            {activeEmergency?.isEmergency ? (
                <EmergencyOverlay
                    emergency={activeEmergency}
                    onDismiss={() => setActiveEmergency(null)}
                />
            ) : (
                <VoiceMode
                    initialLocation={userLocation}
                    onEmergency={handleEmergency}
                    onClose={handleClose}
                />
            )}
        </div>
    );
};

export default VoiceAgentPage;
