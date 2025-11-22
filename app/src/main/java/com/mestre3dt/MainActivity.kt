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
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
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
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
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
                                MestreTab.Dashboard -> Icon(Icons.Default.ListAlt, contentDescription = null)
                                MestreTab.Session -> Icon(Icons.Default.ListAlt, contentDescription = null)
                                MestreTab.Campaigns -> Icon(Icons.Default.Campaign, contentDescription = null)
                                MestreTab.Npcs -> Icon(Icons.Default.People, contentDescription = null)
                                MestreTab.Enemies -> Icon(Icons.Default.Shield, contentDescription = null)
                                MestreTab.Sound -> Icon(Icons.Default.MusicNote, contentDescription = null)
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
                    onRemoveTrigger = viewModel::removeTriggerFromScene,
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
                    npcs = uiState.npcs,
                    onAddTrigger = viewModel::addTriggerToNpc,
                    onRemoveTrigger = viewModel::removeTriggerFromNpc
                )
                MestreTab.Enemies -> EnemiesScreen(
                    enemies = uiState.enemies,
                    onAddInstance = viewModel::addEnemyInstance,
                    onReset = viewModel::resetEncounter
                )
                MestreTab.Sound -> SoundScreen(
                    soundScenes = uiState.soundScenes,
                    activeIndex = uiState.activeSoundSceneIndex,
                    isPlaying = uiState.isSoundPlaying,
                    onSelect = viewModel::selectSoundScene,
                    onTogglePlay = viewModel::toggleSoundPlayback,
                    onSetBackground = viewModel::setSoundBackground,
                    onAddEffect = viewModel::addSoundEffect
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
    onRemoveTrigger: (Int, Int, Int, Int) -> Unit,
    onEndSession: () -> Unit
) {
    val activeCampaign = uiState.campaigns.getOrNull(uiState.activeCampaignIndex)
    val activeArc = activeCampaign?.arcs?.getOrNull(uiState.activeArcIndex)
    val activeScene = activeArc?.scenes?.getOrNull(uiState.activeSceneIndex)
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
            } else {
                Text(
                    text = "Selecione uma campanha/cena na aba Campanhas.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.error
                )
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
                                RollTriggerCard(trigger, onRemove = {
                                    onRemoveTrigger(
                                        uiState.activeCampaignIndex,
                                        uiState.activeArcIndex,
                                        uiState.activeSceneIndex,
                                        triggerIndex
                                    )
                                })
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
                            NpcCard(npc = npc, onAddTrigger = {}, onRemoveTrigger = {})
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
                                Text(
                                    summary.sceneName ?: "Cena não definida",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    "Campanha: ${summary.campaignTitle ?: "-"} | Arco: ${summary.arcTitle ?: "-"}",
                                    style = MaterialTheme.typography.bodySmall
                                )
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
private fun RollTriggerCard(trigger: RollTrigger, onRemove: (() -> Unit)? = null) {
    var expanded by remember { mutableStateOf(false) }
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
                    RollTriggerCard(trigger) { onRemoveTrigger(index) }
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
    onRemoveTrigger: (Int, Int) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item { Text("NPCs", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold) }
        itemsIndexed(npcs) { index, npc ->
            NpcCard(
                npc = npc,
                onAddTrigger = { trigger -> onAddTrigger(index, trigger) },
                onRemoveTrigger = { triggerIndex -> onRemoveTrigger(index, triggerIndex) }
            )
        }
    }
}

@Composable
private fun EnemiesScreen(
    enemies: List<com.mestre3dt.data.Enemy>,
    onAddInstance: (com.mestre3dt.data.Enemy, Int) -> Unit,
    onReset: () -> Unit
) {
    val quantities = remember { mutableStateMapOf<String, String>() }
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Inimigos e encontros", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                OutlinedButton(onClick = onReset) { Text("Reset encontro") }
            }
        }
        items(enemies) { enemy ->
            val key = enemy.name
            val qtyText = quantities[key] ?: "1"
            OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(enemy.name, style = MaterialTheme.typography.titleSmall)
                    Text(enemy.tags.joinToString(), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                    Text(
                        "F/H/R/A/PdF ${enemy.attributes.strength}/${enemy.attributes.skill}/${enemy.attributes.resistance}/${enemy.attributes.armor}/${enemy.attributes.firepower}",
                        style = MaterialTheme.typography.bodySmall
                    )
                    Text("PV ${enemy.currentHp}/${enemy.maxHp} | PM ${enemy.currentMp ?: 0}/${enemy.maxMp ?: 0}", style = MaterialTheme.typography.bodySmall)
                    if (enemy.powers.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(4.dp))
                        enemy.powers.forEach { power ->
                            Text(power.name, fontWeight = FontWeight.SemiBold)
                            Text(power.description, style = MaterialTheme.typography.bodySmall)
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = qtyText,
                            onValueChange = { new -> quantities[key] = new.filter { it.isDigit() }.ifBlank { "" } },
                            label = { Text("Qtd no encontro") },
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedButton(onClick = {
                            val qty = qtyText.toIntOrNull() ?: 0
                            onAddInstance(enemy, qty)
                        }) {
                            Text("Adicionar")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SoundScreen(
    soundScenes: List<SoundScene>,
    activeIndex: Int,
    isPlaying: Boolean,
    onSelect: (Int) -> Unit,
    onTogglePlay: () -> Unit,
    onSetBackground: (Int, com.mestre3dt.data.SoundAsset) -> Unit,
    onAddEffect: (Int, com.mestre3dt.data.SoundEffect) -> Unit
) {
    val context = LocalContext.current
    val backgroundPlayer = remember { ExoPlayer.Builder(context).build() }
    DisposableEffect(backgroundPlayer) {
        onDispose { backgroundPlayer.release() }
    }

    val effectPlayer: (Uri) -> Unit = remember {
        { uri ->
            MediaPlayer.create(context, uri)?.apply {
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
            if (isPlaying) backgroundPlayer.play() else backgroundPlayer.pause()
        } else {
            backgroundPlayer.stop()
        }
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
