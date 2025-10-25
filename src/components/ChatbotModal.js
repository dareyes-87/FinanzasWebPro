import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Modal.css'; // Reutilizamos tu CSS de modal
import './Chatbot.css'; // Añadimos los estilos específicos del chat
import { Send, Loader2, Bot, User } from 'lucide-react';

const ChatbotModal = ({ closeModal }) => {
    const [messages, setMessages] = useState([
        { 
            role: 'model', // 'model' es el rol de Gemini
            parts: [{ text: "¡Hola! Soy tu asesor financiero de IA. Puedes preguntarme sobre conceptos de finanzas, consejos para ahorrar o cómo crear un presupuesto." }] 
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Para auto-scroll
    const chatBodyRef = useRef(null);
    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (input.trim() === '' || loading) return;

        const userMessage = { role: 'user', parts: [{ text: input }] };
        const newMessages = [...messages, userMessage];
        
        setMessages(newMessages);
        setInput('');
        setLoading(true);
        setError(null);

        try {
            // LLAMAMOS A LA EDGE FUNCTION
            const { data, error: funcError } = await supabase.functions.invoke('gemini-chat', {
                body: { chatHistory: newMessages }, // Enviamos todo el historial
            });

            if (funcError) throw funcError;
            if (data.error) throw new Error(data.error); // Error de lógica en la función

            // Añadimos la respuesta del bot
            setMessages(prev => [...prev, data.response]);

        } catch (err) {
            console.error(err);
            setError("Lo siento, tuve un error al conectar con la IA. Por favor, intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content chat-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Asesor IA</h3>
                    <button onClick={closeModal} className="close-button">&times;</button>
                </div>
                
                <div className="chat-body" ref={chatBodyRef}>
                    {messages.map((msg, index) => (
                        <div key={index} className={`chat-message ${msg.role === 'user' ? 'user' : 'model'}`}>
                            <div className="chat-avatar">
                                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                            </div>
                            <div className="chat-bubble">
                                {msg.parts[0].text}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="chat-message model">
                            <div className="chat-avatar"><Bot size={20} /></div>
                            <div className="chat-bubble loading-bubble">
                                <Loader2 size={16} className="spinner-icon" />
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="chat-error-message">
                            {error}
                        </div>
                    )}
                </div>

                <div className="chat-input-area">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Escribe tu consulta financiera..."
                        disabled={loading}
                    />
                    <button className="btn-primary" onClick={handleSend} disabled={loading}>
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatbotModal;