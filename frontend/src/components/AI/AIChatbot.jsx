import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Bot, Activity, Sparkles } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './AIChatbot.css';

const AIChatbot = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { role: 'model', parts: [{ text: "Hello! I'm your VitalPath AI Assistant. I can help you understand medical terms, explain platform features, or guide you through entering your symptoms. How can I assist you today?" }] }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const scrollRef = useRef(null);
    const messagesRef = useRef(messages);
    const isLoadingRef = useRef(isLoading);

    // Keep refs in sync with state for use in closures
    useEffect(() => { messagesRef.current = messages; }, [messages]);
    useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async (msg = null) => {
        const userMsg = msg || input.trim();
        if (!userMsg || isLoadingRef.current) return;

        console.log('[Chatbot] handleSend triggered:', { userMsg, source: msg ? 'external' : 'internal' });

        if (!msg) setInput('');
        if (!hasInteracted) setHasInteracted(true);
        setMessages(prev => [...prev, { role: 'user', parts: [{ text: userMsg }] }]);
        setIsLoading(true);

        try {
            // Capture history BEFORE adding the new message
            // Filter out the initial model greeting and TRUNCATE to last 6 messages
            const currentHistory = messagesRef.current;
            const chatHistory = currentHistory
                .filter((m, i) => !(i === 0 && m.role === 'model'))
                .slice(-6); // Only send last 6 messages to save tokens/quota

            const res = await api.post('/chat', {
                message: userMsg,
                history: chatHistory
            });

            if (res.data?.success && res.data?.data?.reply) {
                setMessages(prev => [...prev, { role: 'model', parts: [{ text: res.data.data.reply }] }]);
            } else {
                throw new Error('API returned unsuccessful or empty response');
            }
        } catch (err) {
            console.error('[Chatbot] Chat error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
                url: err.config?.url
            });
            const errorText = "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.";
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: errorText }] }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="vital-chatbot-container">
            <div className="vital-chat-window">
                {/* Header */}
                <div className="chat-header">
                    <div className="chat-header-info">
                        <Bot size={20} />
                        <span className="chat-header-title">VitalPath Assistant</span>
                    </div>
                </div>

                {/* Messages Area / Initial Orb View */}
                {!hasInteracted ? (
                    <div className="chat-initial-view">
                        <div className="orb-wrapper">
                            <video
                                src="/orb.mp4"
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="orb-video"
                            />
                        </div>
                        <div className="chat-welcome-text">
                            <h3 className="welcome-title">AI Support Assistant</h3>
                            <p className="welcome-subtitle">Ask me about your health insights or symptoms.</p>
                        </div>
                    </div>
                ) : (
                    <div ref={scrollRef} className="chat-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`message-wrapper ${msg.role}`}>
                                <div className={`message-bubble ${msg.role}`}>
                                    {msg.parts?.[0]?.text || "..."}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="chat-loading">
                                <div className="loading-bubble">
                                    <Activity className="animate-spin" size={16} color="#3b82f6" />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Input Area / Route to full assistant */}
                <div className="chat-form" style={{ padding: '0 1.25rem 12px 1.25rem' }}>
                    <button
                        onClick={() => navigate('/patient/assistant')}
                        className="chat-nav-btn"
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            letterSpacing: '0.5px'
                        }}
                    >
                        <Sparkles size={18} color="#a78bfa" />
                        Start New Chat
                    </button>
                </div>

                {/* Safety Disclaimer */}
                <div className="chat-disclaimer">
                    Informational only. Not for medical advice or emergency use.
                </div>
            </div>
        </div>
    );
};

export default AIChatbot;
