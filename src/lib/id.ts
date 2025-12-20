export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `id_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`
}

