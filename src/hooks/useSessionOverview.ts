import { useMemo } from 'react'
import { useAppStore } from '@/store/AppStore'

export function useSessionOverview() {
  const { state } = useAppStore()

  return useMemo(() => {
    const { session, campaigns, scenes, characters, combats } = state
    const activeCampaign = campaigns.find((campaign) => campaign.id === session.activeCampaignId) ?? null
    const activeScene = scenes.find((scene) => scene.id === session.activeSceneId) ?? null
    const campaignScenes = scenes
      .filter((scene) => scene.campaignId === session.activeCampaignId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
    const linkedNpcIds = activeScene?.npcIds ?? []
    const linkedEnemyIds = activeScene?.enemyIds ?? []
    const npcsInScene = characters.filter((character) => linkedNpcIds.includes(character.id))
    const enemiesInScene = characters.filter((character) => linkedEnemyIds.includes(character.id))
    const playersInCampaign = characters.filter(
      (character) =>
        character.campaignId === session.activeCampaignId &&
        (character.type === 'PLAYER' || character.type === 'COMPANION'),
    )
    const activeCombat = combats.find((combat) => combat.id === session.activeCombatId) ?? null
    const lastEndedCombat =
      activeScene == null
        ? null
        : [...combats.filter((combat) => !combat.isActive && combat.sceneId === activeScene.id)].sort(
            (a, b) => (b.endedAt || 0) - (a.endedAt || 0),
          )[0] ?? null

    return {
      activeCampaign,
      activeCombat,
      activeScene,
      campaignScenes,
      enemiesInScene,
      lastEndedCombat,
      npcsInScene,
      playersInCampaign,
      session,
      state,
    }
  }, [state])
}
