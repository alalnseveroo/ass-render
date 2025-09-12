// frontend/src/contexts/SocketContext.jsx

import React, { createContext, useContext } from 'react';
import io from 'socket.io-client';

// A URL do backend agora é dinâmica
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const socket = io(BACKEND_URL);
const SocketContext = createContext(socket);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
