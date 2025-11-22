package com.mestre3dt.data

import kotlinx.serialization.Serializable

/**
 * Snapshot completo para backups locais e remotos, incluindo estado de encontro e seleções ativas.
 */

@Serializable
data class RemoteSnapshot(
    val campaigns: List<Campaign>,
    val npcs: List<Npc>,
    val enemies: List<Enemy>,
    val soundScenes: List<SoundScene>,
    val sessionNotes: List<SessionNote>,
    val sessionSummaries: List<SessionSummary>,
    val encounter: List<EncounterEnemyState> = emptyList(),
    val activeCampaignIndex: Int = 0,
    val activeArcIndex: Int = 0,
    val activeSceneIndex: Int = 0,
    val activeSoundSceneIndex: Int = 0,
    val isSoundPlaying: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)
