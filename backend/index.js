const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const fs = require('fs');
const path = require('path');

process.setMaxListeners(30);

const app = express();
app.use(cors());

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../dist')));

// Middleware para logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Rota catch-all para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 3000;
const sessions = new Map();
const sockets = new Map();
const MESSAGE_BATCH_SIZE = 30;

const processMessage = async (message) => {
  if (!message) return null;
  const messageData = {
    id: message.id, body: message.body, from: message.from,
    to: message.to, fromMe: message.fromMe, timestamp: message.timestamp,
    type: message.type, hasMedia: message.hasMedia, media: null
  };
  if (message.hasMedia) {
    try {
      const media = await message.downloadMedia();
      if (media) {
        messageData.media = {
          mimetype: media.mimetype, data: media.data,
          filename: media.filename
        };
      }
    } catch (e) { console.error(`[ERRO] Falha ao baixar mídia:`, e.message); }
  }
  return messageData;
};

const createWhatsappSession = (sessionId, socket) => {
    console.log(`[SESSÃO ${sessionId}] Etapa 1/5: Criando nova instância do cliente...`);
    
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: sessionId }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--no-first-run'
          ],
          executablePath: '/usr/bin/chromium'
        }
    });

    if (socket) sockets.set(sessionId, socket.id);

    client.on('qr', async (qr) => {
        const qrImageUrl = await qrcode.toDataURL(qr);
        const socketId = sockets.get(sessionId);
        if (socketId) io.to(socketId).emit('qr', { sessionId, qrImageUrl });
    });

    client.on('ready', async () => {
        console.log(`[SESSÃO ${sessionId}] Etapa 3/5: Cliente está pronto!`);
        client.info.picUrl = await client.getProfilePicUrl(client.info.wid._serialized).catch(() => null);
        sessions.set(sessionId, client);
        
        const socketId = sockets.get(sessionId);
        if (socketId) io.to(socketId).emit('session_ready', { sessionId });

        io.emit('session_status_update', { sessionId, status: 'connected', picUrl: client.info.picUrl });
    });

    client.on('message_create', async (message) => {
        const chat = await message.getChat();
        const processedMessage = await processMessage(message);
        
        io.emit('message_received', { sessionId, message: processedMessage });

        if (message.fromMe) return;

        const contact = await message.getContact();
        io.emit('notification', {
            sessionId,
            chatId: chat.id._serialized,
            unreadCount: chat.unreadCount,
            message: processedMessage,
            contact: { name: contact.name || contact.pushname || chat.name }
        });
    });

    client.on('disconnected', (reason) => {
        console.log(`[SESSÃO ${sessionId}] Cliente desconectado:`, reason);
        sessions.delete(sessionId);
        sockets.delete(sessionId);
        io.emit('session_deleted', { sessionId });
        const sessionDir = path.join(__dirname, '.wwebjs_auth', `session-${sessionId}`);
        fs.rm(sessionDir, { recursive: true, force: true }, () => {});
    });

    client.initialize().catch(e => console.error(`[SESSÃO ${sessionId}] [ERRO] Falha na inicialização: `, e));
};

const restoreSessions = () => {
    const sessionsDir = path.join(__dirname, '.wwebjs_auth');
    if (fs.existsSync(sessionsDir)) {
        fs.readdir(sessionsDir, (err, files) => {
            if (err) return;
            const sessionFiles = files.filter(file => file.startsWith('session-'));
            if (sessionFiles.length > 0) {
                io.emit('restoring_sessions', { count: sessionFiles.length });
                sessionFiles.forEach(dirName => {
                    const sessionId = dirName.replace('session-', '');
                    createWhatsappSession(sessionId, null);
                });
            }
        });
    }
};

io.on('connection', (socket) => {
    console.log(`[INFO] Novo cliente conectado: ${socket.id}`);
    
    const readySessions = [];
    sessions.forEach((client, id) => {
        if (client.info) {
            readySessions.push({ id, status: 'connected', picUrl: client.info.picUrl });
        }
    });
    socket.emit('all_sessions_status', readySessions);

    socket.on('create_session', (sessionId) => {
        createWhatsappSession(sessionId, socket);
    });

    socket.on('delete_session', async (sessionId) => {
        const client = sessions.get(sessionId);
        if (client) await client.destroy();
    });

    socket.on('get_chats', async (sessionId) => {
        console.log(`[SOCKET IN] Recebida solicitação 'get_chats' para a sessão: ${sessionId}`);
        const client = sessions.get(sessionId);
        if (!client) return;

        const chats = await client.getChats();
        console.log(`[SESSÃO ${sessionId}] ${chats.length} chats encontrados. Enviando lista básica...`);
        
        // 1. Envia a lista básica primeiro para uma renderização rápida
        const basicChats = await Promise.all(chats.map(async chat => {
            try {
                const contact = await chat.getContact();
                const lastMessage = (await chat.fetchMessages({limit: 1}))[0];
                return {
                    id: chat.id,
                    name: contact.name || contact.pushname || chat.name,
                    picUrl: null, // Foto virá depois
                    unreadCount: chat.unreadCount,
                    timestamp: chat.timestamp,
                    lastMessage: await processMessage(lastMessage)
                };
            } catch (e) { return null; }
        }));
        socket.emit('chats', { sessionId, chats: basicChats.filter(Boolean) });
        console.log(`[SOCKET OUT] Lista básica de chats enviada para ${socket.id}.`);

        // 2. Em segundo plano, busca as fotos e envia atualizações
        console.log(`[SESSÃO ${sessionId}] Iniciando busca de fotos em segundo plano...`);
        for (const chat of chats) {
            try {
                const contact = await chat.getContact();
                const picUrl = await contact.getProfilePicUrl().catch(() => null);
                if (picUrl) {
                    // Envia a foto assim que a encontra
                    socket.emit('chat_pic_update', { sessionId, chatId: chat.id._serialized, picUrl });
                }
            } catch(e) { /* Ignora erros individuais de busca de foto */ }
        }
        console.log(`[SESSÃO ${sessionId}] Busca de fotos em segundo plano finalizada.`);
    });

    socket.on('get_messages', async (data) => {
        const client = sessions.get(data.sessionId);
        if (client) {
            const chat = await client.getChatById(data.chatId);
            await chat.sendSeen();
            io.emit('notification_cleared', { sessionId: data.sessionId, chatId: data.chatId });
            const messages = await chat.fetchMessages({ limit: MESSAGE_BATCH_SIZE });
            socket.emit('messages', { chatId: data.chatId, messages: await Promise.all(messages.map(processMessage)), canLoadMore: messages.length === MESSAGE_BATCH_SIZE });
        }
    });

    socket.on('get_older_messages', async (data) => {
        const client = sessions.get(data.sessionId);
        if (client) {
            const chat = await client.getChatById(data.chatId);
            const messages = await chat.fetchMessages({ limit: MESSAGE_BATCH_SIZE, before: data.beforeMessageId });
            socket.emit('older_messages', { chatId: data.chatId, messages: await Promise.all(messages.map(processMessage)), canLoadMore: messages.length === MESSAGE_BATCH_SIZE });
        }
    });

    socket.on('send_message', async (data, callback) => {
        const client = sessions.get(data.sessionId);
        if(client) {
            try {
                const sentMessage = await client.sendMessage(data.chatId, data.text);
                callback({ success: true, message: await processMessage(sentMessage) });
            } catch(e) {
                callback({ success: false, error: e.message });
            }
        }
    });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[INFO] Servidor backend rodando na porta ${port}`);
  restoreSessions();
});
