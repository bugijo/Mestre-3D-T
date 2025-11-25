package com.mestre3dt.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.mestre3dt.data.Attributes
import com.mestre3dt.data.Enemy
import com.mestre3dt.ui.AppUiState

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

    Box(modifier = Modifier.fillMaxSize()) {
        // Gradient background
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color(0xFF1A1A2E),
                            Color(0xFF0F0F1E)
                        )
                    )
                )
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            //  Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Surface(
                        modifier = Modifier.size(48.dp),
                        shape = CircleShape,
                        color = Color(0xFFB71C1C).copy(alpha = 0.2f)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                Icons.Default.Shield,
                                contentDescription = null,
                                tint = Color(0xFFE53935),
                                modifier = Modifier.size(28.dp)
                            )
                        }
                    }
                    Column {
                        Text(
                            "Arsenal de Combate",
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            "${uiState.enemies.size} inimigos • ${uiState.encounter.size} em combate",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color.White.copy(alpha = 0.7f)
                        )
                    }
                }

                FilledTonalButton(
                    onClick = { showResetConfirm = true },
                    colors = ButtonDefaults.filledTonalButtonColors(
                        containerColor = Color(0xFFFF5252).copy(alpha = 0.2f),
                        contentColor = Color(0xFFFF5252)
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.Refresh, null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Reset")
                }
            }

            if (uiState.enemies.isEmpty()) {
                EmptyStateEnemies()
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(uiState.enemies, key = { it.id }) { enemy ->
                        AnimatedVisibility(
                            visible = true,
                            enter = fadeIn() + slideInHorizontally()
                        ) {
                            ModernEnemyCard(
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

        // FAB
        FloatingActionButton(
            onClick = {
                editingEnemy = null
                showDialog = true
            },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(24.dp),
            containerColor = Color(0xFFE53935),
            contentColor = Color.White,
            elevation = FloatingActionButtonDefaults.elevation(8.dp)
        ) {
            Icon(Icons.Default.Add, "Adicionar Inimigo", modifier = Modifier.size(28.dp))
        }
    }

    if (showDialog) {
        ModernEnemyDialog(
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
            icon = { Icon(Icons.Default.Warning, null, tint = MaterialTheme.colorScheme.error) },
            title = { Text("Excluir Inimigo", fontWeight = FontWeight.Bold) },
            text = { Text("Esta ação não pode ser desfeita. Deseja continuar?") },
            confirmButton = {
                Button(
                    onClick = {
                        onDeleteEnemy(showDeleteConfirm!!)
                        showDeleteConfirm = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
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
            icon = { Icon(Icons.Default.Refresh, null, tint = MaterialTheme.colorScheme.primary) },
            title = { Text("Reset Encontro", fontWeight = FontWeight.Bold) },
            text = { Text("Remover todos os inimigos do combate atual?") },
            confirmButton = {
                Button(onClick = {
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
fun EmptyStateEnemies() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White.copy(alpha = 0.05f)
        )
    ) {
        Column(
            modifier = Modifier.padding(40.dp).fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Surface(
                modifier = Modifier.size(80.dp),
                shape = CircleShape,
                color = Color(0xFFE53935).copy(alpha = 0.2f)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        Icons.Default.Warning,
                        contentDescription = null,
                        modifier = Modifier.size(40.dp),
                        tint = Color(0xFFE53935)
                    )
                }
            }
            Text(
                "Nenhum inimigo criado",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Text(
                "Adicione ameaças para o combate!",
                style = MaterialTheme.typography.bodyLarge,
                color = Color.White.copy(alpha = 0.7f)
            )
        }
    }
}

@Composable
fun ModernEnemyCard(
    enemy: Enemy,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onAddToEncounter: (Enemy, Int) -> Unit
) {
    var quantity by remember { mutableStateOf("1") }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E2E)),
        elevation = CardDefaults.elevatedCardElevation(6.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    Surface(
                        modifier = Modifier.size(56.dp),
                        shape = CircleShape,
                        color = Color(0xFFE53935).copy(alpha = 0.2f)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                Icons.Default.Shield,
                                contentDescription = null,
                                tint = Color(0xFFE53935),
                                modifier = Modifier.size(32.dp)
                            )
                        }
                    }
                    
                    Column {
                        Text(
                            enemy.name,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            enemy.tags.take(2).forEach { tag ->
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = Color(0xFFFF9800).copy(alpha = 0.2f)
                                ) {
                                    Text(
                                        tag,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Color(0xFFFFB74D),
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                                    )
                                }
                            }
                        }
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    IconButton(onClick = onEdit) {
                        Icon(Icons.Default.Edit, "Editar", tint = Color(0xFF64B5F6))
                    }
                    IconButton(onClick = onDelete) {
                        Icon(Icons.Default.Delete, "Excluir", tint = Color(0xFFE57373))
                    }
                }
            }

            // Stats
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = Color.White.copy(alpha = 0.05f)
            ) {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        EnemyAttributeChip("F", enemy.attributes.strength, Color(0xFFE53935))
                        EnemyAttributeChip("H", enemy.attributes.skill, Color(0xFF42A5F5))
                        EnemyAttributeChip("R", enemy.attributes.resistance, Color(0xFF66BB6A))
                        EnemyAttributeChip("A", enemy.attributes.armor, Color(0xFFFF9800))
                        EnemyAttributeChip("PdF", enemy.attributes.firepower, Color(0xFFAB47BC))
                    }
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Favorite, null, tint = Color(0xFF66BB6A), modifier = Modifier.size(16.dp))
                            Text("${enemy.currentHp}/${enemy.maxHp}", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold, color = Color.White)
                        }
                        enemy.maxMp?.let { maxMp ->
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.Star, null, tint = Color(0xFF42A5F5), modifier = Modifier.size(16.dp))
                                Text("${enemy.currentMp}/$maxMp", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold, color = Color.White)
                            }
                        }
                    }
                }
            }

            // Adicionar ao encontro
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = quantity,
                    onValueChange = { if (it.all { c -> c.isDigit() }) quantity = it },
                    label = { Text("Quantidade") },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color(0xFFE53935),
                        unfocusedBorderColor = Color.White.copy(alpha = 0.3f)
                    )
                )
                Button(
                    onClick = {
                        val qty = quantity.toIntOrNull() ?: 1
                        onAddToEncounter(enemy, qty)
                    },
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE53935)),
                    modifier = Modifier.weight(1.5f).height(56.dp)
                ) {
                    Icon(Icons.Default.Add, null, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Adicionar")
                }
            }
        }
    }
}

