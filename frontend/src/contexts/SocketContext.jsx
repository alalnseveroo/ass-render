import React, { createContext, useContext } from 'react';
import io from 'socket.io-client';

// Conecta ao backend. Altere a URL se o seu backend estiver em outro lugar.
const socket = io('https://.onrender.com');
const SocketContext = createContext(socket);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
