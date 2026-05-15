import React, { createContext, useContext, useState, useCallback } from 'react';
import { LANGUAGES, getLangByCode } from '../utils/translate';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [langCode, setLangCode] = useState('en'); // default English

    const setLanguage = useCallback((code) => {
        if (LANGUAGES.find(l => l.code === code)) setLangCode(code);
    }, []);

    const lang = getLangByCode(langCode);

    return (
        <LanguageContext.Provider value={{ langCode, lang, setLanguage, languages: LANGUAGES }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used within <LanguageProvider>');
    return ctx;
}
