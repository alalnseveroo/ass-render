import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node', // Ambiente para testes de backend
    globals: true,
    setupFiles: ['./vitest.setup.js'], // Arquivo de setup para mocks
  },
});
