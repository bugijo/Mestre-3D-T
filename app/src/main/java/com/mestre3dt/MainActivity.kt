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
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.mestre3dt.ui.MestreViewModel
import com.mestre3dt.ui.screens.CampaignsScreen
import com.mestre3dt.ui.screens.DashboardScreen
import com.mestre3dt.ui.screens.EnemiesScreen
import com.mestre3dt.ui.screens.NpcsScreen
import com.mestre3dt.ui.screens.SessionScreen
import com.mestre3dt.ui.screens.SoundScreen
import com.mestre3dt.ui.theme.Mestre3DTTheme

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

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Mesa do Mestre 3D&T") })
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
                    onAdjustHp = viewModel::adjustEnemyHp,
                    onAdjustMp = viewModel::adjustEnemyMp,
                    onToggleDown = viewModel::toggleEnemyDown,
                    onRemoveEnemy = viewModel::removeEnemyInstance,
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
                MestreTab.Npcs -> NpcsScreen(uiState = uiState)
                MestreTab.Enemies -> EnemiesScreen(uiState = uiState)
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
