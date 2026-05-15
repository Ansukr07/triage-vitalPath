import api from './axios';

// ── Auth ────────────────────────────────────────────────────────────────────
export const authService = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => {
        const rf = localStorage.getItem('refreshToken');
        localStorage.clear();
        return api.post('/auth/logout', { refreshToken: rf });
    },
};

// ── Patients ────────────────────────────────────────────────────────────────
export const patientService = {
    getProfile: () => api.get('/patients/me'),
    updateProfile: (data) => api.patch('/patients/me', data),
    submitSymptoms: (data) => api.post('/patients/symptoms', data),
    getSymptomHistory: () => api.get('/patients/symptoms'),
    getTriageHistory: () => api.get('/patients/triage/history'),
    getClinicalInsights: (text) => api.post('/patients/clinical-insights', { text }),
    getDoctors: () => api.get('/doctors'),
    sendEmergencyAlert: () => api.post('/patients/emergency-alert'),
};

// ── Doctors ─────────────────────────────────────────────────────────────────
export const doctorService = {
    getProfile: () => api.get('/doctors/me'),
    updateProfile: (d) => api.patch('/doctors/me', d),
    getQueue: () => api.get('/doctors/queue'),
    getPatientDetail: (id) => api.get(`/doctors/patients/${id}`),
    getPatientSummary: (id) => api.get(`/doctors/patients/${id}/summary`),
    overrideTriage: (id, d) => api.post(`/doctors/patients/${id}/override`, d),
    getAlerts: () => api.get('/doctors/alerts'),
    getSimilarity: (id) => api.get(`/doctors/patients/${id}/similarity`),
};

// ── Reports ─────────────────────────────────────────────────────────────────
export const reportService = {
    upload: (formData) => api.post('/reports/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    list: (params) => api.get('/reports', { params }),
    getById: (id) => api.get(`/reports/${id}`),
    addNotes: (id, n) => api.patch(`/reports/${id}/notes`, { notes: n }),
    delete: (id) => api.delete(`/reports/${id}`),
    reparse: (id) => api.post(`/reports/${id}/reparse`),
    generateSummary: () => api.post('/reports/generate-summary'),
};

// ── Reminders ────────────────────────────────────────────────────────────────
export const reminderService = {
    list: (params) => api.get('/reminders', { params }),
    create: (data) => api.post('/reminders', data),
    update: (id, d) => api.patch(`/reminders/${id}`, d),
    delete: (id) => api.delete(`/reminders/${id}`),
};

// ── Chat ────────────────────────────────────────────────────────────────────
export const chatService = {
    sendMessage: (message, history, location = null, mode = 'text') => api.post('/chat', { message, history, location, mode }),
    autoSaveSession: (messages, metadata = {}) => api.post('/chat/sessions/auto-save', { messages, ...metadata }),

    // Session persistence
    getSessions:   ()                      => api.get('/chat/sessions'),
    createSession: (title, messages)       => api.post('/chat/sessions', { title, messages }),
    updateSession: (id, data)              => api.put(`/chat/sessions/${id}`, data),
    deleteSession: (id)                    => api.delete(`/chat/sessions/${id}`),

    assessRisk: (history, location = null) => api.post('/chat/assess-risk', { history, location }),

    // Escalation logs (admin/doctor)
    getEscalations:        ()              => api.get('/chat/escalations'),
    acknowledgeEscalation: (id, note)     => api.post(`/chat/escalations/${id}/acknowledge`, { note }),
};

// ── Triage ───────────────────────────────────────────────────────────────────
export const triageService = {
    getLatest: (patientId) => api.get(`/triage/${patientId}/latest`),
    getHistory: (patientId) => api.get(`/triage/${patientId}/history`),
};

// ── EHR ─────────────────────────────────────────────────────────────────────
export const ehrService = {
    // Patient self-service
    getMe: () => api.get('/ehr/me'),
    getMyTimeline: (limit = 50) => api.get('/ehr/timeline', { params: { limit } }),
    getMyRiskTrend: (days = 90) => api.get('/ehr/risk-trend', { params: { days } }),
    getMySummary: () => api.get('/ehr/summary'),
    search: (params) => api.get('/ehr/search', { params }),
    updateSurgeries: (surgeries) => api.patch('/ehr/me/surgeries', { surgeries }),
    updateInsurance: (insuranceInfo, occupation) => api.patch('/ehr/me/insurance', { insuranceInfo, occupation }),

    // Doctor / admin — patient-specific
    getPatient: (patientId) => api.get(`/ehr/patients/${patientId}`),
    getPatientTimeline: (patientId, limit = 100) => api.get(`/ehr/patients/${patientId}/timeline`, { params: { limit } }),
    getPatientRiskTrend: (patientId, days = 90) => api.get(`/ehr/patients/${patientId}/risk-trend`, { params: { days } }),
    getPatientSummary: (patientId) => api.get(`/ehr/patients/${patientId}/summary`),
    addNote: (patientId, data) => api.post(`/ehr/patients/${patientId}/notes`, data),
    deleteNote: (patientId, noteId) => api.delete(`/ehr/patients/${patientId}/notes/${noteId}`),

    // Admin audit
    getAuditLogs: (params) => api.get('/audit', { params }),
    getAuditStats: (days = 30) => api.get('/audit/stats', { params: { days } }),
};
