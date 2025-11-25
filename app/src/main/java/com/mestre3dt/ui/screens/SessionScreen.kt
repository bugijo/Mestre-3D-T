package com.mestre3dt.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Note
import androidx.compose.material.icons.filled.Swords
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.mestre3dt.ui.AppUiState

@Composable
fun SessionScreen(
    uiState: AppUiState,
    onAdjustHp: (Int, Int) -> Unit,
    onAdjustMp: (Int, Int) -> Unit,
    onToggleDown: (Int) -> Unit,
    onRemoveEnemy: (Int) -> Unit,
    onAddNote: (String, Boolean) -> Unit,
    onAddTrigger: (Int, Int, Int, com.mestre3dt.data.RollTrigger) -> Unit,
    onEditTrigger: (Int, Int, Int, Int, com.mestre3dt.data.RollTrigger) -> Unit,
    onRemoveTrigger: (Int, Int, Int, Int) -> Unit,
    onStartSession: (String) -> Unit,
    onEndSession: () -> Unit
) {
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("Combate", "Mapa", "Notas")

    val activeCampaign = uiState.campaigns.getOrNull(uiState.activeCampaignIndex)
    val activeArc = activeCampaign?.arcs?.getOrNull(uiState.activeArcIndex)
    val activeScene = activeArc?.scenes?.getOrNull(uiState.activeSceneIndex)

    Column(modifier = Modifier.fillMaxSize()) {
        // Header com nome da cena
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = MaterialTheme.colorScheme.primaryContainer,
            tonalElevation = 3.dp
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = activeScene?.name ?: "Nenhuma cena ativa",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )
                if (activeCampaign != null) {
                    Text(
                        text = "${activeCampaign.title} • ${activeArc?.title ?: ""}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                    )
                }
            }
        }

        // Tabs
        TabRow(selectedTabIndex = selectedTab) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTab == index,
                    onClick = { selectedTab = index },
                    text = { Text(title) },
                    icon = {
                        Icon(
                            when (index) {
                                0 -> Icons.Default.Swords
                                1 -> Icons.Default.Map
                                else -> Icons.Default.Note
                            },
                            contentDescription = title
                        )
                    }
                )
            }
        }

        // Content
        Box(modifier = Modifier.weight(1f)) {
            when (selectedTab) {
                0 -> CombatTab(
                    encounter = uiState.encounter,
                    onAdjustHp = onAdjustHp,
                    onAdjustMp = onAdjustMp,
                    onToggleDown = onToggleDown,
                    onRemoveEnemy = onRemoveEnemy
                )
                1 -> MapTab(mapUri = activeScene?.mapImageUri)
                2 -> NotesTab(scene = activeScene)
            }
        }

        // Footer com mini-player
        if (uiState.soundScenes.isNotEmpty()) {
            MiniSoundPlayer(
                isPlaying = uiState.isSoundPlaying,
                currentTrack = activeScene?.suggestedMusicUri ?: "Sem música"
            )
        }
    }
}

@Composable
fun CombatTab(
    encounter: List<com.mestre3dt.data.EncounterEnemyState>,
    onAdjustHp: (Int, Int) -> Unit,
    onAdjustMp: (Int, Int) -> Unit,
    onToggleDown: (Int) -> Unit,
    onRemoveEnemy: (Int) -> Unit
) {
    if (encounter.isEmpty()) {
        Column(
            modifier = Modifier.fillMaxSize().padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                "Nenhum inimigo no encontro",
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "Adicione inimigos na aba 'Combate'",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            itemsIndexed(encounter) { index, enemy ->
                EnemyCombatCard(
                    enemy = enemy,
                    onAdjustHp = { delta -> onAdjustHp(index, delta) },
                    onAdjustMp = { delta -> onAdjustMp(index, delta) },
                    onToggleDown = { onToggleDown(index) },
                    onRemove = { onRemoveEnemy(index) }
                )
            }
        }
    }
}

