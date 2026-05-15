import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Mic, Video, Plus, Menu, MoreVertical } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { translateText } from '../utils/translate';
import { chatService } from '../api/services';
import LanguagePicker from './LanguagePicker';
import './VoiceMode.css';

const VoiceMode = ({ initialLocation, onEmergency, onClose }) => {
    const { langCode, lang } = useLanguage();
    const [status, setStatus]                       = useState('connecting');
    const [currentTranscript, setCurrentTranscript] = useState('');
    const [lastAIText, setLastAIText]               = useState('');
    const [physicalRiskScore, setPhysicalRiskScore] = useState(0);
    const [mentalRiskScore,   setMentalRiskScore]   = useState(0);
    const [physicalSeverity,  setPhysicalSeverity]  = useState('LOW');
    const [mentalSeverity,    setMentalSeverity]    = useState('LOW');
    const [physicalReasons,   setPhysicalReasons]   = useState([]);
    const [mentalReasons,     setMentalReasons]     = useState([]);
    const [careCategory,      setCareCategory]      = useState(null);
    const [lastEmergency,     setLastEmergency]     = useState(null);
    const [saving, setSaving]                       = useState(false);

    // Combined score for UI (max of both — drives orb pulse)
    const riskScore = Math.max(physicalRiskScore, mentalRiskScore);

    // ── All mutable state in refs — avoids stale-closure bugs ────────────
    const recognitionRef     = useRef(null);
    const synthesisRef       = useRef(window.speechSynthesis);
    const statusRef          = useRef('connecting');
    const isProcessingRef    = useRef(false);
    const silenceTimerRef    = useRef(null);
    const accumulatedTextRef = useRef('');

    // "Dead-man's switch" — once set to true every callback bails immediately
    const destroyedRef = useRef(false);

    // ── Store the latest lang/callbacks in refs so the setup effect (which
    //    runs ONCE with []) can always read current values without re-running ─
    const langCodeRef        = useRef(langCode);
    const speechLangRef      = useRef(lang.speechLang);
    const onEmergencyRef     = useRef(onEmergency);
    const onCloseRef         = useRef(onClose);
    const initialLocationRef = useRef(initialLocation);

    // Keep refs in sync with latest props/context on every render
    useEffect(() => { langCodeRef.current        = langCode;        }, [langCode]);
    useEffect(() => { speechLangRef.current      = lang.speechLang; }, [lang.speechLang]);
    useEffect(() => { onEmergencyRef.current     = onEmergency;     }, [onEmergency]);
    useEffect(() => { onCloseRef.current         = onClose;         }, [onClose]);
    useEffect(() => { initialLocationRef.current = initialLocation; }, [initialLocation]);

    // ── Helper: update status in both state and ref ───────────────────────
    const setStatusBoth = useCallback((val) => {
        statusRef.current = val;
        setStatus(val);
    }, []);

    // ── HARD STOP: kills mic + TTS immediately, safe to call multiple times ─
    const hardStop = useCallback(() => {
        destroyedRef.current = true;
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        synthesisRef.current?.cancel();
        try { recognitionRef.current?.abort(); } catch (e) {}
    }, []);

    // ── TTS + restart listening ───────────────────────────────────────────
    // Defined BEFORE processUserInput so it can be stored in a ref
    const speakResponseRef = useRef(null);
    speakResponseRef.current = (text, currentHistory) => {
        if (destroyedRef.current) {
            console.warn('[VoiceMode] speakResponse called after destroy');
            return;
        }

        console.log('[VoiceMode] speakResponse called with:', text.substring(0, 50));
        setStatusBoth('speaking');
        setLastAIText(text);

        // Append assistant turn
        const assistantTurn = { role: 'model', parts: [{ text }] };
        recognitionRef.userHistory = [...(currentHistory || []), assistantTurn];

        synthesisRef.current?.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = speechLangRef.current;

        const voices = synthesisRef.current?.getVoices() || [];
        const sl = speechLangRef.current;
        const preferred =
            voices.find(v => v.lang === sl && v.name.toLowerCase().includes('female')) ||
            voices.find(v => v.lang === sl) ||
            voices.find(v => v.name.includes('Google US English')) ||
            voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')) ||
            voices.find(v => v.lang.startsWith('en')) ||
            voices[0];
        if (preferred) utterance.voice = preferred;
        utterance.rate  = 1.0;
        utterance.pitch = 1.0;

        const restartListening = () => {
            if (destroyedRef.current) return;
            setTimeout(() => {
                if (destroyedRef.current) return;
                console.log('[VoiceMode] Restarting listening after TTS');
                setStatusBoth('listening');
                setCurrentTranscript('');
                accumulatedTextRef.current = '';
                try { recognitionRef.current?.start(); } catch (e) {
                    console.warn('[VoiceMode] Could not restart recognition:', e);
                }
            }, 700);
        };

        utterance.onend   = restartListening;
        utterance.onerror = (e) => {
            console.error('[VoiceMode] TTS error:', e);
            restartListening();
        };

        console.log('[VoiceMode] Speaking utterance:', text.substring(0, 50));
        synthesisRef.current?.speak(utterance);
    };

    // ── Process the accumulated spoken input ─────────────────────────────
    const processUserInputRef = useRef(null);
    processUserInputRef.current = async (text) => {
        if (destroyedRef.current || isProcessingRef.current || !text.trim()) return;
        isProcessingRef.current = true;

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setStatusBoth('processing');
        setCurrentTranscript('');
        accumulatedTextRef.current = '';

        // Stop recognition while processing (not abort — we want to restart after)
        try { recognitionRef.current?.stop(); } catch (e) {}

        const lc = langCodeRef.current;

        // ── Translate user input to English before sending to AI ──
        const textForAI = lc !== 'en' ? await translateText(text, lc, 'en') : text;

        // Append user turn to history (storing original language text)
        const userTurn = { role: 'user', parts: [{ text }] };
        const updatedHistory = [...(recognitionRef.userHistory || []), userTurn];
        recognitionRef.userHistory = updatedHistory;

        try {
            const res = await chatService.sendMessage(
                textForAI,
                updatedHistory,
                initialLocationRef.current,
                'voice'
            );
            if (destroyedRef.current) return;

            const data = res.data?.data || res.data;

            if (data.emergency?.isEmergency) {
                hardStop();
                try {
                    const msgs = (recognitionRef.userHistory || []).map(m => ({
                        role:    m.role === 'model' ? 'assistant' : 'user',
                        content: m.parts?.[0]?.text || '',
                    })).filter(m => m.content);
                    if (msgs.length) {
                        await chatService.autoSaveSession(msgs, {
                            latestPhysicalRiskScore: data.physicalRiskScore,
                            latestMentalRiskScore:   data.mentalRiskScore,
                            latestPhysicalSeverity:  data.physicalSeverity,
                            latestMentalSeverity:    data.mentalSeverity,
                            latestPhysicalReasons:   data.physicalReasons,
                            latestMentalReasons:     data.mentalReasons,
                            latestCareCategory:      data.careCategory,
                            latestEmergency:         data.emergency,
                        });
                    }
                } catch (e) {}
                onEmergencyRef.current(data.emergency);
                onCloseRef.current();
                return;
            }

            // Update dual risk scores & metadata
            if (typeof data.physicalRiskScore === 'number') setPhysicalRiskScore(data.physicalRiskScore);
            if (typeof data.mentalRiskScore   === 'number') setMentalRiskScore(data.mentalRiskScore);
            if (data.physicalSeverity) setPhysicalSeverity(data.physicalSeverity);
            if (data.mentalSeverity)   setMentalSeverity(data.mentalSeverity);
            if (data.physicalReasons)  setPhysicalReasons(data.physicalReasons);
            if (data.mentalReasons)    setMentalReasons(data.mentalReasons);
            if (data.careCategory)     setCareCategory(data.careCategory);
            setLastEmergency(data.emergency || null);

            const replyTextEn = data.reply?.trim();
            if (replyTextEn) {
                const replyText = lc !== 'en' ? await translateText(replyTextEn, 'en', lc) : replyTextEn;
                speakResponseRef.current(replyText, updatedHistory);
            } else {
                const fallbackEn = "I didn't catch a response. Could you repeat that?";
                const fallback = lc !== 'en' ? await translateText(fallbackEn, 'en', lc) : fallbackEn;
                speakResponseRef.current(fallback, updatedHistory);
            }
        } catch (err) {
            if (destroyedRef.current) return;
            console.error('[VoiceMode] Backend error:', err);
            const errEn = "I'm having trouble connecting. Please try again.";
            const errText = lc !== 'en' ? await translateText(errEn, 'en', lc) : errEn;
            speakResponseRef.current(errText, recognitionRef.userHistory);
        } finally {
            if (!destroyedRef.current) isProcessingRef.current = false;
        }
    };

    // ── Setup SpeechRecognition ONCE (empty deps — stable via refs) ───────
    useEffect(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            alert('Speech Recognition is not supported. Please use Chrome or Edge.');
            onCloseRef.current();
            return;
        }

        // Reset destroyed flag for this mount
        destroyedRef.current = false;

        const recognition = new SR();
        recognition.continuous    = false;
        recognition.interimResults = true;
        recognition.lang           = speechLangRef.current;
        recognitionRef.current     = recognition;
        recognitionRef.userHistory = [];

        console.log('[VoiceMode] SpeechRecognition initialized');

        recognition.onresult = (event) => {
            if (destroyedRef.current || statusRef.current !== 'listening') return;

            let interimText = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const r = event.results[i];
                if (r.isFinal) {
                    accumulatedTextRef.current +=
                        (accumulatedTextRef.current ? ' ' : '') + r[0].transcript;
                } else {
                    interimText += r[0].transcript;
                }
            }

            const display = (accumulatedTextRef.current + (interimText ? ' ' + interimText : '')).trim();
            setCurrentTranscript(display);

            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            if (display.length > 0) {
                silenceTimerRef.current = setTimeout(() => {
                    if (destroyedRef.current) return;
                    const full = accumulatedTextRef.current.trim();
                    if (full) processUserInputRef.current(full);
                }, 2000);
            }
        };

        recognition.onerror = (event) => {
            if (destroyedRef.current) return;
            if (event.error === 'no-speech' && statusRef.current === 'listening') {
                try { recognition.start(); } catch (e) {}
            } else if (event.error !== 'aborted') {
                console.error('[VoiceMode] Recognition error:', event.error);
            }
        };

        recognition.onend = () => {
            if (destroyedRef.current || statusRef.current !== 'listening') return;

            const captured = accumulatedTextRef.current.trim();
            if (captured) {
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                if (!isProcessingRef.current) processUserInputRef.current(captured);
            } else {
                try { recognition.start(); } catch (e) {}
            }
        };

        console.log('[VoiceMode] Scheduling greeting in 400ms');

        // Safety fallback: if stuck in connecting/speaking after 7s → force listening
        const fallbackTimer = setTimeout(() => {
            if (destroyedRef.current) return;
            if (statusRef.current === 'connecting' || statusRef.current === 'speaking') {
                console.warn('[VoiceMode] Fallback triggered — forcing listening state.');
                synthesisRef.current?.cancel();
                statusRef.current = 'connecting'; // reset so setStatusBoth works
                setStatusBoth('listening');
                setCurrentTranscript('');
                accumulatedTextRef.current = '';
                try { recognition.start(); } catch (e) {
                    console.warn('[VoiceMode] Fallback start recognition failed:', e);
                }
            }
        }, 7000);

        // Kick off with a greeting
        const greetingTimer = setTimeout(async () => {
            if (destroyedRef.current) {
                console.log('[VoiceMode] Greeting skipped - component destroyed');
                return;
            }

            // Move UI out of 'connecting' immediately
            setStatusBoth('speaking');

            console.log('[VoiceMode] Initializing greeting...');
            try {
                const greetingEn = "Hi, I'm your VitalPath health assistant. How are you feeling today?";
                const lc = langCodeRef.current;
                console.log('[VoiceMode] Translating greeting, langCode =', lc);
                const greeting = lc !== 'en' ? await translateText(greetingEn, 'en', lc) : greetingEn;
                console.log('[VoiceMode] Greeting ready:', greeting.substring(0, 50));

                if (destroyedRef.current) return;

                // Wait for voices to load (Chrome loads them asynchronously)
                await new Promise(resolve => {
                    const voices = synthesisRef.current?.getVoices() || [];
                    if (voices.length > 0) return resolve();
                    synthesisRef.current?.addEventListener(
                        'voiceschanged',
                        () => resolve(),
                        { once: true }
                    );
                    setTimeout(resolve, 1500); // bail out after 1.5s
                });

                if (destroyedRef.current) return;

                console.log('[VoiceMode] Calling speakResponse with greeting');
                speakResponseRef.current(greeting, []);
            } catch (err) {
                console.error('[VoiceMode] Greeting error:', err);
                if (!destroyedRef.current) {
                    console.log('[VoiceMode] Falling back to direct listening');
                    setStatusBoth('listening');
                    try { recognition.start(); } catch (e) {
                        console.error('[VoiceMode] Failed to start recognition:', e);
                    }
                }
            }
        }, 400);

        // ── Cleanup ──────────────────────────────────────────────────────
        return () => {
            console.log('[VoiceMode] Component unmounting, cleaning up');
            destroyedRef.current = true;
            clearTimeout(greetingTimer);
            clearTimeout(fallbackTimer);
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            synthesisRef.current?.cancel();
            try { recognition.abort(); } catch (e) {}
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // ← EMPTY DEPS: runs exactly once per mount

    // ── Keep recognition language in sync when user switches language ─────
    useEffect(() => {
        if (recognitionRef.current) {
            recognitionRef.current.lang = lang.speechLang;
        }
    }, [lang.speechLang]);

    // ── End call ─────────────────────────────────────────────────────────
    const handleEndCall = async () => {
        hardStop();
        onClose();

        const history = recognitionRef.userHistory || [];
        if (history.length > 0) {
            const msgs = history.map(m => ({
                role:    m.role === 'model' ? 'assistant' : 'user',
                content: m.parts?.[0]?.text || '',
            })).filter(m => m.content);
            if (msgs.length) {
                const metadata = {
                    latestPhysicalRiskScore: physicalRiskScore,
                    latestMentalRiskScore:   mentalRiskScore,
                    latestPhysicalSeverity:  physicalSeverity,
                    latestMentalSeverity:    mentalSeverity,
                    latestPhysicalReasons:   physicalReasons,
                    latestMentalReasons:     mentalReasons,
                    latestCareCategory:      careCategory,
                    latestEmergency:         lastEmergency,
                };
                chatService.autoSaveSession(msgs, metadata).catch(err => {
                    console.error('[VoiceMode] Auto-save failed:', err);
                });
            }
        }
    };

    const getRiskBadge = () => {
        if (riskScore > 74) return { label: 'CRITICAL', color: '#ef4444' };
        if (riskScore > 50) return { label: 'HIGH',     color: '#f59e0b' };
        if (riskScore > 20) return { label: 'MODERATE', color: '#eab308' };
        return { label: 'LOW', color: '#10b981' };
    };
    const riskBadge = getRiskBadge();

    const statusLabel = {
        connecting: '● Connecting',
        listening:  '● Listening',
        processing: '● Processing',
        speaking:   '● Speaking',
    }[status] || '';

    return (
        <motion.div
            className="vpa-voice-mode"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3 }}
        >
            {/* ── Top Bar ── */}
            <div className="vpa-voice-topbar">
                <button className="vpa-voice-icon-btn" onClick={handleEndCall}>
                    <Menu size={20} />
                </button>
                <div className="vpa-voice-title-container">
                    <span className="vpa-voice-title">
                        VitalPath <span className="vpa-voice-title-light">Voice</span>
                    </span>
                    {riskScore > 20 && (
                        <div
                            className="vpa-voice-risk-dot"
                            style={{ backgroundColor: riskBadge.color }}
                            title={`Risk: ${riskBadge.label}`}
                        />
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <LanguagePicker compact />
                    <button className="vpa-voice-icon-btn">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </div>

            {/* ── Orb ── */}
            <div className="vpa-voice-center">
                <motion.div
                    className={`vpa-voice-orb-wrapper ${status}`}
                    animate={{
                        scale: status === 'speaking'  ? [1, 1.12, 1] :
                               status === 'listening' ? [1, 1.04, 1] : 1,
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: status === 'speaking' ? 0.9 : 1.8,
                        ease: 'easeInOut',
                    }}
                >
                    <video className="vpa-voice-orb-video" src="/orb.mp4" autoPlay loop muted playsInline />
                </motion.div>

                <motion.div
                    className="vpa-voice-status-label"
                    key={status}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {statusLabel}
                </motion.div>
            </div>

            {/* ── Transcript ── */}
            <div className="vpa-voice-bottom-area">
                <div className="vpa-voice-transcript">
                    {status === 'speaking' && lastAIText && (
                        <motion.p
                            key={lastAIText}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="vpa-transcript-text"
                        >
                            {lastAIText}
                        </motion.p>
                    )}
                    {(status === 'listening' || status === 'processing') && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`vpa-transcript-text ${!currentTranscript ? 'placeholder' : ''}`}
                        >
                            {currentTranscript || (status === 'processing'
                                ? (langCode === 'hi' ? 'सोच रहा हूँ...' : langCode === 'kn' ? 'ಆಲೋಚಿಸುತ್ತಿದೆ...' : 'Thinking...')
                                : (langCode === 'hi' ? 'सुन रहा हूँ...' : langCode === 'kn' ? 'ಆಲಿಸುತ್ತಿದೆ...' : 'Listening...'))}
                        </motion.p>
                    )}
                </div>

                {/* Controls */}
                <div className="vpa-voice-controls">
                    <button className="vpa-voice-circle-btn"><Plus size={22} /></button>
                    <div className="vpa-voice-type-pill">Type</div>
                    <button className="vpa-voice-circle-btn"><Video size={20} /></button>

                    <button
                        className={`vpa-voice-circle-btn mic-btn ${status === 'listening' ? 'active' : ''}`}
                        onClick={() => {
                            if (status === 'listening') {
                                const t = accumulatedTextRef.current.trim();
                                if (t) processUserInputRef.current(t);
                            }
                        }}
                    >
                        <Mic size={20} />
                    </button>

                    <button className="vpa-voice-circle-btn end-call" onClick={handleEndCall}>
                        <X size={26} />
                    </button>
                </div>
            </div>

            {saving && (
                <div className="vpa-voice-saving-overlay">
                    <div className="vpa-voice-saving-spinner"></div>
                    <p>Saving transcript...</p>
                </div>
            )}
        </motion.div>
    );
};

export default VoiceMode;
