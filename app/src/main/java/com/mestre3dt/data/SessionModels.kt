package com.mestre3dt.data

data class EncounterEnemyState(
    val enemy: Enemy,
    val currentHp: Int,
    val currentMp: Int?,
    val isDown: Boolean
)
