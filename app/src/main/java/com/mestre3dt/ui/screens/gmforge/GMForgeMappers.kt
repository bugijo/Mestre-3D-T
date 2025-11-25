package com.mestre3dt.ui.screens.gmforge

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import com.mestre3dt.data.Enemy
import com.mestre3dt.data.EncounterEnemyState
import com.mestre3dt.data.Npc
import com.mestre3dt.data.Scene
import com.mestre3dt.ui.MestreUiState
import com.mestre3dt.ui.theme.*
import java.util.concurrent.TimeUnit

/**
 * GM FORGE DATA MAPPERS
 * Convert existing UiState data to GM Forge data models
 */

// Campaign Mapping
fun MestreUiState.toCampaignCards(): List<CampaignCardData> {
    return campaigns.map { campaign ->
        val totalScenes = campaign.arcs.flatMap { it.scenes }.size
        val completedScenes = campaign.arcs.flatMap { it.scenes }.count { it.isCompleted }
        val progress = if (totalScenes > 0) completedScenes.toFloat() / totalScenes else 0f
        
        CampaignCardData(
            id = campaign.id,
            title = campaign.title,
            description = campaign.description,
            coverUri = "", // TODO: Add cover image to Campaign model
            progress = progress,
            playerCount = 4 // TODO: Add to Campaign model or track in GameSession
        )
    }
}

// Session Participants Mapping
fun MestreUiState.toSessionParticipants(): List<SessionParticipant> {
    val participants = mutableListOf<SessionParticipant>()
    
    // Convert encounter enemies to participants
    encounterEnemies.forEachIndexed { index, enemyState ->
        val enemy = enemies.find { it.id == enemyState.enemyId }
        if (enemy != null) {
            participants.add(
                SessionParticipant(
                    id = enemyState.id,
                    name = "${enemy.name} #${index + 1}",
                    avatarUri = enemy.imageUri,
                    initiative = 10 + (0..10).random(), // TODO: Implement initiative system
                    currentHp = enemyState.currentHp,
                    maxHp = enemyState.maxHp,
                    isPlayer = false,
                    isCurrentTurn = false,
                    isOnline = true,
                    position = Offset(
                        100f + (index % 3) * 150f,
                        100f + (index / 3) * 150f
                    )
                )
            )
        }
    }
    
    // TODO: Add player characters when multi-user is implemented
    // For now, add sample players from NPCs
    npcs.take(2).forEachIndexed { index, npc ->
        participants.add(
            SessionParticipant(
                id = npc.id,
                name = npc.name,
                avatarUri = npc.imageUri,
                initiative = 15 + (0..5).random(),
                currentHp = npc.currentPV,
                maxHp = npc.maxPV,
                isPlayer = true,
                isCurrentTurn = index == 0,
                isOnline = true,
                position = Offset(
                    400f + index * 150f,
                    250f
                )
            )
        )
    }
    
    return participants.sortedByDescending { it.initiative }
}

// Combat Log Mapping
fun MestreUiState.toCombatLog(): List<LogEntry> {
    // Convert session notes to combat log
    return activeScene?.notes?.takeLast(10)?.map { note ->
        LogEntry(
            actor = "System",
            message = note.text,
            icon = if (note.important) Icons.Default.Warning else Icons.Default.Info,
            color = if (note.important) Color(0xFFFF9800) else NeonPurple
        )
    } ?: emptyList()
}

// Timeline Scenes Mapping
fun MestreUiState.toTimelineScenes(): List<TimelineScene> {
    val activeArc = campaigns.find { it.id == activeCampaignId }?.arcs?.find { it.id == activeArcId }
    return activeArc?.scenes?.mapIndexed { index, scene ->
        TimelineScene(
            id = scene.id,
            name = scene.name,
            description = scene.objective,
            type = determineSceneType(scene, index),
            isCompleted = scene.isCompleted,
            isActive = scene.id == activeSceneId
        )
    } ?: emptyList()
}

private fun determineSceneType(scene: Scene, index: Int): SceneType {
    // Simple heuristic based on scene name
    return when {
        scene.name.contains("tavern", ignoreCase = true) || scene.name.contains("taverna", ignoreCase = true) -> SceneType.TAVERN
        scene.name.contains("forest", ignoreCase = true) || scene.name.contains("floresta", ignoreCase = true) -> SceneType.FOREST
        scene.name.contains("dungeon", ignoreCase = true) || scene.name.contains("masmorra", ignoreCase = true) -> SceneType.DUNGEON
        scene.name.contains("dragon", ignoreCase = true) || scene.name.contains("dragão", ignoreCase = true) -> SceneType.DRAGON_LAIR
        scene.name.contains("ruin", ignoreCase = true) || scene.name.contains("ruína", ignoreCase = true) -> SceneType.RUINS
        scene.name.contains("boss", ignoreCase = true) || scene.name.contains("chefe", ignoreCase = true) -> SceneType.BOSS
        scene.enemyIds.isNotEmpty() -> SceneType.AMBUSH
        else -> SceneType.TAVERN
    }
}

// Next Session Timestamp
fun MestreUiState.getNextSessionTimestamp(): Long {
    // TODO: Add to Campaign model or Settings
    // For now, return timestamp for "next Saturday at 7 PM"
    val now = System.currentTimeMillis()
    val nextSaturday = now + TimeUnit.DAYS.toMillis(6)
    return nextSaturday
}
