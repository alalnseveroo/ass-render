FROM node:18-bullseye-slim

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    libgbm1 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    xvfb \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Configurar variáveis do Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json do frontend e instalar dependências
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copiar arquivos do frontend e construir
COPY frontend ./frontend
RUN cd frontend && npm run build

# Copiar package.json do backend e instalar dependências
COPY backend/package*.json ./
RUN npm install

# Copiar arquivos do backend
COPY backend ./

# Mover arquivos do frontend buildado
RUN mkdir -p dist && \
    cp -r frontend/dist/* dist/ && \
    rm -rf frontend

# Configurar permissões
RUN mkdir -p .wwebjs_auth/session && \
    chown -R node:node /app && \
    chmod -R 755 /app && \
    chmod -R 777 .wwebjs_auth

USER node

# Expor porta
ENV PORT=3000
EXPOSE 3000

# Verificar a estrutura antes de iniciar
RUN echo '#!/bin/bash\n\
echo "=== Estrutura de Diretórios ==="\n\
ls -la /app\n\
echo "=== Conteúdo do dist ==="\n\
ls -la /app/dist\n\
echo "=== Node Modules ==="\n\
ls -la /app/node_modules\n\
echo "=== Iniciando Aplicação ==="\n\
exec node index.js' > /app/start.sh && \
    chmod +x /app/start.sh

# Iniciar a aplicação
CMD ["./start.sh"]
