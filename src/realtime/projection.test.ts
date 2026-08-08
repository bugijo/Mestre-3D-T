import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultSnapshot } from '@/store/defaultData'
import { createSessionProjection, sanitizeCharacterForPlayers, sanitizeSceneForPlayers } from './projection'

describe('projeção da sessão presencial', () => {
  beforeEach(() => localStorage.clear())

  it('remove segredos, anexos e histórico permanente das fichas enviadas', () => {
    const snapshot = createDefaultSnapshot()
    const character = snapshot.characters[0]
    character.secrets = { master: 'não vazar' }
    character.history = [{ id: 'history', type: 'event', title: 'Privado', detail: 'Detalhe', createdAt: 1 }]
    character.sourceAttachment = { name: 'ficha.pdf', mimeType: 'application/pdf', size: 100, reviewedAt: 1 }

    const safe = sanitizeCharacterForPlayers(character)
    expect(safe.secrets).toEqual({})
    expect(safe.history).toEqual([])
    expect(safe.sourceAttachment).toBeUndefined()
  })

  it('não projeta ganchos, gatilhos ou caminhos narrativos do Mestre', () => {
    const snapshot = createDefaultSnapshot()
    const scene = snapshot.scenes[0]
    const safe = sanitizeSceneForPlayers(scene)
    expect(safe?.hooks).toEqual([])
    expect(safe?.triggers).toEqual([])
    expect(safe?.connections).toEqual([])
    expect(safe?.enemyIds).toEqual([])
  })

  it('inclui o estado persistido do mapa e somente dados sanitizados', () => {
    const snapshot = createDefaultSnapshot()
    const sceneId = snapshot.session.activeSceneId!
    localStorage.setItem(`map-state:${sceneId}`, JSON.stringify({ fogEnabled: true, tokens: [{ id: 'token' }] }))
    snapshot.characters[0].secrets = { master: 'segredo' }

    const projection = createSessionProjection(snapshot)
    expect(projection.mapState).toEqual({ fogEnabled: true, tokens: [{ id: 'token' }] })
    expect(projection.characters[0].secrets).toEqual({})
    expect(projection.scene?.hooks).toEqual([])
  })
})
