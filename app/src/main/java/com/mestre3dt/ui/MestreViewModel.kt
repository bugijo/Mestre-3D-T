package com.mestre3dt.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.mestre3dt.data.Arc
import com.mestre3dt.data.Campaign
import com.mestre3dt.data.EncounterEnemyState
import com.mestre3dt.data.Enemy
import com.mestre3dt.data.InMemoryRepository
import com.mestre3dt.data.LocalSnapshotRepository
import com.mestre3dt.data.RemoteSnapshot
import com.mestre3dt.data.RemoteSyncRepository
import com.mestre3dt.data.Scene
import com.mestre3dt.data.SessionSummary
import com.mestre3dt.data.RollTrigger
import com.mestre3dt.data.SessionNote
import com.mestre3dt.data.SoundAsset
import com.mestre3dt.data.SoundEffect
import java.util.UUID
import kotlinx.coroutines.Job
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

sealed interface SyncStatus {
    data object Idle : SyncStatus
    data class Syncing(val message: String = "Sincronizando…") : SyncStatus
    data class Success(val message: String) : SyncStatus
    data class Error(val message: String) : SyncStatus
}

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
    val isSoundPlaying: Boolean = false,
    val syncStatus: SyncStatus = SyncStatus.Idle,
    val isRemoteConfigured: Boolean = false,
    val activeSession: com.mestre3dt.data.SessionLog? = null,
    val sessionLogs: List<com.mestre3dt.data.SessionLog> = emptyList(),
    val musicVolume: Float = 1.0f,
    val sfxVolume: Float = 1.0f
)

class MestreViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = InMemoryRepository()
    private val remoteSyncRepository = RemoteSyncRepository()
    private val localSnapshotRepository = LocalSnapshotRepository(application)

    private val activeCampaignIndex = MutableStateFlow(0)
    private val activeArcIndex = MutableStateFlow(0)
    private val activeSceneIndex = MutableStateFlow(0)
    private val activeSoundSceneIndex = MutableStateFlow(0)
    private val isSoundPlaying = MutableStateFlow(false)

    private val sessionSummaries = MutableStateFlow<List<SessionSummary>>(emptyList())

    private val encounterState = MutableStateFlow<List<EncounterEnemyState>>(emptyList())
    private val syncStatus = MutableStateFlow<SyncStatus>(SyncStatus.Idle)
    private var ongoingSync: Job? = null

    init {
        viewModelScope.launch(Dispatchers.IO) {
            val localSnapshot = localSnapshotRepository.loadSnapshot()
            if (localSnapshot != null) {
                applySnapshot(localSnapshot, persistLocal = false)
            } else {
                encounterState.value = buildEncounter(repository.enemies.value)
            }
        }
    }

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
        sessionSummaries,
        syncStatus,
        repository.activeSession,
        repository.sessionLogs,
        repository.musicVolume,
        repository.sfxVolume
    ) { campaigns, npcs, enemies, soundScenes, notes, campIdx, arcIdx, sceneIdx, encounter, soundIdx, playing, summaries, sync, activeSess, logs, mVol, sVol ->
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
            isSoundPlaying = playing,
            syncStatus = sync,
            isRemoteConfigured = remoteSyncRepository.isConfigured,
            activeSession = activeSess,
            sessionLogs = logs,
            musicVolume = mVol,
            sfxVolume = sVol
        )
    }.stateIn(viewModelScope, kotlinx.coroutines.flow.SharingStarted.WhileSubscribed(5_000), AppUiState())

    fun setActiveCampaign(index: Int) {
        activeCampaignIndex.value = index
        activeArcIndex.value = 0
        activeSceneIndex.value = 0
        persistLocalSnapshot()
    }

    fun setActiveArc(index: Int) {
        activeArcIndex.value = index
        activeSceneIndex.value = 0
        persistLocalSnapshot()
    }

    fun setActiveScene(index: Int) {
        activeSceneIndex.value = index
        persistLocalSnapshot()
    }

    fun addCampaign(campaign: Campaign) {
        repository.addCampaign(campaign)
        persistLocalSnapshot()
    }

    fun addArc(campaignIndex: Int, arc: Arc) {
        repository.addArc(campaignIndex, arc)
        setActiveArc(index = repository.campaigns.value[campaignIndex].arcs.size - 1)
        persistLocalSnapshot()
    }

    fun addScene(campaignIndex: Int, arcIndex: Int, scene: Scene) {
        repository.addScene(campaignIndex, arcIndex, scene)
        activeSceneIndex.value = repository.campaigns.value[campaignIndex].arcs[arcIndex].scenes.size - 1
        persistLocalSnapshot()
    }

    fun addTriggerToScene(campaignIndex: Int, arcIndex: Int, sceneIndex: Int, trigger: RollTrigger) {
        repository.addTriggerToScene(campaignIndex, arcIndex, sceneIndex, trigger)
        persistLocalSnapshot()
    }

    fun editTriggerInScene(campaignIndex: Int, arcIndex: Int, sceneIndex: Int, triggerIndex: Int, trigger: RollTrigger) {
        repository.editTriggerInScene(campaignIndex, arcIndex, sceneIndex, triggerIndex, trigger)
        persistLocalSnapshot()
    }

    fun removeTriggerFromScene(campaignIndex: Int, arcIndex: Int, sceneIndex: Int, triggerIndex: Int) {
        repository.removeTriggerFromScene(campaignIndex, arcIndex, sceneIndex, triggerIndex)
        persistLocalSnapshot()
    }

    fun addTriggerToNpc(index: Int, trigger: RollTrigger) {
        repository.addTriggerToNpc(index, trigger)
        persistLocalSnapshot()
    }

    fun editTriggerInNpc(index: Int, triggerIndex: Int, trigger: RollTrigger) {
        repository.editTriggerInNpc(index, triggerIndex, trigger)
        persistLocalSnapshot()
    }

    fun removeTriggerFromNpc(index: Int, triggerIndex: Int) {
        repository.removeTriggerFromNpc(index, triggerIndex)
        persistLocalSnapshot()
    }

    fun addNote(text: String, important: Boolean) {
        repository.addNote(SessionNote(text, important))
        persistLocalSnapshot()
    }

    fun startSession(campaignTitle: String) {
        repository.startSession(campaignTitle)
        persistLocalSnapshot()
    }

    fun endSessionWithSummary() {
        val campaigns = repository.campaigns.value
        val activeCampaign = campaigns.getOrNull(activeCampaignIndex.value)
        val activeArc = activeCampaign?.arcs?.getOrNull(activeArcIndex.value)
        val activeScene = activeArc?.scenes?.getOrNull(activeSceneIndex.value)
        val defeated = encounterState.value.filter { it.isDown || it.currentHp <= 0 }.map { it.label }
        
        val summary = SessionSummary(
            campaignTitle = activeCampaign?.title,
            arcTitle = activeArc?.title,
            sceneName = activeScene?.name,
            importantNotes = repository.sessionNotes.value.filter { it.important }.map { it.text },
            defeatedEnemies = defeated,
            timestamp = System.currentTimeMillis()
        )

        repository.addSummaryToSession(summary)
        repository.endSession()
        
        // Legacy support for simple list
        sessionSummaries.update { current -> listOf(summary) + current }
        
        encounterState.value = buildEncounter(repository.enemies.value)
        persistLocalSnapshot()
    }

    fun adjustEnemyHp(index: Int, delta: Int) {
        encounterState.update { current ->
            current.mapIndexed { idx, state ->
                if (idx != index) return@mapIndexed state
                val newHp = (state.currentHp + delta).coerceIn(0, state.enemy.maxHp)
                state.copy(currentHp = newHp, isDown = newHp <= 0 || state.isDown)
            }
        }
        persistLocalSnapshot()
    }

    fun toggleEnemyDown(index: Int) {
        encounterState.update { current ->
            current.mapIndexed { idx, state ->
                if (idx != index) return@mapIndexed state
                state.copy(isDown = !state.isDown, currentHp = if (!state.isDown) 0 else state.currentHp)
            }
        }
        persistLocalSnapshot()
    }

    fun adjustEnemyMp(index: Int, delta: Int) {
        encounterState.update { current ->
            current.mapIndexed { idx, state ->
                if (idx != index) return@mapIndexed state
                val currentMp = state.currentMp ?: 0
                val maxMp = state.enemy.maxMp ?: 0
                val newMp = (currentMp + delta).coerceIn(0, maxMp)
                state.copy(currentMp = newMp)
            }
        }
        persistLocalSnapshot()
    }

    fun removeEnemyInstance(index: Int) {
        encounterState.update { current ->
            current.filterIndexed { idx, _ -> idx != index }
        }
        persistLocalSnapshot()
    }

    fun resetEncounter() {
        encounterState.value = buildEncounter(repository.enemies.value)
        persistLocalSnapshot()
    }

    fun selectSoundScene(index: Int) {
        activeSoundSceneIndex.value = index
        persistLocalSnapshot()
    }

    fun toggleSoundPlayback() {
        isSoundPlaying.value = !isSoundPlaying.value
        persistLocalSnapshot()
    }

    fun setSoundBackground(sceneIndex: Int, background: SoundAsset) {
        persistLocalSnapshot()
    }

    fun setSfxVolume(volume: Float) {
        repository.setSfxVolume(volume)
        persistLocalSnapshot()
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
        persistLocalSnapshot()
    }

    private fun currentSnapshot(): RemoteSnapshot = RemoteSnapshot(
        campaigns = repository.campaigns.value,
        npcs = repository.npcs.value,
        enemies = repository.enemies.value,
        soundScenes = repository.soundScenes.value,
        sessionNotes = repository.sessionNotes.value,
        sessionSummaries = sessionSummaries.value,
        encounter = encounterState.value,
        activeCampaignIndex = activeCampaignIndex.value,
        activeArcIndex = activeArcIndex.value,
        activeSceneIndex = activeSceneIndex.value,
        activeSoundSceneIndex = activeSoundSceneIndex.value,
        isSoundPlaying = isSoundPlaying.value
    )

    private fun persistLocalSnapshot() {
        viewModelScope.launch(Dispatchers.IO) {
            localSnapshotRepository.saveSnapshot(currentSnapshot())
        }
    }

    fun pushSnapshotToCloud() {
        if (!remoteSyncRepository.isConfigured) {
            syncStatus.value = SyncStatus.Error("Defina SUPABASE_URL e SUPABASE_KEY em local.properties.")
            return
        }
        ongoingSync?.cancel()
        ongoingSync = viewModelScope.launch {
            syncStatus.value = SyncStatus.Syncing("Enviando backup…")
            val result = remoteSyncRepository.pushSnapshot(currentSnapshot())
            syncStatus.value = result.fold(
                onSuccess = { SyncStatus.Success("Backup enviado para Supabase.") },
                onFailure = { SyncStatus.Error(it.message ?: "Falha ao enviar backup.") }
            )
        }
    }

    fun pullSnapshotFromCloud() {
        if (!remoteSyncRepository.isConfigured) {
            syncStatus.value = SyncStatus.Error("Defina SUPABASE_URL e SUPABASE_KEY em local.properties.")
            return
        }
        ongoingSync?.cancel()
        ongoingSync = viewModelScope.launch {
            syncStatus.value = SyncStatus.Syncing("Baixando backup…")
            val result = remoteSyncRepository.pullLatest()
            syncStatus.value = result.fold(
                onSuccess = { snapshot ->
                    if (snapshot != null) {
                        applySnapshot(snapshot)
                        SyncStatus.Success("Backup mais recente aplicado.")
                    } else {
                        SyncStatus.Error("Nenhum snapshot remoto encontrado.")
                    }
                },
                onFailure = { SyncStatus.Error(it.message ?: "Falha ao baixar backup.") }
            )
        }
    }

    private fun applySnapshot(snapshot: RemoteSnapshot, persistLocal: Boolean = true) {
        repository.setCampaigns(snapshot.campaigns)
        repository.setNpcs(snapshot.npcs)
        repository.setEnemies(snapshot.enemies)
        repository.setSoundScenes(snapshot.soundScenes)
        repository.setNotes(snapshot.sessionNotes)
        sessionSummaries.value = snapshot.sessionSummaries
        activeCampaignIndex.value = snapshot.activeCampaignIndex
        activeArcIndex.value = snapshot.activeArcIndex
        activeSceneIndex.value = snapshot.activeSceneIndex
        encounterState.value = snapshot.encounter.ifEmpty { buildEncounter(snapshot.enemies) }
        activeSoundSceneIndex.value = snapshot.activeSoundSceneIndex
        isSoundPlaying.value = snapshot.isSoundPlaying
        if (persistLocal) {
            persistLocalSnapshot()
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
