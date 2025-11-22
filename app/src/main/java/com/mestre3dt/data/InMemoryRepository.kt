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
