package com.mestre3dt.data

import com.mestre3dt.BuildConfig
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.okhttp.OkHttp
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.HttpRequestBuilder
import io.ktor.client.request.get
import io.ktor.client.request.headers
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType
import kotlinx.serialization.json.Json
import io.ktor.serialization.kotlinx.json.json

class RemoteSyncRepository(
    private val client: HttpClient = defaultClient(),
    private val baseUrl: String = BuildConfig.SUPABASE_URL,
    private val apiKey: String = BuildConfig.SUPABASE_KEY,
    private val table: String = BuildConfig.SUPABASE_TABLE
) {
    val isConfigured: Boolean = baseUrl.isNotBlank() && apiKey.isNotBlank()

    suspend fun pushSnapshot(snapshot: RemoteSnapshot): Result<Unit> = runCatching {
        require(isConfigured) { "Configure SUPABASE_URL e SUPABASE_KEY para habilitar a sincronização." }
        client.post("$baseUrl/rest/v1/$table") {
            applySupabaseHeaders()
            contentType(ContentType.Application.Json)
            setBody(snapshot)
        }
        Unit
    }

    suspend fun pullLatest(): Result<RemoteSnapshot?> = runCatching {
        require(isConfigured) { "Configure SUPABASE_URL e SUPABASE_KEY para habilitar a sincronização." }
        val response = client.get("$baseUrl/rest/v1/$table") {
            applySupabaseHeaders()
            parameter("select", "*")
            parameter("order", "createdAt.desc")
            parameter("limit", 1)
        }
        val snapshots = response.body<List<RemoteSnapshot>>()
        snapshots.firstOrNull()
    }

    private fun HttpRequestBuilder.applySupabaseHeaders() {
        headers {
            append("apikey", apiKey)
            append("Authorization", "Bearer $apiKey")
            append("Prefer", "return=minimal")
        }
    }
}

private fun defaultClient() = HttpClient(OkHttp) {
    install(ContentNegotiation) {
        json(
            Json {
                ignoreUnknownKeys = true
                encodeDefaults = true
            }
        )
    }
}
