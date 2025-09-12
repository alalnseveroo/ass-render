import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import http from 'http';
import { io as Client } from 'socket.io-client';
import SocketService from '../services/SocketService';
import { Client as MockWppClient } from 'whatsapp-web.js';

describe('SocketService Integration Test', () => {
  let server, clientSocket, port;

  // Inicia um servidor e um cliente de socket antes de todos os testes
  beforeAll(async () => {
    await new Promise((resolve) => {
      server = http.createServer();
      new SocketService(server); // Inicializa nosso serviço de socket com o servidor
      server.listen(() => {
        port = server.address().port;
        clientSocket = Client(`http://localhost:${port}`);
        clientSocket.on('connect', resolve);
      });
    });
  });

  // Fecha as conexões depois de todos os testes
  afterAll(() => {
    server.close();
    clientSocket.close();
  });
  
  // Limpa os mocks entre os testes para garantir que um não interfira no outro
  beforeEach(() => {
    MockWppClient.mockClear();
  });

  it('deve receber um evento "qr" quando o WhatsappService emitir um QR code', { retry: 3, timeout: 10000 }, async () => {
    const qrPromise = new Promise((resolve) => {
      clientSocket.on('qr', (data) => resolve(data));
    });

    clientSocket.emit('create_session');

    // **MAIS PACIÊNCIA:** Esperamos por até 5 segundos para a instância do cliente ser criada
    await vi.waitFor(() => {
        expect(MockWppClient.mock.instances.length).toBe(1);
    }, { timeout: 5000 });

    const mockClientInstance = MockWppClient.mock.instances[0];
    mockClientInstance.emit('qr', 'fake_qr_string');

    const qrData = await qrPromise;
    expect(qrData.sessionId).toBeDefined();
    expect(qrData.qrImageUrl).toContain('data:image/png;base64,');
  });
  
  it('deve receber um evento "session_ready" quando a sessão estiver pronta', { retry: 3, timeout: 10000 }, async () => {
    const readyPromise = new Promise(resolve => clientSocket.on('session_ready', resolve));
    
    // Assegura que estamos testando a criação de uma nova instância
    clientSocket.emit('create_session');
    
    // **MAIS PACIÊNCIA:** Esperamos por até 5 segundos
    await vi.waitFor(() => {
        expect(MockWppClient.mock.instances.length).toBe(1);
    }, { timeout: 5000 });
    
    const mockClientInstance = MockWppClient.mock.instances[0];
    mockClientInstance.emit('ready');
    
    const readyData = await readyPromise;
    expect(readyData.sessionId).toBeDefined();
  });
});
