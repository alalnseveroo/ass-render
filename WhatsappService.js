const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const EventEmitter = require('events');
const puppeteer = require('puppeteer');
const SupabaseAuth = require('../authStrategies/SupabaseAuth');
const { supabase } = require('../supabaseClient');
const { processMessage } = require('../utils/MessageProcessor');

class WhatsappService extends EventEmitter {
    constructor() {
        super();
        this.sessions = new Map();
        this.MESSAGE_BATCH_SIZE = 30;
    }

    async initialize() {
        console.log("Restaurando sessões do Supabase...");
        const { data: sessionsToRestore, error } = await supabase.from('sessions').select('id');

        if (error) {
            console.error("Erro ao buscar sessões do Supabase:", error);
            return;
        }

        if (sessionsToRestore && sessionsToRestore.length > 0) {
            const ids = sessionsToRestore.map(s => s.id);
            this.emit('restoring_sessions', { ids });
            ids.forEach(sessionId => {
                console.log(`Restaurando sessão: ${sessionId}`);
                this.createSession(sessionId);
            });
        }
    }

    createSession(sessionId) {
        console.log(`Criando sessão: ${sessionId}`);
        const client = new Client({
            authStrategy: new SupabaseAuth(sessionId),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--disable-gpu'
                ],
                executablePath: puppeteer.executablePath(),
            }
        });

        client.on('qr', async (qr) => {
            console.log(`[${sessionId}] QR Code recebido`);
            const qrImageUrl = await qrcode.toDataURL(qr);
            this.emit('qr', { sessionId, qrImageUrl });
        });

        client.on('ready', async () => {
            console.log(`[${sessionId}] Cliente está pronto!`);
            this.sessions.set(sessionId, client);
            const picUrl = await client.getProfilePicUrl(client.info.wid._serialized).catch(() => null);
            this.emit('ready', { sessionId, picUrl });
        });

        client.on('message', async (message) => {
            const chat = await message.getChat();
            const contact = await message.getContact();
            const picUrl = await contact.getProfilePicUrl().catch(() => null);
            const lastMessage = await chat.fetchMessages({ limit: 1 }).then(m => m[0]).catch(() => null);

            this.emit('message_received', { sessionId, message: await processMessage(message) });
            this.emit('chats_update', {
                sessionId,
                chat: { ...chat, name: contact.name || contact.pushname || chat.name, number: chat.id.user, picUrl, lastMessage: await processMessage(lastMessage) }
            });
        });

        client.on('disconnected', (reason) => {
            console.log(`[${sessionId}] Foi desconectado`, reason);
            this.sessions.delete(sessionId);
            this.emit('disconnected', { sessionId });
        });
        
        client.on('auth_failure', (msg) => {
            console.error(`[${sessionId}] Falha na autenticação`, msg);
            this.emit('auth_failure', { sessionId });
        });

        client.initialize().catch(e => console.error(`[${sessionId}] Erro ao inicializar: `, e));
        return client;
    }

    async deleteSession(sessionId) {
        const client = this.sessions.get(sessionId);
        if (client) {
            await client.logout();
        } else {
            const authStrategy = new SupabaseAuth(sessionId);
            await authStrategy.logout();
            this.emit('disconnected', { sessionId });
        }
    }
    
    getClient(sessionId) {
        const client = this.sessions.get(sessionId);
        if (!client) throw new Error("Sessão não encontrada ou não está pronta.");
        return client;
    }
}

module.exports = new WhatsappService();
