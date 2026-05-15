import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './LanguagePicker.css';

/**
 * LanguagePicker — a compact pill-style language switcher.
 * Renders EN / हि / ಕ buttons.
 */
export default function LanguagePicker({ compact = false }) {
    const { langCode, setLanguage, languages } = useLanguage();

    return (
        <div className={`lang-picker ${compact ? 'lang-picker-compact' : ''}`} title="Select language">
            {languages.map(l => (
                <button
                    key={l.code}
                    className={`lang-btn ${langCode === l.code ? 'lang-btn-active' : ''}`}
                    onClick={() => setLanguage(l.code)}
                    title={l.label}
                >
                    {compact ? l.nativeName.slice(0, 2) : l.nativeName}
                </button>
            ))}
        </div>
    );
}
