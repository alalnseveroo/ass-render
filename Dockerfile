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
    && rm -rf /var/lib/apt/lists/*

# Configurar variáveis do Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Configurar diretório de trabalho
WORKDIR /app

# Criar diretório dist
RUN mkdir -p dist

# Configurar e construir o frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Configurar o backend
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./

# Copiar os arquivos do frontend buildado
RUN mkdir -p dist
COPY frontend/dist/ ./dist/

# Criar diretório para as sessões do WhatsApp
RUN mkdir -p .wwebjs_auth/session && \
    chmod -R 777 .wwebjs_auth

# Expor porta
ENV PORT=3000
EXPOSE 3000

# Iniciar a aplicação
CMD ["node", "index.js"]
