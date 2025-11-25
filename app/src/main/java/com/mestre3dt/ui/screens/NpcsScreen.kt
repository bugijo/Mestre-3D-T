package com.mestre3dt.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.mestre3dt.data.Attributes
import com.mestre3dt.data.Npc
import com.mestre3dt.ui.AppUiState
import java.util.UUID

@Composable
fun NpcsScreen(
    uiState: AppUiState,
    onAddNpc: (Npc) -> Unit,
    onUpdateNpc: (String, Npc) -> Unit,
    onDeleteNpc: (String) -> Unit
) {
    var showDialog by remember { mutableStateOf(false) }
    var editingNpc by remember { mutableStateOf<Npc?>(null) }
    var showDeleteConfirm by remember { mutableStateOf<String?>(null) }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    editingNpc = null
                    showDialog = true
                }
            ) {
                Icon(Icons.Default.Add, "Adicionar NPC")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                "Gerenciador de NPCs",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            if (uiState.npcs.isEmpty()) {
                OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                    Column(
                        modifier = Modifier.padding(32.dp).fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            Icons.Default.Person,
                            contentDescription = null,
                            modifier = Modifier.size(48.dp),
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Nenhum NPC cadastrado", style = MaterialTheme.typography.titleMedium)
                        Text("Crie personagens para sua história!", style = MaterialTheme.typography.bodyMedium)
                    }
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(uiState.npcs, key = { it.id }) { npc ->
                        NpcCard(
                            npc = npc,
                            onEdit = {
                                editingNpc = npc
                                showDialog = true
                            },
                            onDelete = { showDeleteConfirm = npc.id }
                        )
                    }
                }
            }
        }
    }

    if (showDialog) {
        AddEditNpcDialog(
            npc = editingNpc,
            onDismiss = { showDialog = false },
            onSave = { npc ->
                if (editingNpc != null) {
                    onUpdateNpc(editingNpc!!.id, npc)
                } else {
                    onAddNpc(npc)
                }
                showDialog = false
            }
        )
    }

    if (showDeleteConfirm != null) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = null },
            title = { Text("Excluir NPC") },
            text = { Text("Tem certeza que deseja excluir este NPC?") },
            confirmButton = {
                TextButton(onClick = {
                    onDeleteNpc(showDeleteConfirm!!)
                    showDeleteConfirm = null
                }) {
                    Text("Excluir")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = null }) {
                    Text("Cancelar")
                }
            }
        )
    }
}

@Composable
fun NpcCard(
    npc: Npc,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    OutlinedCard {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(npc.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text(npc.role, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                }
                Row {
                    IconButton(onClick = onEdit) {
                        Icon(Icons.Default.Edit, "Editar")
                    }
                    IconButton(onClick = onDelete) {
                        Icon(Icons.Default.Delete, "Excluir")
                    }
                }
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                "F${npc.attributes.strength} H${npc.attributes.skill} R${npc.attributes.resistance} A${npc.attributes.armor} PdF${npc.attributes.firepower} | PV:${npc.maxHp} PM:${npc.maxMp}",
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditNpcDialog(
    npc: Npc?,
    onDismiss: () -> Unit,
    onSave: (Npc) -> Unit
) {
    var name by remember { mutableStateOf(npc?.name ?: "") }
    var role by remember { mutableStateOf(npc?.role ?: "") }
    var strength by remember { mutableStateOf(npc?.attributes?.strength ?: 0) }
    var skill by remember { mutableStateOf(npc?.attributes?.skill ?: 0) }
    var resistance by remember { mutableStateOf(npc?.attributes?.resistance ?: 0) }
    var armor by remember { mutableStateOf(npc?.attributes?.armor ?: 0) }
    var firepower by remember { mutableStateOf(npc?.attributes?.firepower ?: 0) }

    val calculatedHp = resistance * 5
    val calculatedMp = resistance * 5

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(max = 600.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp).verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = if (npc != null) "Editar NPC" else "Novo NPC",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nome") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = role,
                    onValueChange = { role = it },
                    label = { Text("Papel (ex: Guarda, Mercador)") },
                    modifier = Modifier.fillMaxWidth()
                )

                Text("Atributos 3D&T", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)

                AttributeSlider("Força (F)", strength, onValueChange = { strength = it })
                AttributeSlider("Habilidade (H)", skill, onValueChange = { skill = it })
                AttributeSlider("Resistência (R)", resistance, onValueChange = { resistance = it })
                AttributeSlider("Armadura (A)", armor, onValueChange = { armor = it })
                AttributeSlider("Poder de Fogo (PdF)", firepower, onValueChange = { firepower = it })

                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    )
                ) {
                    Text(
                        "PV: $calculatedHp | PM: $calculatedMp",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(12.dp)
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(onClick = onDismiss, modifier = Modifier.weight(1f)) {
                        Text("Cancelar")
                    }
                    Button(
                        onClick = {
                            val newNpc = Npc(
                                id = npc?.id ?: java.util.UUID.randomUUID().toString(),
                                name = name,
                                role = role,
                                personality = npc?.personality ?: emptyList(),
                                speechStyle = npc?.speechStyle ?: "",
                                mannerisms = npc?.mannerisms ?: emptyList(),
                                goal = npc?.goal ?: "",
                                secrets = npc?.secrets ?: emptyMap(),
                                quickPhrases = npc?.quickPhrases ?: emptyList(),
                                triggers = npc?.triggers ?: emptyList(),
                                attributes = Attributes(strength, skill, resistance, armor, firepower),
                                maxHp = calculatedHp,
                                maxMp = calculatedMp
                            )
                            onSave(newNpc)
                        },
                        enabled = name.isNotBlank() && role.isNotBlank(),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Salvar")
                    }
                }
            }
        }
    }
}

@Composable
fun AttributeSlider(
    label: String,
    value: Int,
    onValueChange: (Int) -> Unit
) {
    Column {
        Text("$label: $value", style = MaterialTheme.typography.bodyMedium)
        Slider(
            value = value.toFloat(),
            onValueChange = { onValueChange(it.toInt()) },
            valueRange = 0f..10f,
            steps = 9
        )
    }
}
