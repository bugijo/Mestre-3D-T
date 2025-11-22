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
import com.mestre3dt.data.Power
import com.mestre3dt.data.SoundAsset
import com.mestre3dt.data.SoundEffect
import com.mestre3dt.data.ActiveSession
import com.mestre3dt.data.SoundPreferences
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
    val activeSession: ActiveSession? = null,
    val activeCampaignIndex: Int = 0,
    val activeArcIndex: Int = 0,
    val activeSceneIndex: Int = 0,
    val encounter: List<EncounterEnemyState> = emptyList(),
    val activeSoundSceneIndex: Int = 0,
    val isSoundPlaying: Boolean = false,
    val soundPreferences: SoundPreferences = SoundPreferences(),
    val syncStatus: SyncStatus = SyncStatus.Idle,
    val isRemoteConfigured: Boolean = false,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
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
    private val soundPreferences = MutableStateFlow(SoundPreferences())

    private val sessionSummaries = MutableStateFlow<List<SessionSummary>>(emptyList())
    private val activeSession = MutableStateFlow<ActiveSession?>(null)

    private val encounterState = MutableStateFlow<List<EncounterEnemyState>>(emptyList())
    private val syncStatus = MutableStateFlow<SyncStatus>(SyncStatus.Idle)
    private val loadingState = MutableStateFlow(true)
    private val uiError = MutableStateFlow<String?>(null)
    private var ongoingSync: Job? = null

    init {
        viewModelScope.launch(Dispatchers.IO) {
            loadingState.value = true
            try {
                val localSnapshot = localSnapshotRepository.loadSnapshot()
                if (localSnapshot != null) {
                    applySnapshot(localSnapshot, persistLocal = false)
                } else {
                    encounterState.value = buildEncounter(repository.enemies.value)
                }
            } catch (e: Exception) {
                uiError.value = e.message ?: "Falha ao carregar snapshot local."
            } finally {
                loadingState.value = false
            }
        }
    }

    val uiState: StateFlow<AppUiState> = combine(
        repository.campaigns,
        repository.npcs,
        repository.enemies,
        repository.soundScenes,
        repository.sessionNotes,
        activeSession,
        activeCampaignIndex,
        activeArcIndex,
        activeSceneIndex,
        encounterState,
        activeSoundSceneIndex,
        isSoundPlaying,
        soundPreferences,
        sessionSummaries,
        syncStatus,
        loadingState,
        uiError
    ) { campaigns, npcs, enemies, soundScenes, notes, session, campIdx, arcIdx, sceneIdx, encounter, soundIdx, playing, prefs, summaries, sync, isLoading, error ->
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
            activeSession = session,
            sessionSummaries = summaries,
            activeCampaignIndex = safeCampaignIdx,
            activeArcIndex = safeArcIdx,
            activeSceneIndex = safeSceneIdx,
            encounter = if (encounter.isEmpty()) buildEncounter(enemies) else encounter,
            activeSoundSceneIndex = soundIdx.coerceIn(0, (soundScenes.size - 1).coerceAtLeast(0)),
            isSoundPlaying = playing,
            soundPreferences = prefs,
            syncStatus = sync,
            isRemoteConfigured = remoteSyncRepository.isConfigured,
            isLoading = isLoading || sync is SyncStatus.Syncing,
            errorMessage = when (sync) {
                is SyncStatus.Error -> sync.message
                else -> error
            }
        )
    }.stateIn(viewModelScope, kotlinx.coroutines.flow.SharingStarted.WhileSubscribed(5_000), AppUiState())

    fun setActiveCampaign(index: Int) {
        activeCampaignIndex.value = index
        activeArcIndex.value = 0
        activeSceneIndex.value = 0
        persistLocalSnapshot()
    }

    private fun reportError(message: String) {
        uiError.value = message
    }

    fun setActiveArc(index: Int) {
        activeArcIndex.value = index
        activeSceneIndex.value = 0
        persistLocalSnapshot()
    }

    fun setActiveScene(index: Int) {
        activeSceneIndex.value = index
        val campaign = repository.campaigns.value.getOrNull(activeCampaignIndex.value)
        val arc = campaign?.arcs?.getOrNull(activeArcIndex.value)
        val scene = arc?.scenes?.getOrNull(index)
        if (scene != null) {
            activeSession.update { current ->
                current?.copy(
                    scenesVisited = (current.scenesVisited + scene.name).distinct()
                )
            }
        }
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

    fun updateTriggerInScene(
        campaignIndex: Int,
        arcIndex: Int,
        sceneIndex: Int,
        triggerIndex: Int,
        trigger: RollTrigger
    ) {
        repository.updateTriggerInScene(campaignIndex, arcIndex, sceneIndex, triggerIndex, trigger)
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

    fun updateTriggerInNpc(index: Int, triggerIndex: Int, trigger: RollTrigger) {
        repository.updateTriggerInNpc(index, triggerIndex, trigger)
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

    fun addEnemy(enemy: Enemy) {
        repository.addEnemy(enemy)
        syncEncounterWithEnemies()
    }

    fun updateEnemy(index: Int, enemy: Enemy) {
        repository.updateEnemy(index, enemy)
        syncEncounterWithEnemies()
    }

    fun removeEnemy(index: Int) {
        repository.removeEnemy(index)
        syncEncounterWithEnemies()
    }

    fun addPowerToEnemy(enemyIndex: Int, power: Power) {
        repository.addPowerToEnemy(enemyIndex, power)
        syncEncounterWithEnemies()
    }

    fun updatePower(enemyIndex: Int, powerIndex: Int, power: Power) {
        repository.updatePower(enemyIndex, powerIndex, power)
        syncEncounterWithEnemies()
    }

    fun removePower(enemyIndex: Int, powerIndex: Int) {
        repository.removePower(enemyIndex, powerIndex)
        syncEncounterWithEnemies()
    }

    private fun syncEncounterWithEnemies() {
        val enemiesByName = repository.enemies.value.associateBy { it.name }
        encounterState.update { current ->
            current.mapNotNull { state ->
                val updatedEnemy = enemiesByName[state.enemy.name] ?: return@mapNotNull null
                val adjustedHp = state.currentHp.coerceIn(0, updatedEnemy.maxHp)
                val adjustedMp = when (updatedEnemy.maxMp) {
                    null -> null
                    else -> (state.currentMp ?: updatedEnemy.maxMp).coerceIn(0, updatedEnemy.maxMp)
                }
                state.copy(
                    enemy = updatedEnemy,
                    currentHp = adjustedHp,
                    currentMp = adjustedMp,
                    isDown = state.isDown || adjustedHp <= 0
                )
            }
        }
        persistLocalSnapshot()
    }

    fun startSession(name: String) {
        activeSession.value = ActiveSession(
            name = name.ifBlank { "Sessão ${System.currentTimeMillis()}" },
            startedAt = System.currentTimeMillis(),
            resumedFrom = activeSession.value?.startedAt
        )
        repository.setNotes(emptyList())
        encounterState.value = buildEncounter(repository.enemies.value)
        persistLocalSnapshot()
    }

    fun endSessionWithSummary() {
        val session = activeSession.value
        val campaigns = repository.campaigns.value
        val activeCampaign = campaigns.getOrNull(activeCampaignIndex.value)
        val activeArc = activeCampaign?.arcs?.getOrNull(activeArcIndex.value)
        val activeScene = activeArc?.scenes?.getOrNull(activeSceneIndex.value)
        val defeated = encounterState.value.filter { it.isDown || it.currentHp <= 0 }.map { it.label }
        sessionSummaries.update { current ->
            listOf(
                SessionSummary(
                    sessionName = session?.name,
                    startedAt = session?.startedAt,
                    endedAt = System.currentTimeMillis(),
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
        activeSession.value = null
        repository.setNotes(emptyList())
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

    fun setSoundPreferences(backgroundVolume: Float, effectsVolume: Float, duckOnFocusLoss: Boolean) {
        soundPreferences.value = SoundPreferences(
            backgroundVolume = backgroundVolume,
            effectsVolume = effectsVolume,
            duckOnFocusLoss = duckOnFocusLoss
        )
        persistLocalSnapshot()
    }

    fun setSoundBackground(sceneIndex: Int, background: SoundAsset) {
        repository.setSoundBackground(sceneIndex, background)
        activeSoundSceneIndex.value = sceneIndex
        persistLocalSnapshot()
    }

    fun addSoundEffect(sceneIndex: Int, effect: SoundEffect) {
        repository.addSoundEffect(sceneIndex, effect)
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
        activeSession = activeSession.value,
        encounter = encounterState.value,
        activeCampaignIndex = activeCampaignIndex.value,
        activeArcIndex = activeArcIndex.value,
        activeSceneIndex = activeSceneIndex.value,
        activeSoundSceneIndex = activeSoundSceneIndex.value,
        isSoundPlaying = isSoundPlaying.value,
        soundPreferences = soundPreferences.value
    )

    private fun persistLocalSnapshot() {
        viewModelScope.launch(Dispatchers.IO) {
            localSnapshotRepository.saveSnapshot(currentSnapshot())
        }
    }

    fun pushSnapshotToCloud() {
        if (!remoteSyncRepository.isConfigured) {
            val message = "Defina SUPABASE_URL e SUPABASE_KEY em local.properties."
            syncStatus.value = SyncStatus.Error(message)
            reportError(message)
            return
        }
        ongoingSync?.cancel()
        ongoingSync = viewModelScope.launch {
            syncStatus.value = SyncStatus.Syncing("Enviando backup…")
            val result = remoteSyncRepository.pushSnapshot(currentSnapshot())
            syncStatus.value = result.fold(
                onSuccess = {
                    uiError.value = null
                    SyncStatus.Success("Backup enviado para Supabase.")
                },
                onFailure = {
                    val message = it.message ?: "Falha ao enviar backup."
                    reportError(message)
                    SyncStatus.Error(message)
                }
            )
        }
    }

    fun pullSnapshotFromCloud() {
        if (!remoteSyncRepository.isConfigured) {
            val message = "Defina SUPABASE_URL e SUPABASE_KEY em local.properties."
            syncStatus.value = SyncStatus.Error(message)
            reportError(message)
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
                        uiError.value = null
                        SyncStatus.Success("Backup mais recente aplicado.")
                    } else {
                        val message = "Nenhum snapshot remoto encontrado."
                        reportError(message)
                        SyncStatus.Error(message)
                    }
                },
                onFailure = {
                    val message = it.message ?: "Falha ao baixar backup."
                    reportError(message)
                    SyncStatus.Error(message)
                }
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
        activeSession.value = snapshot.activeSession
        activeCampaignIndex.value = snapshot.activeCampaignIndex
        activeArcIndex.value = snapshot.activeArcIndex
        activeSceneIndex.value = snapshot.activeSceneIndex
        encounterState.value = snapshot.encounter.ifEmpty { buildEncounter(snapshot.enemies) }
        activeSoundSceneIndex.value = snapshot.activeSoundSceneIndex
        isSoundPlaying.value = snapshot.isSoundPlaying
        soundPreferences.value = snapshot.soundPreferences
        uiError.value = null
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
