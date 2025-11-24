package com.mestre3dt.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.mestre3dt.ui.AppUiState
import com.mestre3dt.ui.SyncStatus

@Composable
fun DashboardScreen(
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
