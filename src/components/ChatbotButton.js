import React from 'react';
import { Bot } from 'lucide-react';
import './Chatbot.css'; // Crearemos este archivo CSS

const ChatbotButton = ({ onClick }) => {
    return (
        <button className="chatbot-button" onClick={onClick} title="Asesor IA">
            <Bot size={28} />
        </button>
    );
};

export default ChatbotButton;