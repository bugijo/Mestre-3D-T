package com.mestre3dt

import android.content.Context
import android.content.Intent
import android.media.MediaPlayer
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.viewModels
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.ListAlt
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.Slider
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.tooling.preview.Preview
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.common.C
import com.mestre3dt.data.Arc
import com.mestre3dt.data.Campaign
import com.mestre3dt.data.EncounterEnemyState
import com.mestre3dt.data.Npc
import com.mestre3dt.data.RollTrigger
import com.mestre3dt.data.Scene
import com.mestre3dt.ui.AppUiState
import com.mestre3dt.ui.MestreViewModel
import com.mestre3dt.ui.SyncStatus
import com.mestre3dt.data.SoundScene
import com.mestre3dt.data.SoundPreferences
import com.mestre3dt.data.SessionNote
import com.mestre3dt.data.SessionSummary
import com.mestre3dt.data.ActiveSession
import com.mestre3dt.data.sampleCampaigns
import com.mestre3dt.data.sampleEnemies
import com.mestre3dt.data.sampleNpcs
import com.mestre3dt.data.sampleSoundScenes
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
                                MestreTab.Dashboard -> Icon(Icons.Default.ListAlt, contentDescription = "Dashboard")
                                MestreTab.Session -> Icon(Icons.Default.ListAlt, contentDescription = "Sessão")
                                MestreTab.Campaigns -> Icon(Icons.Default.Campaign, contentDescription = "Campanhas")
                                MestreTab.Npcs -> Icon(Icons.Default.People, contentDescription = "NPCs")
                                MestreTab.Enemies -> Icon(Icons.Default.Shield, contentDescription = "Combate")
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
            if (uiState.isLoading) {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            }
            uiState.errorMessage?.let {
                ErrorBanner(message = it)
            }
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
                    onUpdateTrigger = viewModel::updateTriggerInScene,
                    onRemoveTrigger = viewModel::removeTriggerFromScene,
                    onStartSession = viewModel::startSession,
                    onEndSession = viewModel::endSessionWithSummary,
                    onResetEncounter = viewModel::resetEncounter
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
                    npcs = uiState.npcs,
                    onAddTrigger = viewModel::addTriggerToNpc,
                    onUpdateTrigger = viewModel::updateTriggerInNpc,
                    onRemoveTrigger = viewModel::removeTriggerFromNpc
                )
                MestreTab.Enemies -> EnemiesScreen(
                    enemies = uiState.enemies,
                    onAddEnemy = viewModel::addEnemy,
                    onUpdateEnemy = viewModel::updateEnemy,
                    onRemoveEnemy = viewModel::removeEnemy,
                    onAddPower = viewModel::addPowerToEnemy,
                    onUpdatePower = viewModel::updatePower,
                    onRemovePower = viewModel::removePower,
                    onAddInstance = viewModel::addEnemyInstance,
                    onReset = viewModel::resetEncounter
                )
                MestreTab.Sound -> SoundScreen(
                    soundScenes = uiState.soundScenes,
                    activeIndex = uiState.activeSoundSceneIndex,
                    isPlaying = uiState.isSoundPlaying,
                    preferences = uiState.soundPreferences,
                    onSelect = viewModel::selectSoundScene,
                    onTogglePlay = viewModel::toggleSoundPlayback,
                    onSetBackground = viewModel::setSoundBackground,
                    onAddEffect = viewModel::addSoundEffect,
                    onPreferencesChanged = viewModel::setSoundPreferences
                )
            }
        }
    }
}

@Composable
private fun DashboardScreen(
    uiState: AppUiState,
    onPushSync: () -> Unit,
    onPullSync: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                text = "Painel do Mestre — visão geral",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Campanhas: ${uiState.campaigns.size} | NPCs: ${uiState.npcs.size} | Encontros: ${uiState.enemies.size}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.primary
            )
        }
        item {
            val statusText = when (val status = uiState.syncStatus) {
                is SyncStatus.Idle -> "Pronto para sincronizar com Supabase (gratuito)."
                is SyncStatus.Syncing -> status.message
                is SyncStatus.Success -> status.message
                is SyncStatus.Error -> status.message
            }
            val isSyncing = uiState.syncStatus is SyncStatus.Syncing
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Backup em nuvem", style = MaterialTheme.typography.titleMedium)
                    Text(
                        text = if (uiState.isRemoteConfigured) statusText else "Configure SUPABASE_URL/SUPABASE_KEY em local.properties para usar o banco gratuito.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = if (uiState.syncStatus is SyncStatus.Error || !uiState.isRemoteConfigured) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Button(onClick = onPushSync, enabled = uiState.isRemoteConfigured && !isSyncing) {
                            Text("Enviar backup")
                        }
                        OutlinedButton(onClick = onPullSync, enabled = uiState.isRemoteConfigured && !isSyncing) {
                            Text("Baixar backup")
                        }
                    }
                }
            }
        }
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Próximos passos do MVP", style = MaterialTheme.typography.titleMedium)
                    Text("- CRUD de campanhas com cenas e gatilhos", style = MaterialTheme.typography.bodySmall)
                    Text("- Seleção de cena ativa em sessão", style = MaterialTheme.typography.bodySmall)
                    Text("- Controle de encontro e log de sessão", style = MaterialTheme.typography.bodySmall)
                    Text("- Painel de som local", style = MaterialTheme.typography.bodySmall)
                }
            }
        }
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Dica de uso", style = MaterialTheme.typography.titleMedium)
                    Text(
                        text = "Use a aba Campanhas para ativar a cena em andamento e já puxar gatilhos e NPCs na aba Sessão.",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }
    }
}

