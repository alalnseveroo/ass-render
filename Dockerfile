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
