import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { reportService } from '../../api/services';
import {
    ArrowLeft, RefreshCw, Loader2, AlertTriangle, Clock,
    User, Stethoscope, Bot, Crosshair, ClipboardList,
    BookOpenText, History, Pill, Microscope, BarChart3,
    TriangleAlert, CalendarCheck, Dna, Tag, FileText,
    Info, UserPen, CheckCircle2, XCircle, AlertCircle,
    TestTubes, Thermometer, Tablets, FlaskConical,
    Heart, Scan, BrainCircuit, Radio, Activity, FileCheck2
} from 'lucide-react';
import './PatientDashboard.css';
import './ReportDetail.css';

const TYPE_ICONS = {
    blood_test: TestTubes,
    xray: Scan,
    mri: BrainCircuit,
    ct_scan: Radio,
    ecg: Activity,
    urine_test: FlaskConical,
    biopsy: Microscope,
    prescription: Tablets,
    discharge_summary: ClipboardList,
    consultation: Stethoscope,
    other: FileText,
};

export default function ReportDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reparsing, setReparsing] = useState(false);

    const fetchReport = async () => {
        try {
            const res = await reportService.getById(id);
            setReport(res.data.data);
        } catch {
            setError('Unable to load report details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReport(); }, [id]);

    const handleReparse = async () => {
        setReparsing(true);
        try {
            await reportService.reparse(id);
            setTimeout(async () => {
                await fetchReport();
                setReparsing(false);
            }, 15000);
        } catch {
            setReparsing(false);
            alert('Re-analysis failed. Please try again.');
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

    if (error || !report) return (
        <div className="pd-wrapper">
            <Sidebar />
            <main className="pd-content">
                <button className="rd-back-btn" onClick={() => navigate('/patient/reports')}>
                    <ArrowLeft size={16} /> Back to Reports
                </button>
                <div className="rd-section rd-pending-state">
                    <AlertTriangle size={48} className="rd-pending-icon-svg" />
                    <div className="rd-pending-title">{error || 'Report not found'}</div>
                </div>
            </main>
        </div>
    );

    const parsed = report.parsedData || {};
    const entities = report.clinicalEntities || {};
    const classification = report.bertClassification || {};
    const isParsed = parsed.parseStatus === 'done';
    const isFailed = parsed.parseStatus === 'failed';
    const keyValueEntries = parsed.keyValues ? Object.entries(parsed.keyValues) : [];
    const flaggedSet = new Set((parsed.flaggedItems || []).map(f => f.toLowerCase()));
    const patientInfo = parsed.patientInfo || {};
    const doctorInfo = parsed.doctorInfo || {};
    const medications = parsed.medications || [];
    const investigations = parsed.investigations || [];
    const chiefComplaints = parsed.chiefComplaints || [];
    const diagnosis = parsed.diagnosis || [];
    const pastHistory = parsed.pastMedicalHistory || [];

    const TypeIcon = TYPE_ICONS[report.reportType] || FileText;

    return (
        <div className="pd-wrapper">
            <Sidebar />
            <main className="pd-content">
                <button className="rd-back-btn" onClick={() => navigate('/patient/reports')}>
                    <ArrowLeft size={16} /> Back to Reports
                </button>

                {/* ── Header ── */}
                <div className="rd-header">
                    <div className="rd-title-area">
                        <h1>{report.originalName}</h1>
                        <div className="rd-meta-row">
                            <span className="rd-badge rd-badge-type">
                                <TypeIcon size={14} /> {report.reportType?.replace(/_/g, ' ')}
                            </span>
                            <span className={`rd-badge ${isParsed ? 'rd-badge-parsed' : isFailed ? 'rd-badge-failed' : 'rd-badge-pending'}`}>
                                {isParsed ? <><CheckCircle2 size={12} /> Parsed</> : isFailed ? <><XCircle size={12} /> Failed</> : <><Loader2 size={12} className="rd-spin" /> Processing</>}
                            </span>
                            <span className="rd-date">
                                Uploaded {new Date(report.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                            {report.reportDate && (
                                <span className="rd-date">
                                    Report Date: {new Date(report.reportDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        className="rd-reparse-btn"
                        onClick={handleReparse}
                        disabled={reparsing}
                    >
                        {reparsing
                            ? <><Loader2 size={16} className="rd-spin" /> Re-analysing...</>
                            : <><RefreshCw size={16} /> Re-analyse</>}
                    </button>
                </div>

                {reparsing && (
                    <div className="rd-section rd-pending-state rd-full-width" style={{ marginBottom: '2rem' }}>
                        <Loader2 size={48} className="rd-pending-icon-svg rd-spin" />
                        <div className="rd-pending-title">Re-analysing Report...</div>
                        <div className="rd-pending-desc">
                            The AI is re-processing this document with our latest analysis engine.
                            This typically takes 10–20 seconds. The page will refresh automatically.
                        </div>
                    </div>
                )}

                {!isParsed && !isFailed ? (
                    <div className="rd-section rd-pending-state">
                        <Clock size={48} className="rd-pending-icon-svg" />
                        <div className="rd-pending-title">Analysis in Progress</div>
                        <div className="rd-pending-desc">
                            Our AI engine is extracting structured clinical data from your document.
                            This typically takes 10–30 seconds. Refresh to check for updates.
                        </div>
                    </div>
                ) : isFailed ? (
                    <div className="rd-section rd-pending-state">
                        <AlertTriangle size={48} className="rd-pending-icon-svg" />
                        <div className="rd-pending-title">Analysis Failed</div>
                        <div className="rd-pending-desc">
                            Our system was unable to process this document. This may happen with scanned images or
                            corrupted files. Please try re-uploading or contact support.
                        </div>
                    </div>
                ) : (
                    <div className="rd-grid">

                        {/* ── Patient & Doctor Info ── */}
                        {(patientInfo.name || doctorInfo.name) && (
                            <div className="rd-section rd-full-width">
                                <div className="rd-section-title">
                                    <User size={20} className="rd-section-icon-svg" />
                                    Patient & Doctor Information
                                </div>
                                <div className="rd-info-grid">
                                    {patientInfo.name && (
                                        <div className="rd-info-card">
                                            <div className="rd-info-card-header">
                                                <div className="rd-icon-box rd-icon-patient"><User size={18} /></div>
                                                <span className="rd-section-label">Patient</span>
                                            </div>
                                            <div className="rd-info-value">{patientInfo.name}</div>
                                            <div className="rd-info-sub">
                                                {[patientInfo.age, patientInfo.gender, patientInfo.id && `ID: ${patientInfo.id}`]
                                                    .filter(Boolean).join(' • ')}
                                            </div>
                                        </div>
                                    )}
                                    {doctorInfo.name && (
                                        <div className="rd-info-card">
                                            <div className="rd-info-card-header">
                                                <div className="rd-icon-box rd-icon-doctor"><Stethoscope size={18} /></div>
                                                <span className="rd-section-label">Doctor</span>
                                            </div>
                                            <div className="rd-info-value">{doctorInfo.name}</div>
                                            <div className="rd-info-sub">
                                                {[doctorInfo.specialization, doctorInfo.department, doctorInfo.hospital]
                                                    .filter(Boolean).join(' • ')}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── AI Summary ── */}
                        <div className="rd-section rd-full-width">
                            <div className="rd-section-title">
                                <Bot size={20} className="rd-section-icon-svg" />
                                AI Summary
                            </div>
                            <p className="rd-summary-text">
                                {parsed.summary || 'No summary available for this report.'}
                            </p>
                        </div>

                        {/* ── Chief Complaints ── */}
                        {chiefComplaints.length > 0 && (
                            <div className="rd-section">
                                <div className="rd-section-title">
                                    <Crosshair size={20} className="rd-section-icon-svg" />
                                    Chief Complaints
                                </div>
                                <ul className="rd-list">
                                    {chiefComplaints.map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                            </div>
                        )}

                        {/* ── Diagnosis ── */}
                        {diagnosis.length > 0 && (
                            <div className="rd-section">
                                <div className="rd-section-title">
                                    <ClipboardList size={20} className="rd-section-icon-svg" />
                                    Diagnosis / Impressions
                                </div>
                                <div className="rd-flagged-list">
                                    {diagnosis.map((d, i) => (
                                        <span key={i} className="rd-diagnosis-chip">{d}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── History of Present Illness ── */}
                        {parsed.historyOfPresentIllness && (
                            <div className="rd-section rd-full-width">
                                <div className="rd-section-title">
                                    <BookOpenText size={20} className="rd-section-icon-svg" />
                                    History of Present Illness
                                </div>
                                <p className="rd-summary-text">{parsed.historyOfPresentIllness}</p>
                            </div>
                        )}

                        {/* ── Past Medical History ── */}
                        {pastHistory.length > 0 && (
                            <div className="rd-section">
                                <div className="rd-section-title">
                                    <History size={20} className="rd-section-icon-svg" />
                                    Past Medical History
                                </div>
                                <ul className="rd-list">
                                    {pastHistory.map((h, i) => <li key={i}>{h}</li>)}
                                </ul>
                            </div>
                        )}

                        {/* ── Medications / Prescriptions ── */}
                        {medications.length > 0 && (
                            <div className="rd-section rd-full-width">
                                <div className="rd-section-title">
                                    <Pill size={20} className="rd-section-icon-svg" />
                                    Medications & Prescriptions
                                </div>
                                <table className="rd-kv-table">
                                    <thead>
                                        <tr>
                                            <th>Medication</th>
                                            <th>Dosage</th>
                                            <th>Frequency</th>
                                            <th>Duration</th>
                                            <th>Route</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {medications.map((med, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: 600 }}>{med.name || med}</td>
                                                <td>{med.dosage || '—'}</td>
                                                <td>{med.frequency || '—'}</td>
                                                <td>{med.duration || '—'}</td>
                                                <td>{med.route || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ── Investigations / Test Results ── */}
                        {investigations.length > 0 && (
                            <div className="rd-section rd-full-width">
                                <div className="rd-section-title">
                                    <Microscope size={20} className="rd-section-icon-svg" />
                                    Investigation Results
                                </div>
                                <table className="rd-kv-table">
                                    <thead>
                                        <tr>
                                            <th>Test / Investigation</th>
                                            <th>Result</th>
                                            <th>Normal Range</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {investigations.map((inv, i) => (
                                            <tr key={i} className={inv.status === 'abnormal' || inv.status === 'critical' ? 'rd-kv-flagged' : ''}>
                                                <td style={{ fontWeight: 600 }}>
                                                    {(inv.status === 'abnormal' || inv.status === 'critical') && (
                                                        <AlertCircle size={14} style={{ marginRight: '0.4rem', color: '#dc2626', verticalAlign: 'middle' }} />
                                                    )}
                                                    {inv.name || inv}
                                                </td>
                                                <td>{inv.result || '—'}</td>
                                                <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{inv.normalRange || '—'}</td>
                                                <td>
                                                    {inv.status && (
                                                        <span className={`rd-badge ${inv.status === 'normal' ? 'rd-badge-parsed' : inv.status === 'critical' ? 'rd-badge-failed' : inv.status === 'abnormal' ? 'rd-badge-pending' : ''}`}>
                                                            {inv.status}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ── Key Values (legacy / additional) ── */}
                        {keyValueEntries.length > 0 && investigations.length === 0 && (
                            <div className="rd-section rd-full-width">
                                <div className="rd-section-title">
                                    <BarChart3 size={20} className="rd-section-icon-svg" />
                                    Extracted Test Values
                                </div>
                                <table className="rd-kv-table">
                                    <thead>
                                        <tr>
                                            <th>Parameter</th>
                                            <th>Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {keyValueEntries.map(([key, value]) => {
                                            const isFlagged = flaggedSet.has(key.toLowerCase()) ||
                                                (parsed.flaggedItems || []).some(f =>
                                                    key.toLowerCase().includes(f.toLowerCase()) ||
                                                    f.toLowerCase().includes(key.toLowerCase())
                                                );
                                            return (
                                                <tr key={key} className={isFlagged ? 'rd-kv-flagged' : ''}>
                                                    <td>
                                                        {isFlagged && <AlertCircle size={14} style={{ marginRight: '0.4rem', color: '#dc2626', verticalAlign: 'middle' }} />}
                                                        {key.replace(/_/g, ' ')}
                                                    </td>
                                                    <td>{value}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ── Flagged Items ── */}
                        {parsed.flaggedItems?.length > 0 && (
                            <div className="rd-section rd-full-width">
                                <div className="rd-section-title">
                                    <TriangleAlert size={20} className="rd-section-icon-svg" />
                                    Flagged Items
                                </div>
                                <div className="rd-flagged-list">
                                    {parsed.flaggedItems.map((item, i) => (
                                        <span key={i} className="rd-flag-chip">{item}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Follow-Up Plan ── */}
                        {parsed.followUp && (
                            <div className="rd-section rd-full-width">
                                <div className="rd-section-title">
                                    <CalendarCheck size={20} className="rd-section-icon-svg" />
                                    Follow-Up Plan
                                </div>
                                <p className="rd-summary-text">{parsed.followUp}</p>
                            </div>
                        )}

                        {/* ── ClinicalBERT Entities ── */}
                        <div className="rd-section rd-full-width">
                            <div className="rd-section-title">
                                <Dna size={20} className="rd-section-icon-svg" />
                                ClinicalBERT Entity Extraction
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--pd-text-muted)', marginBottom: '1.5rem' }}>
                                ClinicalBERT extracts and structures clinical information from medical documents.
                            </p>
                            <div className="rd-entity-grid">
                                <EntityCard type="symptoms" icon={<Thermometer size={16} />} label="Symptoms" items={entities.symptoms || []} />
                                <EntityCard type="conditions" icon={<Heart size={16} />} label="Conditions" items={entities.conditions || []} />
                                <EntityCard type="medications" icon={<Pill size={16} />} label="Medications" items={entities.medications || []} />
                                <EntityCard type="tests" icon={<FlaskConical size={16} />} label="Tests & Labs" items={entities.tests || []} />
                            </div>
                        </div>

                        {/* ── Document Classification ── */}
                        <div className="rd-section rd-full-width">
                            <div className="rd-section-title">
                                <Tag size={20} className="rd-section-icon-svg" />
                                Document Classification
                            </div>
                            <div className="rd-class-grid">
                                <div className="rd-class-item">
                                    <div className="rd-section-label">Document Type</div>
                                    <div className="rd-class-value">
                                        {(classification.docType || 'Unknown').replace(/_/g, ' ')}
                                    </div>
                                </div>
                                <div className="rd-class-item">
                                    <div className="rd-section-label">Consultation</div>
                                    <div className="rd-class-value">
                                        {(classification.consultationType || 'Routine').replace(/_/g, ' ')}
                                    </div>
                                </div>
                                <div className="rd-class-item">
                                    <div className="rd-section-label">Confidence</div>
                                    <div className="rd-class-value">
                                        {Math.round((classification.confidence || 0) * 100)}%
                                    </div>
                                    <div className="rd-confidence-track">
                                        <div
                                            className="rd-confidence-fill"
                                            style={{ width: `${Math.round((classification.confidence || 0) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Doctor Notes (if any) ── */}
                        {report.doctorNotes && (
                            <div className="rd-section rd-full-width">
                                <div className="rd-section-title">
                                    <UserPen size={20} className="rd-section-icon-svg" />
                                    Doctor Notes
                                </div>
                                <p className="rd-summary-text">{report.doctorNotes}</p>
                                {report.reviewedAt && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--pd-text-muted)', marginTop: '1rem' }}>
                                        Reviewed on {new Date(report.reviewedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* ── Disclaimer ── */}
                        <div className="rd-disclaimer rd-full-width">
                            <Info size={20} className="rd-disclaimer-icon-svg" />
                            <div>
                                <strong>Important:</strong> This analysis is generated by automated AI tools (ClinicalBERT
                                and LLM). It is a decision-support summary only — not a medical diagnosis. All clinical
                                interpretation and decisions must be made by a licensed healthcare professional. Always
                                consult your doctor for personal medical guidance.
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

/* ── Sub-component: Entity Category Card ── */
function EntityCard({ type, icon, label, items }) {
    return (
        <div className={`rd-entity-card rd-entity-${type}`}>
            <div className="rd-entity-card-header">
                <div className="rd-entity-card-icon">{icon}</div>
                <div className="rd-entity-card-label">{label}</div>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--pd-text-muted)', fontWeight: 600 }}>
                    {items.length}
                </span>
            </div>
            <div className="rd-entity-chips">
                {items.length > 0 ? items.map((item, i) => (
                    <span key={i} className="rd-entity-chip">{item}</span>
                )) : (
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>None detected</span>
                )}
            </div>
        </div>
    );
}
