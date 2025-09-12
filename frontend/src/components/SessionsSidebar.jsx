import React from 'react';

const SessionIcon = ({ session, isActive, onClick, onDelete }) => (
  <div className="session-container"> 
    <div 
      className={`session-icon ${isActive ? 'active' : ''}`} 
      onClick={onClick}
    >
      {session.status === 'pending' || !session.picUrl ? (
        <div className="skeleton"></div> 
      ) : (
        <img src={session.picUrl} alt={`Sessão ${session.id}`} />
      )}
    </div>
    {session.hasUnread && <div className="session-unread-indicator"></div>}
    {session.status === 'connected' && (
      <button className="session-delete-btn" onClick={(e) => {
        e.stopPropagation();
        onDelete(session.id);
      }}>×</button>
    )}
  </div>
);

const SessionsSidebar = ({ sessions, activeSession, onSessionClick, onCreateSession, onDeleteSession }) => {
  return (
    <div className="sidebar sessions-sidebar">
      {sessions && sessions.map((session) => (
        <SessionIcon 
          key={session.id}
          session={session}
          isActive={session.id === activeSession}
          onClick={() => onSessionClick(session.id)}
          onDelete={onDeleteSession}
        />
      ))}
      <button className="add-session-btn" onClick={onCreateSession}>+</button>
    </div>
  );
};

export default SessionsSidebar;
