import { useState, useEffect } from 'react';
import { ShieldCheck, Filter, Download, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import '../../components/EHR/EHR.css';
import api from '../../api/axios';

const ACTION_COLORS = {
    SUBMIT_SYMPTOMS: '#3b82f6',
    UPDATE_PATIENT_PROFILE: '#22c55e',
    OVERRIDE_TRIAGE: '#f97316',
    ADD_DOCTOR_NOTE: '#a855f7',
    DELETE_DOCTOR_NOTE: '#ef4444',
    UPLOAD_REPORT: '#06b6d4',
    UPDATE_SURGERIES: '#eab308',
    UPDATE_INSURANCE: '#6366f1',
};

function getActionColor(action) {
    for (const [key, color] of Object.entries(ACTION_COLORS)) {
        if (action?.includes(key)) return color;
    }
    return 'var(--text-muted)';
}

function fmt(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);
    const [filters, setFilters] = useState({ action: '', actorRole: '', status: '', dateFrom: '', dateTo: '' });
    const [page, setPage] = useState(1);

    const fetchLogs = async (p = 1) => {
        setLoading(true);
        try {
            const params = { ...filters, page: p, limit: 25 };
            Object.keys(params).forEach(k => !params[k] && delete params[k]);
            const { data } = await api.get('/audit', { params });
            setLogs(data.data || []);
            setPagination(data.pagination);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const { data } = await api.get('/audit/stats', { params: { days: 30 } });
            setStats(data.data);
        } catch (e) { console.error(e); } finally { setLoadingStats(false); }
    };

    useEffect(() => { fetchLogs(1); fetchStats(); }, []);

    const handleFilter = (e) => {
        e.preventDefault();
        setPage(1);
        fetchLogs(1);
    };

    const exportCSV = () => {
        const headers = ['Date', 'Actor', 'Role', 'Action', 'Resource', 'Status', 'IP'];
        const rows = logs.map(l => [
            fmt(l.createdAt),
            l.actor ? `${l.actor.firstName} ${l.actor.lastName}` : 'System',
            l.actorRole || '—',
            l.action,
            l.resource || '—',
            l.status,
            l.ip || '—',
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `audit_logs_${Date.now()}.csv`; a.click();
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <div className="ehr-header">
                    <div className="ehr-header-left">
                        <div className="ehr-header-title"><ShieldCheck size={22} /> Audit Logs</div>
                        <div className="ehr-header-meta">
                            System activity & security events
                            {stats && <span style={{ color: 'var(--stable)' }}>· {stats.total} events (30d)</span>}
                        </div>
                    </div>
                    <div className="ehr-header-actions">
                        <button className="btn btn-outline btn-sm" onClick={exportCSV}><Download size={14} /> Export CSV</button>
                        <button className="btn btn-outline btn-sm" onClick={() => { fetchLogs(1); fetchStats(); }}><RefreshCw size={14} /></button>
                    </div>
                </div>

                <div className="ehr-body">
                    {/* Stats Row */}
                    {!loadingStats && stats && (
                        <div className="ehr-stats-row" style={{ marginBottom: '1.5rem' }}>
                            <div className="ehr-stat">
                                <span className="ehr-stat-icon">📋</span>
                                <span className="ehr-stat-value">{stats.total}</span>
                                <span className="ehr-stat-label">Total Events (30d)</span>
                            </div>
                            {stats.statusStats?.map(s => (
                                <div key={s._id} className="ehr-stat">
                                    <span className="ehr-stat-icon">{s._id === 'success' ? '✅' : '❌'}</span>
                                    <span className="ehr-stat-value">{s.count}</span>
                                    <span className="ehr-stat-label">{s._id}</span>
                                </div>
                            ))}
                            {stats.roleStats?.map(s => (
                                <div key={s._id} className="ehr-stat">
                                    <span className="ehr-stat-icon">👤</span>
                                    <span className="ehr-stat-value">{s.count}</span>
                                    <span className="ehr-stat-label">{s._id || 'unknown'}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Top Actions */}
                    {stats?.actionStats?.length > 0 && (
                        <div className="ehr-card" style={{ marginBottom: '1.5rem' }}>
                            <div className="ehr-card-title" style={{ marginBottom: '1rem' }}>Top Actions (30d)</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {stats.actionStats.slice(0, 10).map(s => (
                                    <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: getActionColor(s._id), flexShrink: 0 }} />
                                        <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{s._id}</span>
                                        <span style={{ fontWeight: 700, color: '#fff' }}>{s.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="ehr-card" style={{ marginBottom: '1.5rem' }}>
                        <div className="ehr-card-title" style={{ marginBottom: '1rem' }}><Filter size={15} /> Filters</div>
                        <form onSubmit={handleFilter} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                            <input className="form-input" style={{ width: 180 }} placeholder="Action keyword..." value={filters.action} onChange={e => setFilters(p => ({ ...p, action: e.target.value }))} />
                            <select className="form-input" style={{ width: 130 }} value={filters.actorRole} onChange={e => setFilters(p => ({ ...p, actorRole: e.target.value }))}>
                                <option value="">All Roles</option>
                                <option value="patient">Patient</option>
                                <option value="doctor">Doctor</option>
                                <option value="admin">Admin</option>
                            </select>
                            <select className="form-input" style={{ width: 120 }} value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
                                <option value="">Any Status</option>
                                <option value="success">Success</option>
                                <option value="failure">Failure</option>
                            </select>
                            <input type="date" className="form-input" style={{ width: 150 }} value={filters.dateFrom} onChange={e => setFilters(p => ({ ...p, dateFrom: e.target.value }))} />
                            <input type="date" className="form-input" style={{ width: 150 }} value={filters.dateTo} onChange={e => setFilters(p => ({ ...p, dateTo: e.target.value }))} />
                            <button type="submit" className="btn btn-primary btn-sm">Apply</button>
                            <button type="button" className="btn btn-outline btn-sm" onClick={() => { setFilters({ action: '', actorRole: '', status: '', dateFrom: '', dateTo: '' }); fetchLogs(1); }}>Clear</button>
                        </form>
                    </div>

                    {/* Logs Table */}
                    <div className="ehr-card">
                        <div className="ehr-card-header">
                            <div className="ehr-card-title">Activity Log ({pagination.total} total)</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Page {pagination.page} of {pagination.pages}</div>
                        </div>

                        {loading ? (
                            <div className="ehr-loading"><div className="spinner" /></div>
                        ) : logs.length === 0 ? (
                            <div className="ehr-empty">
                                <div className="ehr-empty-icon">🛡️</div>
                                <div className="ehr-empty-text">No audit logs found.</div>
                            </div>
                        ) : (
                            <>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Time</th>
                                            <th>Actor</th>
                                            <th>Action</th>
                                            <th>Resource</th>
                                            <th>Status</th>
                                            <th>IP</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map(log => (
                                            <tr key={log._id}>
                                                <td style={{ fontSize: '0.82rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{fmt(log.createdAt)}</td>
                                                <td>
                                                    {log.actor ? (
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.actor.firstName} {log.actor.lastName}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{log.actorRole}</div>
                                                        </div>
                                                    ) : <span style={{ color: 'var(--text-dim)' }}>System</span>}
                                                </td>
                                                <td>
                                                    <span className="audit-action-badge" style={{ borderColor: getActionColor(log.action), color: getActionColor(log.action) }}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{log.resource || '—'}</td>
                                                <td>
                                                    <span className={log.status === 'success' ? 'audit-status-success' : 'audit-status-failure'}>
                                                        {log.status === 'success' ? '✓' : '✗'} {log.status}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>{log.ip || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
                                    <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => { setPage(p => p - 1); fetchLogs(page - 1); }}>
                                        <ChevronLeft size={14} /> Prev
                                    </button>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {pagination.page} / {pagination.pages}
                                    </span>
                                    <button className="btn btn-outline btn-sm" disabled={page >= pagination.pages} onClick={() => { setPage(p => p + 1); fetchLogs(page + 1); }}>
                                        Next <ChevronRight size={14} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
