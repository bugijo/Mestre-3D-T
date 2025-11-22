package com.mestre3dt

import com.mestre3dt.data.RemoteSnapshot
import com.mestre3dt.data.RemoteSyncRepository
import com.mestre3dt.data.sampleCampaigns
import com.mestre3dt.data.sampleEnemies
import com.mestre3dt.data.sampleNpcs
import com.mestre3dt.data.sampleSoundScenes
import com.mestre3dt.data.sampleNotes
import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.headers
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.headersOf
import io.ktor.serialization.kotlinx.json.json
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class RemoteSyncRepositoryTest {

    private val snapshot = RemoteSnapshot(
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

    @Test
    fun pushSnapshot_sendsPayloadAndHeaders() = runBlocking {
        var capturedBody: String? = null
        var capturedAuth: String? = null

        val engine = MockEngine { request ->
            capturedBody = request.body.toString()
            capturedAuth = request.headers["Authorization"]
            respond(
                content = "{}",
                status = HttpStatusCode.OK,
                headers = headersOf("Content-Type", ContentType.Application.Json.toString())
            )
        }

        val client = HttpClient(engine) {
            install(ContentNegotiation) { json(Json { encodeDefaults = true }) }
        }

        val repo = RemoteSyncRepository(
            client = client,
            baseUrl = "https://example.supabase.co",
            apiKey = "key",
            table = "snapshots"
        )

        val result = repo.pushSnapshot(snapshot)

        assertTrue(result.isSuccess)
        assertTrue(capturedAuth?.contains("Bearer") == true)
        assertTrue(capturedBody?.contains("campaigns") == true)
    }

    @Test
    fun pullLatest_returnsSnapshot() = runBlocking {
        val json = Json { encodeDefaults = true }
        val engine = MockEngine {
            respond(
                content = json.encodeToString(listOf(snapshot)),
                status = HttpStatusCode.OK,
                headers = headersOf("Content-Type", ContentType.Application.Json.toString())
            )
        }
        val client = HttpClient(engine) {
            install(ContentNegotiation) { json(json) }
        }

        val repo = RemoteSyncRepository(
            client = client,
            baseUrl = "https://example.supabase.co",
            apiKey = "key",
            table = "snapshots"
        )

        val result = repo.pullLatest()
        val latest = result.getOrNull()

        assertTrue(result.isSuccess)
        assertEquals(snapshot.campaigns.size, latest?.campaigns?.size)
    }
}

