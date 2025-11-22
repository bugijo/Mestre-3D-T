package com.mestre3dt.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mestre3dt.data.Arc
import com.mestre3dt.data.Campaign
import com.mestre3dt.data.EncounterEnemyState
import com.mestre3dt.data.Enemy
import com.mestre3dt.data.InMemoryRepository
import com.mestre3dt.data.Scene
import com.mestre3dt.data.SessionSummary
import com.mestre3dt.data.RollTrigger
import com.mestre3dt.data.SessionNote
import com.mestre3dt.data.SoundAsset
import com.mestre3dt.data.SoundEffect
import java.util.UUID
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update

data class AppUiState(
    val campaigns: List<Campaign> = emptyList(),
    val npcs: List<com.mestre3dt.data.Npc> = emptyList(),
    val enemies: List<Enemy> = emptyList(),
    val soundScenes: List<com.mestre3dt.data.SoundScene> = emptyList(),
    val sessionNotes: List<SessionNote> = emptyList(),
    val sessionSummaries: List<SessionSummary> = emptyList(),
    val activeCampaignIndex: Int = 0,
    val activeArcIndex: Int = 0,
    val activeSceneIndex: Int = 0,
    val encounter: List<EncounterEnemyState> = emptyList(),
    val activeSoundSceneIndex: Int = 0,
    val isSoundPlaying: Boolean = false
)

class MestreViewModel : ViewModel() {
    private val repository = InMemoryRepository()

    private val activeCampaignIndex = MutableStateFlow(0)
    private val activeArcIndex = MutableStateFlow(0)
    private val activeSceneIndex = MutableStateFlow(0)
    private val activeSoundSceneIndex = MutableStateFlow(0)
    private val isSoundPlaying = MutableStateFlow(false)

    private val sessionSummaries = MutableStateFlow<List<SessionSummary>>(emptyList())

    private val encounterState = MutableStateFlow<List<EncounterEnemyState>>(emptyList())

    val uiState: StateFlow<AppUiState> = combine(
        repository.campaigns,
        repository.npcs,
        repository.enemies,
        repository.soundScenes,
        repository.sessionNotes,
        activeCampaignIndex,
        activeArcIndex,
        activeSceneIndex,
        encounterState,
        activeSoundSceneIndex,
        isSoundPlaying,
        sessionSummaries
    ) { campaigns, npcs, enemies, soundScenes, notes, campIdx, arcIdx, sceneIdx, encounter, soundIdx, playing, summaries ->
        val safeCampaignIdx = campIdx.coerceIn(0, (campaigns.size - 1).coerceAtLeast(0))
        val selectedCampaign = campaigns.getOrNull(safeCampaignIdx)
        val safeArcIdx = arcIdx.coerceIn(0, (selectedCampaign?.arcs?.size?.minus(1) ?: 0).coerceAtLeast(0))
        val selectedArc = selectedCampaign?.arcs?.getOrNull(safeArcIdx)
        val safeSceneIdx = sceneIdx.coerceIn(0, (selectedArc?.scenes?.size?.minus(1) ?: 0).coerceAtLeast(0))

        AppUiState(
            campaigns = campaigns,
            npcs = npcs,
            enemies = enemies,
            soundScenes = soundScenes,
            sessionNotes = notes,
            sessionSummaries = summaries,
            activeCampaignIndex = safeCampaignIdx,
            activeArcIndex = safeArcIdx,
            activeSceneIndex = safeSceneIdx,
            encounter = if (encounter.isEmpty()) buildEncounter(enemies) else encounter,
            activeSoundSceneIndex = soundIdx.coerceIn(0, (soundScenes.size - 1).coerceAtLeast(0)),
            isSoundPlaying = playing
        )
    }.stateIn(viewModelScope, kotlinx.coroutines.flow.SharingStarted.WhileSubscribed(5_000), AppUiState())

    fun setActiveCampaign(index: Int) {
        activeCampaignIndex.value = index
        activeArcIndex.value = 0
        activeSceneIndex.value = 0
    }

    fun setActiveArc(index: Int) {
        activeArcIndex.value = index
        activeSceneIndex.value = 0
    }

    fun setActiveScene(index: Int) {
        activeSceneIndex.value = index
    }

