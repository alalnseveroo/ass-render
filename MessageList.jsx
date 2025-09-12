import React, { useRef, useLayoutEffect } from 'react';

const MessageBubble = ({ msg }) => {
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const renderMedia = () => {
        if (msg.type === 'image' && msg.media) return <img src={`data:${msg.media.mimetype};base64,${msg.media.data}`} alt={msg.media.filename || 'Imagem'} className="chat-image" />;
        if ((msg.type === 'ptt' || msg.type === 'audio') && msg.media) return <audio src={`data:${msg.media.mimetype};base64,${msg.media.data}`} controls className="chat-audio" />;
        if (msg.type === 'document' && msg.media) return (
            <a href={`data:${msg.media.mimetype};base64,${msg.media.data}`} download={msg.media.filename || 'documento'} className="chat-document">
                Documento: {msg.media.filename || 'documento'}
            </a>
        );
        return <span>{msg.body}</span>;
    };

    return (
        <div className={`message-container ${msg.fromMe ? 'mine' : 'other'}`}>
            <div className="message-content">
                <div className="message-bubble">
                    {renderMedia()}
                </div>
                <span className="message-timestamp">{formatTimestamp(msg.timestamp)}</span>
            </div>
        </div>
    );
};

const MessageList = ({ messages = [] }) => {
    const listRef = useRef(null);
    useLayoutEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="message-list" ref={listRef}>
            {messages.map((msg) => (
                <MessageBubble 
                    key={msg.id._serialized || msg.id.id} 
                    msg={msg}
                />
            ))}
        </div>
    );
};

export default MessageList;
