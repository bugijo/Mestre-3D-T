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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.mestre3dt.data.Arc
import com.mestre3dt.data.Campaign
import com.mestre3dt.data.Scene
import com.mestre3dt.ui.AppUiState

@Composable
fun CampaignsScreen(
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
            Text("Gerenciador de Campanhas", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }

        if (uiState.campaigns.isEmpty()) {
            item {
                OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                    Column(
                        modifier = Modifier.padding(32.dp).fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(Icons.Default.Campaign, contentDescription = "Ícone de campanha", modifier = Modifier.size(48.dp), tint = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Nenhuma campanha criada", style = MaterialTheme.typography.titleMedium)
                        Text("Crie sua primeira aventura abaixo!", style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }

        item {
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