@Composable
private fun SessionScreen(
    uiState: AppUiState,
    onAdjustHp: (Int, Int) -> Unit,
    onAdjustMp: (Int, Int) -> Unit,
    onToggleDown: (Int) -> Unit,
    onRemoveEnemy: (Int) -> Unit,
    onAddNote: (String, Boolean) -> Unit,
    onAddTrigger: (Int, Int, Int, RollTrigger) -> Unit,
    onUpdateTrigger: (Int, Int, Int, Int, RollTrigger) -> Unit,
    onRemoveTrigger: (Int, Int, Int, Int) -> Unit,
    onStartSession: (String) -> Unit,
    onEndSession: () -> Unit,
    onResetEncounter: () -> Unit
) {
    val activeCampaign = uiState.campaigns.getOrNull(uiState.activeCampaignIndex)
    val activeArc = activeCampaign?.arcs?.getOrNull(uiState.activeArcIndex)
    val activeScene = activeArc?.scenes?.getOrNull(uiState.activeSceneIndex)
    var sessionName by remember { mutableStateOf(uiState.activeSession?.name.orEmpty()) }
    var noteText by remember { mutableStateOf("") }
    var important by remember { mutableStateOf(false) }
    var triggerSituation by remember { mutableStateOf("") }
    var triggerType by remember { mutableStateOf("Persuasão") }
    var triggerAttribute by remember { mutableStateOf("Habilidade") }
    var triggerDifficulty by remember { mutableStateOf("10") }
    var triggerSuccess by remember { mutableStateOf("") }
    var triggerFailure by remember { mutableStateOf("") }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                text = "Painel rápido da sessão",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            if (activeCampaign != null && activeScene != null) {
                Text(
                    text = "Campanha: ${activeCampaign.title} — Cena: ${activeScene.name}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.primary
                )
                QuickActionsRow(
                    isSessionActive = uiState.activeSession != null,
                    sessionName = sessionName.ifBlank { "Sessão atual" },
                    onStart = { onStartSession(sessionName.ifBlank { "Sessão atual" }) },
                    onEnd = onEndSession,
                    onResetEncounter = onResetEncounter,
                    encounterAvailable = uiState.encounter.isNotEmpty()
                )
            } else {
                Text(
                    text = "Selecione uma campanha/cena na aba Campanhas.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.error
                )
            }
        }

        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    SectionTitle("Sessão em andamento")
                    if (uiState.activeSession != null) {
                        val active = uiState.activeSession
                        Text("Nome: ${active.name}", style = MaterialTheme.typography.bodyMedium)
                        Text(
                            "Iniciada em: ${java.text.DateFormat.getDateTimeInstance().format(java.util.Date(active.startedAt))}",
                            style = MaterialTheme.typography.bodySmall
                        )
                        if (active.scenesVisited.isNotEmpty()) {
                            Text("Cenas visitadas: ${active.scenesVisited.joinToString()}", style = MaterialTheme.typography.bodySmall)
                        }
                        if (active.resumedFrom != null) {
                            Text("Retomada de sessão iniciada em ${java.text.DateFormat.getDateTimeInstance().format(java.util.Date(active.resumedFrom))}", style = MaterialTheme.typography.labelSmall)
                        }
                        OutlinedButton(onClick = onEndSession) {
                            Text("Encerrar sessão e gerar resumo")
                        }
                    } else {
                        Text("Nenhuma sessão ativa. Inicie para registrar notas e resumo.", style = MaterialTheme.typography.bodySmall)
                        OutlinedTextField(
                            value = sessionName,
                            onValueChange = { sessionName = it },
                            label = { Text("Nome da sessão") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        Row(horizontalArrangement = Arrangement.End, modifier = Modifier.fillMaxWidth()) {
                            Button(onClick = { onStartSession(sessionName) }) { Text("Iniciar sessão") }
                        }
                    }
                }
            }
        }

        activeScene?.let { scene ->
            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Cena em andamento", style = MaterialTheme.typography.titleMedium)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("Objetivo: ${scene.objective}", style = MaterialTheme.typography.bodyMedium)
                        Text("Clima: ${scene.mood}", style = MaterialTheme.typography.bodySmall)
                        Spacer(modifier = Modifier.height(6.dp))
                        Text("Texto de abertura:", style = MaterialTheme.typography.labelLarge)
                        Text(scene.opening, style = MaterialTheme.typography.bodySmall)
                        Spacer(modifier = Modifier.height(6.dp))
                        Text("Ganchos:", style = MaterialTheme.typography.labelLarge)
                        scene.hooks.forEach { hook ->
                            Text("• $hook", style = MaterialTheme.typography.bodySmall)
                        }
                        if (scene.triggers.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Gatilhos de rolagem:", style = MaterialTheme.typography.labelLarge)
                            scene.triggers.forEachIndexed { triggerIndex, trigger ->
                                RollTriggerCard(
                                    trigger,
                                    onRemove = {
                                        onRemoveTrigger(
                                            uiState.activeCampaignIndex,
                                            uiState.activeArcIndex,
                                            uiState.activeSceneIndex,
                                            triggerIndex
                                        )
                                    },
                                    onUpdate = { updated ->
                                        onUpdateTrigger(
                                            uiState.activeCampaignIndex,
                                            uiState.activeArcIndex,
                                            uiState.activeSceneIndex,
                                            triggerIndex,
                                            updated
                                        )
                                    }
                                )
                            }
                        }
                    }
                }
            }

            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        SectionTitle("Novo gatilho rápido para a cena")
                        OutlinedTextField(
                            value = triggerSituation,
                            onValueChange = { triggerSituation = it },
                            label = { Text("Situação") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = triggerType,
                            onValueChange = { triggerType = it },
                            label = { Text("Tipo de teste") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = triggerAttribute,
                            onValueChange = { triggerAttribute = it },
                            label = { Text("Atributo") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                            OutlinedTextField(
                                value = triggerDifficulty,
                                onValueChange = { triggerDifficulty = it },
                                label = { Text("Dificuldade") },
                                modifier = Modifier.weight(1f)
                            )
                            OutlinedButton(onClick = {
                                if (triggerSituation.isNotBlank() && triggerSuccess.isNotBlank()) {
                                    onAddTrigger(
                                        uiState.activeCampaignIndex,
                                        uiState.activeArcIndex,
                                        uiState.activeSceneIndex,
                                        RollTrigger(
                                            situation = triggerSituation,
                                            testType = triggerType.ifBlank { "Teste" },
                                            attribute = triggerAttribute.ifBlank { "Habilidade" },
                                            difficulty = triggerDifficulty.ifBlank { "10" },
                                            onSuccess = triggerSuccess.ifBlank { "Revele a pista" },
                                            onFailure = triggerFailure.ifBlank { "Nada acontece" }
                                        )
                                    )
                                    triggerSituation = ""
                                    triggerType = "Persuasão"
                                    triggerAttribute = "Habilidade"
                                    triggerDifficulty = "10"
                                    triggerSuccess = ""
                                    triggerFailure = ""
                                }
                            }) {
                                Text("Salvar gatilho")
                            }
                        }
                        OutlinedTextField(
                            value = triggerSuccess,
                            onValueChange = { triggerSuccess = it },
                            label = { Text("Resultado em sucesso") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = triggerFailure,
                            onValueChange = { triggerFailure = it },
                            label = { Text("Resultado em falha") },
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }
        }

        if (uiState.npcs.isNotEmpty()) {
            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        SectionTitle("NPCs na cena")
                        uiState.npcs.forEach { npc ->
                            NpcCard(npc = npc, onAddTrigger = {}, onUpdateTrigger = { _, _ -> }, onRemoveTrigger = {})
                        }
                    }
                }
            }
        }

        if (uiState.encounter.isNotEmpty()) {
            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        SectionTitle("Encontro atual")
                        uiState.encounter.forEachIndexed { index, state ->
                            EncounterEnemyRow(
                                state = state,
                                onAdjustHp = { delta -> onAdjustHp(index, delta) },
                                onAdjustMp = { delta -> onAdjustMp(index, delta) },
                                onToggleDown = { onToggleDown(index) },
                                onRemove = { onRemoveEnemy(index) }
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                        }
                    }
                }
            }
        }

        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    SectionTitle("Notas rápidas da sessão")
                    Row(verticalAlignment = Alignment.CenterVertically) {
                    OutlinedTextField(
                        value = noteText,
                        onValueChange = { noteText = it },
                        label = { Text("Anotação") },
                        modifier = Modifier.weight(1f)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Importante", style = MaterialTheme.typography.labelSmall)
                            SingleChoiceSegmentedButtonRow {
                                SegmentedButton(
                                    checked = !important,
                                    onCheckedChange = { important = false },
                                    shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2)
                                ) { Text("Não") }
                                SegmentedButton(
                                    checked = important,
                                    onCheckedChange = { important = true },
                                    shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2)
                                ) { Text("Sim") }
                            }
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        OutlinedButton(onClick = {
                            if (noteText.isNotBlank()) {
                                onAddNote(noteText, important)
                                noteText = ""
                                important = false
                            }
                        }) {
                            Text("Salvar")
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    uiState.sessionNotes.forEach { note ->
                        val bg = if (note.important) MaterialTheme.colorScheme.errorContainer else MaterialTheme.colorScheme.surfaceVariant
                        val fg = if (note.important) MaterialTheme.colorScheme.onErrorContainer else MaterialTheme.colorScheme.onSurfaceVariant
                        Text(
                            note.text,
                            modifier = Modifier
                                .padding(vertical = 2.dp)
                                .background(bg)
                                .padding(8.dp),
                            style = MaterialTheme.typography.bodySmall,
                            color = fg
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedButton(onClick = onEndSession) {
                        Text("Encerrar sessão e gerar resumo")
                    }
                }
            }
        }

        if (uiState.sessionSummaries.isNotEmpty()) {
            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        SectionTitle("Resumos anteriores")
                        uiState.sessionSummaries.forEach { summary ->
                            Column(modifier = Modifier.padding(vertical = 6.dp)) {
                                summary.sessionName?.let {
                                    Text(
                                        it,
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                                Text(
                                    summary.sceneName ?: "Cena não definida",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    "Campanha: ${summary.campaignTitle ?: "-"} | Arco: ${summary.arcTitle ?: "-"}",
                                    style = MaterialTheme.typography.bodySmall
                                )
                                val started = summary.startedAt?.let { java.util.Date(it) }
                                val ended = summary.endedAt?.let { java.util.Date(it) }
                                if (started != null) {
                                    Text(
                                        "Início: ${java.text.DateFormat.getDateTimeInstance().format(started)}",
                                        style = MaterialTheme.typography.labelSmall
                                    )
                                }
                                if (ended != null) {
                                    Text(
                                        "Fim: ${java.text.DateFormat.getDateTimeInstance().format(ended)}",
                                        style = MaterialTheme.typography.labelSmall
                                    )
                                }
                                if (summary.importantNotes.isNotEmpty()) {
                                    Text("Notas importantes:", style = MaterialTheme.typography.labelLarge)
                                    summary.importantNotes.forEach { note -> Text("• $note", style = MaterialTheme.typography.bodySmall) }
                                }
                                if (summary.defeatedEnemies.isNotEmpty()) {
                                    Text("Inimigos derrotados:", style = MaterialTheme.typography.labelLarge)
                                    Text(summary.defeatedEnemies.joinToString(), style = MaterialTheme.typography.bodySmall)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RollTriggerCard(
    trigger: RollTrigger,
    onRemove: (() -> Unit)? = null,
    onUpdate: ((RollTrigger) -> Unit)? = null
) {
    var expanded by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf(false) }
    var situation by remember { mutableStateOf(trigger.situation) }
    var type by remember { mutableStateOf(trigger.testType) }
    var attribute by remember { mutableStateOf(trigger.attribute) }
    var difficulty by remember { mutableStateOf(trigger.difficulty) }
    var success by remember { mutableStateOf(trigger.onSuccess) }
    var failure by remember { mutableStateOf(trigger.onFailure) }

    OutlinedCard(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(trigger.situation, style = MaterialTheme.typography.titleSmall)
                    Text(
                        "${trigger.testType} (${trigger.attribute}) | Dif.: ${trigger.difficulty}",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    if (onUpdate != null) {
                        TextButton(onClick = { editing = true }) { Text("Editar") }
                    }
                    onRemove?.let {
                        TextButton(onClick = it) { Text("Remover") }
                    }
                    TextButton(onClick = { expanded = !expanded }) {
                        Text(if (expanded) "Ocultar" else "Ver detalhes")
                    }
                }
            }
            if (expanded) {
                Spacer(modifier = Modifier.height(4.dp))
                Text("Sucesso:", style = MaterialTheme.typography.labelLarge)
                Text(trigger.onSuccess, style = MaterialTheme.typography.bodySmall)
                Spacer(modifier = Modifier.height(4.dp))
                Text("Falha:", style = MaterialTheme.typography.labelLarge)
                Text(trigger.onFailure, style = MaterialTheme.typography.bodySmall)
            }
            if (editing) {
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(value = situation, onValueChange = { situation = it }, label = { Text("Situação") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = type, onValueChange = { type = it }, label = { Text("Tipo de teste") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = attribute, onValueChange = { attribute = it }, label = { Text("Atributo") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = difficulty, onValueChange = { difficulty = it }, label = { Text("Dificuldade") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = success, onValueChange = { success = it }, label = { Text("Resultado em sucesso") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = failure, onValueChange = { failure = it }, label = { Text("Resultado em falha") }, modifier = Modifier.fillMaxWidth())
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    TextButton(onClick = { editing = false }) { Text("Cancelar") }
                    onUpdate?.let { update ->
                        TextButton(onClick = {
                            update(
                                RollTrigger(
                                    situation = situation,
                                    testType = type,
                                    attribute = attribute,
                                    difficulty = difficulty,
                                    onSuccess = success,
                                    onFailure = failure
                                )
                            )
                            editing = false
                        }) {
                            Text("Salvar")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun EncounterEnemyRow(
    state: EncounterEnemyState,
    onAdjustHp: (Int) -> Unit,
    onAdjustMp: (Int) -> Unit,
    onToggleDown: () -> Unit,
    onRemove: () -> Unit
) {
    val downColor = if (state.isDown) MaterialTheme.colorScheme.errorContainer else MaterialTheme.colorScheme.surfaceVariant
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(downColor)
            .padding(12.dp)
    ) {
        Text(state.label, style = MaterialTheme.typography.titleSmall)
        Text(state.enemy.tags.joinToString(), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
        Text(
            "PV ${state.currentHp}/${state.enemy.maxHp} | PM ${state.currentMp ?: 0}/${state.enemy.maxMp ?: 0}",
            style = MaterialTheme.typography.bodySmall
        )
        Spacer(modifier = Modifier.height(4.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf(-5, -1, +1, +5).forEach { delta ->
                OutlinedButton(onClick = { onAdjustHp(delta) }) {
                    Text(if (delta > 0) "+$delta PV" else "$delta PV")
                }
            }
            OutlinedButton(onClick = onToggleDown) {
                Text(if (state.isDown) "Levantar" else "Derrubar")
            }
        }
        if (state.enemy.maxMp != null) {
            Spacer(modifier = Modifier.height(4.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(-5, -1, +1, +5).forEach { delta ->
                    OutlinedButton(onClick = { onAdjustMp(delta) }) {
                        Text(if (delta > 0) "+$delta PM" else "$delta PM")
                    }
                }
            }
        }
        Spacer(modifier = Modifier.height(4.dp))
        OutlinedButton(onClick = onRemove) { Text("Remover do encontro") }
        if (state.enemy.powers.isNotEmpty()) {
            Spacer(modifier = Modifier.height(4.dp))
            Text("Poderes:", style = MaterialTheme.typography.labelLarge)
            state.enemy.powers.forEach { power ->
                Text(power.name, fontWeight = FontWeight.SemiBold)
                Text(power.description, style = MaterialTheme.typography.bodySmall)
                Text("Custo PM: ${power.mpCost?.toString() ?: "0"} | Alvo: ${power.target}", style = MaterialTheme.typography.bodySmall)
                power.testReminder?.let { Text("Teste: $it", style = MaterialTheme.typography.bodySmall) }
                power.onSuccess?.let { Text("Sucesso: $it", style = MaterialTheme.typography.bodySmall) }
                power.onFailure?.let { Text("Falha: $it", style = MaterialTheme.typography.bodySmall) }
                Spacer(modifier = Modifier.height(4.dp))
            }
        }
    }
}

@Composable
private fun NpcCard(
    npc: Npc,
    onAddTrigger: (RollTrigger) -> Unit,
    onUpdateTrigger: (Int, RollTrigger) -> Unit,
    onRemoveTrigger: (Int) -> Unit
) {
    var situation by remember { mutableStateOf("") }
    var testType by remember { mutableStateOf("Persuasão") }
    var attribute by remember { mutableStateOf("Habilidade") }
    var difficulty by remember { mutableStateOf("10") }
    var onSuccess by remember { mutableStateOf("") }
    var onFailure by remember { mutableStateOf("") }

    OutlinedCard(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(npc.name, style = MaterialTheme.typography.titleSmall)
            Text(npc.role, style = MaterialTheme.typography.bodySmall)
            Text("Personalidade: ${npc.personality.joinToString()} ", style = MaterialTheme.typography.bodySmall)
            Text("Jeito de falar: ${npc.speechStyle}", style = MaterialTheme.typography.bodySmall)
            Text("Trejeitos: ${npc.mannerisms.joinToString()} ", style = MaterialTheme.typography.bodySmall)
            if (npc.quickPhrases.isNotEmpty()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text("Frases prontas:", style = MaterialTheme.typography.labelLarge)
                npc.quickPhrases.forEach { phrase ->
                    Text("• $phrase", style = MaterialTheme.typography.bodySmall)
                }
            }
            if (npc.triggers.isNotEmpty()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text("Gatilhos do NPC:", style = MaterialTheme.typography.labelLarge)
                npc.triggers.forEachIndexed { index, trigger ->
                    RollTriggerCard(
                        trigger,
                        onRemove = { onRemoveTrigger(index) },
                        onUpdate = { updated -> onUpdateTrigger(index, updated) }
                    )
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text("Novo gatilho para o NPC", style = MaterialTheme.typography.titleSmall)
            OutlinedTextField(
                value = situation,
                onValueChange = { situation = it },
                label = { Text("Situação") },
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = testType,
                onValueChange = { testType = it },
                label = { Text("Tipo de teste") },
                modifier = Modifier.fillMaxWidth()
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = attribute,
                    onValueChange = { attribute = it },
                    label = { Text("Atributo") },
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = difficulty,
                    onValueChange = { difficulty = it },
                    label = { Text("Dificuldade") },
                    modifier = Modifier.weight(1f)
                )
            }
            OutlinedTextField(
                value = onSuccess,
                onValueChange = { onSuccess = it },
                label = { Text("Sucesso") },
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = onFailure,
                onValueChange = { onFailure = it },
                label = { Text("Falha") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(6.dp))
            OutlinedButton(onClick = {
                if (situation.isNotBlank() && onSuccess.isNotBlank()) {
                    onAddTrigger(
                        RollTrigger(
                            situation = situation,
                            testType = testType.ifBlank { "Teste" },
                            attribute = attribute.ifBlank { "Habilidade" },
                            difficulty = difficulty.ifBlank { "10" },
                            onSuccess = onSuccess,
                            onFailure = onFailure.ifBlank { "Não revela nada" }
                        )
                    )
                    situation = ""
                    testType = "Persuasão"
                    attribute = "Habilidade"
                    difficulty = "10"
                    onSuccess = ""
                    onFailure = ""
                }
            }) {
                Text("Salvar gatilho do NPC")
            }
        }
    }
}

@Composable
private fun CampaignsScreen(
    uiState: AppUiState,
    onAddCampaign: (Campaign) -> Unit,
    onAddArc: (Int, Arc) -> Unit,
    onAddScene: (Int, Int, Scene) -> Unit,
    onSetActiveCampaign: (Int) -> Unit,
    onSetActiveArc: (Int) -> Unit,
    onSetActiveScene: (Int) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var synopsis by remember { mutableStateOf("") }
    var genre by remember { mutableStateOf("") }
    val arcTitles = remember { mutableStateMapOf<Int, String>() }
    val sceneNames = remember { mutableStateMapOf<Pair<Int, Int>, String>() }
    val sceneObjectives = remember { mutableStateMapOf<Pair<Int, Int>, String>() }
    val sceneMoods = remember { mutableStateMapOf<Pair<Int, Int>, String>() }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text("Campanhas e cenas", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Criar campanha rápida", style = MaterialTheme.typography.titleSmall)
                    OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("Título") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = synopsis, onValueChange = { synopsis = it }, label = { Text("Sinopse") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = genre, onValueChange = { genre = it }, label = { Text("Gênero") }, modifier = Modifier.fillMaxWidth())
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedButton(onClick = {
                        if (title.isNotBlank()) {
                            onAddCampaign(
                                Campaign(
                                    title = title,
                                    synopsis = synopsis.ifBlank { "Sinopse rápida" },
                                    genre = genre.ifBlank { "Fantasia" },
                                    arcs = emptyList()
                                )
                            )
                            title = ""
                            synopsis = ""
                            genre = ""
                        }
                    }) {
                        Text("Salvar campanha")
                    }
                }
            }
        }

        if (uiState.campaigns.isEmpty()) {
            item {
                EmptyStateCard(text = "Nenhuma campanha cadastrada. Crie uma para habilitar cenas e gatilhos na sessão.")
            }
        }

        items(uiState.campaigns.size) { index ->
            val campaign = uiState.campaigns[index]
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(campaign.title, style = MaterialTheme.typography.titleMedium)
                            Text(campaign.synopsis, style = MaterialTheme.typography.bodySmall)
                            Text("Gênero: ${campaign.genre}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                        }
                        OutlinedButton(onClick = { onSetActiveCampaign(index) }) {
                            Text(if (uiState.activeCampaignIndex == index) "Ativa" else "Ativar")
                        }
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Arcos", style = MaterialTheme.typography.labelLarge)
                    campaign.arcs.forEachIndexed { arcIndex, arc ->
                        Column(modifier = Modifier.padding(vertical = 4.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(arc.title, fontWeight = FontWeight.SemiBold)
                                Spacer(modifier = Modifier.width(8.dp))
                                TextButton(onClick = { onSetActiveArc(arcIndex) }) { Text(if (uiState.activeArcIndex == arcIndex && uiState.activeCampaignIndex == index) "Ativo" else "Usar") }
                            }
                            arc.scenes.forEachIndexed { sceneIndex, scene ->
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("• ${scene.name} (${scene.mood})", style = MaterialTheme.typography.bodySmall, modifier = Modifier.weight(1f))
                                    TextButton(onClick = { onSetActiveScene(sceneIndex) }) {
                                        Text(if (uiState.activeSceneIndex == sceneIndex && uiState.activeCampaignIndex == index) "Cena ativa" else "Ativar cena")
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            val sceneKey = index to arcIndex
                            OutlinedTextField(
                                value = sceneNames[sceneKey] ?: "",
                                onValueChange = { sceneNames[sceneKey] = it },
                                label = { Text("Nome da cena") },
                                modifier = Modifier.fillMaxWidth()
                            )
                            OutlinedTextField(
                                value = sceneObjectives[sceneKey] ?: "",
                                onValueChange = { sceneObjectives[sceneKey] = it },
                                label = { Text("Objetivo") },
                                modifier = Modifier.fillMaxWidth()
                            )
                            OutlinedTextField(
                                value = sceneMoods[sceneKey] ?: "",
                                onValueChange = { sceneMoods[sceneKey] = it },
                                label = { Text("Clima") },
                                modifier = Modifier.fillMaxWidth()
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            OutlinedButton(onClick = {
                                val name = sceneNames[sceneKey].orEmpty()
                                if (name.isNotBlank()) {
                                    onAddScene(
                                        index,
                                        arcIndex,
                                        Scene(
                                            name = name,
                                            objective = sceneObjectives[sceneKey].orEmpty().ifBlank { "Objetivo a definir" },
                                            mood = sceneMoods[sceneKey].orEmpty().ifBlank { "neutro" },
                                            opening = "Descrição a adicionar",
                                            hooks = emptyList(),
                                            triggers = emptyList()
                                        )
                                    )
                                    sceneNames[sceneKey] = ""
                                    sceneObjectives[sceneKey] = ""
                                    sceneMoods[sceneKey] = ""
                                }
                            }) {
                                Text("Adicionar cena")
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = arcTitles[index] ?: "",
                        onValueChange = { arcTitles[index] = it },
                        label = { Text("Novo arco") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    OutlinedButton(onClick = {
                        val arcTitle = arcTitles[index].orEmpty()
                        if (arcTitle.isNotBlank()) {
                            onAddArc(index, Arc(title = arcTitle, scenes = emptyList()))
                            arcTitles[index] = ""
                        }
                    }) {
                        Text("Adicionar arco")
                    }
                }
            }
        }
    }
}

@Composable
private fun NpcsScreen(
    npcs: List<Npc>,
    onAddTrigger: (Int, RollTrigger) -> Unit,
    onUpdateTrigger: (Int, Int, RollTrigger) -> Unit,
    onRemoveTrigger: (Int, Int) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item { Text("NPCs", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold) }
        if (npcs.isEmpty()) {
            item { EmptyStateCard(text = "Nenhum NPC cadastrado. Use gatilhos da cena ativa ou cadastre um NPC aqui.") }
        }
        itemsIndexed(npcs) { index, npc ->
            NpcCard(
                npc = npc,
                onAddTrigger = { trigger -> onAddTrigger(index, trigger) },
                onUpdateTrigger = { triggerIndex, trigger -> onUpdateTrigger(index, triggerIndex, trigger) },
                onRemoveTrigger = { triggerIndex -> onRemoveTrigger(index, triggerIndex) }
            )
        }
    }
}

@Composable
private fun EnemiesScreen(
    enemies: List<com.mestre3dt.data.Enemy>,
    onAddEnemy: (com.mestre3dt.data.Enemy) -> Unit,
    onUpdateEnemy: (Int, com.mestre3dt.data.Enemy) -> Unit,
    onRemoveEnemy: (Int) -> Unit,
    onAddPower: (Int, com.mestre3dt.data.Power) -> Unit,
    onUpdatePower: (Int, Int, com.mestre3dt.data.Power) -> Unit,
    onRemovePower: (Int, Int) -> Unit,
    onAddInstance: (com.mestre3dt.data.Enemy, Int) -> Unit,
    onReset: () -> Unit
) {
    val quantities = remember { mutableStateMapOf<String, String>() }
    var createName by remember { mutableStateOf("") }
    var createTags by remember { mutableStateOf("") }
    var createF by remember { mutableStateOf("1") }
    var createH by remember { mutableStateOf("1") }
    var createR by remember { mutableStateOf("1") }
    var createA by remember { mutableStateOf("0") }
    var createP by remember { mutableStateOf("0") }
    var createHp by remember { mutableStateOf("5") }
    var createMp by remember { mutableStateOf("0") }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Inimigos e encontros", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                OutlinedButton(onClick = onReset) { Text("Reset encontro") }
            }
        }

        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    SectionTitle("Cadastrar inimigo rápido")
                    OutlinedTextField(value = createName, onValueChange = { createName = it }, label = { Text("Nome") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = createTags, onValueChange = { createTags = it }, label = { Text("Tags (separadas por vírgula)") }, modifier = Modifier.fillMaxWidth())
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(value = createF, onValueChange = { createF = it.filter { ch -> ch.isDigit() } }, label = { Text("F") }, modifier = Modifier.weight(1f))
                        OutlinedTextField(value = createH, onValueChange = { createH = it.filter { ch -> ch.isDigit() } }, label = { Text("H") }, modifier = Modifier.weight(1f))
                        OutlinedTextField(value = createR, onValueChange = { createR = it.filter { ch -> ch.isDigit() } }, label = { Text("R") }, modifier = Modifier.weight(1f))
                        OutlinedTextField(value = createA, onValueChange = { createA = it.filter { ch -> ch.isDigit() } }, label = { Text("A") }, modifier = Modifier.weight(1f))
                        OutlinedTextField(value = createP, onValueChange = { createP = it.filter { ch -> ch.isDigit() } }, label = { Text("PdF") }, modifier = Modifier.weight(1f))
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(value = createHp, onValueChange = { createHp = it.filter { ch -> ch.isDigit() } }, label = { Text("PV Máx") }, modifier = Modifier.weight(1f))
                        OutlinedTextField(value = createMp, onValueChange = { createMp = it.filter { ch -> ch.isDigit() } }, label = { Text("PM Máx (opcional)") }, modifier = Modifier.weight(1f))
                    }
                    OutlinedButton(onClick = {
                        val name = createName.trim()
                        val hp = createHp.toIntOrNull() ?: 0
                        val mp = createMp.toIntOrNull()
                        if (name.isNotBlank() && hp > 0) {
                            onAddEnemy(
                                com.mestre3dt.data.Enemy(
                                    name = name,
                                    tags = createTags.split(",").map { it.trim() }.filter { it.isNotBlank() },
                                    attributes = com.mestre3dt.data.EnemyAttributes(
                                        strength = createF.toIntOrNull() ?: 0,
                                        skill = createH.toIntOrNull() ?: 0,
                                        resistance = createR.toIntOrNull() ?: 0,
                                        armor = createA.toIntOrNull() ?: 0,
                                        firepower = createP.toIntOrNull() ?: 0
                                    ),
                                    maxHp = hp,
                                    currentHp = hp,
                                    maxMp = mp,
                                    currentMp = mp,
                                    powers = emptyList()
                                )
                            )
                            createName = ""
                            createTags = ""
                            createF = "1"
                            createH = "1"
                            createR = "1"
                            createA = "0"
                            createP = "0"
                            createHp = "5"
                            createMp = "0"
                        }
                    }) { Text("Salvar inimigo") }
                }
            }
        }

        if (enemies.isEmpty()) {
            item {
                EmptyStateCard(text = "Nenhum inimigo cadastrado. Crie um novo acima para popular a lista e usar no encontro.")
            }
        }

        itemsIndexed(enemies) { index, enemy ->
            EnemyCard(
                enemy = enemy,
                defaultQty = quantities[enemy.name] ?: "1",
                onQtyChanged = { new -> quantities[enemy.name] = new },
                onAddInstance = { qty -> onAddInstance(enemy, qty) },
                onUpdateEnemy = { onUpdateEnemy(index, it) },
                onRemoveEnemy = { onRemoveEnemy(index) },
                onAddPower = { onAddPower(index, it) },
                onUpdatePower = { powerIndex, power -> onUpdatePower(index, powerIndex, power) },
                onRemovePower = { powerIndex -> onRemovePower(index, powerIndex) }
            )
        }
    }
}

@Composable
private fun EnemyCard(
    enemy: com.mestre3dt.data.Enemy,
    defaultQty: String,
    onQtyChanged: (String) -> Unit,
    onAddInstance: (Int) -> Unit,
    onUpdateEnemy: (com.mestre3dt.data.Enemy) -> Unit,
    onRemoveEnemy: () -> Unit,
    onAddPower: (com.mestre3dt.data.Power) -> Unit,
    onUpdatePower: (Int, com.mestre3dt.data.Power) -> Unit,
    onRemovePower: (Int) -> Unit,
) {
    var editing by remember { mutableStateOf(false) }
    var confirmingRemoval by remember { mutableStateOf(false) }
    var name by remember { mutableStateOf(enemy.name) }
    var tags by remember { mutableStateOf(enemy.tags.joinToString(", ")) }
    var f by remember { mutableStateOf(enemy.attributes.strength.toString()) }
    var h by remember { mutableStateOf(enemy.attributes.skill.toString()) }
    var r by remember { mutableStateOf(enemy.attributes.resistance.toString()) }
    var a by remember { mutableStateOf(enemy.attributes.armor.toString()) }
    var pdf by remember { mutableStateOf(enemy.attributes.firepower.toString()) }
    var hp by remember { mutableStateOf(enemy.maxHp.toString()) }
    var mp by remember { mutableStateOf(enemy.maxMp?.toString() ?: "") }

    OutlinedCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(enemy.name, style = MaterialTheme.typography.titleSmall)
                    Text(enemy.tags.joinToString(), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                    Text(
                        "F/H/R/A/PdF ${enemy.attributes.strength}/${enemy.attributes.skill}/${enemy.attributes.resistance}/${enemy.attributes.armor}/${enemy.attributes.firepower}",
                        style = MaterialTheme.typography.bodySmall
                    )
                    Text("PV ${enemy.currentHp}/${enemy.maxHp} | PM ${enemy.currentMp ?: 0}/${enemy.maxMp ?: 0}", style = MaterialTheme.typography.bodySmall)
                }
                TextButton(onClick = { editing = !editing }) { Text(if (editing) "Fechar edição" else "Editar") }
            }

            if (enemy.powers.isNotEmpty()) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Poderes", style = MaterialTheme.typography.labelLarge)
                    enemy.powers.forEachIndexed { powerIndex, power ->
                        PowerEditor(
                            power = power,
                            onUpdate = { onUpdatePower(powerIndex, it) },
                            onRemove = { onRemovePower(powerIndex) }
                        )
                    }
                }
            }

            PowerCreator(onAddPower = onAddPower)

            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = defaultQty,
                    onValueChange = { new -> onQtyChanged(new.filter { it.isDigit() }.ifBlank { "" }) },
                    label = { Text("Qtd no encontro") },
                    modifier = Modifier.weight(1f)
                )
                OutlinedButton(onClick = { onAddInstance(defaultQty.toIntOrNull() ?: 0) }) {
                    Text("Adicionar")
                }
            }

            if (editing) {
                Divider(modifier = Modifier.padding(vertical = 4.dp))
                Text("Edição completa", style = MaterialTheme.typography.labelLarge)
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Nome") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = tags, onValueChange = { tags = it }, label = { Text("Tags, separadas por vírgula") }, modifier = Modifier.fillMaxWidth())
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = f, onValueChange = { f = it.filter { ch -> ch.isDigit() } }, label = { Text("F") }, modifier = Modifier.weight(1f))
                    OutlinedTextField(value = h, onValueChange = { h = it.filter { ch -> ch.isDigit() } }, label = { Text("H") }, modifier = Modifier.weight(1f))
                    OutlinedTextField(value = r, onValueChange = { r = it.filter { ch -> ch.isDigit() } }, label = { Text("R") }, modifier = Modifier.weight(1f))
                    OutlinedTextField(value = a, onValueChange = { a = it.filter { ch -> ch.isDigit() } }, label = { Text("A") }, modifier = Modifier.weight(1f))
                    OutlinedTextField(value = pdf, onValueChange = { pdf = it.filter { ch -> ch.isDigit() } }, label = { Text("PdF") }, modifier = Modifier.weight(1f))
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = hp, onValueChange = { hp = it.filter { ch -> ch.isDigit() } }, label = { Text("PV Máx") }, modifier = Modifier.weight(1f))
                    OutlinedTextField(value = mp, onValueChange = { mp = it.filter { ch -> ch.isDigit() } }, label = { Text("PM Máx") }, modifier = Modifier.weight(1f))
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = {
                        val parsedHp = hp.toIntOrNull() ?: enemy.maxHp
                        val parsedMp = mp.toIntOrNull()
                        onUpdateEnemy(
                            enemy.copy(
                                name = name.ifBlank { enemy.name },
                                tags = tags.split(",").map { it.trim() }.filter { it.isNotBlank() },
                                attributes = com.mestre3dt.data.EnemyAttributes(
                                    strength = f.toIntOrNull() ?: 0,
                                    skill = h.toIntOrNull() ?: 0,
                                    resistance = r.toIntOrNull() ?: 0,
                                    armor = a.toIntOrNull() ?: 0,
                                    firepower = pdf.toIntOrNull() ?: 0
                                ),
                                maxHp = parsedHp,
                                currentHp = parsedHp.coerceAtMost(enemy.currentHp),
                                maxMp = parsedMp,
                                currentMp = parsedMp?.coerceAtMost(enemy.currentMp ?: parsedMp ?: 0),
                            )
                        )
                        editing = false
                    }, modifier = Modifier.weight(1f)) { Text("Salvar alterações") }

                    OutlinedButton(
                        onClick = {
                            confirmingRemoval = !confirmingRemoval
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(if (confirmingRemoval) "Confirmar exclusão" else "Excluir inimigo")
                    }
                }
                if (confirmingRemoval) {
                    Text("Esta ação remove o inimigo e suas instâncias do encontro.", style = MaterialTheme.typography.bodySmall)
                    OutlinedButton(onClick = onRemoveEnemy, modifier = Modifier.fillMaxWidth()) { Text("Remover agora") }
                }
            }
        }
    }
}

@Composable
private fun PowerCreator(onAddPower: (com.mestre3dt.data.Power) -> Unit) {
    var name by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var mpCost by remember { mutableStateOf("") }
    var target by remember { mutableStateOf("Alvo único") }
    var testReminder by remember { mutableStateOf("") }
    var onSuccess by remember { mutableStateOf("") }
    var onFailure by remember { mutableStateOf("") }

    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text("Adicionar poder", style = MaterialTheme.typography.labelLarge)
        OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Nome") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = description, onValueChange = { description = it }, label = { Text("Descrição") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = mpCost, onValueChange = { mpCost = it.filter { ch -> ch.isDigit() } }, label = { Text("Custo em PM") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = target, onValueChange = { target = it }, label = { Text("Alvo") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = testReminder, onValueChange = { testReminder = it }, label = { Text("Lembrete de teste") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = onSuccess, onValueChange = { onSuccess = it }, label = { Text("Efeito em sucesso") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = onFailure, onValueChange = { onFailure = it }, label = { Text("Efeito em falha") }, modifier = Modifier.fillMaxWidth())
        OutlinedButton(onClick = {
            val powerName = name.trim()
            if (powerName.isNotEmpty()) {
                onAddPower(
                    com.mestre3dt.data.Power(
                        name = powerName,
                        description = description.ifBlank { "Efeito rápido" },
                        mpCost = mpCost.toIntOrNull(),
                        target = target.ifBlank { "Alvo" },
                        testReminder = testReminder.ifBlank { null },
                        onSuccess = onSuccess.ifBlank { null },
                        onFailure = onFailure.ifBlank { null }
                    )
                )
                name = ""
                description = ""
                mpCost = ""
                target = "Alvo único"
                testReminder = ""
                onSuccess = ""
                onFailure = ""
            }
        }) { Text("Salvar poder") }
    }
}

@Composable
private fun PowerEditor(
    power: com.mestre3dt.data.Power,
    onUpdate: (com.mestre3dt.data.Power) -> Unit,
    onRemove: () -> Unit,
) {
    var name by remember { mutableStateOf(power.name) }
    var description by remember { mutableStateOf(power.description) }
    var mpCost by remember { mutableStateOf(power.mpCost?.toString() ?: "") }
    var target by remember { mutableStateOf(power.target) }
    var testReminder by remember { mutableStateOf(power.testReminder.orEmpty()) }
    var onSuccess by remember { mutableStateOf(power.onSuccess.orEmpty()) }
    var onFailure by remember { mutableStateOf(power.onFailure.orEmpty()) }
    var confirmRemoval by remember { mutableStateOf(false) }

    OutlinedCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(power.name, style = MaterialTheme.typography.titleSmall)
            OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Nome") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = description, onValueChange = { description = it }, label = { Text("Descrição") }, modifier = Modifier.fillMaxWidth())
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = mpCost, onValueChange = { mpCost = it.filter { ch -> ch.isDigit() } }, label = { Text("PM") }, modifier = Modifier.weight(1f))
                OutlinedTextField(value = target, onValueChange = { target = it }, label = { Text("Alvo") }, modifier = Modifier.weight(1f))
            }
            OutlinedTextField(value = testReminder, onValueChange = { testReminder = it }, label = { Text("Lembrete") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = onSuccess, onValueChange = { onSuccess = it }, label = { Text("Sucesso") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = onFailure, onValueChange = { onFailure = it }, label = { Text("Falha") }, modifier = Modifier.fillMaxWidth())
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = {
                    onUpdate(
                        com.mestre3dt.data.Power(
                            name = name.ifBlank { power.name },
                            description = description.ifBlank { power.description },
                            mpCost = mpCost.toIntOrNull(),
                            target = target.ifBlank { power.target },
                            testReminder = testReminder.ifBlank { null },
                            onSuccess = onSuccess.ifBlank { null },
                            onFailure = onFailure.ifBlank { null }
                        )
                    )
                }, modifier = Modifier.weight(1f)) { Text("Atualizar poder") }

                OutlinedButton(onClick = { confirmRemoval = !confirmRemoval }, modifier = Modifier.weight(1f)) {
                    Text(if (confirmRemoval) "Confirmar remoção" else "Remover")
                }
            }
            if (confirmRemoval) {
                OutlinedButton(onClick = onRemove, modifier = Modifier.fillMaxWidth()) { Text("Remover poder agora") }
            }
        }
    }
}

