package com.mestre3dt.data

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class InMemoryRepository {
    private val _campaigns = MutableStateFlow(sampleCampaigns)
    val campaigns: StateFlow<List<Campaign>> = _campaigns

    private val _npcs = MutableStateFlow(sampleNpcs)
    val npcs: StateFlow<List<Npc>> = _npcs

    private val _enemies = MutableStateFlow(sampleEnemies)
    val enemies: StateFlow<List<Enemy>> = _enemies

    private val _soundScenes = MutableStateFlow(sampleSoundScenes)
    val soundScenes: StateFlow<List<SoundScene>> = _soundScenes

    private val _sessionNotes = MutableStateFlow(sampleNotes)
    val sessionNotes: StateFlow<List<SessionNote>> = _sessionNotes

    fun addEnemy(enemy: Enemy) {
        _enemies.value = listOf(enemy) + _enemies.value
    }

    fun updateEnemy(index: Int, enemy: Enemy) {
        _enemies.value = _enemies.value.mapIndexed { currentIndex, current ->
            if (currentIndex == index) enemy else current
        }
    }

    fun removeEnemy(index: Int) {
        _enemies.value = _enemies.value.filterIndexed { currentIndex, _ -> currentIndex != index }
    }

    fun addPowerToEnemy(enemyIndex: Int, power: Power) {
        _enemies.value = _enemies.value.mapIndexed { index, enemy ->
            if (index != enemyIndex) return@mapIndexed enemy
            enemy.copy(powers = enemy.powers + power)
        }
    }

    fun updatePower(enemyIndex: Int, powerIndex: Int, power: Power) {
        _enemies.value = _enemies.value.mapIndexed { index, enemy ->
            if (index != enemyIndex) return@mapIndexed enemy
            val updatedPowers = enemy.powers.mapIndexed { idx, current ->
                if (idx != powerIndex) current else power
            }
            enemy.copy(powers = updatedPowers)
        }
    }

    fun removePower(enemyIndex: Int, powerIndex: Int) {
        _enemies.value = _enemies.value.mapIndexed { index, enemy ->
            if (index != enemyIndex) return@mapIndexed enemy
            enemy.copy(powers = enemy.powers.filterIndexed { idx, _ -> idx != powerIndex })
        }
    }

    fun addTriggerToScene(campaignIndex: Int, arcIndex: Int, sceneIndex: Int, trigger: RollTrigger) {
        _campaigns.value = _campaigns.value.mapIndexed { cIndex, campaign ->
            if (cIndex != campaignIndex) return@mapIndexed campaign
            val updatedArcs = campaign.arcs.mapIndexed { aIndex, arc ->
                if (aIndex != arcIndex) return@mapIndexed arc
                val updatedScenes = arc.scenes.mapIndexed { sIndex, scene ->
                    if (sIndex != sceneIndex) return@mapIndexed scene
                    scene.copy(triggers = scene.triggers + trigger)
                }
                arc.copy(scenes = updatedScenes)
            }
            campaign.copy(arcs = updatedArcs)
        }
    }

    fun updateTriggerInScene(
        campaignIndex: Int,
        arcIndex: Int,
        sceneIndex: Int,
        triggerIndex: Int,
        trigger: RollTrigger
    ) {
        _campaigns.value = _campaigns.value.mapIndexed { cIndex, campaign ->
            if (cIndex != campaignIndex) return@mapIndexed campaign
            val updatedArcs = campaign.arcs.mapIndexed { aIndex, arc ->
                if (aIndex != arcIndex) return@mapIndexed arc
                val updatedScenes = arc.scenes.mapIndexed { sIndex, scene ->
                    if (sIndex != sceneIndex) return@mapIndexed scene
                    val updatedTriggers = scene.triggers.mapIndexed { tIndex, current ->
                        if (tIndex != triggerIndex) current else trigger
                    }
                    scene.copy(triggers = updatedTriggers)
                }
                arc.copy(scenes = updatedScenes)
            }
            campaign.copy(arcs = updatedArcs)
        }
    }

    fun removeTriggerFromScene(campaignIndex: Int, arcIndex: Int, sceneIndex: Int, triggerIndex: Int) {
        _campaigns.value = _campaigns.value.mapIndexed { cIndex, campaign ->
            if (cIndex != campaignIndex) return@mapIndexed campaign
            val updatedArcs = campaign.arcs.mapIndexed { aIndex, arc ->
                if (aIndex != arcIndex) return@mapIndexed arc
                val updatedScenes = arc.scenes.mapIndexed { sIndex, scene ->
                    if (sIndex != sceneIndex) return@mapIndexed scene
                    scene.copy(triggers = scene.triggers.filterIndexed { index, _ -> index != triggerIndex })
                }
                arc.copy(scenes = updatedScenes)
            }
            campaign.copy(arcs = updatedArcs)
        }
    }

    fun addCampaign(campaign: Campaign) {
        _campaigns.value = listOf(campaign) + _campaigns.value
    }

    fun addArc(campaignIndex: Int, arc: Arc) {
        _campaigns.value = _campaigns.value.mapIndexed { index, campaign ->
            if (index == campaignIndex) campaign.copy(arcs = campaign.arcs + arc) else campaign
        }
    }

    fun addScene(campaignIndex: Int, arcIndex: Int, scene: Scene) {
        _campaigns.value = _campaigns.value.mapIndexed { cIndex, campaign ->
            if (cIndex != campaignIndex) return@mapIndexed campaign
            val updatedArcs = campaign.arcs.mapIndexed { aIndex, arc ->
                if (aIndex == arcIndex) arc.copy(scenes = arc.scenes + scene) else arc
            }
            campaign.copy(arcs = updatedArcs)
        }
    }

    fun addNote(note: SessionNote) {
        _sessionNotes.value = listOf(note) + _sessionNotes.value
    }

    fun setSoundBackground(sceneIndex: Int, background: SoundAsset) {
        _soundScenes.value = _soundScenes.value.mapIndexed { index, scene ->
            if (index != sceneIndex) return@mapIndexed scene
            scene.copy(background = background)
        }
    }

    fun addSoundEffect(sceneIndex: Int, effect: SoundEffect) {
        _soundScenes.value = _soundScenes.value.mapIndexed { index, scene ->
            if (index != sceneIndex) return@mapIndexed scene
            scene.copy(effects = scene.effects + effect)
        }
    }

    fun updateEnemies(updater: (List<Enemy>) -> List<Enemy>) {
        _enemies.value = updater(_enemies.value)
    }

    fun setCampaigns(items: List<Campaign>) {
        _campaigns.value = items
    }

    fun setNpcs(items: List<Npc>) {
        _npcs.value = items
    }

    fun addTriggerToNpc(index: Int, trigger: RollTrigger) {
        _npcs.value = _npcs.value.mapIndexed { npcIndex, npc ->
            if (npcIndex != index) return@mapIndexed npc
            npc.copy(triggers = npc.triggers + trigger)
        }
    }

    fun updateTriggerInNpc(index: Int, triggerIndex: Int, trigger: RollTrigger) {
        _npcs.value = _npcs.value.mapIndexed { npcIndex, npc ->
            if (npcIndex != index) return@mapIndexed npc
            val updated = npc.triggers.mapIndexed { tIndex, current ->
                if (tIndex != triggerIndex) current else trigger
            }
            npc.copy(triggers = updated)
        }
    }

    fun removeTriggerFromNpc(index: Int, triggerIndex: Int) {
        _npcs.value = _npcs.value.mapIndexed { npcIndex, npc ->
            if (npcIndex != index) return@mapIndexed npc
            npc.copy(triggers = npc.triggers.filterIndexed { idx, _ -> idx != triggerIndex })
        }
    }

    fun setEnemies(items: List<Enemy>) {
        _enemies.value = items
    }

    fun setSoundScenes(items: List<SoundScene>) {
        _soundScenes.value = items
    }

    fun setNotes(items: List<SessionNote>) {
        _sessionNotes.value = items
    }
}
