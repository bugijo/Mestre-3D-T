package com.mestre3dt.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.mestre3dt.data.Npc
import com.mestre3dt.data.RollTrigger
import com.mestre3dt.ui.components.NpcCard

@Composable
fun NpcsScreen(
    npcs: List<Npc>,
    onAddTrigger: (Int, RollTrigger) -> Unit,
    onEditTrigger: (Int, Int, RollTrigger) -> Unit,
    onRemoveTrigger: (Int, Int) -> Unit
) {
    var triggerToRemove by remember { mutableStateOf<Pair<Int, Int>?>(null) }

    if (triggerToRemove != null) {
        DeleteConfirmationDialog(
            message = "Remover este gatilho do NPC?",
            onConfirm = {
                onRemoveTrigger(triggerToRemove!!.first, triggerToRemove!!.second)
                triggerToRemove = null
            },
            onDismiss = { triggerToRemove = null }
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text("Gerenciador de NPCs", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }

        if (npcs.isEmpty()) {
            item {
                OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                    Column(
                        modifier = Modifier.padding(32.dp).fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(Icons.Default.Person, contentDescription = "Ícone de NPC", modifier = Modifier.size(48.dp), tint = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Nenhum NPC cadastrado", style = MaterialTheme.typography.titleMedium)
                        Text("Crie personagens para sua história!", style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }

        itemsIndexed(npcs) { index, npc ->
            NpcCard(
                npc = npc,
                onAddTrigger = { trigger -> onAddTrigger(index, trigger) },
                onEditTrigger = { triggerIndex, trigger -> onEditTrigger(index, triggerIndex, trigger) },
                onRemoveTrigger = { triggerIndex -> triggerToRemove = index to triggerIndex }
            )
        }
    }
}
