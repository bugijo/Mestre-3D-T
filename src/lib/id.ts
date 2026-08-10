/**
 * Gera um UUID v4 seguro.
 *
 * - Em contexto seguro (HTTPS ou localhost): usa `crypto.randomUUID()` (nativo, rápido).
 * - Se `randomUUID` não estiver disponível (ex: HTTP LAN, navegadores antigos):
 *   usa `crypto.getRandomValues()` para preencher os bytes aleatórios.
 * - Se nem `crypto` existir (ambiente muito restrito):
 *   fallback para `Date.now()` + `Math.random()`, sem garantia criptográfica.
 *
 * A função **nunca** lança exceção — sempre retorna uma string no formato UUID v4.
 */

/** Constrói UUID v4 a partir de 16 bytes aleatórios */
function uuidFromBytes(bytes: Uint8Array): string {
  // Ajusta os bits para UUID v4: versão 4 e variante RFC 4122
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // version 4 (0100xxxx)
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant 10xxxxxx

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function createId(): string {
  // 1. Caminho ideal: crypto.randomUUID()
  if (typeof crypto !== 'undefined') {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }

    // 2. Fallback com crypto.getRandomValues() — funciona em HTTP LAN
    //    Acessamos via Crypto.prototype para evitar perda de bind em testes
    if (typeof Uint8Array !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16)
      crypto.getRandomValues(bytes)
      return uuidFromBytes(bytes)
    }
  }

  // 3. Fallback não criptográfico (último recurso)
  const timestamp = Date.now().toString(16).padStart(12, '0')
  const random1 = Math.random().toString(16).slice(2, 14).padEnd(12, '0')
  const random2 = Math.random().toString(16).slice(2, 10).padEnd(8, '0')
  return [
    timestamp.slice(0, 8),
    timestamp.slice(8, 12),
    '4' + random1.slice(1, 4),
    '8' + random2.slice(0, 3),
    random1.slice(4, 12) + random2.slice(3, 7),
  ].join('-')
}