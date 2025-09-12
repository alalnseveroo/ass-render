const { Server } = require("socket.io");
const whatsappService = require('./WhatsappService');
const { processMessage } = require('../utils/MessageProcessor');

class SocketService {
    constructor(server) {
        this.io = new Server(server, {
            cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
        });
        this.initEventListeners();
    }

    initEventListeners() {
        // Ouve eventos do WhatsappService e os retransmite para o frontend
        whatsappService.on('qr', ({ sessionId, qrImageUrl }) => {
            this.io.to(sessionId).emit('qr', { sessionId, qrImageUrl });
        });

        whatsappService.on('ready', ({ sessionId, picUrl }) => {
            this.io.to(sessionId).emit('session_ready', { sessionId });
            this.io.emit('session_status_update', { sessionId, status: 'connected', picUrl });
        });

        whatsappService.on('disconnected', ({ sessionId }) => {
            this.io.emit('session_deleted', { sessionId });
        });
        
        whatsappService.on('auth_failure', ({ sessionId }) => {
            this.io.emit('session_status_update', { sessionId, status: 'auth_failure' });
        });
        
        whatsappService.on('message_received', ({ sessionId, message }) => {
            this.io.emit('message_received', { sessionId, message });
        });
        
        whatsappService.on('chats_update', ({ sessionId, chat }) => {
            this.io.emit('chats_update', { sessionId, chat });
        });
        
        whatsappService.on('restoring_sessions', ({ ids }) => {
            this.io.emit('restoring_sessions', { ids });
        });

        // Gerencia conexões e comandos do frontend
        this.io.on('connection', (socket) => {
            console.log('Novo cliente conectado:', socket.id);

            const readySessions = [];
            whatsappService.sessions.forEach((client, id) => {
                if (client.info) {
                    readySessions.push({ id, status: 'connected' });
                }
            });
            socket.emit('all_sessions_status', readySessions);

            socket.on('create_session', () => {
                const sessionId = String(Date.now());
                socket.join(sessionId);
                whatsappService.createSession(sessionId);
            });
            
            socket.on('delete_session', (sessionId) => {
                whatsappService.deleteSession(sessionId);
            });
            
            socket.on('send_message', async (data, callback) => {
                try {
                    const client = whatsappService.getClient(data.sessionId);
                    const sentMessage = await client.sendMessage(data.chatId, data.text);
                    if (callback) callback({ success: true, message: await processMessage(sentMessage) });
                } catch (error) {
                    if (callback) callback({ success: false, error: error.message });
                }
            });

            socket.on('get_chats', async (sessionId) => {
                try {
                    const client = whatsappService.getClient(sessionId);
                    const chats = await client.getChats();
                    
                    const chatPromises = chats.map(async (chat) => {
                        try {
                            const contact = await chat.getContact().catch(() => null);
                            const lastMessage = await chat.fetchMessages({ limit: 1 }).then(m => m[0]).catch(() => null);
                            const picUrl = await contact?.getProfilePicUrl().catch(() => null);
                            return {
                                ...chat,
                                name: contact ? contact.name || contact.pushname || chat.name : chat.name,
                                number: chat.id.user,
                                unreadCount: chat.unreadCount,
                                picUrl,
                                lastMessage: lastMessage ? await processMessage(lastMessage) : null
                            };
                        } catch (e) { return null; }
                    });
    
                    const chatsWithDetails = (await Promise.all(chatPromises)).filter(Boolean);
                    socket.emit('chats', { sessionId, chats: chatsWithDetails });
                } catch (error) {
                    socket.emit('chats_error', { sessionId, message: error.message });
                }
            });

            socket.on('get_messages', async (data) => {
                try {
                    const client = whatsappService.getClient(data.sessionId);
                    const chat = await client.getChatById(data.chatId);
                    await chat.sendSeen(); 
                    const rawMessages = await chat.fetchMessages({ limit: whatsappService.MESSAGE_BATCH_SIZE });
                    const messages = await Promise.all(rawMessages.map(processMessage));
                    socket.emit('messages', { chatId: data.chatId, messages });
                } catch (error) { console.error('Erro ao buscar mensagens:', error); }
            });
            
            socket.on('start_new_chat', async ({ sessionId, number }, callback) => {
                try {
                    const client = whatsappService.getClient(sessionId);
                    if (!number || !/^\d+$/.test(number)) {
                        return callback({ success: false, message: "Número inválido." });
                    }
                    const formattedNumber = `${number}@c.us`;
                    const contact = await client.getContactById(formattedNumber);
                    if (!contact) throw new Error('Contato não encontrado');
    
                    const chat = await contact.getChat();
                    const picUrl = await contact.getProfilePicUrl().catch(() => null);
                    const chatData = {
                        ...chat, name: contact.name || contact.pushname || chat.name,
                        number: contact.number, picUrl, unreadCount: 0
                    };
                    this.io.emit('chats_update', { sessionId, chat: chatData });
                    if (callback) callback({ success: true, chat: chatData });
                } catch (e) {
                    if (callback) callback({ success: false, message: "Número não encontrado ou inválido." });
                }
            });
        });
    }
}

module.exports = SocketService;
