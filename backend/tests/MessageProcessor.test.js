import { describe, it, expect } from 'vitest';
import { processMessage } from '../utils/MessageProcessor';

describe('MessageProcessor', () => {
  it('deve processar uma mensagem de texto simples corretamente', async () => {
    const mockMessage = {
      id: { _serialized: 'msg1' },
      body: 'Olá',
      from: '123@c.us',
      to: '456@c.us',
      fromMe: false,
      timestamp: 1678886400,
      type: 'chat',
      hasMedia: false,
    };

    const processed = await processMessage(mockMessage);

    expect(processed).toEqual({
      ...mockMessage,
      media: null,
    });
  });

  it('deve lidar com tipos de mídia não suportados', async () => {
    const mockMessage = {
      type: 'interactive',
      hasMedia: true,
    };

    const processed = await processMessage(mockMessage);

    expect(processed.body).toBe('[Mensagem interativa não suportada]');
    expect(processed.hasMedia).toBe(false);
  });
});
