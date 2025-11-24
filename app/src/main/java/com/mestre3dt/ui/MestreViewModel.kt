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
import com.mestre3dt.data.Npc
import com.mestre3dt.data.RemoteSnapshot
import com.mestre3dt.data.RemoteSyncRepository
import com.mestre3dt.data.RollTrigger
import com.mestre3dt.data.Scene
import com.mestre3dt.data.SessionLog
import com.mestre3dt.data.SessionNote
import com.mestre3dt.data.SessionSummary
import com.mestre3dt.data.SoundAsset
import com.mestre3dt.data.SoundEffect
import com.mestre3dt.data.SoundScene
import java.util.UUID
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
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
    val npcs: List<Npc> = emptyList(),
    val enemies: List<Enemy> = emptyList(),
    val soundScenes: List<SoundScene> = emptyList(),
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
    val activeSession: SessionLog? = null,
    val sessionLogs: List<SessionLog> = emptyList(),
    val musicVolume: Float = 1.0f,
    val sfxVolume: Float = 1.0f
)

class MestreViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = InMemoryRepository()
    private val remoteSyncRepository = RemoteSyncRepository()
    private val localSnapshotRepository = LocalSnapshotRepository(application)

    private val _uiState = MutableStateFlow(AppUiState())
    private var ongoingSync: Job? = null

    val uiState: StateFlow<AppUiState> = _uiState.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5_000), AppUiState()
    )

    init {
        viewModelScope.launch(Dispatchers.IO) {
            val localSnapshot = localSnapshotRepository.loadSnapshot()
            if (localSnapshot != null) {
                applySnapshot(localSnapshot, persistLocal = false)
            } else {
                _uiState.update { it.copy(encounter = buildEncounter(repository.enemies.value)) }
            }
        }


        combine(
            repository.campaigns,
            repository.npcs,
            repository.enemies,
            repository.soundScenes,
            repository.sessionNotes,
            repository.activeSession,
            repository.sessionLogs,
            repository.musicVolume,
            repository.sfxVolume
        ) { flows ->
            val campaigns = flows[0] as List<Campaign>
            val npcs = flows[1] as List<Npc>
            val enemies = flows[2] as List<Enemy>
            val soundScenes = flows[3] as List<SoundScene>
            val notes = flows[4] as List<SessionNote>
            val activeSess = flows[5] as SessionLog?
            val logs = flows[6] as List<SessionLog>
            val mVol = flows[7] as Float
            val sVol = flows[8] as Float
            val ui = _uiState.value
            
            val safeCampaignIdx = ui.activeCampaignIndex.coerceIn(0, (campaigns.size - 1).coerceAtLeast(0))
            val selectedCampaign = campaigns.getOrNull(safeCampaignIdx)
            val safeArcIdx = ui.activeArcIndex.coerceIn(0, (selectedCampaign?.arcs?.size?.minus(1) ?: 0).coerceAtLeast(0))
            val selectedArc = selectedCampaign?.arcs?.getOrNull(safeArcIdx)

            ui.copy(
                campaigns = campaigns,
                npcs = npcs,
                enemies = enemies,
                soundScenes = soundScenes,
                sessionNotes = notes,
                activeCampaignIndex = safeCampaignIdx,
                activeArcIndex = safeArcIdx,
                activeSceneIndex = ui.activeSceneIndex.coerceIn(0, (selectedArc?.scenes?.size?.minus(1) ?: 0).coerceAtLeast(0)),
                encounter = if (ui.encounter.isEmpty()) buildEncounter(enemies) else ui.encounter,
                activeSoundSceneIndex = ui.activeSoundSceneIndex.coerceIn(0, (soundScenes.size - 1).coerceAtLeast(0)),
                isRemoteConfigured = remoteSyncRepository.isConfigured,
                activeSession = activeSess,
                sessionLogs = logs,
                musicVolume = mVol,
                sfxVolume = sVol
            )
        }.onEach { newState ->
            _uiState.value = newState
        }.launchIn(viewModelScope)
    }

    fun setActiveCampaign(index: Int) {
        _uiState.update { it.copy(activeCampaignIndex = index, activeArcIndex = 0, activeSceneIndex = 0) }
        persistLocalSnapshot()
    }

    fun setActiveArc(index: Int) {
        _uiState.update { it.copy(activeArcIndex = index, activeSceneIndex = 0) }
        persistLocalSnapshot()
    }

    fun setActiveScene(index: Int) {
        _uiState.update { it.copy(activeSceneIndex = index) }
        persistLocalSnapshot()
    }

    fun addCampaign(campaign: Campaign) {
        repository.addCampaign(campaign)
        persistLocalSnapshot()
    }

    fun addArc(campaignIndex: Int, arc: Arc) {
        repository.addArc(campaignIndex, arc)
        _uiState.update { it.copy(activeArcIndex = repository.campaigns.value.getOrNull(campaignIndex)?.arcs?.size?.minus(1) ?: 0) }
        persistLocalSnapshot()
    }

    fun addScene(campaignIndex: Int, arcIndex: Int, scene: Scene) {
        repository.addScene(campaignIndex, arcIndex, scene)
        _uiState.update { it.copy(activeSceneIndex = repository.campaigns.value.getOrNull(campaignIndex)?.arcs?.getOrNull(arcIndex)?.scenes?.size?.minus(1) ?: 0) }
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
        val ui = uiState.value
        val campaigns = ui.campaigns
        val activeCampaign = campaigns.getOrNull(ui.activeCampaignIndex)
        val activeArc = activeCampaign?.arcs?.getOrNull(ui.activeArcIndex)
        val activeScene = activeArc?.scenes?.getOrNull(ui.activeSceneIndex)
        val defeated = ui.encounter.filter { it.isDown || it.currentHp <= 0 }.map { it.label }

        val summary = SessionSummary(
            campaignTitle = activeCampaign?.title,
            arcTitle = activeArc?.title,
            sceneName = activeScene?.name,
            importantNotes = ui.sessionNotes.filter { it.important }.map { it.text },
            defeatedEnemies = defeated,
            timestamp = System.currentTimeMillis()
        )

        repository.addSummaryToSession(summary)
        repository.endSession()

        _uiState.update { it.copy(sessionSummaries = listOf(summary) + it.sessionSummaries) }
        _uiState.update { it.copy(encounter = buildEncounter(ui.enemies)) }
        persistLocalSnapshot()
    }

    fun adjustEnemyHp(index: Int, delta: Int) {
        _uiState.update { ui ->
            ui.copy(encounter = ui.encounter.mapIndexed { idx, state ->
                if (idx != index) return@mapIndexed state
                val newHp = (state.currentHp + delta).coerceIn(0, state.enemy.maxHp)
                state.copy(currentHp = newHp, isDown = newHp <= 0 || state.isDown)
            })
        }
        persistLocalSnapshot()
    }

    fun toggleEnemyDown(index: Int) {
        _uiState.update { ui ->
            ui.copy(encounter = ui.encounter.mapIndexed { idx, state ->
                if (idx != index) return@mapIndexed state
                state.copy(isDown = !state.isDown, currentHp = if (!state.isDown) 0 else state.currentHp)
            })
        }
        persistLocalSnapshot()
    }

    fun adjustEnemyMp(index: Int, delta: Int) {
        _uiState.update { ui ->
            ui.copy(encounter = ui.encounter.mapIndexed { idx, state ->
                if (idx != index) return@mapIndexed state
                val currentMp = state.currentMp ?: 0
                val maxMp = state.enemy.maxMp ?: 0
                val newMp = (currentMp + delta).coerceIn(0, maxMp)
                state.copy(currentMp = newMp)
            })
        }
        persistLocalSnapshot()
    }

    fun removeEnemyInstance(index: Int) {
        _uiState.update { ui ->
            ui.copy(encounter = ui.encounter.filterIndexed { idx, _ -> idx != index })
        }
        persistLocalSnapshot()
    }

    fun resetEncounter() {
        _uiState.update { it.copy(encounter = buildEncounter(it.enemies)) }
        persistLocalSnapshot()
    }

    fun selectSoundScene(index: Int) {
        _uiState.update { it.copy(activeSoundSceneIndex = index) }
        persistLocalSnapshot()
    }

    fun toggleSoundPlayback() {
        _uiState.update { it.copy(isSoundPlaying = !it.isSoundPlaying) }
        persistLocalSnapshot()
    }

    fun setSoundBackground(sceneIndex: Int, background: SoundAsset) {
        repository.setSoundBackground(sceneIndex, background)
        persistLocalSnapshot()
    }

    fun addSoundEffect(sceneIndex: Int, effect: SoundEffect) {
        repository.addSoundEffect(sceneIndex, effect)
        persistLocalSnapshot()
    }

    fun setMusicVolume(volume: Float) {
        repository.setMusicVolume(volume)
        persistLocalSnapshot()
    }

    fun setSfxVolume(volume: Float) {
        repository.setSfxVolume(volume)
        persistLocalSnapshot()
    }

    fun addEnemyInstance(enemy: Enemy, quantity: Int) {
        if (quantity <= 0) return
        _uiState.update { ui ->
            val newEnemies = ui.encounter + List(quantity) { idx ->
                EncounterEnemyState(
                    id = UUID.randomUUID().toString(),
                    label = "${enemy.name} #${ui.encounter.count { it.enemy.name == enemy.name } + idx + 1}",
                    enemy = enemy,
                    currentHp = enemy.currentHp,
                    currentMp = enemy.currentMp,
                    isDown = enemy.currentHp <= 0
                )
            }
            ui.copy(encounter = newEnemies)
        }
        persistLocalSnapshot()
    }

    fun updateEnemy(original: Enemy, updated: Enemy) {
        repository.updateEnemy(original, updated)
        persistLocalSnapshot()
    }

    private fun currentSnapshot(): RemoteSnapshot = with(uiState.value) {
        RemoteSnapshot(
            campaigns = campaigns,
            npcs = npcs,
            enemies = enemies,
            soundScenes = soundScenes,
            sessionNotes = sessionNotes,
            sessionSummaries = sessionSummaries,
            encounter = encounter,
            activeCampaignIndex = activeCampaignIndex,
            activeArcIndex = activeArcIndex,
            activeSceneIndex = activeSceneIndex,
            activeSoundSceneIndex = activeSoundSceneIndex,
            isSoundPlaying = isSoundPlaying
        )
    }

    private fun persistLocalSnapshot() {
        viewModelScope.launch(Dispatchers.IO) {
            localSnapshotRepository.saveSnapshot(currentSnapshot())
        }
    }

    fun pushSnapshotToCloud() {
        if (!remoteSyncRepository.isConfigured) {
            _uiState.update { it.copy(syncStatus = SyncStatus.Error("Defina SUPABASE_URL e SUPABASE_KEY em local.properties.")) }
            return
        }
        ongoingSync?.cancel()
        ongoingSync = viewModelScope.launch {
            _uiState.update { it.copy(syncStatus = SyncStatus.Syncing("Enviando backup…")) }
            val result = remoteSyncRepository.pushSnapshot(currentSnapshot())
            val newStatus = result.fold(
                onSuccess = { SyncStatus.Success("Backup enviado para Supabase.") },
                onFailure = { SyncStatus.Error(it.message ?: "Falha ao enviar backup.") }
            )
            _uiState.update { it.copy(syncStatus = newStatus) }
        }
    }

    fun pullSnapshotFromCloud() {
        if (!remoteSyncRepository.isConfigured) {
            _uiState.update { it.copy(syncStatus = SyncStatus.Error("Defina SUPABASE_URL e SUPABASE_KEY em local.properties.")) }
            return
        }
        ongoingSync?.cancel()
        ongoingSync = viewModelScope.launch {
            _uiState.update { it.copy(syncStatus = SyncStatus.Syncing("Baixando backup…")) }
            val result = remoteSyncRepository.pullLatest()
            val newStatus = result.fold(
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
            _uiState.update { it.copy(syncStatus = newStatus) }
        }
    }

    private fun applySnapshot(snapshot: RemoteSnapshot, persistLocal: Boolean = true) {
        repository.setCampaigns(snapshot.campaigns)
        repository.setNpcs(snapshot.npcs)
        repository.setEnemies(snapshot.enemies)
        repository.setSoundScenes(snapshot.soundScenes)
        repository.setNotes(snapshot.sessionNotes)
        _uiState.update { ui ->
            ui.copy(
                sessionSummaries = snapshot.sessionSummaries,
                activeCampaignIndex = snapshot.activeCampaignIndex,
                activeArcIndex = snapshot.activeArcIndex,
                activeSceneIndex = snapshot.activeSceneIndex,
                encounter = snapshot.encounter.ifEmpty { buildEncounter(snapshot.enemies) },
                activeSoundSceneIndex = snapshot.activeSoundSceneIndex,
                isSoundPlaying = snapshot.isSoundPlaying
            )
        }
        if (persistLocal) {
            persistLocalSnapshot()
        }
    }

    private fun buildEncounter(enemies: List<Enemy>): List<EncounterEnemyState> =
        enemies.map { enemy ->
            EncounterEnemyState(
                id = UUID.randomUUID().toString(),
                label = enemy.name,
                enemy = enemy,
                currentHp = enemy.currentHp,
                currentMp = enemy.currentMp,
                isDown = enemy.currentHp <= 0
            )
        }
}
