package com.example

import androidx.compose.material3.MaterialTheme
import com.example.BuildConfig
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.Query
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Serializable
data class GenerateContentRequest(
    val contents: List<ContentPart>
)

@Serializable
data class ContentPart(
    val parts: List<TextPart>
)

@Serializable
data class TextPart(
    val text: String
)

@Serializable
data class GenerateContentResponse(
    val candidates: List<Candidate>
)

@Serializable
data class Candidate(
    val content: ContentPart
)

interface GeminiApiService {
    @POST("v1beta/models/gemini-1.5-flash:generateContent")
    suspend fun generateContent(
        @Query("key") apiKey: String,
        @Body request: GenerateContentRequest
    ): GenerateContentResponse
}

object GeminiClient {
    private val json = Json { ignoreUnknownKeys = true }
    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
        .readTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
        .build()

    val service: GeminiApiService by lazy {
        Retrofit.Builder()
            .baseUrl("https://generativelanguage.googleapis.com/")
            .client(okHttpClient)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(GeminiApiService::class.java)
    }
}

suspend fun getTelegramTrends(): String = withContext(Dispatchers.IO) {
    val prompt = "Summarize 3 trending topics on Telegram right now in a few short bullet points. Be concise and engaging."
    val request = GenerateContentRequest(
        contents = listOf(ContentPart(parts = listOf(TextPart(prompt))))
    )
    try {
        val response = GeminiClient.service.generateContent(BuildConfig.GEMINI_API_KEY, request)
        response.candidates.firstOrNull()?.content?.parts?.firstOrNull()?.text ?: "Trends are currently unavailable. Check back later!"
    } catch (e: Exception) {
        "Stay tuned for the latest Telegram trends! (Processing...)"
    }
}
