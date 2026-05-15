import { useState } from 'react';
import { Trash2, Plus, Lock } from 'lucide-react';

const CATEGORIES = ['general', 'diagnosis', 'treatment', 'followup', 'alert'];

function NoteCard({ note, canDelete, onDelete }) {
    const initials = note.addedBy
        ? `${note.addedBy.firstName?.[0] || ''}${note.addedBy.lastName?.[0] || ''}`
        : '?';
    const name = note.addedBy ? `Dr. ${note.addedBy.firstName} ${note.addedBy.lastName}` : 'Unknown';

    return (
        <div className="ehr-note">
            <div className="ehr-note-header">
                <div className="ehr-note-author">
                    <div className="ehr-note-avatar">{initials}</div>
                    <div>
                        <div>{name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 400 }}>{note.role}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {note.isPrivate && (
                        <span title="Private note" style={{ color: 'var(--text-dim)' }}><Lock size={13} /></span>
                    )}
                    <span className="ehr-note-category">{note.category}</span>
                    <span className="ehr-note-time">
                        {note.createdAt ? new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </span>
                    {canDelete && (
                        <button
                            onClick={() => onDelete(note._id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '0.2rem' }}
                            title="Delete note"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
            <div className="ehr-note-text">{note.text}</div>
        </div>
    );
}

export default function DoctorNotes({ notes = [], patientId, canAdd = false, canDelete = false, onAdd, onDelete, loading = false }) {
    const [text, setText] = useState('');
    const [category, setCategory] = useState('general');
    const [isPrivate, setIsPrivate] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        setSubmitting(true);
        setError('');
        try {
            await onAdd?.({ text: text.trim(), category, isPrivate });
            setText('');
        } catch (err) {
            setError(err.message || 'Failed to add note.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            {canAdd && (
                <div className="ehr-note-add-form">
                    <div className="ehr-note-add-title">Add Clinical Note</div>
                    <form onSubmit={handleSubmit}>
                        <textarea
                            className="form-input"
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="Enter clinical note, diagnosis, treatment plan, or follow-up instructions..."
                            rows={3}
                            style={{ resize: 'vertical', marginBottom: '0.75rem' }}
                        />
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <select
                                className="form-input"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                style={{ width: 'auto', minWidth: 130 }}
                            >
                                {CATEGORIES.map(c => (
                                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                ))}
                            </select>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={isPrivate}
                                    onChange={e => setIsPrivate(e.target.checked)}
                                />
                                Private (patient cannot see)
                            </label>
                            <button
                                type="submit"
                                className="btn btn-primary btn-sm"
                                disabled={submitting || !text.trim()}
                                style={{ marginLeft: 'auto' }}
                            >
                                <Plus size={14} /> {submitting ? 'Saving...' : 'Add Note'}
                            </button>
                        </div>
                        {error && <div style={{ color: '#fca5a5', fontSize: '0.82rem', marginTop: '0.5rem' }}>{error}</div>}
                    </form>
                </div>
            )}

            {loading ? (
                <div className="ehr-loading"><div className="spinner" /></div>
            ) : notes.length === 0 ? (
                <div className="ehr-empty">
                    <div className="ehr-empty-icon">📝</div>
                    <div className="ehr-empty-text">No clinical notes recorded.</div>
                </div>
            ) : (
                <div className="ehr-notes-list">
                    {notes.map((note, i) => (
                        <NoteCard
                            key={note._id || i}
                            note={note}
                            canDelete={canDelete}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
