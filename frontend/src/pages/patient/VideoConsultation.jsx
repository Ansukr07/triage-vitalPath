import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useAuth } from '../../context/AuthContext';
import { Activity, Copy, LogOut, Video, Stethoscope } from 'lucide-react';
import './VideoConsultation.css';

export default function VideoConsultation() {
  const { roomId } = useParams();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user }   = useAuth();

  // Risk data passed via navigation state from Assistant.jsx
  const riskState = location.state || {};
  const {
    physicalRisk  = { score: 0, severity: 'LOW',  reasons: [] },
    mentalRisk    = { score: 0, severity: 'LOW',  reasons: [] },
    careCategory  = 'Home Care',
    patientName   = `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
  } = riskState;

  const [jitsiReady, setJitsiReady] = useState(false);
  const [copied,     setCopied]     = useState(false);

  // Copy room link to clipboard on mount so patient can share
  useEffect(() => {
    const link = `${window.location.origin}/doctor/consultation/${roomId}`;
    navigator.clipboard?.writeText(link).catch(() => {});
  }, [roomId]);

  const copyRoomLink = () => {
    const link = `${window.location.origin}/doctor/consultation/${roomId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const initials = patientName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'P';

  const careBadgeClass =
    careCategory === 'Emergency Room' ? 'emergency' :
    careCategory === 'Clinic Visit'   ? 'clinic'    : 'home';

  const allSymptoms = [
    ...(physicalRisk.reasons || []).map(r => ({ text: r, type: 'physical' })),
    ...(mentalRisk.reasons   || []).map(r => ({ text: r, type: 'mental'   })),
  ].slice(0, 6);

  return (
    <div className="vc-root">
      {/* ── Topbar ──────────────────────────────────────────────── */}
      <div className="vc-topbar">
        <div className="vc-topbar-left">
          <div className="vc-logo">
            <div className="vc-logo-icon">
              <Activity size={16} color="#fff" />
            </div>
            VitalPath
          </div>
          <div className="vc-live-badge">
            <span className="vc-live-dot" />
            Live
          </div>
          <span className="vc-title">Healthcare Consultation</span>
        </div>

        <div className="vc-topbar-right">
          <button className="vc-btn vc-btn-ghost" onClick={copyRoomLink}>
            <Copy size={14} />
            {copied ? 'Copied!' : 'Share Room Link'}
          </button>
          <button
            className="vc-btn vc-btn-danger"
            onClick={() => navigate('/call-ended')}
          >
            <LogOut size={14} /> Leave
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="vc-body">
        {/* ── Jitsi Video ─────────────────────────────────────── */}
        <div className="vc-video-area">
          {!jitsiReady && (
            <div className="vc-jitsi-waiting">
              <div className="vc-jitsi-spinner" />
              <span>Connecting to secure room…</span>
            </div>
          )}
          <div className="vc-jitsi-wrapper" style={{ opacity: jitsiReady ? 1 : 0, height: '100%' }}>
            <JitsiMeeting
              roomName={roomId}
              configOverwrite={{
                startWithAudioMuted:  false,
                startWithVideoMuted:  false,
                prejoinPageEnabled:   false,
                disableModeratorIndicator: true,
                enableWelcomePage: false,
              }}
              interfaceConfigOverwrite={{
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                TOOLBAR_BUTTONS: [
                  'microphone', 'camera', 'closedcaptions', 'desktop',
                  'fullscreen', 'fodeviceselection', 'hangup', 'chat',
                  'recording', 'tileview',
                ],
              }}
              userInfo={{
                displayName: patientName || 'Patient',
              }}
              onApiReady={() => setJitsiReady(true)}
              onReadyToClose={() => navigate('/call-ended')}
              getIFrameRef={(iframeRef) => {
                iframeRef.style.width  = '100%';
                iframeRef.style.height = '100%';
                iframeRef.style.border = 'none';
              }}
            />
          </div>
        </div>

        {/* ── Side Panel ──────────────────────────────────────── */}
        <aside className="vc-panel">
          {/* Patient */}
          <div className="vc-section">
            <div className="vc-section-label">Patient</div>
            <div className="vc-patient-header">
              <div className="vc-patient-avatar">{initials}</div>
              <div>
                <div className="vc-patient-name">{patientName || 'You'}</div>
                <div className="vc-patient-role">Patient</div>
              </div>
            </div>
          </div>

          {/* Risk Scores */}
          <div className="vc-section">
            <div className="vc-section-label">AI Risk Assessment</div>
            <div className="vc-risk-grid">
              <div className="vc-risk-card">
                <div className="vc-risk-card-title">Physical</div>
                <div className="vc-risk-score physical">{physicalRisk.score}</div>
                <span className={`vc-risk-severity ${physicalRisk.severity}`}>
                  {physicalRisk.severity}
                </span>
              </div>
              <div className="vc-risk-card">
                <div className="vc-risk-card-title">Mental</div>
                <div className="vc-risk-score mental">{mentalRisk.score}</div>
                <span className={`vc-risk-severity ${mentalRisk.severity}`}>
                  {mentalRisk.severity}
                </span>
              </div>
            </div>
          </div>

          {/* Care Recommendation */}
          <div className="vc-section">
            <div className="vc-section-label">Recommendation</div>
            <div className={`vc-care-badge ${careBadgeClass}`}>
              <Stethoscope size={14} />
              {careCategory}
            </div>
          </div>

          {/* Detected Symptoms */}
          <div className="vc-section">
            <div className="vc-section-label">Detected Indicators</div>
            <div className="vc-symptoms-list">
              {allSymptoms.length > 0 ? allSymptoms.map((s, i) => (
                <div key={i} className="vc-symptom-tag">
                  <span className={`vc-symptom-dot ${s.type}`} />
                  {s.text}
                </div>
              )) : (
                <div className="vc-empty-tag">Run "Assess Risk" for AI indicators</div>
              )}
            </div>
          </div>

          {/* Room ID */}
          <div className="vc-section">
            <div className="vc-section-label">Room ID (share with doctor)</div>
            <div className="vc-room-id" onClick={copyRoomLink} title="Click to copy doctor link">
              {roomId}
            </div>
            <div className="vc-copy-hint">
              {copied ? '✓ Doctor link copied!' : "Click to copy doctor's join link"}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
