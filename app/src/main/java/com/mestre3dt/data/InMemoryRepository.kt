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

    private val _activeSession = MutableStateFlow<SessionLog?>(null)
    val activeSession: StateFlow<SessionLog?> = _activeSession

    private val _sessionLogs = MutableStateFlow<List<SessionLog>>(emptyList())
    val sessionLogs: StateFlow<List<SessionLog>> = _sessionLogs

    private val _musicVolume = MutableStateFlow(1.0f)
    val musicVolume: StateFlow<Float> = _musicVolume

    private val _sfxVolume = MutableStateFlow(1.0f)
    val sfxVolume: StateFlow<Float> = _sfxVolume

    fun startSession(campaignTitle: String) {
        if (_activeSession.value == null) {
            _activeSession.value = SessionLog(
                id = java.util.UUID.randomUUID().toString(),
                startTime = System.currentTimeMillis(),
                endTime = null,
                campaignTitle = campaignTitle,
                summaries = emptyList()
            )
        }
    }

    fun endSession() {
        val current = _activeSession.value
        if (current != null) {
            val ended = current.copy(endTime = System.currentTimeMillis())
            _sessionLogs.value = listOf(ended) + _sessionLogs.value
            _activeSession.value = null
        }
    }

    fun addSummaryToSession(summary: SessionSummary) {
        val current = _activeSession.value
        if (current != null) {
            _activeSession.value = current.copy(summaries = current.summaries + summary)
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

    fun editTriggerInScene(campaignIndex: Int, arcIndex: Int, sceneIndex: Int, triggerIndex: Int, trigger: RollTrigger) {
        _campaigns.value = _campaigns.value.mapIndexed { cIndex, campaign ->
            if (cIndex != campaignIndex) return@mapIndexed campaign
            val updatedArcs = campaign.arcs.mapIndexed { aIndex, arc ->
                if (aIndex != arcIndex) return@mapIndexed arc
                val updatedScenes = arc.scenes.mapIndexed { sIndex, scene ->
                    if (sIndex != sceneIndex) return@mapIndexed scene
                    val updatedTriggers = scene.triggers.mapIndexed { tIndex, t ->
                        if (tIndex == triggerIndex) trigger else t
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

    fun updateEnemy(original: Enemy, updated: Enemy) {
        _enemies.value = _enemies.value.map { enemy ->
            if (enemy == original) updated else enemy
        }
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

    fun editTriggerInNpc(index: Int, triggerIndex: Int, trigger: RollTrigger) {
        _npcs.value = _npcs.value.mapIndexed { npcIndex, npc ->
            if (npcIndex != index) return@mapIndexed npc
            val updatedTriggers = npc.triggers.mapIndexed { tIndex, t ->
                if (tIndex == triggerIndex) trigger else t
            }
            npc.copy(triggers = updatedTriggers)
        }
    }

    fun removeTriggerFromNpc(index: Int, triggerIndex: Int) {
        _npcs.value = _npcs.value.mapIndexed { npcIndex, npc ->
            if (npcIndex != index) return@mapIndexed npc
            npc.copy(triggers = npc.triggers.filterIndexed { tIndex, _ -> tIndex != triggerIndex })
        }
    }

    fun setMusicVolume(volume: Float) {
        _musicVolume.value = volume.coerceIn(0f, 1f)
    }

    fun setSfxVolume(volume: Float) {
        _sfxVolume.value = volume.coerceIn(0f, 1f)
    }

    fun setEnemies(enemies: List<Enemy>) {
        _enemies.value = enemies
    }

    fun setSoundScenes(soundScenes: List<SoundScene>) {
        _soundScenes.value = soundScenes
    }

    fun setNotes(sessionNotes: List<SessionNote>) {
        _sessionNotes.value = sessionNotes
    }
}
