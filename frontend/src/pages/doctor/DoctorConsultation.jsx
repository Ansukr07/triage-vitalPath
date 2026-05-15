import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useAuth } from '../../context/AuthContext';
import { Activity, LogOut, Stethoscope, ClipboardList, Save } from 'lucide-react';
import '../patient/VideoConsultation.css';

export default function DoctorConsultation() {
  const { roomId } = useParams();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user }   = useAuth();

  // Patient risk data passed via navigation state from doctor PatientDetail
  const state = location.state || {};
  const {
    patientName   = 'Patient',
    patientId     = null,
    physicalRisk  = { score: 0, severity: 'LOW',  reasons: [] },
    mentalRisk    = { score: 0, severity: 'LOW',  reasons: [] },
    careCategory  = 'Home Care',
    vitals        = null,
  } = state;

  const [jitsiReady,  setJitsiReady]  = useState(false);
  const [notes,       setNotes]       = useState('');
  const [notesSaved,  setNotesSaved]  = useState(false);

  const doctorName = `Dr. ${user?.firstName || ''} ${user?.lastName || ''}`.trim();

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

  const saveNotes = () => {
    // Notes could be sent to backend here — for now show success feedback
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2500);
  };

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
          <span className="vc-title">Clinical Consultation — {patientName}</span>
        </div>

        <div className="vc-topbar-right">
          {patientId && (
            <button
              className="vc-btn vc-btn-ghost"
              onClick={() => navigate(`/doctor/patient/${patientId}`)}
            >
              <ClipboardList size={14} /> Patient File
            </button>
          )}
          <button
            className="vc-btn vc-btn-danger"
            onClick={() => navigate('/call-ended')}
          >
            <LogOut size={14} /> End Call
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
              <span>Connecting to patient room…</span>
            </div>
          )}
          <div className="vc-jitsi-wrapper" style={{ opacity: jitsiReady ? 1 : 0, height: '100%' }}>
            <JitsiMeeting
              roomName={roomId}
              configOverwrite={{
                startWithAudioMuted: false,
                startWithVideoMuted: false,
                prejoinPageEnabled:  false,
                disableModeratorIndicator: false,
                enableWelcomePage: false,
              }}
              interfaceConfigOverwrite={{
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                TOOLBAR_BUTTONS: [
                  'microphone', 'camera', 'closedcaptions', 'desktop',
                  'fullscreen', 'fodeviceselection', 'hangup', 'chat',
                  'recording', 'tileview', 'participants-pane',
                ],
              }}
              userInfo={{ displayName: doctorName || 'Doctor' }}
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
            <div className="vc-section-label">Patient Summary</div>
            <div className="vc-patient-header">
              <div className="vc-patient-avatar">{initials}</div>
              <div>
                <div className="vc-patient-name">{patientName}</div>
                <div className="vc-patient-role">Patient</div>
              </div>
            </div>
          </div>

          {/* Vitals */}
          {vitals && (
            <div className="vc-section">
              <div className="vc-section-label">Last Vitals</div>
              <div className="vc-symptoms-list">
                {vitals.heartRate        && <div className="vc-symptom-tag"><span className="vc-symptom-dot" /> Heart Rate: {vitals.heartRate} bpm</div>}
                {vitals.oxygenSaturation && <div className="vc-symptom-tag"><span className="vc-symptom-dot" /> SpO₂: {vitals.oxygenSaturation}%</div>}
                {vitals.bloodPressureSystolic && <div className="vc-symptom-tag"><span className="vc-symptom-dot" /> BP: {vitals.bloodPressureSystolic}/{vitals.bloodPressureDiastolic} mmHg</div>}
                {vitals.temperature      && <div className="vc-symptom-tag"><span className="vc-symptom-dot" /> Temp: {vitals.temperature}°C</div>}
              </div>
            </div>
          )}

          {/* Risk Scores */}
          <div className="vc-section">
            <div className="vc-section-label">AI Risk Scores</div>
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
            <div className="vc-section-label">Triage Recommendation</div>
            <div className={`vc-care-badge ${careBadgeClass}`}>
              <Stethoscope size={14} />
              {careCategory}
            </div>
          </div>

          {/* Detected Indicators */}
          <div className="vc-section">
            <div className="vc-section-label">Detected Indicators</div>
            <div className="vc-symptoms-list">
              {allSymptoms.length > 0 ? allSymptoms.map((s, i) => (
                <div key={i} className="vc-symptom-tag">
                  <span className={`vc-symptom-dot ${s.type}`} />
                  {s.text}
                </div>
              )) : (
                <div className="vc-empty-tag">No indicators available</div>
              )}
            </div>
          </div>

          {/* Doctor Notes */}
          <div className="vc-section">
            <div className="vc-section-label">Consultation Notes</div>
            <textarea
              className="vc-notes-textarea"
              placeholder="Add your clinical observations here…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <button
              className="vc-btn vc-btn-accent"
              style={{ width: '100%', marginTop: '10px', justifyContent: 'center' }}
              onClick={saveNotes}
            >
              <Save size={14} />
              {notesSaved ? 'Notes Saved ✓' : 'Save Notes'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
