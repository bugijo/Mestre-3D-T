package com.mestre3dt

import android.app.Application
import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import androidx.test.core.app.ApplicationProvider
import com.mestre3dt.ui.MestreViewModel
import com.mestre3dt.data.Power
import com.mestre3dt.data.Enemy
import com.mestre3dt.data.SoundAsset
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class MestreViewModelTest {

    @get:Rule
    val instantTaskExecutorRule = InstantTaskExecutorRule()

    private val dispatcher = StandardTestDispatcher()

    @Before
    fun setup() {
        Dispatchers.setMain(dispatcher)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun startSession_resetsNotesAndCreatesSession() = runTest(dispatcher) {
        val application = ApplicationProvider.getApplicationContext<Application>()
        val viewModel = MestreViewModel(application)

        advanceUntilIdle()
        viewModel.startSession("Mesa QA")
        advanceUntilIdle()

        val state = viewModel.uiState.first { it.activeSession != null }
        assertNotNull(state.activeSession)
        assertEquals("Mesa QA", state.activeSession?.name)
        assertTrue(state.sessionNotes.isEmpty(), "Notas devem ser limpas ao iniciar a sessão")
    }

    @Test
    fun adjustEnemyHp_clampsAtZeroAndMarksDown() = runTest(dispatcher) {
        val application = ApplicationProvider.getApplicationContext<Application>()
        val viewModel = MestreViewModel(application)

        advanceUntilIdle()
        viewModel.resetEncounter()
        advanceUntilIdle()

        viewModel.adjustEnemyHp(index = 0, delta = -999)
        advanceUntilIdle()

        val encounterState = viewModel.uiState.first().encounter
        assertTrue(encounterState.isNotEmpty(), "Encontro precisa ter inimigos iniciais")
        val firstEnemy = encounterState.first()
        assertEquals(0, firstEnemy.currentHp)
        assertTrue(firstEnemy.isDown)
    }

    @Test
    fun activeSelectors_andSceneTriggers_updateState() = runTest(dispatcher) {
        val application = ApplicationProvider.getApplicationContext<Application>()
        val viewModel = MestreViewModel(application)

        advanceUntilIdle()

        viewModel.addCampaign(com.mestre3dt.data.Campaign("Extra", "", "", arcs = emptyList()))
        viewModel.addArc(0, com.mestre3dt.data.Arc("Novo arco", scenes = emptyList()))
        viewModel.addScene(0, 0, com.mestre3dt.data.Scene("Cena", "", "", "", emptyList(), emptyList()))
        viewModel.setActiveCampaign(0)
        viewModel.setActiveArc(0)
        viewModel.setActiveScene(0)
        viewModel.addTriggerToScene(0, 0, 0, previewTrigger())
        viewModel.updateTriggerInScene(0, 0, 0, previewTrigger().copy(difficulty = "15"))
        viewModel.removeTriggerFromScene(0, 0, 0)

        val state = viewModel.uiState.first()
        assertEquals(0, state.activeCampaignIndex)
        assertTrue(state.campaigns.first().arcs.first().scenes.first().triggers.isEmpty())
    }

    @Test
    fun npcTriggers_andNotes_arePersisted() = runTest(dispatcher) {
        val application = ApplicationProvider.getApplicationContext<Application>()
        val viewModel = MestreViewModel(application)

        advanceUntilIdle()

        viewModel.addTriggerToNpc(0, previewTrigger())
        viewModel.updateTriggerInNpc(0, 0, previewTrigger().copy(difficulty = "14"))
        viewModel.removeTriggerFromNpc(0, 0)
        viewModel.addNote("Importante", true)

        val state = viewModel.uiState.first()
        assertTrue(state.npcs.first().triggers.isEmpty())
        assertEquals("Importante", state.sessionNotes.first().text)
    }

    @Test
    fun enemyCrud_andEncounterSync() = runTest(dispatcher) {
        val application = ApplicationProvider.getApplicationContext<Application>()
        val viewModel = MestreViewModel(application)

        advanceUntilIdle()
        val base = viewModel.uiState.first().enemies.first()
        val updated = base.copy(name = "Atualizado", powers = emptyList())

        viewModel.updateEnemy(0, updated)
        viewModel.addPowerToEnemy(0, Power("Golpe", "Forte", 1, "Alvo", null, null, null))
        viewModel.updatePower(0, 0, Power("Golpe 2", "Mais forte", 2, "Alvo", "Teste", "Hit", "Miss"))
        viewModel.removePower(0, 0)
        viewModel.addEnemy(base.copy(name = "Novo"))
        viewModel.removeEnemy(1)
        viewModel.resetEncounter()

        val state = viewModel.uiState.first()
        assertEquals("Atualizado", state.enemies.first().name)
        assertTrue(state.enemies.first().powers.isEmpty())
        assertTrue(state.encounter.isNotEmpty())
    }

    @Test
    fun enemyActions_adjustHpMpAndToggleDown() = runTest(dispatcher) {
        val application = ApplicationProvider.getApplicationContext<Application>()
        val viewModel = MestreViewModel(application)

        advanceUntilIdle()
        viewModel.resetEncounter()
        advanceUntilIdle()

        viewModel.adjustEnemyHp(0, -5)
        viewModel.adjustEnemyMp(0, -1)
        viewModel.toggleEnemyDown(0)
        viewModel.removeEnemyInstance(0)

        val encounter = viewModel.uiState.first().encounter
        assertTrue(encounter.isNotEmpty())
    }

    @Test
    fun sessionLifecycle_generatesSummary() = runTest(dispatcher) {
        val application = ApplicationProvider.getApplicationContext<Application>()
        val viewModel = MestreViewModel(application)

        advanceUntilIdle()
        viewModel.startSession("Sessão teste")
        advanceUntilIdle()
        viewModel.endSessionWithSummary()
        advanceUntilIdle()

        val state = viewModel.uiState.first()
        assertTrue(state.sessionSummaries.isNotEmpty())
        assertEquals(null, state.activeSession)
    }

    @Test
    fun soundControls_toggleAndPersistPreferences() = runTest(dispatcher) {
        val application = ApplicationProvider.getApplicationContext<Application>()
        val viewModel = MestreViewModel(application)

        advanceUntilIdle()
        viewModel.selectSoundScene(0)
        viewModel.toggleSoundPlayback()
        viewModel.setSoundPreferences(0.4f, 0.6f, false)
        viewModel.setSoundBackground(0, SoundAsset("Nova", null))
        viewModel.addSoundEffect(0, com.mestre3dt.data.SoundEffect("SFX", null))

        val state = viewModel.uiState.first()
        assertEquals(0, state.activeSoundSceneIndex)
        assertTrue(state.isSoundPlaying)
        assertEquals(0.4f, state.soundPreferences.backgroundVolume)
        assertEquals("Nova", state.soundScenes.first().background?.name)
        assertEquals(1, state.soundScenes.first().effects.size)
    }

    @Test
    fun addEnemyInstance_andResetEncounter_handleQuantities() = runTest(dispatcher) {
        val application = ApplicationProvider.getApplicationContext<Application>()
        val viewModel = MestreViewModel(application)

        advanceUntilIdle()
        val enemy: Enemy = viewModel.uiState.first().enemies.first()
        viewModel.addEnemyInstance(enemy, quantity = 2)
        viewModel.addEnemyInstance(enemy, quantity = 0)
        viewModel.resetEncounter()

        val encounter = viewModel.uiState.first().encounter
        assertTrue(encounter.isNotEmpty())
    }

    @Test
    fun syncWithoutConfig_setsErrors() = runTest(dispatcher) {
        val application = ApplicationProvider.getApplicationContext<Application>()
        val viewModel = MestreViewModel(application)

        advanceUntilIdle()
        viewModel.pushSnapshotToCloud()
        viewModel.pullSnapshotFromCloud()
        advanceUntilIdle()

        val state = viewModel.uiState.first()
        assertTrue(state.errorMessage?.contains("SUPABASE") == true)
        assertTrue(state.syncStatus is com.mestre3dt.ui.SyncStatus.Error)
    }

    private fun previewTrigger() = com.mestre3dt.data.RollTrigger(
        situation = "Situação",
        testType = "Teste",
        attribute = "Hab",
        difficulty = "10",
        onSuccess = "Ok",
        onFailure = "Falha"
    )
}
