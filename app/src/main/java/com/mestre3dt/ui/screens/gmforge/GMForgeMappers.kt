package com.mestre3dt.ui.screens.gmforge

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import com.mestre3dt.data.EncounterEnemyState
import com.mestre3dt.data.Npc
import com.mestre3dt.data.Scene
import com.mestre3dt.ui.AppUiState
import com.mestre3dt.ui.theme.*
import java.util.concurrent.TimeUnit
import kotlin.math.absoluteValue

/**
 * GM FORGE DATA MAPPERS
 * Convert existing AppUiState to GM Forge data models
 */

// Campaign Mapping
fun AppUiState.toCampaignCards(): List<CampaignCardData> {
    return campaigns.mapIndexed { index, campaign ->
        val totalScenes = campaign.arcs.flatMap { it.scenes }.size
        val completedScenes = 0 // TODO: Track scene completion in app state
        val progress = if (totalScenes > 0) completedScenes.toFloat() / totalScenes else 0f
        
        CampaignCardData(
            id = index.toString(), // Using index as ID since Campaign doesn't have id field
            title = campaign.title,
            description = campaign.synopsis,
            coverUri = "", // TODO: Add cover image to Campaign model
            progress = progress,
            playerCount = 4 // TODO: Add to Campaign model or track in GameSession
        )
    }
}

// Session Participants Mapping
fun AppUiState.toSessionParticipants(): List<SessionParticipant> {
    val participants = mutableListOf<SessionParticipant>()
    
    // Convert encounter enemies to participants
    encounter.forEachIndexed { index, enemyState ->
        val enemy = enemyState.enemy
        val initiativeSeed = (enemy.id.hashCode() * 31 + index).absoluteValue
        participants.add(
            SessionParticipant(
                id = enemy.id,
                name = "${enemy.name} #${index + 1}",
                avatarUri = enemy.imageUri,
                initiative = 10 + (initiativeSeed % 11),
                currentHp = enemyState.currentHp,
                maxHp = enemy.maxHp,
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
    
    // TODO: Add player characters when multi-user is implemented
    // For now, add sample players from NPCs
    npcs.take(2).forEachIndexed { index, npc ->
        val initiativeSeed = (npc.id.hashCode() * 17 + index).absoluteValue
        participants.add(
            SessionParticipant(
                id = npc.id,
                name = npc.name,
                avatarUri = npc.imageUri,
                initiative = 15 + (initiativeSeed % 6),
                currentHp = npc.maxHp,
                maxHp = npc.maxHp,
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
fun AppUiState.toCombatLog(): List<LogEntry> {
    // Convert session notes to combat log
    return sessionNotes.takeLast(10).map { note ->
        LogEntry(
            actor = "System",
            message = note.text,
            icon = if (note.important) Icons.Default.Warning else Icons.Default.Info,
            color = if (note.important) Color(0xFFFF9800) else NeonPurple
        )
    }
}

// Timeline Scenes Mapping
fun AppUiState.toTimelineScenes(): List<TimelineScene> {
    val selectedCampaign = campaigns.getOrNull(activeCampaignIndex)
    val activeArc = selectedCampaign?.arcs?.getOrNull(activeArcIndex)
    
    return activeArc?.scenes?.mapIndexed { index, scene ->
        TimelineScene(
            id = index.toString(), // Using index as ID
            name = scene.name,
            description = scene.objective,
            type = determineSceneType(scene, index),
            isCompleted = false, // TODO: Track scene completion
            isActive = index == activeSceneIndex
        )
    } ?: emptyList()
}

// Helper to get active scene
fun AppUiState.getActiveScene(): Scene? {
    val selectedCampaign = campaigns.getOrNull(activeCampaignIndex) ?: return null
    val activeArc = selectedCampaign.arcs.getOrNull(activeArcIndex) ?: return null
    return activeArc.scenes.getOrNull(activeSceneIndex)
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
fun AppUiState.getNextSessionTimestamp(): Long {
    // TODO: Add to Campaign model or Settings
    // For now, return timestamp for "next Saturday at 7 PM"
    val now = System.currentTimeMillis()
    val nextSaturday = now + TimeUnit.DAYS.toMillis(6)
    return nextSaturday
}
