package com.mestre3dt.data.models

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverters
import com.mestre3dt.data.Converters
import kotlinx.serialization.Serializable
import java.util.UUID

/**
 * Scene (Cena) - Represents a location/encounter in the campaign
 * Contains map image, soundtrack, and list of enemies present
 */
@Entity(tableName = "scenes")
@Serializable
data class Scene(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val description: String = "",
    val objective: String = "",
    val mood: String = "neutral", // tense, calm, epic, mysterious
    val opening: String = "", // Narração inicial
    
    // Visual & Audio
    val mapImageUri: String? = null,
    val backgroundImageUri: String? = null,
    val soundtrackId: String? = null,
    
    // Content
    @TypeConverters(Converters::class)
    val enemyIds: List<String> = emptyList(),
    @TypeConverters(Converters::class)
    val npcIds: List<String> = emptyList(),
    @TypeConverters(Converters::class)
    val hooks: List<String> = emptyList(), // Story hooks
    @TypeConverters(Converters::class)
    val triggers: List<RollTrigger> = emptyList(),
    
    // Metadata
    val campaignId: String,
    val arcId: String,
    val orderIndex: Int = 0,
    val isCompleted: Boolean = false,
    val completedAt: Long? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

/**
 * Character - Unified model for NPCs and Enemies
 * Uses 3D&T Attribute System (F/H/R/A/PdF)
 */
@Entity(tableName = "characters")
@Serializable
data class Character(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val type: CharacterType,
    val role: String = "", // Guarda, Mercador, Boss, etc
    
    // Visual
    val imageUri: String? = null,
    val portraitUri: String? = null,
    @TypeConverters(Converters::class)
    val tags: List<String> = emptyList(),
    
    // 3D&T Attributes (base values)
    val strength: Int = 0,      // Força (F)
    val skill: Int = 0,         // Habilidade (H)
    val resistance: Int = 0,    // Resistência (R)
    val armor: Int = 0,         // Armadura (A)
    val firepower: Int = 0,     // Poder de Fogo (PdF)
    
    // Derived Stats (calculated from attributes)
    val maxHp: Int = resistance * 5,  // PV = R x 5
    val maxMp: Int = resistance * 5,  // PM = R x 5
    
    // Current State (runtime values)
    val currentHp: Int = maxHp,
    val currentMp: Int = maxMp,
    @TypeConverters(Converters::class)
    val activeConditions: List<Condition> = emptyList(),
    
    // Character Details
    val personality: String = "",
    val speechStyle: String = "",
    @TypeConverters(Converters::class)
    val mannerisms: List<String> = emptyList(),
    val goal: String = "",
    @TypeConverters(Converters::class)
    val secrets: Map<Int, String> = emptyMap(),
    @TypeConverters(Converters::class)
    val quickPhrases: List<String> = emptyList(),
    
    // Resources
    @TypeConverters(Converters::class)
    val advantages: List<String> = emptyList(),
    @TypeConverters(Converters::class)
    val disadvantages: List<String> = emptyList(),
    @TypeConverters(Converters::class)
    val equipment: List<EquipmentItem> = emptyList(),
    @TypeConverters(Converters::class)
    val powers: List<Power> = emptyList(),
    
    // Metadata
    val campaignId: String? = null,
    val isTemplate: Boolean = false, // Para monstros do compêndio
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

enum class CharacterType {
    PLAYER,
    NPC,
    ENEMY,
    BOSS,
    COMPANION
}

/**
 * Condition - Status effects applied to characters
 */
@Serializable
data class Condition(
    val id: String = UUID.randomUUID().toString(),
    val type: ConditionType,
    val name: String,
    val description: String = "",
    val duration: Int = -1, // -1 = permanent, 0+ = rounds remaining
    val value: Int = 0, // Damage per round, modifier value, etc
    val appliedAt: Long = System.currentTimeMillis()
)

enum class ConditionType {
    BURNING,      // Queimando (dano por turno)
    POISONED,     // Envenenado
    PARALYZED,    // Paralisado (não pode agir)
    STUNNED,      // Atordoado
    BLEEDING,     // Sangrando
    BLESSED,      // Abençoado (+modificador)
    CURSED,       // Amaldiçoado
    INVISIBLE,    // Invisível
    FLYING,       // Voando
    PRONE,        // Caído
    RESTRAINED,   // Imobilizado
    FRIGHTENED,   // Amedrontado
    CHARMED,      // Enfeitiçado
    CUSTOM        // Condição customizada
}

/**
 * Equipment Item - Gear that can be equipped
 */
@Serializable
data class EquipmentItem(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val type: EquipmentType,
    val description: String = "",
    val bonusF: Int = 0,
    val bonusH: Int = 0,
    val bonusR: Int = 0,
    val bonusA: Int = 0,
    val bonusPdF: Int = 0,
    val special: String = "",
    val imageUri: String? = null,
    val isEquipped: Boolean = false
)

enum class EquipmentType {
    WEAPON,
    ARMOR,
    SHIELD,
    ACCESSORY,
    CONSUMABLE
}

/**
 * Power - Special abilities/spells
 */
@Serializable
data class Power(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val description: String,
    val mpCost: Int? = null,
    val target: String = "Single",
    val testReminder: String? = null,
    val onSuccess: String? = null,
    val onFailure: String? = null,
    val damage: String? = null,
    val range: String = "Melee",
    val areaEffect: Boolean = false
)

/**
 * Roll Trigger - Situational skill checks
 */
@Serializable
data class RollTrigger(
    val id: String = UUID.randomUUID().toString(),
    val situation: String,
    val testType: String, // Percepção, Persuasão, etc
    val attribute: String, // Habilidade, Resistência
    val difficulty: String, // "12", "15", "Oposto"
    val onSuccess: String,
    val onFailure: String
)

/**
 * Combat - Active combat encounter
 */
@Entity(tableName = "combats")
@Serializable
data class Combat(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val sceneId: String,
    val round: Int = 1,
    val currentTurnIndex: Int = 0,
    @TypeConverters(Converters::class)
    val participants: List<CombatParticipant> = emptyList(),
    val isActive: Boolean = true,
    val startedAt: Long = System.currentTimeMillis(),
    val endedAt: Long? = null
)

/**
 * Combat Participant - Character in combat with initiative
 */
@Serializable
data class CombatParticipant(
    val id: String = UUID.randomUUID().toString(),
    val characterId: String,
    val name: String,
    val initiative: Int,
    val currentHp: Int,
    val maxHp: Int,
    val currentMp: Int?,
    val maxMp: Int?,
    val imageUri: String? = null,
    val isPlayer: Boolean = false,
    val isDefeated: Boolean = false,
    @TypeConverters(Converters::class)
    val activeConditions: List<Condition> = emptyList()
)