    fun addCampaign(campaign: Campaign) = repository.addCampaign(campaign)

    fun addArc(campaignIndex: Int, arc: Arc) {
        repository.addArc(campaignIndex, arc)
        setActiveArc(index = repository.campaigns.value[campaignIndex].arcs.size - 1)
    }

    fun addScene(campaignIndex: Int, arcIndex: Int, scene: Scene) {
        repository.addScene(campaignIndex, arcIndex, scene)
        activeSceneIndex.value = repository.campaigns.value[campaignIndex].arcs[arcIndex].scenes.size - 1
    }

    fun addTriggerToScene(campaignIndex: Int, arcIndex: Int, sceneIndex: Int, trigger: RollTrigger) {
        repository.addTriggerToScene(campaignIndex, arcIndex, sceneIndex, trigger)
    }

    fun addNote(text: String, important: Boolean) {
        repository.addNote(SessionNote(text, important))
    }

    fun endSessionWithSummary() {
        val campaigns = repository.campaigns.value
        val activeCampaign = campaigns.getOrNull(activeCampaignIndex.value)
        val activeArc = activeCampaign?.arcs?.getOrNull(activeArcIndex.value)
        val activeScene = activeArc?.scenes?.getOrNull(activeSceneIndex.value)
        val defeated = encounterState.value.filter { it.isDown || it.currentHp <= 0 }.map { it.label }
        sessionSummaries.update { current ->
            listOf(
                SessionSummary(
                    campaignTitle = activeCampaign?.title,
                    arcTitle = activeArc?.title,
                    sceneName = activeScene?.name,
                    importantNotes = repository.sessionNotes.value.filter { it.important }.map { it.text },
                    defeatedEnemies = defeated,
                    timestamp = System.currentTimeMillis()
                )
            ) + current
        }
        encounterState.value = buildEncounter(repository.enemies.value)
    }

    fun adjustEnemyHp(index: Int, delta: Int) {
        encounterState.update { current ->
            current.mapIndexed { idx, state ->
                if (idx != index) return@mapIndexed state
                val newHp = (state.currentHp + delta).coerceIn(0, state.enemy.maxHp)
                state.copy(currentHp = newHp, isDown = newHp <= 0 || state.isDown)
            }
        }
    }

    fun toggleEnemyDown(index: Int) {
        encounterState.update { current ->
            current.mapIndexed { idx, state ->
                if (idx != index) return@mapIndexed state
                state.copy(isDown = !state.isDown, currentHp = if (!state.isDown) 0 else state.currentHp)
            }
        }
    }

    fun resetEncounter() {
        encounterState.value = buildEncounter(repository.enemies.value)
    }

    fun selectSoundScene(index: Int) {
        activeSoundSceneIndex.value = index
    }

    fun toggleSoundPlayback() {
        isSoundPlaying.value = !isSoundPlaying.value
    }

    fun setSoundBackground(sceneIndex: Int, background: SoundAsset) {
        repository.setSoundBackground(sceneIndex, background)
        activeSoundSceneIndex.value = sceneIndex
    }

    fun addSoundEffect(sceneIndex: Int, effect: SoundEffect) {
        repository.addSoundEffect(sceneIndex, effect)
    }

    fun addEnemyInstance(enemy: Enemy, quantity: Int) {
        if (quantity <= 0) return
        encounterState.update { current ->
            current + List(quantity) { idx ->
                EncounterEnemyState(
                    id = UUID.randomUUID().toString(),
                    label = "${enemy.name} #${current.count { it.enemy.name == enemy.name } + idx + 1}",
                    enemy = enemy,
                    currentHp = enemy.currentHp,
                    currentMp = enemy.currentMp,
                    isDown = enemy.currentHp <= 0
                )
            }
        }
    }

    private fun buildEncounter(enemies: List<Enemy>): List<EncounterEnemyState> =
        enemies.mapIndexed { index, enemy ->
            EncounterEnemyState(
                id = UUID.randomUUID().toString(),
                label = "${enemy.name} #${index + 1}",
                enemy = enemy,
                currentHp = enemy.currentHp,
                currentMp = enemy.currentMp,
                isDown = enemy.currentHp <= 0
            )
        }
}