@Composable
private fun EmptyStateCard(text: String) {
    OutlinedCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(text, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
private fun SoundScreen(
    soundScenes: List<SoundScene>,
    activeIndex: Int,
    isPlaying: Boolean,
    preferences: com.mestre3dt.data.SoundPreferences,
    onSelect: (Int) -> Unit,
    onTogglePlay: () -> Unit,
    onSetBackground: (Int, com.mestre3dt.data.SoundAsset) -> Unit,
    onAddEffect: (Int, com.mestre3dt.data.SoundEffect) -> Unit,
    onPreferencesChanged: (Float, Float, Boolean) -> Unit
) {
    val context = LocalContext.current
    val backgroundPlayer = remember { ExoPlayer.Builder(context).build() }
    DisposableEffect(backgroundPlayer) {
        onDispose { backgroundPlayer.release() }
    }

    val effectPlayer: (Uri) -> Unit = remember {
        { uri ->
            MediaPlayer.create(context, uri)?.apply {
                setVolume(preferences.effectsVolume, preferences.effectsVolume)
                setOnCompletionListener { release() }
                start()
            }
        }
    }

    LaunchedEffect(activeIndex, soundScenes, isPlaying) {
        val scene = soundScenes.getOrNull(activeIndex)
        val bgUri = scene?.background?.uri
        if (bgUri != null) {
            backgroundPlayer.setMediaItem(MediaItem.fromUri(bgUri))
            backgroundPlayer.prepare()
            backgroundPlayer.volume = preferences.backgroundVolume
            if (isPlaying) backgroundPlayer.play() else backgroundPlayer.pause()
        } else {
            backgroundPlayer.stop()
        }
    }

    LaunchedEffect(preferences.backgroundVolume, preferences.duckOnFocusLoss) {
        backgroundPlayer.volume = preferences.backgroundVolume
        backgroundPlayer.audioAttributes = backgroundPlayer.audioAttributes.buildUpon()
            .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
            .setUsage(C.USAGE_MEDIA)
            .build()
        backgroundPlayer.playWhenReady = isPlaying
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text("Painel de som local", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    SectionTitle("Preferências de áudio")
                    Text("Volume da trilha")
                    Slider(
                        value = preferences.backgroundVolume,
                        onValueChange = { onPreferencesChanged(it, preferences.effectsVolume, preferences.duckOnFocusLoss) },
                        valueRange = 0f..1f
                    )
                    Text("Volume dos efeitos")
                    Slider(
                        value = preferences.effectsVolume,
                        onValueChange = { onPreferencesChanged(preferences.backgroundVolume, it, preferences.duckOnFocusLoss) },
                        valueRange = 0f..1f
                    )
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Checkbox(
                            checked = preferences.duckOnFocusLoss,
                            onCheckedChange = { onPreferencesChanged(preferences.backgroundVolume, preferences.effectsVolume, it) }
                        )
                        Text("Reduzir volume quando outro app tocar áudio")
                    }
                }
            }
        }
        items(soundScenes.size) { index ->
            val scene = soundScenes[index]
            val backgroundPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
                if (uri != null) {
                    context.contentResolver.takePersistableUriPermission(
                        uri,
                        Intent.FLAG_GRANT_READ_URI_PERMISSION
                    )
                    onSetBackground(index, com.mestre3dt.data.SoundAsset(name = scene.name, uri = uri.toString()))
                }
            }

            val effectPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
                if (uri != null) {
                    context.contentResolver.takePersistableUriPermission(
                        uri,
                        Intent.FLAG_GRANT_READ_URI_PERMISSION
                    )
                    onAddEffect(index, com.mestre3dt.data.SoundEffect(name = "SFX ${scene.effects.size + 1}", uri = uri.toString()))
                }
            }
            OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(scene.name, style = MaterialTheme.typography.titleSmall)
                            Text(
                                "Trilha: ${scene.background?.name ?: "selecione um arquivo"}",
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                        OutlinedButton(onClick = { onSelect(index) }) {
                            Text(if (activeIndex == index) "Ativa" else "Ativar")
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(onClick = { backgroundPicker.launch(arrayOf("audio/*")) }) {
                            Text("Escolher trilha")
                        }
                        OutlinedButton(onClick = { effectPicker.launch(arrayOf("audio/*")) }) {
                            Text("Adicionar SFX")
                        }
                    }
                    if (scene.effects.isNotEmpty()) {
                        Text("Efeitos:", style = MaterialTheme.typography.labelLarge)
                        scene.effects.forEach { effect ->
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    "• ${effect.name} ${if (effect.uri == null) "(selecionar arquivo)" else ""}",
                                    style = MaterialTheme.typography.bodySmall,
                                    modifier = Modifier.weight(1f)
                                )
                                OutlinedButton(onClick = {
                                    effect.uri?.let { effectPlayer(Uri.parse(it)) }
                                }, enabled = effect.uri != null) {
                                    Text("Tocar")
                                }
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    OutlinedButton(onClick = onTogglePlay, enabled = scene.background?.uri != null) {
                        Text(
                            when {
                                scene.background?.uri == null -> "Selecione uma trilha"
                                isPlaying && activeIndex == index -> "Pausar trilha"
                                else -> "Tocar trilha"
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SectionTitle(title: String) {
    Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
}

@Composable
private fun ErrorBanner(message: String) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text("Algo deu errado", style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.onErrorContainer)
            Text(message, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onErrorContainer)
        }
    }
}

@Composable
private fun QuickActionsRow(
    isSessionActive: Boolean,
    sessionName: String,
    onStart: () -> Unit,
    onEnd: () -> Unit,
    onResetEncounter: () -> Unit,
    encounterAvailable: Boolean
) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(vertical = 8.dp)) {
        AssistChip(
            onClick = onStart,
            enabled = !isSessionActive,
            label = { Text("Iniciar sessão") },
            leadingIcon = {
                Icon(Icons.Default.ListAlt, contentDescription = "Iniciar ${sessionName}")
            }
        )
        AssistChip(
            onClick = onEnd,
            enabled = isSessionActive,
            label = { Text("Encerrar sessão") },
            leadingIcon = {
                Icon(Icons.Default.Shield, contentDescription = "Encerrar ${sessionName}")
            }
        )
        AssistChip(
            onClick = onResetEncounter,
            enabled = encounterAvailable,
            label = { Text("Reset encontro") },
            leadingIcon = {
                Icon(Icons.Default.People, contentDescription = "Reiniciar encontro")
            },
            colors = AssistChipDefaults.assistChipColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant,
                labelColor = MaterialTheme.colorScheme.onSurface
            )
        )
    }
}