@Composable
fun EnemyAttributeChip(label: String, value: Int, color: Color) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = color.copy(alpha = 0.2f)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                label,
                style = MaterialTheme.typography.labelSmall,
                color = color,
                fontWeight = FontWeight.Bold
            )
            Text(
                value.toString(),
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ModernEnemyDialog(
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
        Card(
            modifier = Modifier.fillMaxWidth().heightIn(max = 650.dp),
            shape = RoundedCornerShape(24.dp),
            elevation = CardDefaults.elevatedCardElevation(8.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp).verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Surface(
                        modifier = Modifier.size(48.dp),
                        shape = CircleShape,
                        color = Color(0xFFE53935).copy(alpha = 0.2f)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                if (enemy != null) Icons.Default.Edit else Icons.Default.Shield,
                                contentDescription = null,
                                tint = Color(0xFFE53935)
                            )
                        }
                    }
                    Text(
                        text = if (enemy != null) "Editar Inimigo" else "Novo Inimigo",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                }

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nome do Inimigo") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp)
                )
                
                OutlinedTextField(
                    value = tags,
                    onValueChange = { tags = it },
                    label = { Text("Tags") },
                    placeholder = { Text("Ex: Goblin, Boss, Voador") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp)
                )

                Text(
                    "Atributos 3D&T",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )

                ModernAttributeSlider2("💪 Força", strength, Color(0xFFE53935)) { strength = it; maxHp = (resistance * 5).toString() }
                ModernAttributeSlider2("🎯 Habilidade", skill, Color(0xFF42A5F5)) { skill = it }
                ModernAttributeSlider2("🛡️ Resistência", resistance, Color(0xFF66BB6A)) { 
                    resistance = it
                    maxHp = (it * 5).toString()
                }
                ModernAttributeSlider2("🔰 Armadura", armor, Color(0xFFFF9800)) { armor = it }
                ModernAttributeSlider2("🔥 PdF", firepower, Color(0xFFAB47BC)) { firepower = it }

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = maxHp,
                        onValueChange = { if (it.all { c -> c.isDigit() }) maxHp = it },
                        label = { Text("PV Máximo") },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp)
                    )
                    OutlinedTextField(
                        value = maxMp,
                        onValueChange = { if (it.all { c -> c.isDigit() } || it.isEmpty()) maxMp = it },
                        label = { Text("PM Máximo") },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp)
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f).height(48.dp),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Cancelar")
                    }
                    Button(
                        onClick = {
                            val hpValue = maxHp.toIntOrNull() ?: 10
                            val mpValue = maxMp.toIntOrNull()
                            val newEnemy = Enemy(
                                id = enemy?.id ?: java.util.UUID.randomUUID().toString(),
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
                        modifier = Modifier.weight(1f).height(48.dp),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Salvar")
                    }
                }
            }
        }
    }
}

@Composable
fun ModernAttributeSlider2(
    label: String,
    value: Int,
    color: Color,
    onValueChange: (Int) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(label, style = MaterialTheme.typography.bodyLarge)
            Surface(
                shape = CircleShape,
                color = color.copy(alpha = 0.2f)
            ) {
                Text(
                    value.toString(),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = color,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                )
            }
        }
        Slider(
            value = value.toFloat(),
            onValueChange = { onValueChange(it.toInt()) },
            valueRange = 0f..10f,
            steps = 9,
            colors = SliderDefaults.colors(
                thumbColor = color,
                activeTrackColor = color,
                inactiveTrackColor = color.copy(alpha = 0.3f)
            )
        )
    }
}
