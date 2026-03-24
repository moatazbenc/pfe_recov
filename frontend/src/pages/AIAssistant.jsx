import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../components/AuthContext';

function AIAssistant() {
    const { user } = useAuth();
    const [messages, setMessages] = useState([
        { id: 1, role: 'assistant', text: `Hello ${user?.name}! I'm your AI Performance Assistant. How can I help you today? I can suggest goal improvements, generate feedback, or help you draft a progress update.` }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { id: Date.now(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await axios.post('/api/ai/assist', { prompt: input });
            const assistantMsg = { 
                id: Date.now() + 1, 
                role: 'assistant', 
                text: res.data.content || res.data.suggestion || "I'm sorry, I couldn't process that request right now." 
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (err) {
            console.error('AI Error:', err);
            setMessages(prev => [...prev, { 
                id: Date.now() + 1, 
                role: 'assistant', 
                text: "Oops! Something went wrong while talking to the AI. Please try again later." 
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ai-assistant-page" style={{ height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>
            <header style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ margin: 0 }}>AI Assistant</h1>
                <p className="text-muted">Get automated suggestions for goals and performance</p>
            </header>

            <div className="chat-container card shadow-sm" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
                <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {messages.map((msg) => (
                        <div key={msg.id} style={{ 
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '70%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                        }}>
                            <div style={{ 
                                padding: '0.75rem 1rem', 
                                borderRadius: '12px',
                                background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-main)',
                                color: msg.role === 'user' ? '#000' : 'inherit',
                                border: '1px solid var(--border-color)',
                                borderTopRightRadius: msg.role === 'user' ? '2px' : '12px',
                                borderTopLeftRadius: msg.role === 'assistant' ? '2px' : '12px',
                                fontSize: '0.95rem',
                                lineHeight: '1.5',
                                boxShadow: 'var(--shadow-sm)'
                            }}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div style={{ alignSelf: 'flex-start', padding: '0.75rem 1rem', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                            <span className="dot-flashing">AI is thinking...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-input" onSubmit={handleSend} style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.75rem' }}>
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your question here (e.g., 'Suggest a SMART goal for learning React')" 
                        style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                        disabled={loading}
                    />
                    <button type="submit" className="btn btn--primary" disabled={loading}>
                        Send
                    </button>
                </form>
            </div>

            <div className="quick-suggestions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                <button className="btn btn--sm btn--outline" onClick={() => setInput("Suggest 3 career development goals")}>Suggest Goals</button>
                <button className="btn btn--sm btn--outline" onClick={() => setInput("How can I improve my KPI tracking?")}>Improve KPIs</button>
                <button className="btn btn--sm btn--outline" onClick={() => setInput("Help me write a performance update")}>Write Update</button>
            </div>
        </div>
    );
}

export default AIAssistant;
