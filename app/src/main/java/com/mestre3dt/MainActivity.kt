package com.mestre3dt

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ListAlt
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.mestre3dt.ui.MestreViewModel
import com.mestre3dt.ui.screens.*
import com.mestre3dt.ui.screens.gmforge.*
import com.mestre3dt.ui.theme.Mestre3DTTheme
import com.mestre3dt.ui.layout.GMForgeLayout

class MainActivity : ComponentActivity() {
    private val viewModel: MestreViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            Mestre3DTTheme {
                MestreApp(viewModel)
            }
        }
    }
}

private enum class MestreTab(val label: String) {
    Dashboard("Dashboard"),
    Session("Sessão"),
    Campaigns("Campanhas"),
    Npcs("NPCs"),
    Enemies("Combate"),
    Sound("Som")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MestreApp(viewModel: MestreViewModel = viewModel()) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedTab by remember { mutableStateOf(MestreTab.Dashboard) }
    var useGMForge by remember { mutableStateOf(true) } // Toggle GM Forge mode

    if (useGMForge) {
        // GM FORGE LAYOUT
        GMForgeLayout(
            selectedRoute = when (selectedTab) {
                MestreTab.Dashboard -> "dashboard"
                MestreTab.Session -> "session"
                MestreTab.Campaigns -> "campaigns"
                MestreTab.Npcs -> "characters"
                MestreTab.Enemies -> "encounters"
                MestreTab.Sound -> "lore"
            },
            onNavigate = { route ->
                selectedTab = when (route) {
                    "dashboard" -> MestreTab.Dashboard
                    "session" -> MestreTab.Session
                    "campaigns" -> MestreTab.Campaigns
                    "characters" -> MestreTab.Npcs
                    "encounters" -> MestreTab.Enemies
                    else -> MestreTab.Sound
                }
            }
        ) {
            // Content area
            when (selectedTab) {
                MestreTab.Dashboard -> GMDashboardScreen(
                    campaigns = uiState.toCampaignCards(),
                    nextSessionTimestamp =uiState.getNextSessionTimestamp(),
                    onCampaignClick = { campaignId ->
                        // Campaign ID is actually the index as string
                        val index = campaignId.toIntOrNull() ?: 0
                        viewModel.setActiveCampaign(index)
                        selectedTab = MestreTab.Session
                    },
                    onPrepareSession = {
                        selectedTab = MestreTab.Session
                    }
                )

                MestreTab.Session -> GMSessionScreen(
                    participants = uiState.toSessionParticipants(),
                    mapUri = uiState.getActiveScene()?.mapImageUri,
                    combatLog = uiState.toCombatLog(),
                    onRollDice = { /* TODO: Implement dice roller */ },
                    onTokenMove = { tokenId, position ->
                        // TODO: Update token position
                    }
                )

                MestreTab.Campaigns -> GMCampaignTimelineScreen(
                    scenes = uiState.toTimelineScenes(),
                    onSceneClick = { sceneId ->
                        // Scene ID is the index as string
                        val index = sceneId.toIntOrNull() ?: 0
                        viewModel.setActiveScene(index)
                        selectedTab = MestreTab.Session
                    }
                )

                MestreTab.Npcs -> NpcsScreen(
                    uiState = uiState,
                    onAddNpc = viewModel::addNpc,
                    onUpdateNpc = viewModel::updateNpc,
                    onDeleteNpc = viewModel::deleteNpc
                )

                MestreTab.Enemies -> EnemiesScreen(
                    uiState = uiState,
                    onAddEnemy = viewModel::addEnemy,
                    onUpdateEnemy = viewModel::updateEnemyById,
                    onDeleteEnemy = viewModel::deleteEnemy,
                    onAddToEncounter = viewModel::addToEncounter,
                    onResetEncounter = viewModel::resetEncounter
                )

                MestreTab.Sound -> SoundScreen(
                    soundScenes = uiState.soundScenes,
                    activeIndex = uiState.activeSoundSceneIndex,
                    isPlaying = uiState.isSoundPlaying,
                    musicVolume = uiState.musicVolume,
                    sfxVolume = uiState.sfxVolume,
                    onSelect = viewModel::selectSoundScene,
                    onTogglePlay = viewModel::toggleSoundPlayback,
                    onSetBackground = viewModel::setSoundBackground,
                    onAddEffect = viewModel::addSoundEffect,
                    onSetMusicVolume = viewModel::setMusicVolume,
                    onSetSfxVolume = viewModel::setSfxVolume
                )
            }
        }
    } else {
        // CLASSIC LAYOUT
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Mesa do Mestre 3D&T") },
                    actions = {
                        IconButton(onClick = { useGMForge = !useGMForge }) {
                            Icon(Icons.Default.Dashboard, "Toggle GM Forge")
                        }
                    }
                )
            },
            bottomBar = {
                NavigationBar {
                    MestreTab.values().forEach { tab ->
                        NavigationBarItem(
                            selected = tab == selectedTab,
                            onClick = { selectedTab = tab },
                            label = { Text(tab.label) },
                            icon = {
                                when (tab) {
                                    MestreTab.Dashboard -> Icon(Icons.AutoMirrored.Filled.ListAlt, contentDescription = "Dashboard")
                                    MestreTab.Session -> Icon(Icons.AutoMirrored.Filled.ListAlt, contentDescription = "Sessão")
                                    MestreTab.Campaigns -> Icon(Icons.Default.Campaign, contentDescription = "Campanhas")
                                    MestreTab.Npcs -> Icon(Icons.Default.People, contentDescription = "NPCs")
                                    MestreTab.Enemies -> Icon(Icons.Default.Shield, contentDescription = "Inimigos")
                                    MestreTab.Sound -> Icon(Icons.Default.MusicNote, contentDescription = "Som")
                                }
                            }
                        )
                    }
                }
            }
        ) { paddingValues ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                when (selectedTab) {
                    MestreTab.Dashboard -> DashboardScreen(
                        uiState = uiState,
                        onPushSync = viewModel::pushSnapshotToCloud,
                        onPullSync = viewModel::pullSnapshotFromCloud
                    )
                    MestreTab.Session -> SessionScreen(
                        uiState = uiState,
                        onAdjustHp = viewModel::adjustEncounterHp,
                        onAdjustMp = viewModel::adjustEncounterMp,
                        onToggleDown = viewModel::toggleEncounterDown,
                        onRemoveEnemy = viewModel::removeFromEncounter,
                        onAddNote = viewModel::addNote,
                        onAddTrigger = viewModel::addTriggerToScene,
                        onEditTrigger = viewModel::editTriggerInScene,
                        onRemoveTrigger = viewModel::removeTriggerFromScene,
                        onStartSession = viewModel::startSession,
                        onEndSession = viewModel::endSessionWithSummary
                    )
                    MestreTab.Campaigns -> CampaignsScreen(
                        uiState = uiState,
                        onAddCampaign = viewModel::addCampaign,
                        onAddArc = viewModel::addArc,
                        onAddScene = viewModel::addScene,
                        onSetActiveCampaign = viewModel::setActiveCampaign,
                        onSetActiveArc = viewModel::setActiveArc,
                        onSetActiveScene = viewModel::setActiveScene
                    )
                    MestreTab.Npcs -> NpcsScreen(
                        uiState = uiState,
                        onAddNpc = viewModel::addNpc,
                        onUpdateNpc = viewModel::updateNpc,
                        onDeleteNpc = viewModel::deleteNpc
                    )
                    MestreTab.Enemies -> EnemiesScreen(
                        uiState = uiState,
                        onAddEnemy = viewModel::addEnemy,
                        onUpdateEnemy = viewModel::updateEnemyById,
                        onDeleteEnemy = viewModel::deleteEnemy,
                        onAddToEncounter = viewModel::addToEncounter,
                        onResetEncounter = viewModel::resetEncounter
                    )
                    MestreTab.Sound -> SoundScreen(
                        soundScenes = uiState.soundScenes,
                        activeIndex = uiState.activeSoundSceneIndex,
                        isPlaying = uiState.isSoundPlaying,
                        musicVolume = uiState.musicVolume,
                        sfxVolume = uiState.sfxVolume,
                        onSelect = viewModel::selectSoundScene,
                        onTogglePlay = viewModel::toggleSoundPlayback,
                        onSetBackground = viewModel::setSoundBackground,
                        onAddEffect = viewModel::addSoundEffect,
                        onSetMusicVolume = viewModel::setMusicVolume,
                        onSetSfxVolume = viewModel::setSfxVolume
                    )
                }
            }
        }
    }
}
