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
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.mestre3dt.data.Attributes
import com.mestre3dt.data.Enemy
import com.mestre3dt.ui.AppUiState
import java.util.UUID

@Composable
fun EnemiesScreen(
    uiState: AppUiState,
    onAddEnemy: (Enemy) -> Unit,
    onUpdateEnemy: (String, Enemy) -> Unit,
    onDeleteEnemy: (String) -> Unit,
    onAddToEncounter: (Enemy, Int) -> Unit,
    onResetEncounter: () -> Unit
) {
    var showDialog by remember { mutableStateOf(false) }
    var editingEnemy by remember { mutableStateOf<Enemy?>(null) }
    var showDeleteConfirm by remember { mutableStateOf<String?>(null) }
    var showResetConfirm by remember { mutableStateOf(false) }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    editingEnemy = null
                    showDialog = true
                }
            ) {
                Icon(Icons.Default.Add, "Adicionar Inimigo")
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
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Gerenciador de Inimigos",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                OutlinedButton(onClick = { showResetConfirm = true }) {
                    Text("Reset Encontro")
                }
            }

            if (uiState.enemies.isEmpty()) {
                OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                    Column(
                        modifier = Modifier.padding(32.dp).fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            Icons.Default.Warning,
                            contentDescription = null,
                            modifier = Modifier.size(48.dp),
                            tint = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Nenhum inimigo criado", style = MaterialTheme.typography.titleMedium)
                        Text("Adicione ameaças para o combate!", style = MaterialTheme.typography.bodyMedium)
                    }
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(uiState.enemies, key = { it.id }) { enemy ->
                        EnemyCard(
                            enemy = enemy,
                            onEdit = {
                                editingEnemy = enemy
                                showDialog = true
                            },
                            onDelete = { showDeleteConfirm = enemy.id },
                            onAddToEncounter = onAddToEncounter
                        )
                    }
                }
            }
        }
    }

    if (showDialog) {
        AddEditEnemyDialog(
            enemy = editingEnemy,
            onDismiss = { showDialog = false },
            onSave = { enemy ->
                if (editingEnemy != null) {
                    onUpdateEnemy(editingEnemy!!.id, enemy)
                } else {
                    onAddEnemy(enemy)
                }
                showDialog = false
            }
        )
    }

    if (showDeleteConfirm != null) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = null },
            title = { Text("Excluir Inimigo") },
            text = { Text("Tem certeza que deseja excluir este inimigo?") },
            confirmButton = {
                TextButton(onClick = {
                    onDeleteEnemy(showDeleteConfirm!!)
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

    if (showResetConfirm) {
        AlertDialog(
            onDismissRequest = { showResetConfirm = false },
            title = { Text("Reset Encontro") },
            text = { Text("Tem certeza que deseja remover todos os inimigos do combate atual?") },
            confirmButton = {
                TextButton(onClick = {
                    onResetEncounter()
                    showResetConfirm = false
                }) {
                    Text("Reset")
                }
            },
            dismissButton = {
                TextButton(onClick = { showResetConfirm = false }) {
                    Text("Cancelar")
                }
            }
        )
    }
}

@Composable
fun EnemyCard(
    enemy: Enemy,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onAddToEncounter: (Enemy, Int) -> Unit
) {
    var quantity by remember { mutableStateOf("1") }

    OutlinedCard {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(enemy.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text(
                        enemy.tags.joinToString(", "),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary
                    )
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
                "F${enemy.attributes.strength} H${enemy.attributes.skill} R${enemy.attributes.resistance} A${enemy.attributes.armor} PdF${enemy.attributes.firepower}",
                style = MaterialTheme.typography.bodySmall
            )
            Text(
                "PV: ${enemy.currentHp}/${enemy.maxHp}${enemy.maxMp?.let { " | PM: ${enemy.currentMp}/$it" } ?: ""}",
                style = MaterialTheme.typography.bodySmall
            )

            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = quantity,
                    onValueChange = { if (it.all { c -> c.isDigit() }) quantity = it },
                    label = { Text("Qtd") },
                    modifier = Modifier.weight(1f)
                )
                Button(onClick = {
                    val qty = quantity.toIntOrNull() ?: 1
                    onAddToEncounter(enemy, qty)
                }) {
                    Text("Adicionar ao Encontro")
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditEnemyDialog(
    enemy: Enemy?,
    onDismiss: () -> Unit,
    onSave: (Enemy) -> Unit
) {
    var name by remember { mutableStateOf(enemy?.name ?: "") }
    var tags by remember { mutableStateOf(enemy?.tags?.joinToString(", ") ?: "") }
    var strength by remember { mutableStateOf(enemy?.attributes?.strength ?: 0) }
    var skill by remember { mutableStateOf(enemy?.attributes?.skill ?: 0) }
    var resistance by remember { mutableStateOf(enemy?.attributes?.resistance ?: 0) }
    var armor by remember { mutableStateOf(enemy?.attributes?.armor ?: 0) }
    var firepower by remember { mutableStateOf(enemy?.attributes?.firepower ?: 0) }
    var maxHp by remember { mutableStateOf(enemy?.maxHp?.toString() ?: (resistance * 5).toString()) }
    var maxMp by remember { mutableStateOf(enemy?.maxMp?.toString() ?: "") }

    Dialog(onDismissRequest = onDismiss) {
        Card {
            Column(
                modifier = Modifier.padding(16.dp).verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nome") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = tags,
                    onValueChange = { tags = it },
                    label = { Text("Tags (separadas por vírgula)") },
                    modifier = Modifier.fillMaxWidth()
                )

                Text("Atributos 3D&T", fontWeight = FontWeight.Bold)

                AttributeSlider("Força (F)", strength, onValueChange = { strength = it })
                AttributeSlider("Habilidade (H)", skill, onValueChange = { skill = it })
                AttributeSlider("Resistência (R)", resistance, onValueChange = {
                    resistance = it
                    maxHp = (it * 5).toString()
                })
                AttributeSlider("Armadura (A)", armor, onValueChange = { armor = it })
                AttributeSlider("Poder de Fogo (PdF)", firepower, onValueChange = { firepower = it })

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = maxHp,
                        onValueChange = { if (it.all { c -> c.isDigit() }) maxHp = it },
                        label = { Text("PV Máximo") },
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = maxMp,
                        onValueChange = { if (it.all { c -> c.isDigit() } || it.isEmpty()) maxMp = it },
                        label = { Text("PM Máximo") },
                        modifier = Modifier.weight(1f)
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(onClick = onDismiss, modifier = Modifier.weight(1f)) {
                        Text("Cancelar")
                    }
                    Button(
                        onClick = {
                            val hpValue = maxHp.toIntOrNull() ?: 10
                            val mpValue = maxMp.toIntOrNull()
                            val newEnemy = Enemy(
                                id = enemy?.id ?: UUID.randomUUID().toString(),
                                name = name,
                                tags = tags.split(",").map { it.trim() }.filter { it.isNotBlank() },
                                attributes = Attributes(strength, skill, resistance, armor, firepower),
                                maxHp = hpValue,
                                currentHp = hpValue,
                                maxMp = mpValue,
                                currentMp = mpValue,
                                powers = enemy?.powers ?: emptyList()
                            )
                            onSave(newEnemy)
                        },
                        enabled = name.isNotBlank(),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Salvar")
                    }
                }
            }
        }
    }
}
