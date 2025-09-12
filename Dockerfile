FROM node:16-slim

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    chromium \
    libgbm1 \
    libasound2 \
    chromium-driver \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar e instalar dependências do backend
COPY backend/package*.json ./
RUN npm install

# Copiar arquivos do backend
COPY backend ./

# Configurar variáveis do Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Expor porta
ENV PORT=3000
EXPOSE 3000

CMD ["node", "index.js"]
