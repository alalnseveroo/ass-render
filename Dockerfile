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

# Configurar diretório da aplicação
WORKDIR /app

# Criar estrutura de diretórios
RUN mkdir -p frontend dist

# Configurar frontend
COPY frontend/package*.json /app/frontend/
WORKDIR /app/frontend
RUN npm install
COPY frontend/. /app/frontend/
RUN npm run build && \
    cp -r dist/* /app/dist/ && \
    cd /app && \
    rm -rf frontend

# Configurar backend
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/. .

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
