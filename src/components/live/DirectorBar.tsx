import { useMemo, useState } from 'react'
import { Gift, Image, Map, MessageSquare, Radio, Send, Sparkles, Swords, UserRound, Volume2 } from 'lucide-react'
import type { Character, RewardEvent, Scene } from '@/domain/models'
import type { LiveAudience, StageKind, StagePresentation } from '@/realtime/protocol'
import { useOptionalLiveSession } from '@/realtime/LiveSessionContext'
import { createId } from '@/lib/id'

export function DirectorBar({
  scene,
  npcs,
  combatActive,
  audioUrl,
  lastReward,
}: {
  scene: Scene | null
  npcs: Character[]
  combatActive: boolean
  audioUrl: string | null
  lastReward: RewardEvent | null
}) {
  const live = useOptionalLiveSession()
  const [message, setMessage] = useState('')
  const [audienceKey, setAudienceKey] = useState('all')
  const approved = live?.participants.filter((entry) => entry.status === 'approved') ?? []
  const audience = useMemo<LiveAudience>(() => audienceKey === 'all' ? { kind: 'all' } : { kind: 'participants', participantIds: [audienceKey] }, [audienceKey])

  if (!live?.code) return null

  const present = (kind: StageKind, title: string, body: string, imageUrl?: string | null, transition: StagePresentation['transition'] = 'fade') => {
    live.presentStage({ id: createId(), kind, title, body, imageUrl, transition, audience })
  }

  return (
    <section className="director-bar" aria-label="Barra do Diretor">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
        <Radio size={14} className="text-[#c98b8f]" />
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white">Barra do Diretor</span>
        <span className="ml-auto text-[11px] text-text-muted">Apresentar aos jogadores</span>
      </div>
      <div className="flex gap-2 overflow-x-auto px-3 py-3">
        <DirectorButton icon={Image} label="Cena" disabled={!scene} onClick={() => scene && present('scene', scene.name, scene.opening || scene.description, scene.backgroundImageDataUrl, 'fade')} />
        <DirectorButton icon={UserRound} label="NPC" disabled={!npcs[0]} onClick={() => npcs[0] && present('npc_reveal', npcs[0].name, npcs[0].role || npcs[0].personality, npcs[0].imageUri, 'reveal')} />
        <DirectorButton icon={Map} label="Mapa" disabled={!scene} onClick={() => scene && present('map', scene.name, scene.objective, scene.mapImageDataUrl || scene.backgroundImageDataUrl, 'zoom')} />
        <DirectorButton icon={Swords} label="Combate" disabled={!combatActive} onClick={() => present('combat', 'Confronto iniciado', 'A iniciativa está em curso. Acompanhem seus recursos e o turno atual.', null, 'zoom')} />
        <DirectorButton icon={Volume2} label="Som" disabled={!audioUrl} onClick={() => present('message', 'Paisagem sonora', 'O Mestre alterou o áudio da cena.', null, 'fade')} />
        <DirectorButton icon={Sparkles} label="Evento" onClick={() => present('message', 'Algo mudou', 'O ambiente reage às escolhas do grupo.', null, 'reveal')} />
        <DirectorButton icon={Gift} label="Recompensa" disabled={!lastReward} onClick={() => present('reward', 'Recompensa recebida', lastReward?.notes || 'A equipe recebeu uma nova recompensa.', null, 'reward')} />
        <DirectorButton icon={MessageSquare} label="Improvisar" onClick={() => setMessage('Vocês percebem um detalhe que não estava ali antes…')} />
      </div>
      <div className="grid gap-2 border-t border-white/10 px-3 py-3 sm:grid-cols-[170px_1fr_auto]">
        <select value={audienceKey} onChange={(event) => setAudienceKey(event.target.value)} aria-label="Destinatário da apresentação" className="field">
          <option value="all">Todos os jogadores</option>
          {approved.map((participant) => <option key={participant.id} value={participant.id}>Só {participant.playerName}</option>)}
        </select>
        <input value={message} onChange={(event) => setMessage(event.target.value)} className="field" placeholder="Mensagem, pista ou informação secreta…" />
        <button
          type="button"
          disabled={!message.trim()}
          onClick={() => {
            present('message', audienceKey === 'all' ? 'Mensagem do Mestre' : 'Informação reservada', message.trim(), null, 'reveal')
            live.sendEvent('message', { text: message.trim() }, audience)
            setMessage('')
          }}
          className="btn-primary"
        ><Send size={15} /> Enviar</button>
      </div>
    </section>
  )
}

function DirectorButton({ icon: Icon, label, disabled, onClick }: { icon: typeof Image; label: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="director-action">
      <Icon size={16} /><span>{label}</span>
    </button>
  )
}
