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
import retrofit2.http.Query
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.flow
import android.util.Log

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

@Serializable
data class Update(
    val update_id: Long,
    val message: Message? = null
)

@Serializable
data class Message(
    val message_id: Long,
    val chat: Chat,
    val text: String? = null
)

@Serializable
data class Chat(
    val id: Long
)

interface TelegramApiService {
    @GET("/bot{token}/getMe")
    suspend fun getMe(
        @Path("token") token: String
    ): TelegramResponse<TelegramUser>

    @GET("/bot{token}/getUpdates")
    suspend fun getUpdates(
        @Path("token") token: String,
        @Query("offset") offset: Long
    ): TelegramResponse<List<Update>>

    @GET("/bot{token}/sendMessage")
    suspend fun sendMessage(
        @Path("token") token: String,
        @Query("chat_id") chatId: Long,
        @Query("text") text: String
    ): TelegramResponse<Message>
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

// Bot Polling Service (Runs when app is open)
suspend fun startBotPolling() {
    var lastUpdateId = 0L
    while (true) {
        try {
            val response = TelegramClient.service.getUpdates(BuildConfig.TELEGRAM_BOT_TOKEN, lastUpdateId + 1)
            if (response.ok && response.result != null) {
                for (update in response.result) {
                    lastUpdateId = update.update_id
                    val message = update.message
                    if (message?.text != null) {
                        // Echo or respond to commands
                        val replyText = when {
                            message.text.startsWith("/start") -> "¡Hola! Soy BotFather (administrado por XpeHub). ¡Estoy funcionando desde la app Android!"
                            message.text.startsWith("/help") -> "Comandos disponibles:\n/start - Iniciar\n/help - Ayuda\nO simplemente envíame un mensaje y te responderé."
                            else -> "Recibí tu mensaje: ${message.text}. (¡Estoy vivo!)"
                        }
                        
                        TelegramClient.service.sendMessage(
                            token = BuildConfig.TELEGRAM_BOT_TOKEN,
                            chatId = message.chat.id,
                            text = replyText
                        )
                    }
                }
            }
        } catch (e: Exception) {
            Log.e("BotPolling", "Error polling updates", e)
        }
        delay(2000) // Poll every 2 seconds
    }
}

