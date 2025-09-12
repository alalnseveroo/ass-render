import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from './contexts/SocketContext';
import SessionsSidebar from './components/SessionsSidebar';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import ConnectionModal from './components/ConnectionModal';
import NewChatModal from './components/NewChatModal';
import './index.css';

function App() {
  const socket = useSocket();

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingSessionId, setConnectingSessionId] = useState(null);
  const [isNewChat, setIsNewChat] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isRestoring, setIsRestoring] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [canLoadMoreMessages, setCanLoadMoreMessages] = useState(false);

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const handleNotification = useCallback((data) => {
      setSessions(prev => prev.map(s => s.id === data.sessionId ? { ...s, hasUnread: true } : s));
      if (data.sessionId === activeSession) {
          setChats(prev => {
              const chatExists = prev.some(c => c.id._serialized === data.chatId);
              if (!chatExists) {
                  socket.emit('get_chats', data.sessionId);
                  return prev;
              }
              return prev.map(c => 
                  c.id._serialized === data.chatId 
                  ? { ...c, unreadCount: data.unreadCount, lastMessage: data.message, timestamp: data.message.timestamp } 
                  : c
              ).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          });
      }
  }, [activeSession, socket]);

  const handleNotificationCleared = useCallback(({ sessionId, chatId }) => {
      if (sessionId === activeSession) {
          setChats(prevChats => {
              const newChats = prevChats.map(c => c.id._serialized === chatId ? { ...c, unreadCount: 0 } : c);
              const stillHasUnreadInSession = newChats.some(c => c.unreadCount > 0);
              setSessions(prevSess => prevSess.map(s => s.id === sessionId ? { ...s, hasUnread: stillHasUnreadInSession } : s));
              return newChats;
          });
      }
  }, [activeSession]);

  useEffect(() => {
    if (!socket) return;
    
    // Todos os listeners de socket.io permanecem aqui
    const onConnect = () => setIsRestoring(false);
    const onQr = ({ sessionId, qrImageUrl }) => { if (sessionId === connectingSessionId) setQrCodeUrl(qrImageUrl); };
    const onSessionReady = ({ sessionId }) => { if (sessionId === connectingSessionId) { setIsConnecting(false); setConnectingSessionId(null); } };
    const onSessionStatusUpdate = (update) => {
      setSessions(prev => {
          const exists = prev.some(s => s.id === update.sessionId);
          return exists ? prev.map(s => s.id === update.sessionId ? { ...s, ...update } : s) : [...prev, { id: update.sessionId, ...update }];
      });
    };
    const onSessionDeleted = ({ sessionId }) => {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSession === sessionId) {
        setActiveSession(null); setChats([]); setActiveChat(null);
      }
    };
    const onAllSessionsStatus = (allSessions) => { setSessions(allSessions); setIsRestoring(false); };
    const onRestoring = () => setIsRestoring(true);
    const onChats = ({ sessionId, chats: newChats }) => {
      if (sessionId === activeSession) { setChats(newChats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))); setIsLoadingChats(false); }
    };
    const onChatPicUpdate = ({ sessionId, chatId, picUrl }) => {
        if (sessionId === activeSession) { setChats(prev => prev.map(c => c.id._serialized === chatId ? { ...c, picUrl } : c)); }
    };
    const onMessages = ({ chatId, messages: newMessages, canLoadMore }) => {
      if (activeChat?.id._serialized === chatId) { setMessages(newMessages); setCanLoadMoreMessages(canLoadMore); }
    };
    const onOlderMessages = ({ chatId, messages: olderMessages, canLoadMore }) => {
      if (activeChat?.id._serialized === chatId) {
        setMessages(prev => [...olderMessages, ...prev]);
        setCanLoadMoreMessages(canLoadMore);
        setIsLoadingMoreMessages(false);
      }
    };
    const onMessageReceived = ({ sessionId, message }) => {
        if (sessionId === activeSession && activeChat && (message.from === activeChat.id._serialized || message.to === activeChat.id._serialized)) {
            setMessages(prev => [...prev, message]);
        }
    };

    socket.on('connect', onConnect);
    socket.on('qr', onQr);
    socket.on('session_ready', onSessionReady);
    socket.on('session_status_update', onSessionStatusUpdate);
    socket.on('session_deleted', onSessionDeleted);
    socket.on('all_sessions_status', onAllSessionsStatus);
    socket.on('restoring_sessions', onRestoring);
    socket.on('chats', onChats);
    socket.on('chat_pic_update', onChatPicUpdate);
    socket.on('messages', onMessages);
    socket.on('older_messages', onOlderMessages);
    socket.on('message_received', onMessageReceived);
    socket.on('notification', handleNotification);
    socket.on('notification_cleared', handleNotificationCleared);
    
    return () => {
      socket.off('connect'); socket.off('qr'); socket.off('session_ready');
      socket.off('session_status_update'); socket.off('session_deleted');
      socket.off('all_sessions_status'); socket.off('restoring_sessions');
      socket.off('chats'); socket.off('chat_pic_update');
      socket.off('messages'); socket.off('older_messages');
      socket.off('message_received'); socket.off('notification');
      socket.off('notification_cleared');
    };
  }, [socket, activeSession, activeChat, connectingSessionId, handleNotification, handleNotificationCleared]);

  useEffect(() => {
    if (activeSession && socket) {
      setIsLoadingChats(true); setChats([]); setActiveChat(null); setMessages([]);
      socket.emit('get_chats', activeSession);
    }
  }, [activeSession, socket]);
  
  useEffect(() => { setFilteredChats(chats); }, [chats]);
  
  const handleCreateSession = () => {
    const newSessionId = String(Date.now());
    setConnectingSessionId(newSessionId);
    setIsConnecting(true);
    setQrCodeUrl('');
    socket.emit('create_session', newSessionId);
  };
  
  const handleSessionClick = (sessionId) => {
    setActiveSession(sessionId);
  };
  
  const handleChatClick = (chat) => {
    if (chat.unreadCount > 0) {
        setChats(prev => prev.map(c => c.id._serialized === chat.id._serialized ? { ...c, unreadCount: 0 } : c));
    }
    setActiveChat(chat);
    socket.emit('get_messages', { sessionId: activeSession, chatId: chat.id._serialized });
  };
  
  const handleLoadMoreMessages = () => {
    if (!messages || messages.length === 0) return;
    setIsLoadingMoreMessages(true);
    const beforeMessageId = messages[0].id;
    socket.emit('get_older_messages', { sessionId: activeSession, chatId: activeChat.id._serialized, beforeMessageId });
  };

  const handleSendMessage = (text) => {
    socket.emit('send_message', {
      sessionId: activeSession, chatId: activeChat.id._serialized, text
    }, (response) => {
      if (!response.success) alert("Falha ao enviar mensagem: " + response.error);
    });
  };

  const handleSearch = (term) => {
    const lowerCaseTerm = term.toLowerCase();
    setFilteredChats(chats.filter(chat => 
        (chat.name && chat.name.toLowerCase().includes(lowerCaseTerm))
    ));
  };
  
  const handleStartNewChat = (number) => {};

  // **FUNÇÕES DE NAVEGAÇÃO MOBILE**
  const handleBackToSessions = () => {
    setActiveSession(null);
    setChats([]);
    setActiveChat(null);
  };

  const handleBackToChats = () => {
    setActiveChat(null);
  };

  return (
    <div className={`main-container ${activeSession ? 'session-active' : ''} ${activeChat ? 'chat-active' : ''}`}>
      {isConnecting && <ConnectionModal qrCodeUrl={qrCodeUrl} onCancel={() => setIsConnecting(false)} />}
      {isNewChat && <NewChatModal onClose={() => setIsNewChat(false)} onStartChat={handleStartNewChat}/>}
      
      <SessionsSidebar
        sessions={sessions}
        activeSession={activeSession}
        onSessionClick={handleSessionClick}
        onCreateSession={handleCreateSession}
        onDeleteSession={(sessionId) => socket.emit('delete_session', sessionId)}
        isRestoring={isRestoring}
      />

      <ChatList
        chats={filteredChats} activeChat={activeChat} onChatClick={handleChatClick}
        onNewChat={() => setIsNewChat(true)} onSearch={handleSearch} isLoading={isLoadingChats}
        onBackToSessions={handleBackToSessions}
      />

      <ChatWindow
        chat={activeChat} messages={messages} onSendMessage={handleSendMessage}
        onLoadMore={handleLoadMoreMessages} canLoadMore={canLoadMoreMessages}
        isLoadingMore={isLoadingMoreMessages}
        onBack={handleBackToChats}
      />

      {/* Placeholder para quando não há sessão ou chat ativo */}
      {!activeSession && !activeChat && (
         <div className="chat-window">
            <div className="placeholder"><p>Selecione ou crie uma sessão</p></div>
        </div>
      )}
      {activeSession && !activeChat && (
         <div className="chat-window">
            <div className="placeholder"><p>Selecione uma conversa</p></div>
        </div>
      )}
    </div>
  );
}

export default App;
