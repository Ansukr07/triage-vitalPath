/**
 * translateText — LibreTranslate wrapper
 * Uses the public LibreTranslate API (no SDK needed).
 *
 * @param {string} text     - Text to translate
 * @param {string} source   - Source language code (e.g. 'hi', 'kn', 'en')
 * @param {string} target   - Target language code (e.g. 'en')
 * @returns {Promise<string>} Translated text, or original text on failure
 */
export async function translateText(text, source, target) {
    if (!text || source === target) return text;

    try {
        // Using Google's highly available public translation endpoint to bypass 403/429 limits
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);

        if (!response.ok) throw new Error(`Translate API HTTP ${response.status}`);
        const data = await response.json();

        // data[0] contains an array of translated segments (if the text was long/multiple sentences)
        const translated = data[0].map(item => item[0]).join('');
        return translated || text;
    } catch (err) {
        console.warn('[Translate] Failed, returning original text:', err.message);
        return text; // Graceful fallback
    }
}

// Supported languages
export const LANGUAGES = [
    { code: 'en', label: 'English',  nativeName: 'English',   speechLang: 'en-US' },
    { code: 'hi', label: 'Hindi',    nativeName: 'हिन्दी',   speechLang: 'hi-IN' },
    { code: 'kn', label: 'Kannada',  nativeName: 'ಕನ್ನಡ',    speechLang: 'kn-IN' },
];

export function getLangByCode(code) {
    return LANGUAGES.find(l => l.code === code) || LANGUAGES[0];
}
