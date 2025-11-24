package com.mestre3dt.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Sessão", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        // A lógica original será restaurada aqui depois.
    }
}