@Composable
fun EnemyCombatCard(
    enemy: com.mestre3dt.data.EncounterEnemyState,
    onAdjustHp: (Int) -> Unit,
    onAdjustMp: (Int) -> Unit,
    onToggleDown: () -> Unit,
    onRemove: () -> Unit
) {
    OutlinedCard(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.outlinedCardColors(
            containerColor = if (enemy.isDown)
                MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.3f)
            else
                MaterialTheme.colorScheme.surface
        )
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    enemy.label,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                if (enemy.isDown) {
                    AssistChip(onClick = {}, label = { Text("💀 Down") })
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // HP Bar
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("PV: ${enemy.currentHp}/${enemy.enemy.maxHp}", style = MaterialTheme.typography.bodySmall)
                    Text("${(enemy.currentHp.toFloat() / enemy.enemy.maxHp * 100).toInt()}%", style = MaterialTheme.typography.bodySmall)
                }
                LinearProgressIndicator(
                    progress = (enemy.currentHp.toFloat() / enemy.enemy.maxHp).coerceIn(0f, 1f),
                    modifier = Modifier.fillMaxWidth().height(8.dp),
                    color = when {
                        enemy.currentHp <= 0 -> MaterialTheme.colorScheme.error
                        enemy.currentHp < enemy.enemy.maxHp / 3 -> MaterialTheme.colorScheme.error
                        enemy.currentHp < enemy.enemy.maxHp / 2 -> MaterialTheme.colorScheme.tertiary
                        else -> MaterialTheme.colorScheme.primary
                    }
                )
            }

            // MP Bar (if exists)
            if (enemy.enemy.maxMp != null && enemy.enemy.maxMp > 0) {
                Spacer(modifier = Modifier.height(4.dp))
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("PM: ${enemy.currentMp ?: 0}/${enemy.enemy.maxMp}", style = MaterialTheme.typography.bodySmall)
                    }
                    LinearProgressIndicator(
                        progress = ((enemy.currentMp ?: 0).toFloat() / enemy.enemy.maxMp!!).coerceIn(0f, 1f),
                        modifier = Modifier.fillMaxWidth().height(8.dp),
                        color = MaterialTheme.colorScheme.secondary
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Action buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(onClick = { onAdjustHp(-5) }, modifier = Modifier.weight(1f)) {
                    Text("-5 PV")
                }
                Button(onClick = { onAdjustHp(-1) }, modifier = Modifier.weight(1f)) {
                    Text("-1 PV")
                }
                OutlinedButton(onClick = onToggleDown, modifier = Modifier.weight(1f)) {
                    Text(if (enemy.isDown) "Reviver" else "Down")
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (enemy.enemy.maxMp != null && enemy.enemy.maxMp > 0) {
                    Button(onClick = { onAdjustMp(-2) }, modifier = Modifier.weight(1f)) {
                        Text("-2 PM")
                    }
                    Button(onClick = { onAdjustMp(-1) }, modifier = Modifier.weight(1f)) {
                        Text("-1 PM")
                    }
                }
                OutlinedButton(
                    onClick = onRemove,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Text("Remover")
                }
            }
        }
    }
}

@Composable
fun MapTab(mapUri: String?) {
    if (mapUri == null) {
        Column(
            modifier = Modifier.fillMaxSize().padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                Icons.Default.Map,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.5f)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                "Sem mapa para esta cena",
                style = MaterialTheme.typography.titleMedium
            )
            Text(
                "Adicione um mapa ao editar a cena",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
        }
    } else {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Visualizador de Mapa: $mapUri")
            // TODO: Implementar AsyncImage com Coil e pinch-to-zoom
        }
    }
}

@Composable
fun NotesTab(scene: com.mestre3dt.data.Scene?) {
    if (scene == null) {
        Column(
            modifier = Modifier.fillMaxSize().padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text("Nenhuma cena ativa", style = MaterialTheme.typography.titleMedium)
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                OutlinedCard {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("Objetivo", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                        Text(scene.objective)
                    }
                }
            }

            item {
                OutlinedCard {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("Opening", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                        Text(scene.opening)
                    }
                }
            }

            if (scene.hooks.isNotEmpty()) {
                item {
                    OutlinedCard {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("Ganchos", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                            scene.hooks.forEach { hook ->
                                Row {
                                    Text("• ", fontWeight = FontWeight.Bold)
                                    Text(hook)
                                }
                            }
                        }
                    }
                }
            }

            if (scene.triggers.isNotEmpty()) {
                item {
                    OutlinedCard {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Text("Gatilhos de Rolagem", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                            scene.triggers.forEach { trigger ->
                                Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
                                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                        Text(trigger.situation, fontWeight = FontWeight.SemiBold)
                                        Text("${trigger.testType} (${trigger.attribute}) - Dificuldade ${trigger.difficulty}", style = MaterialTheme.typography.bodySmall)
                                        Text("✓ Sucesso: ${trigger.onSuccess}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                                        Text("✗ Falha: ${trigger.onFailure}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
                                    }
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
fun MiniSoundPlayer(isPlaying: Boolean, currentTrack: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.surfaceVariant,
        tonalElevation = 2.dp
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                contentDescription = null,
                modifier = Modifier.size(24.dp)
            )
            Text(
                currentTrack,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.weight(1f)
            )
            IconButton(onClick = {}) {
                Text("⚔️")
            }
            IconButton(onClick = {}) {
                Text("🔮")
            }
        }
    }
}
