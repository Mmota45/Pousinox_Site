/**
 * build-static.mjs
 * Gera os arquivos HTML estáticos a partir do app Hono
 * para deploy no GitHub Pages.
 *
 * Saída: docs/  (pasta padrão do GitHub Pages)
 *   docs/index.html       ← landing page
 *   docs/admin/index.html ← painel admin
 *   docs/static/...       ← assets CSS / JS / favicon
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT  = join(ROOT, 'docs')

/* ── helpers ── */
function mkdir(p) { mkdirSync(p, { recursive: true }) }

function write(file, content) {
  mkdir(dirname(file))
  writeFileSync(file, content, 'utf8')
  console.log('  ✓', file.replace(ROOT, ''))
}

function copyDir(src, dest) {
  mkdir(dest)
  for (const entry of readdirSync(src)) {
    const s = join(src, entry), d = join(dest, entry)
    if (statSync(s).isDirectory()) copyDir(s, d)
    else { copyFileSync(s, d); console.log('  ✓', d.replace(ROOT, '')) }
  }
}

/* ── ler o HTML gerado pelo Hono direto do source ── */
function extractHtml(srcFile) {
  // Lê o arquivo TSX como texto e extrai a template string do html
  const src = readFileSync(srcFile, 'utf8')
  // Encontra o bloco return c.html(`...`) ou adminHtml() retornando a string
  const match = src.match(/return\s+`([\s\S]*?)`\s*\)\s*\}/)
  if (match) return match[1]
  // Para o admin.tsx, que retorna direto: return `...`
  const match2 = src.match(/return\s+`([\s\S]*)`/)
  if (match2) return match2[1]
  return null
}

/* ── processar o HTML para GitHub Pages ── */
function processHtml(html, basePath = '') {
  // Substitui caminhos absolutos /static/ pelo caminho relativo correto
  // GitHub Pages serve do root do repositório ou de /docs
  return html
    // links e scripts com /static/ → relativo
    .replace(/href="\/static\//g,  `href="${basePath}static/`)
    .replace(/src="\/static\//g,   `src="${basePath}static/`)
    // favicon
    .replace(/href="\/static\/favicon\.svg"/g, `href="${basePath}static/favicon.svg"`)
    // WhatsApp e outros hrefs absolutos externos ficam como estão
    // Remove referência ao serveStatic (não necessário no estático)
    // Garante que o admin link também funcione
    .replace(/href="\/#/g, `href="#`)
    // Remove o script de live-reload do wrangler se existir
    .trim()
}

/* ── extrair HTML diretamente do source TSX interpretado ── */
async function buildFromSource() {
  console.log('\n🔨 Gerando build estático para GitHub Pages...\n')

  mkdir(OUT)

  // ── 1. Copiar assets estáticos ──────────────────────────────────────
  console.log('📁 Copiando assets...')
  copyDir(join(ROOT, 'public', 'static'), join(OUT, 'static'))

  // ── 2. Gerar landing page (index.html) ──────────────────────────────
  console.log('\n📄 Gerando index.html...')

  // Importa dinamicamente o módulo compilado se existir
  // Caso contrário, lê direto do dist/_worker.js não é viável,
  // então vamos usar uma abordagem de template substituindo as variáveis
  const indexSrc = readFileSync(join(ROOT, 'src', 'index.tsx'), 'utf8')

  // Extrai o número e msg do WhatsApp do source
  const waNumMatch  = indexSrc.match(/whatsappNumber\s*=\s*'([^']+)'/)
  const waMsgMatch  = indexSrc.match(/whatsappMsg\s*=\s*encodeURIComponent\('([^']+)'\)/)
  const waNum  = waNumMatch  ? waNumMatch[1]  : '5535999999999'
  const waMsg  = waMsgMatch  ? waMsgMatch[1]  : 'Olá! Tenho interesse no Fixador de Porcelanato da Pousinox. Pode me ajudar?'
  const waUrl  = `https://wa.me/${waNum}?text=${encodeURIComponent(waMsg)}`

  // Extrai todo o template HTML da landing page
  // Estratégia: pega tudo entre o primeiro c.html(` e o último `)
  const htmlStart = indexSrc.indexOf('return c.html(`')
  const htmlEnd   = indexSrc.lastIndexOf('`)')
  if (htmlStart === -1 || htmlEnd === -1) {
    throw new Error('Não foi possível extrair o HTML do index.tsx')
  }
  let landingHtml = indexSrc.slice(htmlStart + 'return c.html(`'.length, htmlEnd)

  // Substitui a variável ${whatsappUrl} pelo valor real
  landingHtml = landingHtml.replaceAll('${whatsappUrl}', waUrl)

  // Processa paths para GitHub Pages (root relativo)
  landingHtml = processHtml(landingHtml, '')

  write(join(OUT, 'index.html'), landingHtml)

  // ── 3. Gerar painel admin (admin/index.html) ─────────────────────────
  console.log('\n📄 Gerando admin/index.html...')

  const adminSrc = readFileSync(join(ROOT, 'src', 'admin.tsx'), 'utf8')

  // Extrai o template string do adminHtml()
  const adminStart = adminSrc.indexOf('return `')
  const adminEnd   = adminSrc.lastIndexOf('`\n}')
  if (adminStart === -1 || adminEnd === -1) {
    throw new Error('Não foi possível extrair o HTML do admin.tsx')
  }
  let adminHtml = adminSrc.slice(adminStart + 'return `'.length, adminEnd)

  // No admin, os paths precisam subir um nível (../static/)
  adminHtml = processHtml(adminHtml, '../')

  // Ajustar o link "Ver Landing Page" no admin para funcionar no GitHub Pages
  adminHtml = adminHtml.replace('href="/"', 'href="../"')

  write(join(OUT, 'admin', 'index.html'), adminHtml)

  // ── 4. Gerar .nojekyll (necessário para GitHub Pages não ignorar _files) ──
  write(join(OUT, '.nojekyll'), '')

  // ── 5. Gerar 404.html (redireciona para index para SPA) ──────────────
  const notFound = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="0;url=/">
<title>Pousinox</title>
</head><body>
<script>window.location.href = '/';</script>
</body></html>`
  write(join(OUT, '404.html'), notFound)

  console.log('\n✅ Build estático concluído!')
  console.log(`📦 Arquivos gerados em: docs/`)
  console.log('   docs/index.html       ← landing page')
  console.log('   docs/admin/index.html ← painel admin')
  console.log('   docs/static/          ← assets CSS/JS')
  console.log('   docs/.nojekyll')
  console.log('   docs/404.html\n')
}

buildFromSource().catch(err => {
  console.error('❌ Erro no build:', err.message)
  process.exit(1)
})
