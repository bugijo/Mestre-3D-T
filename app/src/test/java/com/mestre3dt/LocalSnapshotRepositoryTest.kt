package com.mestre3dt

import android.app.Application
import androidx.test.core.app.ApplicationProvider
import com.mestre3dt.data.LocalSnapshotRepository
import com.mestre3dt.data.RemoteSnapshot
import com.mestre3dt.data.sampleCampaigns
import com.mestre3dt.data.sampleEnemies
import com.mestre3dt.data.sampleNpcs
import com.mestre3dt.data.sampleNotes
import com.mestre3dt.data.sampleSoundScenes
import kotlinx.coroutines.runBlocking
import org.junit.Before
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

class LocalSnapshotRepositoryTest {

    private lateinit var application: Application

    @Before
    fun setup() {
        application = ApplicationProvider.getApplicationContext()
        application.deleteDatabase("mestre_snapshots.db")
    }

    @Test
    fun saveAndLoadSnapshot_roundTripsData() = runBlocking {
        val repository = LocalSnapshotRepository(application)
        val snapshot = RemoteSnapshot(
            campaigns = sampleCampaigns,
            npcs = sampleNpcs,
            enemies = sampleEnemies,
            soundScenes = sampleSoundScenes,
            sessionNotes = sampleNotes,
            sessionSummaries = emptyList(),
            activeSession = null,
            encounter = emptyList(),
            activeCampaignIndex = 0,
            activeArcIndex = 0,
            activeSceneIndex = 0,
            activeSoundSceneIndex = 0,
            isSoundPlaying = false,
            soundPreferences = com.mestre3dt.data.SoundPreferences()
        )

        repository.saveSnapshot(snapshot)
        val loaded = repository.loadSnapshot()

        assertNotNull(loaded)
        assertEquals(snapshot.campaigns.size, loaded.campaigns.size)
        assertEquals(snapshot.soundScenes.size, loaded.soundScenes.size)
    }
}

