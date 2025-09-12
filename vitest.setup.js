import { vi } from 'vitest';

// Mock completo da biblioteca whatsapp-web.js
// Isso impede que o Puppeteer seja iniciado durante os testes
vi.mock('whatsapp-web.js', () => {
  const EventEmitter = require('events');
  class MockClient extends EventEmitter {
    constructor() {
      super();
      this.info = { wid: { _serialized: 'server@c.us' } };
    }
    initialize = vi.fn().mockResolvedValue();
    sendMessage = vi.fn().mockResolvedValue({ id: { _serialized: 'fake_message_id' }, body: 'mock response', fromMe: true });
    getChats = vi.fn().mockResolvedValue([]);
    getProfilePicUrl = vi.fn().mockResolvedValue('http://fake.pic/url');
    logout = vi.fn().mockResolvedValue();
  }
  return {
    Client: MockClient,
  };
});

// Mock do Supabase para não tocar no banco de dados real durante os testes
vi.mock('./supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    delete: vi.fn().mockResolvedValue({ error: null }),
  },
}));
