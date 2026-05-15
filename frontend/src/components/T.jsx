import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translateText } from '../utils/translate';

/**
 * T (Translate) component
 * Wraps any string and automatically translates it to the user's selected language using LibreTranslate.
 * Usage: <T>Hello World</T>
 */
export default function T({ children }) {
    const { langCode } = useLanguage();
    const [translated, setTranslated] = useState(children);

    useEffect(() => {
        // If it's not a string, or if the language is English, render as-is.
        if (typeof children !== 'string') {
            setTranslated(children);
            return;
        }
        if (langCode === 'en') {
            setTranslated(children);
            return;
        }

        // Otherwise, translate dynamically
        let isMounted = true;
        translateText(children, 'en', langCode).then(res => {
            if (isMounted) setTranslated(res);
        }).catch(() => {
            if (isMounted) setTranslated(children); // fallback to English
        });

        return () => { isMounted = false; };
    }, [children, langCode]);

    return <>{translated}</>;
}
