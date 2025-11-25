package com.mestre3dt.data

import androidx.compose.runtime.Immutable
import kotlinx.serialization.Serializable

@Serializable
@Immutable
data class RollTrigger(
    val situation: String,
    val testType: String,
    val attribute: String,
    val difficulty: String,
    val onSuccess: String,
    val onFailure: String
)

@Serializable
@Immutable
data class Scene(
    val name: String,
    val objective: String,
    val mood: String,
    val opening: String,
    val hooks: List<String>,
    val triggers: List<RollTrigger>,
    val mapImageUri: String? = null,
    val suggestedMusicUri: String? = null,
    val enemyIds: List<String> = emptyList()
)

@Serializable
@Immutable
data class Arc(
    val title: String,
    val scenes: List<Scene>
)

@Serializable
@Immutable
data class Campaign(
    val title: String,
    val synopsis: String,
    val genre: String,
    val system: String = "3D&T",
    val arcs: List<Arc>
)

@Serializable
@Immutable
data class Npc(
    val id: String,
    val name: String,
    val role: String,
    val personality: List<String>,
    val speechStyle: String,
    val mannerisms: List<String>,
    val goal: String,
    val secrets: Map<Int, String>,
    val quickPhrases: List<String>,
    val triggers: List<RollTrigger>,
    val imageUri: String? = null,
    val attributes: Attributes = Attributes(),
    val maxHp: Int = 0,
    val maxMp: Int = 0,
    val advantages: List<String> = emptyList(),
    val disadvantages: List<String> = emptyList()
)

@Serializable
@Immutable
data class Power(
    val name: String,
    val description: String,
    val mpCost: Int?,
    val target: String,
    val testReminder: String?,
    val onSuccess: String?,
    val onFailure: String?
)

@Serializable
@Immutable
data class Enemy(
    val id: String,
    val name: String,
    val tags: List<String>,
    val attributes: Attributes,
    val maxHp: Int,
    val currentHp: Int,
    val maxMp: Int?,
    val currentMp: Int?,
    val powers: List<Power>,
    val imageUri: String? = null
)

@Serializable
@Immutable
data class Attributes(
    val strength: Int = 0,
    val skill: Int = 0,
    val resistance: Int = 0,
    val armor: Int = 0,
    val firepower: Int = 0
)

@Serializable
@Immutable
data class SoundEffect(
    val name: String,
    val uri: String?
)

@Serializable
@Immutable
data class SoundAsset(
    val name: String,
    val uri: String?
)

@Serializable
@Immutable
data class SoundScene(
    val name: String,
    val background: SoundAsset?,
    val effects: List<SoundEffect>
)

@Serializable
@Immutable
data class SessionNote(
    val text: String,
    val important: Boolean
)

@Serializable
@Immutable
data class SessionSummary(
    val campaignTitle: String?,
    val arcTitle: String?,
    val sceneName: String?,
    val importantNotes: List<String>,
    val defeatedEnemies: List<String>,
    val timestamp: Long
)

@Serializable
@Immutable
data class SessionLog(
    val id: String,
    val startTime: Long,
    val endTime: Long?,
    val campaignTitle: String,
    val summaries: List<SessionSummary>
)
