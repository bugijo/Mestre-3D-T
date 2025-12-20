import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

function listFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: string[] = []
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      files.push(...listFiles(p))
    } else if (/\.(ts|tsx|js)$/i.test(e.name) && !/\.test\.(ts|tsx|js)$/i.test(e.name)) {
      files.push(p)
    }
  }
  return files
}

function scanSuspicious(): { file: string; line: number; text: string }[] {
  const root = path.resolve(__dirname, '..')
  const srcDir = path.join(root)
  const files = listFiles(srcDir)
  const issues: { file: string; line: number; text: string }[] = []
  const patterns = [
    /supabase\.co/i,
    /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/,
    /SUPABASE_ANON_KEY\s*=\s*['"]/,
  ]
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8')
    const lines = content.split(/\r?\n/)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      for (const pat of patterns) {
        if (pat.test(line)) {
          issues.push({ file: f, line: i + 1, text: line.trim() })
          break
        }
      }
    }
  }
  return issues
}

describe('Integridade de segurança básica', () => {
  it('não possui chaves ou URLs sensíveis hardcoded em src', () => {
    const found = scanSuspicious()
    expect(found).toEqual([])
  })
})
