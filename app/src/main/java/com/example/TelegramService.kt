package com.example

import com.example.BuildConfig
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import retrofit2.http.GET
import retrofit2.http.Path

@Serializable
data class TelegramUser(
    val id: Long,
    val is_bot: Boolean,
    val first_name: String,
    val username: String? = null
)

@Serializable
data class TelegramResponse<T>(
    val ok: Boolean,
    val result: T? = null,
    val description: String? = null
)

interface TelegramApiService {
    @GET("bot{token}/getMe")
    suspend fun getMe(
        @Path("token") token: String
    ): TelegramResponse<TelegramUser>
}

object TelegramClient {
    private val json = Json { ignoreUnknownKeys = true }
    private val okHttpClient = OkHttpClient.Builder().build()

    val service: TelegramApiService by lazy {
        Retrofit.Builder()
            .baseUrl("https://api.telegram.org/")
            .client(okHttpClient)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(TelegramApiService::class.java)
    }
}

suspend fun verifyTelegramToken(): String {
    return try {
        val response = TelegramClient.service.getMe(BuildConfig.TELEGRAM_BOT_TOKEN)
        if (response.ok) {
            "Bot connected: ${response.result?.first_name} (@${response.result?.username})"
        } else {
            "Error: ${response.description}"
        }
    } catch (e: Exception) {
        "Telegram connection failed. Check your token."
    }
}
