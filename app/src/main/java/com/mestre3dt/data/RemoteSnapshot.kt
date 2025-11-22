package com.mestre3dt.data

import kotlinx.serialization.Serializable

@Serializable
data class RemoteSnapshot(
    val campaigns: List<Campaign>,
    val npcs: List<Npc>,
    val enemies: List<Enemy>,
    val soundScenes: List<SoundScene>,
    val sessionNotes: List<SessionNote>,
    val sessionSummaries: List<SessionSummary>,
    val createdAt: Long = System.currentTimeMillis()
)
