import React, { useState } from 'react';
import MessageList from './MessageList';

const ChatHeader = ({ chat, onBack }) => (
    <div className="chat-header">
        <button className="back-btn" onClick={onBack}>
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        {chat.picUrl ? <img src={chat.picUrl} alt={chat.name} className="chat-header-avatar" /> : <div className="skeleton chat-header-avatar"></div>}
        <h3>{chat.name || chat.id.user}</h3>
    </div>
);

const MessageInput = ({ onSendMessage }) => {
    const [text, setText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim()) {
            onSendMessage(text);
            setText('');
        }
    };

    return (
        <div className="message-input-area">
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Digite uma mensagem..." value={text} onChange={(e) => setText(e.target.value)} />
                <button type="submit">Enviar</button>
            </form>
        </div>
    );
};

const ChatWindow = ({ chat, messages, onSendMessage, onLoadMore, canLoadMore, isLoadingMore, onBack }) => {
    // A janela de chat agora não renderiza nada se não houver um chat ativo.
    // Isso é controlado pelo App.jsx para a lógica de responsividade.
    if (!chat) {
        return null;
    }

    return (
        <div className="chat-window">
            <ChatHeader chat={chat} onBack={onBack} />
            <MessageList 
                messages={messages} 
                onLoadMore={onLoadMore}
                canLoadMore={canLoadMore}
                isLoadingMore={isLoadingMore}
            />
            <MessageInput onSendMessage={onSendMessage} />
        </div>
    );
};

export default ChatWindow;
