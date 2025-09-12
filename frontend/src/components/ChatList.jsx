import React from 'react';
import LoadingDots from './LoadingDots';

const ConversationItem = ({ chat, isActive, onClick }) => {
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`conversation-item ${isActive ? 'active' : ''}`} onClick={onClick}>
      <div className="conversation-avatar">
        {chat.picUrl ? <img src={chat.picUrl} alt={chat.name} /> : <div className="skeleton"></div>}
        {chat.unreadCount > 0 && <div className="unread-indicator"></div>}
      </div>
      <div className="conversation-details">
        <span className="conversation-name">{chat.name || chat.id.user}</span>
        <p className="conversation-last-message">{chat.lastMessage?.body || ' '}</p>
      </div>
      <div className="conversation-info">
        <span>{formatTimestamp(chat.timestamp)}</span>
      </div>
    </div>
  );
};

const ChatList = ({ chats, activeChat, onChatClick, isLoading, onNewChat, onSearch, onBackToSessions }) => {
  return (
    <div className="sidebar conversations-sidebar">
      <div className="conversation-header" style={{display: 'flex', alignItems: 'center'}}>
        <button className="back-btn" onClick={onBackToSessions}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <h3>Conversas</h3>
      </div>
      <div className="conversation-list-header">
        <input type="text" className="search-input" placeholder="Pesquisar..." onChange={(e) => onSearch(e.target.value)} />
        <button className="new-chat-btn" onClick={onNewChat}>+</button>
      </div>
      <div className="conversation-list">
        {isLoading && <LoadingDots />}
        {!isLoading && chats.map((chat) => (
          <ConversationItem 
            key={chat.id._serialized}
            chat={chat}
            isActive={activeChat?.id._serialized === chat.id._serialized}
            onClick={() => onChatClick(chat)}
          />
        ))}
      </div>
    </div>
  );
};

export default ChatList;