private fun previewEncounter() = sampleEnemies.take(2).mapIndexed { index, enemy ->
    EncounterEnemyState(
        id = "preview-$index",
        label = "${enemy.name} #${index + 1}",
        enemy = enemy,
        currentHp = enemy.currentHp,
        currentMp = enemy.currentMp,
        isDown = false
    )
}

private fun previewState() = AppUiState(
    campaigns = sampleCampaigns,
    npcs = sampleNpcs,
    enemies = sampleEnemies,
    soundScenes = sampleSoundScenes,
    sessionNotes = listOf(SessionNote("Grupo conversou com Rina.", true)),
    sessionSummaries = listOf(
        SessionSummary(
            sessionName = "Sessão 1",
            startedAt = System.currentTimeMillis() - 3_600_000,
            endedAt = System.currentTimeMillis() - 1_800_000,
            campaignTitle = sampleCampaigns.first().title,
            arcTitle = sampleCampaigns.first().arcs.first().title,
            sceneName = sampleCampaigns.first().arcs.first().scenes.first().name,
            importantNotes = listOf("Acordo com o tecnomante"),
            defeatedEnemies = listOf("Capanga 1"),
            timestamp = System.currentTimeMillis()
        )
    ),
    activeSession = ActiveSession("Sessão atual", System.currentTimeMillis() - 1_000_000, scenesVisited = listOf("Chegada à Cidade")),
    activeCampaignIndex = 0,
    activeArcIndex = 0,
    activeSceneIndex = 0,
    encounter = previewEncounter(),
    activeSoundSceneIndex = 0,
    isSoundPlaying = false,
    soundPreferences = SoundPreferences(),
    isLoading = false
)

