import { copyFile, writeFile } from 'node:fs/promises'

async function main() {
  await copyFile('dist/index.html', 'dist/404.html')
  await writeFile('dist/.nojekyll', '')
  console.info('[postbuild] Fallback SPA e .nojekyll preparados para GitHub Pages.')
}

main().catch((error) => {
  console.error('[postbuild] Erro fatal:', error)
  process.exitCode = 1
})
