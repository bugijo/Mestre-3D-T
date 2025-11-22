package com.mestre3dt

import com.mestre3dt.data.ActiveSession
import com.mestre3dt.data.EncounterEnemyState
import com.mestre3dt.data.SessionNote
import com.mestre3dt.data.SessionSummary
import com.mestre3dt.data.SoundPreferences
import com.mestre3dt.data.sampleCampaigns
import com.mestre3dt.data.sampleEnemies
import com.mestre3dt.data.sampleNpcs
import com.mestre3dt.data.sampleSoundScenes
import com.mestre3dt.ui.AppUiState

fun previewEncounter(): List<EncounterEnemyState> = sampleEnemies.take(2).mapIndexed { index, enemy ->
    EncounterEnemyState(
        id = "preview-$index",
        label = "${enemy.name} #${index + 1}",
        enemy = enemy,
        currentHp = enemy.currentHp,
        currentMp = enemy.currentMp,
        isDown = false
    )
}

fun previewUiState(): AppUiState = AppUiState(
    campaigns = sampleCampaigns,
    npcs = sampleNpcs,
    enemies = sampleEnemies,
    soundScenes = sampleSoundScenes,
    sessionNotes = listOf(SessionNote("Grupo conversou com Rina.", true)),
    sessionSummaries = listOf(
        SessionSummary(
            sessionName = "Sessão 1",
            startedAt = System.currentTimeMillis() - 3_600_000,
            endedAt = System.currentTimeMillis() - 1_800_000,
            campaignTitle = sampleCampaigns.first().title,
            arcTitle = sampleCampaigns.first().arcs.first().title,
            sceneName = sampleCampaigns.first().arcs.first().scenes.first().name,
            importantNotes = listOf("Acordo com o tecnomante"),
            defeatedEnemies = listOf("Capanga 1"),
            timestamp = System.currentTimeMillis()
        )
    ),
    activeSession = ActiveSession("Sessão atual", System.currentTimeMillis() - 1_000_000, scenesVisited = listOf("Chegada à Cidade")),
    activeCampaignIndex = 0,
    activeArcIndex = 0,
    activeSceneIndex = 0,
    encounter = previewEncounter(),
    activeSoundSceneIndex = 0,
    isSoundPlaying = false,
    soundPreferences = SoundPreferences(),
    isLoading = false
)