@Preview(showBackground = true)
@Composable
private fun DashboardPreview() {
    Mestre3DTTheme {
        DashboardScreen(uiState = previewState(), onPushSync = {}, onPullSync = {})
    }
}

@Preview(showBackground = true)
@Composable
private fun SessionPreview() {
    Mestre3DTTheme {
        SessionScreen(
            uiState = previewState(),
            onAdjustHp = { _, _ -> },
            onAdjustMp = { _, _ -> },
            onToggleDown = {},
            onRemoveEnemy = {},
            onAddNote = { _, _ -> },
            onAddTrigger = { _, _, _, _ -> },
            onUpdateTrigger = { _, _, _, _, _ -> },
            onRemoveTrigger = { _, _, _, _ -> },
            onStartSession = {},
            onEndSession = {},
            onResetEncounter = {}
        )
    }
}

@Preview(showBackground = true)
@Composable
private fun CampaignsPreview() {
    Mestre3DTTheme {
        CampaignsScreen(
            uiState = previewState(),
            onAddCampaign = {},
            onAddArc = { _, _ -> },
            onAddScene = { _, _, _ -> },
            onSetActiveCampaign = {},
            onSetActiveArc = {},
            onSetActiveScene = {}
        )
    }
}

@Preview(showBackground = true)
@Composable
private fun NpcsPreview() {
    Mestre3DTTheme {
        NpcsScreen(npcs = previewState().npcs, onAddTrigger = { _, _ -> }, onUpdateTrigger = { _, _, _ -> }, onRemoveTrigger = { _, _ -> })
    }
}

@Preview(showBackground = true)
@Composable
private fun EnemiesPreview() {
    Mestre3DTTheme {
        EnemiesScreen(
            enemies = previewState().enemies,
            onAddEnemy = {},
            onUpdateEnemy = { _, _ -> },
            onRemoveEnemy = {},
            onAddPower = { _, _ -> },
            onUpdatePower = { _, _, _ -> },
            onRemovePower = { _, _ -> },
            onAddInstance = { _, _ -> },
            onReset = {}
        )
    }
}

@Preview(showBackground = true)
@Composable
private fun SoundPreview() {
    Mestre3DTTheme {
        SoundScreen(
            soundScenes = previewState().soundScenes,
            activeIndex = 0,
            isPlaying = false,
            preferences = SoundPreferences(),
            onSelect = {},
            onTogglePlay = {},
            onSetBackground = { _, _ -> },
            onAddEffect = { _, _ -> },
            onPreferencesChanged = {}
        )
    }
}
