package com.example.ui.update

import android.app.AlertDialog
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import org.json.JSONObject
import java.net.URL
import kotlin.concurrent.thread

object AutoUpdater {
    private const val RELEASES_URL = "https://api.github.com/repos/xpeee-banned/BOT-FATHER/releases/latest"
    private const val DOWNLOAD_URL = "https://github.com/xpeee-banned/BOT-FATHER/releases/download/latest/app-debug.apk"
    private const val CURRENT_VERSION = "2.1.0"

    fun checkForUpdate(context: Context, onResult: (Boolean, String) -> Unit) {
        thread {
            try {
                val connection = URL(RELEASES_URL).openConnection()
                connection.setRequestProperty("Accept", "application/vnd.github.v3+json")
                connection.connectTimeout = 5000
                connection.readTimeout = 5000
                val response = connection.getInputStream().bufferedReader().use { it.readText() }
                val json = JSONObject(response)
                val tagName = json.optString("tag_name", "")
                
                // Compare versions
                val hasUpdate = if (tagName.isNotEmpty()) {
                    try {
                        val latest = tagName.removePrefix("v").split(".").map { it.toInt() }
                        val current = CURRENT_VERSION.split(".").map { it.toInt() }
                        latest > current
                    } catch (e: Exception) {
                        tagName != CURRENT_VERSION
                    }
                } else false

                android.os.Handler(context.mainLooper).post {
                    onResult(hasUpdate, DOWNLOAD_URL)
                }
            } catch (e: Exception) {
                android.os.Handler(context.mainLooper).post {
                    onResult(false, DOWNLOAD_URL)
                }
            }
        }
    }

    fun showUpdateDialog(context: Context, downloadUrl: String) {
        AlertDialog.Builder(context)
            .setTitle("Nueva version disponible")
            .setMessage("Hay una nueva version de RewardNexus disponible.\n\n¿Deseas actualizar ahora?")
            .setPositiveButton("Actualizar ahora") { _, _ ->
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(downloadUrl))
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
            }
            .setNegativeButton("Mas tarde", null)
            .setCancelable(true)
            .show()
    }

    fun manualCheck(context: Context) {
        checkForUpdate(context) { hasUpdate, url ->
            if (hasUpdate) {
                showUpdateDialog(context, url)
            } else {
                AlertDialog.Builder(context)
                    .setTitle("RewardNexus")
                    .setMessage("Tu app esta actualizada a la ultima version.")
                    .setPositiveButton("OK", null)
                    .show()
            }
        }
    }
}
