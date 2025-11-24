package com.mestre3dt.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.mestre3dt.data.Enemy

@Composable
fun EnemiesScreen(
    enemies: List<Enemy>,
    onAddInstance: (Enemy, Int) -> Unit,
    onReset: () -> Unit,
    onEditEnemy: (Enemy, Enemy) -> Unit
) {
    val quantities = remember { mutableStateMapOf<String, String>() }
    var editingEnemy by remember { mutableStateOf<Enemy?>(null) }

    if (editingEnemy != null) {
        EditEnemyDialog(
            enemy = editingEnemy!!,
            onDismiss = { editingEnemy = null },
            onConfirm = { updated ->
                onEditEnemy(editingEnemy!!, updated)
                editingEnemy = null
            }
        )
    }

    var showResetConfirmation by remember { mutableStateOf(false) }

    if (showResetConfirmation) {
        DeleteConfirmationDialog(
            title = "Resetar Encontro",
            message = "Tem certeza que deseja remover todos os inimigos do combate atual?",
            onConfirm = {
                onReset()
                showResetConfirmation = false
            },
            onDismiss = { showResetConfirmation = false }
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Gerenciador de Inimigos", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                OutlinedButton(onClick = { showResetConfirmation = true }) { Text("Reset encontro") }
            }
        }

        if (enemies.isEmpty()) {
            item {
                OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                    Column(
                        modifier = Modifier.padding(32.dp).fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(Icons.Default.Warning, contentDescription = "Ícone de alerta", modifier = Modifier.size(48.dp), tint = MaterialTheme.colorScheme.error)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Nenhum inimigo criado", style = MaterialTheme.typography.titleMedium)
                        Text("Adicione ameaças para o combate!", style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }

        items(enemies) { enemy ->
            val key = enemy.name
            val qtyText = quantities[key] ?: "1"
            OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(enemy.name, style = MaterialTheme.typography.titleSmall, modifier = Modifier.weight(1f))
                        TextButton(onClick = { editingEnemy = enemy }) { Text("Editar") }
                    }
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
fun EditEnemyDialog(enemy: Enemy, onDismiss: () -> Unit, onConfirm: (Enemy) -> Unit) {
    var name by remember { mutableStateOf(enemy.name) }
    var tags by remember { mutableStateOf(enemy.tags.joinToString(", ")) }
    var strength by remember { mutableStateOf(enemy.attributes.strength.toString()) }
    var skill by remember { mutableStateOf(enemy.attributes.skill.toString()) }
    var resistance by remember { mutableStateOf(enemy.attributes.resistance.toString()) }
    var armor by remember { mutableStateOf(enemy.attributes.armor.toString()) }
    var firepower by remember { mutableStateOf(enemy.attributes.firepower.toString()) }
    var maxHp by remember { mutableStateOf(enemy.maxHp.toString()) }
    var maxMp by remember { mutableStateOf((enemy.maxMp ?: 0).toString()) }

    androidx.compose.material3.AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Editar Inimigo") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Nome") })
                OutlinedTextField(value = tags, onValueChange = { tags = it }, label = { Text("Tags (separadas por vírgula)") })
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    OutlinedTextField(value = strength, onValueChange = { strength = it }, label = { Text("F") }, modifier = Modifier.weight(1f))
                    OutlinedTextField(value = skill, onValueChange = { skill = it }, label = { Text("H") }, modifier = Modifier.weight(1f))
                    OutlinedTextField(value = resistance, onValueChange = { resistance = it }, label = { Text("R") }, modifier = Modifier.weight(1f))
                }
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    OutlinedTextField(value = armor, onValueChange = { armor = it }, label = { Text("A") }, modifier = Modifier.weight(1f))
                    OutlinedTextField(value = firepower, onValueChange = { firepower = it }, label = { Text("PdF") }, modifier = Modifier.weight(1f))
                }
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    OutlinedTextField(value = maxHp, onValueChange = { maxHp = it }, label = { Text("PV Max") }, modifier = Modifier.weight(1f))
                    OutlinedTextField(value = maxMp, onValueChange = { maxMp = it }, label = { Text("PM Max") }, modifier = Modifier.weight(1f))
                }
            }
        },
        confirmButton = {
            TextButton(onClick = {
                val updatedAttributes = com.mestre3dt.data.Attributes(
                    strength = strength.toIntOrNull() ?: 0,
                    skill = skill.toIntOrNull() ?: 0,
                    resistance = resistance.toIntOrNull() ?: 0,
                    armor = armor.toIntOrNull() ?: 0,
                    firepower = firepower.toIntOrNull() ?: 0
                )
                onConfirm(
                    enemy.copy(
                        name = name,
                        tags = tags.split(",").map { it.trim() }.filter { it.isNotBlank() },
                        attributes = updatedAttributes,
                        maxHp = maxHp.toIntOrNull() ?: 1,
                        currentHp = maxHp.toIntOrNull() ?: 1,
                        maxMp = maxMp.toIntOrNull() ?: 0,
                        currentMp = maxMp.toIntOrNull() ?: 0
                    )
                )
            }) { Text("Salvar") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}
