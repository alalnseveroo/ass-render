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

# Copiar package.json do backend
COPY backend/package*.json ./

# Instalar dependências do backend
RUN npm install

# Copiar arquivos do frontend
COPY frontend ./frontend

# Construir o frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Voltar para o diretório principal e copiar o resto dos arquivos do backend
WORKDIR /app
COPY backend ./

# Copiar arquivos do frontend buildado para a pasta dist
RUN cp -r frontend/dist/* dist/

# Criar diretório para as sessões do WhatsApp
RUN mkdir -p .wwebjs_auth/session && \
    chmod -R 777 .wwebjs_auth

WORKDIR /app

# Copiar todo o projeto
COPY . .

# Instalar dependências e construir o projeto
RUN chmod +x build.sh
RUN ./build.sh

# Configurar variáveis do Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Expor porta
ENV PORT=3000
EXPOSE 3000

CMD ["node", "index.js"]
