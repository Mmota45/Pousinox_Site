#!/bin/bash
# Script para atualizar o GitHub Pages
# Execute este script após fazer alterações no projeto

echo "🏗️  Building static files..."
npm run build:static

echo "📦  Updating gh-pages branch..."
# Salvar branch atual
CURRENT_BRANCH=$(git branch --show-current)

# Criar diretório temporário
TEMP_DIR=$(mktemp -d)
cp -r docs/* "$TEMP_DIR/"
cp docs/.nojekyll "$TEMP_DIR/" 2>/dev/null || true

# Mudar para branch gh-pages
git checkout gh-pages 2>/dev/null || git checkout --orphan gh-pages

# Limpar e copiar novos arquivos
git rm -rf . --quiet 2>/dev/null || true
cp -r "$TEMP_DIR/." .
git add .
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M:%S')"
git push origin gh-pages --force

# Voltar para branch original
git checkout "$CURRENT_BRANCH"
rm -rf "$TEMP_DIR"

echo "✅  GitHub Pages updated!"
echo "🌐  Site: https://mmota45.github.io/Pousinox_Site/"
