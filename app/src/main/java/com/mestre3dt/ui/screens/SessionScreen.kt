package com.mestre3dt.ui.screens

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
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.mestre3dt.data.RollTrigger
import com.mestre3dt.ui.AppUiState
import com.mestre3dt.ui.components.EncounterEnemyRow
import com.mestre3dt.ui.components.NpcCard
import com.mestre3dt.ui.components.RollTriggerCard
import com.mestre3dt.ui.components.SectionTitle

@Composable
fun SessionScreen(
    uiState: AppUiState,
    onAdjustHp: (Int, Int) -> Unit,
    onAdjustMp: (Int, Int) -> Unit,
    onToggleDown: (Int) -> Unit,
    onRemoveEnemy: (Int) -> Unit,
    onAddNote: (String, Boolean) -> Unit,
    onAddTrigger: (Int, Int, Int, RollTrigger) -> Unit,
    onEditTrigger: (Int, Int, Int, Int, RollTrigger) -> Unit,
    onRemoveTrigger: (Int, Int, Int, Int) -> Unit,
    onStartSession: (String) -> Unit,
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
                if (uiState.activeSession == null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(onClick = { onStartSession(activeCampaign.title) }) {
                        Text("Iniciar Sessão")
                    }
                } else {
                    Text(
                        text = "Sessão em andamento (Início: ${java.text.SimpleDateFormat("HH:mm").format(java.util.Date(uiState.activeSession.startTime))})",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }
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
                                            newTrigger
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
                    OutlinedButton(
                        onClick = onEndSession,
                        enabled = uiState.activeSession != null
                    ) {
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
