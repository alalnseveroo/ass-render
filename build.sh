#!/bin/bash

# Instalar dependências do frontend
cd frontend
npm install

# Construir o frontend
npm run build

# Voltar para a pasta raiz
cd ..

# Instalar dependências do backend
cd backend
npm install
