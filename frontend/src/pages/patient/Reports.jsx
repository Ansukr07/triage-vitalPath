import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { reportService } from '../../api/services';
import {
    UploadCloud,
    Loader2,
    FileText,
    TestTubes,
    Bone,
    Trash2,
    AlertCircle,
    CheckCircle2,
    FolderOpen,
    Dna,
    MoveRight,
    Sparkles,
    Activity,
    ShieldCheck,
    Eye,
    X,
    ChevronDown,
    ChevronUp,
    Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './PatientDashboard.css';

const REPORT_TYPES = ['blood_test', 'xray', 'mri', 'ct_scan', 'ecg', 'urine_test', 'biopsy', 'prescription', 'discharge_summary', 'other'];

export default function Reports() {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [reportType, setReportType] = useState('other');
    const [reportDate, setReportDate] = useState('');
    const [selected, setSelected] = useState(null);

    // AI Health Report state
    const [generatingReport, setGeneratingReport] = useState(false);
    const [aiReport, setAiReport] = useState(null);
    const [aiReportError, setAiReportError] = useState('');
    const [showAiReport, setShowAiReport] = useState(false);

    const handleGenerateReport = async () => {
        setGeneratingReport(true);
        setAiReportError('');
        setAiReport(null);
        try {
            const res = await reportService.generateSummary();
            setAiReport(res.data.data);
            setShowAiReport(true);
        } catch (err) {
            setAiReportError(err.response?.data?.message || 'Report generation failed. Please try again.');
        } finally {
            setGeneratingReport(false);
        }
    };

    const downloadPDF = (rawReport) => {
        // Safety guard: if overview is a raw JSON string (fallback path), re-parse it
        let report = rawReport;
        if (typeof rawReport?.overview === 'string' && rawReport.overview.trim().startsWith('{')) {
            try {
                const inner = rawReport.overview.trim();
                const start = inner.indexOf('{');
                const end = inner.lastIndexOf('}');
                const parsed = JSON.parse(inner.slice(start, end + 1));
                report = { ...parsed, generatedAt: rawReport.generatedAt || parsed.generatedAt };
            } catch { /* keep rawReport */ }
        }
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const margin = 18;
        const contentW = pageW - margin * 2;
        let y = 0;

        // ── Header band ──────────────────────────────────────────────
        // Minimal brand header
        doc.setFillColor(248, 250, 252); // Very light slate
        doc.rect(0, 0, pageW, 28, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.line(0, 28, pageW, 28);
        
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('VitalPath Health', margin, 12);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text('Comprehensive Personal Health Summary', margin, 19);
        doc.setFontSize(8);
        doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, pageW - margin, 19, { align: 'right' });
        y = 38;

        // ── Title ────────────────────────────────────────────────────
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(report.title || 'Comprehensive Health Summary', margin, y);
        y += 10;

        const addSection = (title, body) => {
            if (!body) return;
            if (y > 260) { doc.addPage(); y = 20; }
            // Minimal section label with thin bottom border
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(title.toUpperCase(), margin, y);
            y += 2;
            doc.setDrawColor(226, 232, 240);
            doc.line(margin, y, pageW - margin, y);
            y += 6;
            
            // body text
            doc.setTextColor(51, 65, 85);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            const lines = doc.splitTextToSize(body, contentW);
            lines.forEach(line => {
                if (y > 275) { doc.addPage(); y = 20; }
                doc.text(line, margin, y);
                y += 5;
            });
            y += 6;
        };

        const addBullets = (items) => {
            if (!items || !items.length) return;
            doc.setTextColor(51, 65, 85);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            items.forEach(item => {
                if (y > 275) { doc.addPage(); y = 20; }
                const lines = doc.splitTextToSize(`•  ${item}`, contentW - 4);
                lines.forEach((line, i) => {
                    // Indent continuation lines slightly
                    const xIndent = i === 0 ? margin + 2 : margin + 5;
                    doc.text(line, xIndent, y);
                    y += 5;
                });
                y += 1;
            });
            y += 5;
        };

        // ── Overview ─────────────────────────────────────────────────
        addSection('Overview', report.overview);

        // ── Vitals ───────────────────────────────────────────────────
        if (report.vitalsSnapshot) {
            addSection('Vitals Snapshot', report.vitalsSnapshot.summary);
            addBullets(report.vitalsSnapshot.highlights);
        }

        // ── Symptoms ─────────────────────────────────────────────────
        if (report.symptomsOverview) {
            addSection('Reported Symptoms', report.symptomsOverview.summary);
            addBullets(report.symptomsOverview.recentSymptoms);
        }

        // ── Report Insights ──────────────────────────────────────────
        if (report.reportsInsights) {
            addSection('Clinical Report Insights', report.reportsInsights.summary);
            addBullets(report.reportsInsights.keyFindings);
        }

        // ── Triage History ───────────────────────────────────────────
        if (report.triageHistory) {
            addSection('Triage History', report.triageHistory.summary);
            addBullets(report.triageHistory.assessments);
        } else if (report.triageStatus) {
            // Fallback for older format
            const lvl = (report.triageStatus.level || 'unknown').toUpperCase();
            addSection('Triage Status', `Level: ${lvl}\n${report.triageStatus.message}`);
        }

        // ── Chat Insights ────────────────────────────────────────────
        if (report.chatInsights) {
            addSection('AI Chat Insights', report.chatInsights.summary);
            addBullets(report.chatInsights.keyTopics);
        }

        // ── Watch Points ─────────────────────────────────────────────
        if (report.watchPoints?.length) {
            addSection('Watch Points for Discussion', 'Items to discuss with your doctor:');
            addBullets(report.watchPoints);
        }

        // ── Disclaimer footer ────────────────────────────────────────
        if (y > 255) { doc.addPage(); y = 20; }
        y += 4;
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y, pageW - margin, y);
        y += 5;
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'italic');
        const disclaimerLines = doc.splitTextToSize(
            report.disclaimer || 'This report is generated by VitalPath AI for informational purposes only. Please consult your doctor for clinical advice.',
            contentW
        );
        disclaimerLines.forEach(line => { doc.text(line, margin, y); y += 4.5; });

        // ── Page numbers ─────────────────────────────────────────────
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(148, 163, 184);
            doc.setFont('helvetica', 'normal');
            doc.text(`Page ${i} of ${totalPages}  |  VitalPath Health Summary`, pageW / 2, 290, { align: 'center' });
        }

        const filename = `VitalPath_HealthReport_${new Date().toISOString().slice(0,10)}.pdf`;
        doc.save(filename);
    };

    const fetchReports = async () => {
        try {
            const res = await reportService.list();
            setReports(res.data.data);
        } catch { setError('Unable to load reports.'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchReports(); }, []);

    const onDrop = useCallback(async (acceptedFiles) => {
        if (!acceptedFiles.length) return;
        const file = acceptedFiles[0];
        setUploading(true); setError(''); setSuccess('');
        try {
            const fd = new FormData();
            fd.append('report', file);
            fd.append('reportType', reportType);
            if (reportDate) fd.append('reportDate', reportDate);
            await reportService.upload(fd);
            setSuccess('Report uploaded! Our AI engine is parsing your document.');
            fetchReports();
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed.');
        } finally { setUploading(false); }
    }, [reportType, reportDate]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }, maxFiles: 1,
    });

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this report?')) return;
        try { await reportService.delete(id); setReports(reports.filter(r => r._id !== id)); }
        catch { setError('Delete failed.'); }
    };

    return (
        <div className="pd-wrapper">
            <Sidebar />
            <main className="pd-content">
                <header className="pd-page-header">
                    <h1 className="pd-page-title">Medical Documents</h1>
                    <p className="pd-page-desc">Securely upload and manage your medical records. Our AI engine automatically extracts key information for your care team.</p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2.5rem' }}>
                    {/* Left Column: Upload + AI Report */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* ── AI Health Report Generator Card ── */}
                        <div className="pd-section-card" style={{
                            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                            border: '1px solid rgba(99,102,241,0.35)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* glow blob */}
                            <div style={{
                                position: 'absolute', top: -40, right: -40,
                                width: 140, height: 140, borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
                                pointerEvents: 'none'
                            }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: '10px',
                                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Sparkles size={18} color="#fff" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>AI Health Report</h3>
                                    <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>Generated from your health data</p>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                                VitalPath AI reads your vitals, symptoms, uploaded reports &amp; triage history to produce a structured personal health summary.
                            </p>
                            {aiReportError && (
                                <div style={{ background: '#450a0a', color: '#fca5a5', padding: '0.65rem 1rem', borderRadius: '10px', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <AlertCircle size={14} /> {aiReportError}
                                </div>
                            )}
                            <button
                                id="generate-ai-report-btn"
                                onClick={handleGenerateReport}
                                disabled={generatingReport}
                                style={{
                                    width: '100%',
                                    background: generatingReport ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                    color: '#fff', border: 'none', borderRadius: '12px',
                                    padding: '0.75rem 1rem', fontSize: '0.88rem', fontWeight: 700,
                                    cursor: generatingReport ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {generatingReport
                                    ? <><Loader2 size={16} className="rd-spin" /> Generating Report&hellip;</>
                                    : <><Sparkles size={16} /> Generate My Health Report</>
                                }
                            </button>
                            {aiReport && (
                                <>
                                <button
                                    onClick={() => setShowAiReport(v => !v)}
                                    style={{
                                        marginTop: '0.75rem', width: '100%', background: 'rgba(99,102,241,0.12)',
                                        color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)',
                                        borderRadius: '10px', padding: '0.6rem', fontSize: '0.82rem',
                                        fontWeight: 600, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                                    }}
                                >
                                    {showAiReport ? <><ChevronUp size={14}/> Hide Report</> : <><Eye size={14}/> View Last Report</>}
                                </button>
                                <button
                                    onClick={() => downloadPDF(aiReport)}
                                    style={{
                                        marginTop: '0.5rem', width: '100%',
                                        background: 'linear-gradient(135deg,#10b981,#059669)',
                                        color: '#fff', border: 'none', borderRadius: '10px',
                                        padding: '0.6rem', fontSize: '0.82rem', fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                                    }}
                                >
                                    <Download size={14}/> Download PDF
                                </button>
                                </>
                            )}
                        </div>

                        <div className="pd-section-card">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Upload Record</h2>

                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label className="pd-app-role" style={{ marginBottom: '0.5rem', display: 'block' }}>Document Type</label>
                                <select className="pd-urgent-btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', width: '100%', borderRadius: '12px', padding: '0 1rem' }} value={reportType} onChange={(e) => setReportType(e.target.value)}>
                                    {REPORT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="pd-app-role" style={{ marginBottom: '0.5rem', display: 'block' }}>Date (optional)</label>
                                <input className="pd-urgent-btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', width: '100%', borderRadius: '12px', padding: '0 1rem', textAlign: 'left' }} type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
                            </div>

                            <div {...getRootProps()} style={{
                                border: `2px dashed ${isDragActive ? 'var(--pd-accent)' : '#e2e8f0'}`,
                                borderRadius: '24px', padding: '2.5rem 1.5rem', textAlign: 'center', cursor: 'pointer',
                                background: isDragActive ? '#f0f9ff' : '#f8fafc',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative'
                            }}>
                                <input {...getInputProps()} />
                                <div style={{ display: 'flex', justifyContent: 'center', color: isDragActive ? 'var(--pd-accent)' : '#94a3b8', marginBottom: '1rem' }}>
                                    {uploading ? <Loader2 size={48} className="rd-spin" /> : <UploadCloud size={48} />}
                                </div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: isDragActive ? 'var(--pd-accent)' : 'inherit' }}>
                                    {uploading ? 'Processing...' : isDragActive ? 'Drop File' : 'Drop file or click'}
                                </h3>
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>PDF or Images up to 10MB</p>
                            </div>

                            {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '12px', marginTop: '1.5rem', border: '1px solid #fecaca', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={16} /> {error}</div>}
                            {success && <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem 1rem', borderRadius: '12px', marginTop: '1.5rem', border: '1px solid #bbf7d0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} /> {success}</div>}
                        </div>
                    </div>

                    {/* Right Column: AI Report Panel + Vault List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* ── AI Report Result Panel ── */}
                        {showAiReport && aiReport && (
                            <div className="fade-in pd-section-card" style={{
                                background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
                                border: '1px solid rgba(99,102,241,0.3)',
                                position: 'relative'
                            }}>
                                <div style={{ position:'absolute', top:16, right:16, display:'flex', gap:'0.5rem', alignItems:'center' }}>
                                    <button
                                        onClick={() => downloadPDF(aiReport)}
                                        style={{
                                            background: 'linear-gradient(135deg,#10b981,#059669)',
                                            color:'#fff', border:'none', borderRadius:'8px',
                                            padding:'0.4rem 0.8rem', fontSize:'0.78rem', fontWeight:700,
                                            cursor:'pointer', display:'flex', alignItems:'center', gap:'0.35rem'
                                        }}
                                    >
                                        <Download size={13}/> Download PDF
                                    </button>
                                    <button
                                        onClick={() => setShowAiReport(false)}
                                        style={{ background:'transparent', border:'none', color:'#64748b', cursor:'pointer' }}
                                    ><X size={18}/></button>
                                </div>

                                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.5rem' }}>
                                    <Sparkles size={20} color="#818cf8" />
                                    <div>
                                        <h3 style={{ margin:0, color:'#f1f5f9', fontWeight:800, fontSize:'1.05rem' }}>{aiReport.title || 'Personal Health Summary'}</h3>
                                        <p style={{ margin:0, fontSize:'0.72rem', color:'#64748b' }}>Generated {new Date(aiReport.generatedAt).toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Overview */}
                                {aiReport.overview && (
                                    <div style={{ marginBottom:'1.25rem', padding:'1rem', background:'rgba(99,102,241,0.07)', borderRadius:'12px', border:'1px solid rgba(99,102,241,0.15)' }}>
                                        <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#818cf8', textTransform:'uppercase', marginBottom:'0.4rem' }}>Overview</div>
                                        <p style={{ margin:0, color:'#cbd5e1', fontSize:'0.88rem', lineHeight:1.6 }}>{aiReport.overview}</p>
                                    </div>
                                )}

                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
                                    {/* Vitals */}
                                    {aiReport.vitalsSnapshot && (
                                        <div style={{ padding:'1rem', background:'rgba(16,185,129,0.07)', borderRadius:'12px', border:'1px solid rgba(16,185,129,0.2)' }}>
                                            <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#34d399', textTransform:'uppercase', marginBottom:'0.4rem', display:'flex', gap:'0.4rem', alignItems:'center' }}><Activity size={12}/>Vitals</div>
                                            <p style={{ margin:'0 0 0.5rem', color:'#94a3b8', fontSize:'0.8rem', lineHeight:1.5 }}>{aiReport.vitalsSnapshot.summary}</p>
                                            {aiReport.vitalsSnapshot.highlights?.map((h,i) => (
                                                <div key={i} style={{ fontSize:'0.75rem', color:'#6ee7b7', background:'rgba(16,185,129,0.1)', borderRadius:'6px', padding:'0.2rem 0.5rem', marginBottom:'0.3rem' }}>• {h}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* Symptoms */}
                                {aiReport.symptomsOverview && (
                                    <div style={{ marginBottom:'1.25rem', padding:'1rem', background:'rgba(239,68,68,0.06)', borderRadius:'12px', border:'1px solid rgba(239,68,68,0.15)' }}>
                                        <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#f87171', textTransform:'uppercase', marginBottom:'0.4rem' }}>Reported Symptoms</div>
                                        <p style={{ margin:'0 0 0.6rem', color:'#94a3b8', fontSize:'0.82rem' }}>{aiReport.symptomsOverview.summary}</p>
                                        <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
                                            {aiReport.symptomsOverview.recentSymptoms?.map((s,i) => (
                                                <span key={i} style={{ fontSize:'0.75rem', background:'rgba(239,68,68,0.12)', color:'#fca5a5', padding:'0.2rem 0.55rem', borderRadius:'6px' }}>{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
                                    {/* Reports Insights */}
                                    {aiReport.reportsInsights && (
                                        <div style={{ padding:'1rem', background:'rgba(59,130,246,0.06)', borderRadius:'12px', border:'1px solid rgba(59,130,246,0.15)' }}>
                                            <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#60a5fa', textTransform:'uppercase', marginBottom:'0.4rem' }}>Report Insights</div>
                                            <p style={{ margin:'0 0 0.6rem', color:'#94a3b8', fontSize:'0.82rem' }}>{aiReport.reportsInsights.summary}</p>
                                            {aiReport.reportsInsights.keyFindings?.map((f,i) => (
                                                <div key={i} style={{ fontSize:'0.78rem', color:'#93c5fd', marginBottom:'0.3rem' }}>→ {f}</div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Triage History */}
                                    {aiReport.triageHistory ? (
                                        <div style={{ padding:'1rem', background:'rgba(245,158,11,0.07)', borderRadius:'12px', border:'1px solid rgba(245,158,11,0.2)' }}>
                                            <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#fbbf24', textTransform:'uppercase', marginBottom:'0.4rem', display:'flex', gap:'0.4rem', alignItems:'center' }}><ShieldCheck size={12}/>Triage History</div>
                                            <p style={{ margin:'0 0 0.6rem', color:'#94a3b8', fontSize:'0.82rem' }}>{aiReport.triageHistory.summary}</p>
                                            {aiReport.triageHistory.assessments?.map((a,i) => (
                                                <div key={i} style={{ fontSize:'0.78rem', color:'#fcd34d', marginBottom:'0.3rem' }}>• {a}</div>
                                            ))}
                                        </div>
                                    ) : aiReport.triageStatus ? (
                                        <div style={{ padding:'1rem', background:'rgba(245,158,11,0.07)', borderRadius:'12px', border:'1px solid rgba(245,158,11,0.2)' }}>
                                            <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#fbbf24', textTransform:'uppercase', marginBottom:'0.4rem', display:'flex', gap:'0.4rem', alignItems:'center' }}><ShieldCheck size={12}/>Triage Status</div>
                                            <span style={{
                                                display:'inline-block', padding:'0.25rem 0.65rem', borderRadius:'20px', fontSize:'0.75rem', fontWeight:800, marginBottom:'0.5rem',
                                                background: aiReport.triageStatus.level === 'stable' ? '#052e16' : aiReport.triageStatus.level === 'critical' ? '#450a0a' : '#422006',
                                                color: aiReport.triageStatus.level === 'stable' ? '#4ade80' : aiReport.triageStatus.level === 'critical' ? '#f87171' : '#fb923c'
                                            }}>{(aiReport.triageStatus.level || 'unknown').toUpperCase()}</span>
                                            <p style={{ margin:0, color:'#94a3b8', fontSize:'0.8rem', lineHeight:1.5 }}>{aiReport.triageStatus.message}</p>
                                        </div>
                                    ) : null}
                                </div>

                                {/* Chat Insights */}
                                {aiReport.chatInsights && (
                                    <div style={{ marginBottom:'1.25rem', padding:'1rem', background:'rgba(168,85,247,0.06)', borderRadius:'12px', border:'1px solid rgba(168,85,247,0.15)' }}>
                                        <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#c084fc', textTransform:'uppercase', marginBottom:'0.4rem' }}>AI Chat Insights</div>
                                        <p style={{ margin:'0 0 0.6rem', color:'#94a3b8', fontSize:'0.82rem' }}>{aiReport.chatInsights.summary}</p>
                                        <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
                                            {aiReport.chatInsights.keyTopics?.map((topic,i) => (
                                                <span key={i} style={{ fontSize:'0.75rem', background:'rgba(168,85,247,0.12)', color:'#d8b4fe', padding:'0.2rem 0.55rem', borderRadius:'6px' }}>{topic}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Watch Points */}
                                {aiReport.watchPoints?.length > 0 && (
                                    <div style={{ marginBottom:'1rem', padding:'1rem', background:'rgba(168,85,247,0.06)', borderRadius:'12px', border:'1px solid rgba(168,85,247,0.15)' }}>
                                        <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#c084fc', textTransform:'uppercase', marginBottom:'0.6rem' }}>Watch Points</div>
                                        {aiReport.watchPoints.map((w,i) => (
                                            <div key={i} style={{ fontSize:'0.78rem', color:'#d8b4fe', marginBottom:'0.35rem' }}>⚠ {w}</div>
                                        ))}
                                    </div>
                                )}

                                {/* Disclaimer */}
                                <div style={{ display:'flex', gap:'0.5rem', alignItems:'flex-start', padding:'0.75rem 1rem', background:'rgba(255,255,255,0.03)', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.06)' }}>
                                    <AlertCircle size={13} style={{ color:'#475569', flexShrink:0, marginTop:2 }} />
                                    <p style={{ margin:0, fontSize:'0.72rem', color:'#475569', lineHeight:1.5 }}>{aiReport.disclaimer}</p>
                                </div>
                            </div>
                        )}

                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Vault History
                            <span style={{ fontSize: '0.9rem', color: 'var(--pd-text-muted)', fontWeight: 500 }}>{reports.length} records</span>
                        </h2>

                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {reports.length === 0 && (
                                    <div className="pd-section-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', opacity: 0.3, color: '#94a3b8' }}>
                                            <FolderOpen size={48} />
                                        </div>
                                        <p style={{ color: 'var(--pd-text-muted)', fontWeight: 600 }}>No documents found in your vault.</p>
                                    </div>
                                )}
                                {reports.map((r) => (
                                    <div key={r._id}
                                        className="pd-section-card"
                                        style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s', border: selected?._id === r._id ? '2px solid var(--pd-accent)' : '1px solid var(--pd-border)' }}
                                        onClick={() => setSelected(selected?._id === r._id ? null : r)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                                <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                                    {r.reportType === 'blood_test' ? <TestTubes size={24} /> : r.reportType === 'xray' ? <Bone size={24} /> : <FileText size={24} />}
                                                </div>
                                                <div>
                                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{r.originalName}</h3>
                                                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                                                        <span style={{ textTransform: 'uppercase' }}>{r.reportType?.replace(/_/g, ' ')}</span>
                                                        <span>•</span>
                                                        <span>{new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                <span style={{
                                                    padding: '0.4rem 0.75rem', borderRadius: '30px', fontSize: '0.7rem', fontWeight: 800,
                                                    background: r.parsedData?.parseStatus === 'done' ? '#dcfce7' : '#fef3c7',
                                                    color: r.parsedData?.parseStatus === 'done' ? '#166534' : '#92400e'
                                                }}>
                                                    {r.parsedData?.parseStatus === 'done' ? 'PARSED' : 'PENDING'}
                                                </span>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(r._id); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        {selected?._id === r._id && (
                                            <div className="fade-in" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                                                {r.parsedData?.summary ? (
                                                    <>
                                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--pd-accent)', marginBottom: '0.75rem' }}>AI Insight Summary</h4>
                                                        <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.5rem' }}>{r.parsedData.summary}</p>

                                                        {r.parsedData.flaggedItems?.length > 0 && (
                                                            <div style={{ marginBottom: '1.5rem' }}>
                                                                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#ef4444', marginBottom: '0.75rem' }}>Flagged Items</h4>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                                    {r.parsedData.flaggedItems.map((item, i) => (
                                                                        <span key={i} style={{ background: '#fee2e2', color: '#991b1b', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                            <AlertCircle size={12} /> {item}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', border: '1px solid #f1f5f9', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                                                            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                                                            <div>Note: This summary is generated via automated analysis. Please review the full document with your physician for clinical interpretation.</div>
                                                        </div>

                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/patient/reports/${r._id}`); }}
                                                            style={{
                                                                background: 'var(--pd-accent)', color: '#fff', border: 'none', borderRadius: '12px',
                                                                padding: '0.65rem 1.25rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                                                                transition: 'all 0.2s', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                                            }}
                                                        >
                                                            View Full Analysis <MoveRight size={16} />
                                                        </button>

                                                        {/* ClinicalBERT Structured Entities */}
                                                        {r.clinicalEntities && (
                                                            <div style={{ marginTop: '1.5rem', background: 'rgba(59, 130, 246, 0.03)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                                                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e40af', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    <Dna size={16} /> ClinicalBERT Extraction
                                                                </h4>

                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                                    <div>
                                                                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, marginBottom: '0.25rem' }}>DOC TYPE</div>
                                                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>{r.bertClassification?.docType || 'General'}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, marginBottom: '0.25rem' }}>CONSULTATION</div>
                                                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>{r.bertClassification?.consultationType || 'Routine'}</div>
                                                                    </div>
                                                                </div>

                                                                <div style={{ marginTop: '1rem' }}>
                                                                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, marginBottom: '0.5rem' }}>EXTRACTED SYMPTOMS & MEDICATIONS</div>
                                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                                                        {r.clinicalEntities.symptoms?.map((s, i) => <span key={i} style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#3b82f6', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{s}</span>)}
                                                                        {r.clinicalEntities.medications?.map((m, i) => <span key={i} style={{ fontSize: '0.75rem', background: '#ecfdf5', color: '#10b981', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{m}</span>)}
                                                                        {(!r.clinicalEntities.symptoms?.length && !r.clinicalEntities.medications?.length) && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No clinical entities identified.</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', padding: '1rem' }}>Parsing is in progress. Check back soon for AI insights.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
