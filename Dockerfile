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
RUN mkdir -p dist && \
    cp -r /app/frontend/dist/* /app/dist/ && \
    rm -rf /app/frontend && \
    ls -la /app/dist && \
    cat /app/dist/index.html

# Configurar permissões e diretórios
RUN mkdir -p .wwebjs_auth/session && \
    chmod -R 777 .wwebjs_auth && \
    chmod -R 777 /app/dist && \
    chown -R node:node /app && \
    ls -la /app

# Configurar usuário não-root para segurança
USER node

# Expor porta
ENV PORT=3000
EXPOSE 3000

# Adicionar script de healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:$PORT/ || exit 1

# Adicionar script de inicialização
RUN echo '#!/bin/bash\n\
echo "Verificando diretório dist..."\n\
ls -la /app/dist\n\
echo "Verificando index.html..."\n\
cat /app/dist/index.html\n\
echo "Iniciando aplicação..."\n\
exec node index.js' > /app/start.sh

RUN chmod +x /app/start.sh

# Iniciar a aplicação
CMD ["/app/start.sh"]
