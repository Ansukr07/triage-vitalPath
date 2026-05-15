import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/patient/Dashboard';
import SymptomForm from './pages/patient/SymptomForm';
import Reports from './pages/patient/Reports';
import ReportDetail from './pages/patient/ReportDetail';
import Suggestions from './pages/patient/Suggestions';
import Consultations from './pages/patient/Consultations';
import PatientProfile from './pages/patient/Profile';
import MonitorSymptoms from './pages/patient/MonitorSymptoms';
import DoctorDashboard from './pages/doctor/Dashboard';
import PatientDetail from './pages/doctor/PatientDetail';
import EscalationDashboard from './pages/doctor/EscalationDashboard';
import Assistant from './pages/patient/Assistant';
import VoiceAgentPage from './pages/patient/VoiceAgentPage';
import Appointments from './pages/patient/Appointments';
import VideoConsultation from './pages/patient/VideoConsultation';
import DoctorConsultation from './pages/doctor/DoctorConsultation';
import PatientEHRPage from './pages/patient/EHR';
import PatientEHRDoctorView from './pages/doctor/PatientEHR';
import AuditLogs from './pages/admin/AuditLogs';
import OutbreakDashboard from './pages/doctor/OutbreakDashboard';
import CallEnded from './pages/CallEnded';
import 'leaflet/dist/leaflet.css';
import './index.css';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'doctor' || user.role === 'admin') return <Navigate to="/doctor" replace />;
  return <Navigate to="/patient" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<AppRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/patient" element={<ProtectedRoute roles={['patient']}><PatientDashboard /></ProtectedRoute>} />
      <Route path="/patient/symptoms" element={<ProtectedRoute roles={['patient']}><SymptomForm /></ProtectedRoute>} />
      <Route path="/patient/monitor" element={<ProtectedRoute roles={['patient']}><MonitorSymptoms /></ProtectedRoute>} />
      <Route path="/patient/reports" element={<ProtectedRoute roles={['patient']}><Reports /></ProtectedRoute>} />
      <Route path="/patient/reports/:id" element={<ProtectedRoute roles={['patient']}><ReportDetail /></ProtectedRoute>} />
      <Route path="/patient/suggestions" element={<ProtectedRoute roles={['patient']}><Suggestions /></ProtectedRoute>} />
      <Route path="/patient/consultations" element={<ProtectedRoute roles={['patient']}><Consultations /></ProtectedRoute>} />

      <Route path="/patient/profile" element={<ProtectedRoute roles={['patient']}><PatientProfile /></ProtectedRoute>} />
      <Route path="/patient/assistant" element={<ProtectedRoute roles={['patient']}><Assistant /></ProtectedRoute>} />
      <Route path="/patient/voice" element={<ProtectedRoute roles={['patient']}><VoiceAgentPage /></ProtectedRoute>} />
      <Route path="/patient/appointments" element={<ProtectedRoute roles={['patient']}><Appointments /></ProtectedRoute>} />
      <Route path="/patient/consultation/:roomId" element={<ProtectedRoute roles={['patient']}><VideoConsultation /></ProtectedRoute>} />
      <Route path="/patient/ehr" element={<ProtectedRoute roles={['patient']}><PatientEHRPage /></ProtectedRoute>} />

      <Route path="/doctor" element={<ProtectedRoute roles={['doctor', 'admin']}><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/doctor/patient/:id" element={<ProtectedRoute roles={['doctor', 'admin']}><PatientDetail /></ProtectedRoute>} />
      <Route path="/doctor/patient/:id/ehr" element={<ProtectedRoute roles={['doctor', 'admin']}><PatientEHRDoctorView /></ProtectedRoute>} />
      <Route path="/doctor/escalations" element={<ProtectedRoute roles={['doctor', 'admin']}><EscalationDashboard /></ProtectedRoute>} />
      <Route path="/doctor/consultation/:roomId" element={<ProtectedRoute roles={['doctor', 'admin']}><DoctorConsultation /></ProtectedRoute>} />
      <Route path="/doctor/outbreaks" element={<ProtectedRoute roles={['doctor', 'admin']}><OutbreakDashboard /></ProtectedRoute>} />
      <Route path="/admin/audit" element={<ProtectedRoute roles={['admin']}><AuditLogs /></ProtectedRoute>} />
      <Route path="/call-ended" element={<CallEnded />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
