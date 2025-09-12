import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Estende o expect do Vitest com os matchers do jest-dom
// Isso nos dá acesso a matchers como .toBeInTheDocument()
expect.extend(matchers);

// Roda a limpeza do testing-library após cada teste
// para garantir um ambiente limpo.
afterEach(() => {
  cleanup();
});
