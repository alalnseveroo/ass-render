const processMessage = async (message) => {
    if (!message) return null;
    const messageData = {
        id: message.id, body: message.body, from: message.from,
        to: message.to, fromMe: message.fromMe, timestamp: message.timestamp,
        type: message.type, hasMedia: message.hasMedia, media: null
    };
    const unsupportedMediaTypes = ['interactive', 'poll_creation'];
    if (unsupportedMediaTypes.includes(message.type)) {
        messageData.body = `[${message.type === 'interactive' ? 'Mensagem interativa' : 'Enquete'} não suportada]`;
        messageData.hasMedia = false;
        return messageData;
    }
    if (message.hasMedia) {
        try {
            const media = await message.downloadMedia();
            if (media) {
                messageData.media = {
                    mimetype: media.mimetype, data: media.data,
                    filename: media.filename
                };
            }
        } catch (e) {
            console.error(`[${message.from || message.to}] Falha ao baixar mídia:`, e.message);
            messageData.body = "[Mídia não pôde ser carregada]";
        }
    }
    return messageData;
};

module.exports = { processMessage };
