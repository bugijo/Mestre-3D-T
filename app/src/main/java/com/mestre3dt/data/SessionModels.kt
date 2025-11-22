package com.mestre3dt.data

import androidx.compose.runtime.Immutable
import kotlinx.serialization.Serializable

@Serializable
@Immutable
data class EncounterEnemyState(
    val id: String,
    val label: String,
    val enemy: Enemy,
    val currentHp: Int,
    val currentMp: Int?,
    val isDown: Boolean
)
