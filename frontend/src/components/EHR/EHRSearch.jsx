import { useState } from 'react';
import { Search, X } from 'lucide-react';

const TYPE_FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'reports', label: 'Reports' },
    { key: 'triage', label: 'Triage' },
    { key: 'chat', label: 'AI Sessions' },
];

const RISK_FILTERS = [
    { key: '', label: 'Any Risk' },
    { key: 'critical', label: 'Critical' },
    { key: 'high', label: 'High' },
    { key: 'moderate', label: 'Moderate' },
    { key: 'stable', label: 'Stable' },
];

export default function EHRSearch({ onSearch, loading = false }) {
    const [q, setQ] = useState('');
    const [type, setType] = useState('all');
    const [riskLevel, setRiskLevel] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const handleSearch = (overrides = {}) => {
        onSearch?.({
            q: overrides.q ?? q,
            type: overrides.type ?? type,
            riskLevel: overrides.riskLevel ?? riskLevel,
            dateFrom,
            dateTo,
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    const handleClear = () => {
        setQ('');
        setType('all');
        setRiskLevel('');
        setDateFrom('');
        setDateTo('');
        onSearch?.({ q: '', type: 'all', riskLevel: '', dateFrom: '', dateTo: '' });
    };

    return (
        <div>
            {/* ── Search Input ── */}
            <div className="ehr-search-bar">
                <div className="ehr-search-input-wrap">
                    <Search size={15} className="ehr-search-icon" />
                    <input
                        className="ehr-search-input"
                        type="text"
                        placeholder="Search symptoms, report names, diagnoses..."
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <input
                    type="date"
                    className="form-input"
                    style={{ width: 'auto' }}
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    title="From date"
                />
                <input
                    type="date"
                    className="form-input"
                    style={{ width: 'auto' }}
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    title="To date"
                />
                <button className="btn btn-primary btn-sm" onClick={() => handleSearch()} disabled={loading}>
                    {loading ? '...' : 'Search'}
                </button>
                {(q || riskLevel || dateFrom || dateTo) && (
                    <button className="btn btn-outline btn-sm" onClick={handleClear}>
                        <X size={13} /> Clear
                    </button>
                )}
            </div>

            {/* ── Filter Chips ── */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Record Type</div>
                    <div className="ehr-filter-chips">
                        {TYPE_FILTERS.map(f => (
                            <button
                                key={f.key}
                                className={`ehr-filter-chip ${type === f.key ? 'active' : ''}`}
                                onClick={() => { setType(f.key); handleSearch({ type: f.key }); }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk Level</div>
                    <div className="ehr-filter-chips">
                        {RISK_FILTERS.map(f => (
                            <button
                                key={f.key}
                                className={`ehr-filter-chip ${riskLevel === f.key ? 'active' : ''}`}
                                onClick={() => { setRiskLevel(f.key); handleSearch({ riskLevel: f.key }); }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
