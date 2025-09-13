#!/bin/bash
set -e

echo "Instalando dependências do frontend..."
cd frontend
npm install

echo "Construindo o frontend..."
npm run build

echo "Voltando para a pasta raiz..."
cd ..

echo "Instalando dependências do backend..."
cd backend
npm install

echo "Copiando build do frontend..."
mkdir -p dist
cp -r ../frontend/dist/* dist/

echo "Build completo!"
