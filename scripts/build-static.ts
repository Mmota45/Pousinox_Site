/**
 * build-static.ts
 * Importa as funções do Hono diretamente e gera HTML estático
 * para deploy no GitHub Pages (pasta docs/).
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT  = join(ROOT, 'docs')

/* ── helpers ── */
function mkdir(p: string) { mkdirSync(p, { recursive: true }) }

function write(file: string, content: string) {
  mkdir(dirname(file))
  writeFileSync(file, content, 'utf8')
  console.log('  ✓', file.replace(ROOT, ''))
}

function copyDir(src: string, dest: string) {
  mkdir(dest)
  for (const entry of readdirSync(src)) {
    const s = join(src, entry), d = join(dest, entry)
    if (statSync(s).isDirectory()) copyDir(s, d)
    else { copyFileSync(s, d); console.log('  ✓', d.replace(ROOT, '')) }
  }
}

/* ── processar HTML para GitHub Pages ── */
function processHtml(html: string, prefix: string = '') {
  return html
    .replace(/href="\/static\//g,  `href="${prefix}static/`)
    .replace(/src="\/static\//g,   `src="${prefix}static/`)
    .replace(/action="\/api\//g,   `action="${prefix}api/`)
    .trim()
}

/* ── importar adminHtml do módulo TypeScript ── */
async function getAdminHtml(): Promise<string> {
  // Importação dinâmica — tsx resolve o TypeScript em runtime
  const mod = await import('../src/admin.tsx' as string)
  return mod.adminHtml()
}

/* ── gerar landing page HTML ── */
function getLandingHtml(): string {
  const src = readFileSync(join(ROOT, 'src', 'index.tsx'), 'utf8')

  // Extrai número e mensagem do WhatsApp
  const waNumMatch = src.match(/whatsappNumber\s*=\s*'([^']+)'/)
  const waMsgMatch = src.match(/encodeURIComponent\('([^']+)'\)/)
  const waNum = waNumMatch ? waNumMatch[1] : '5535999999999'
  const waMsg = waMsgMatch ? waMsgMatch[1] : 'Olá! Tenho interesse no Fixador de Porcelanato da Pousinox. Pode me ajudar?'
  const waUrl = `https://wa.me/${waNum}?text=${encodeURIComponent(waMsg)}`

  // Extrai o bloco HTML entre return c.html(` e o último `)
  const start = src.indexOf('return c.html(`')
  if (start === -1) throw new Error('Marcador return c.html(`) não encontrado em index.tsx')

  // Encontra o fechamento correto: última ocorrência de `)` que fecha o c.html
  // Estratégia: pega da posição start+15 até encontrar \`)\n
  const htmlBody = src.slice(start + 'return c.html(`'.length)
  const endMatch = htmlBody.lastIndexOf('`)')
  if (endMatch === -1) throw new Error('Fechamento `) não encontrado em index.tsx')

  let html = htmlBody.slice(0, endMatch)

  // Substitui variável ${whatsappUrl}
  html = html.replaceAll('${whatsappUrl}', waUrl)

  return html
}

/* ── main ── */
async function main() {
  console.log('\n🔨 Gerando build estático para GitHub Pages...\n')

  mkdir(OUT)

  // 1. Copiar assets estáticos
  console.log('📁 Copiando assets estáticos...')
  copyDir(join(ROOT, 'public', 'static'), join(OUT, 'static'))

  // 2. Landing page → docs/index.html
  console.log('\n📄 Gerando docs/index.html...')
  const landingHtml = getLandingHtml()
  write(join(OUT, 'index.html'), processHtml(landingHtml, ''))

  // 3. Painel admin → docs/admin/index.html
  console.log('\n📄 Gerando docs/admin/index.html...')
  let adminHtml = await getAdminHtml()
  // Ajusta path para ../static/ (um nível acima)
  adminHtml = processHtml(adminHtml, '../')
  // Link "Ver Landing Page" volta para a raiz
  adminHtml = adminHtml.replace('href="/"', 'href="../index.html"')
  adminHtml = adminHtml.replace("href='/'", "href='../index.html'")
  write(join(OUT, 'admin', 'index.html'), adminHtml)

  // 4. .nojekyll — necessário para GitHub Pages não ignorar arquivos _
  write(join(OUT, '.nojekyll'), '')

  // 5. 404.html — redirect para index
  write(join(OUT, '404.html'), `<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="0;url=../index.html">
<title>Redirecionando — Pousinox</title>
</head><body>
<script>window.location.replace(window.location.origin + '/Pousinox_Site/');</script>
</body></html>`)

  console.log('\n✅ Build estático concluído com sucesso!')
  console.log('📦 Arquivos em docs/:')
  console.log('   index.html       → landing page')
  console.log('   admin/index.html → painel admin')
  console.log('   static/          → CSS, JS, favicon')
  console.log('   .nojekyll')
  console.log('   404.html\n')
}

main().catch(err => {
  console.error('\n❌ Erro no build:', err.message)
  console.error(err.stack)
  process.exit(1)
})
