package com.rewardnexus.botfather.util

import android.app.AlertDialog
import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.util.Log
import android.widget.Toast
import androidx.core.content.FileProvider
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

object UpdateManager {

    private const val TAG = "UpdateManager"
    private const val RELEASES_API_URL = "https://api.github.com/repos/xpeee-banned/BOT-FATHER/releases/latest"
    private const val DEFAULT_DOWNLOAD_URL = "https://github.com/xpeee-banned/BOT-FATHER/releases/download/latest/app-debug.apk"

    data class ReleaseInfo(
        val tagName: String,
        val versionName: String,
        val downloadUrl: String,
        val releaseNotes: String
    )

    /**
     * Checks for updates from GitHub Releases API asynchronously.
     */
    fun checkForUpdate(context: Context, onResult: (Boolean, ReleaseInfo?) -> Unit) {
        thread {
            try {
                val url = URL(RELEASES_API_URL)
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "GET"
                connection.setRequestProperty("Accept", "application/vnd.github.v3+json")
                connection.connectTimeout = 10000
                connection.readTimeout = 10000

                if (connection.responseCode == 200) {
                    val response = connection.inputStream.bufferedReader().use { it.readText() }
                    val json = JSONObject(response)

                    val tagName = json.optString("tag_name", "")
                    val versionName = tagName.removePrefix("v").trim()
                    val body = json.optString("body", "Nueva actualización disponible.")

                    // Find APK download URL in assets, fallback to DEFAULT_DOWNLOAD_URL
                    var apkUrl = DEFAULT_DOWNLOAD_URL
                    val assets = json.optJSONArray("assets")
                    if (assets != null) {
                        for (i in 0 until assets.length()) {
                            val asset = assets.getJSONObject(i)
                            val name = asset.optString("name", "")
                            if (name.endsWith(".apk")) {
                                apkUrl = asset.optString("browser_download_url", DEFAULT_DOWNLOAD_URL)
                                break
                            }
                        }
                    }

                    val currentVersion = getCurrentVersionName(context)
                    val hasUpdate = isVersionNewer(versionName, currentVersion)

                    val releaseInfo = ReleaseInfo(
                        tagName = tagName,
                        versionName = versionName,
                        downloadUrl = apkUrl,
                        releaseNotes = body
                    )

                    android.os.Handler(context.mainLooper).post {
                        onResult(hasUpdate, releaseInfo)
                    }
                } else {
                    Log.e(TAG, "GitHub API returned HTTP code: ${connection.responseCode}")
                    android.os.Handler(context.mainLooper).post {
                        onResult(false, null)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error checking for updates", e)
                android.os.Handler(context.mainLooper).post {
                    onResult(false, null)
                }
            }
        }
    }

    /**
     * Checks for updates and shows dialog if an update is available or if manual check requested.
     */
    fun checkAndPrompt(context: Context, isManualCheck: Boolean = false) {
        checkForUpdate(context) { hasUpdate, releaseInfo ->
            if (hasUpdate && releaseInfo != null) {
                showUpdateDialog(context, releaseInfo)
            } else if (isManualCheck) {
                val currentVersion = getCurrentVersionName(context)
                AlertDialog.Builder(context)
                    .setTitle("App Actualizada")
                    .setMessage("Estás utilizando la versión más reciente ($currentVersion).")
                    .setPositiveButton("Aceptar", null)
                    .show()
            }
        }
    }

    /**
     * Displays a dialog prompting the user to update.
     */
    fun showUpdateDialog(context: Context, releaseInfo: ReleaseInfo) {
        AlertDialog.Builder(context)
            .setTitle("Nueva Versión Disponible (${releaseInfo.tagName})")
            .setMessage("Se ha encontrado una nueva versión de la aplicación.\n\nNovedades:\n${releaseInfo.releaseNotes}\n\n¿Deseas descargar e instalar la actualización?")
            .setPositiveButton("Actualizar Ahora") { _, _ ->
                downloadAndInstallApk(context, releaseInfo.downloadUrl)
            }
            .setNegativeButton("Más Tarde", null)
            .setCancelable(true)
            .show()
    }

    /**
     * Downloads APK via DownloadManager and triggers installation when download completes.
     */
    fun downloadAndInstallApk(context: Context, downloadUrl: String) {
        Toast.makeText(context, "Descargando actualización...", Toast.LENGTH_SHORT).show()

        val fileName = "app-update.apk"
        val destinationFile = File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), fileName)
        if (destinationFile.exists()) {
            destinationFile.delete()
        }

        try {
            val downloadManager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            val request = DownloadManager.Request(Uri.parse(downloadUrl))
                .setTitle("Descargando actualización de BotFather")
                .setDescription("Descargando el archivo de instalación APK...")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setDestinationUri(Uri.fromFile(destinationFile))
                .setAllowedOverMetered(true)
                .setAllowedOverRoaming(true)

            val downloadId = downloadManager.enqueue(request)

            val onComplete = object : BroadcastReceiver() {
                override fun onReceive(ctxt: Context, intent: Intent) {
                    val id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1)
                    if (id == downloadId) {
                        try {
                            ctxt.unregisterReceiver(this)
                        } catch (e: Exception) {
                            Log.e(TAG, "Error unregistering receiver", e)
                        }
                        triggerInstall(ctxt, destinationFile)
                    }
                }
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.registerReceiver(
                    onComplete,
                    IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
                    Context.RECEIVER_EXPORTED
                )
            } else {
                context.registerReceiver(
                    onComplete,
                    IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error downloading APK via DownloadManager, attempting direct fallback open", e)
            try {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(downloadUrl))
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
            } catch (ex: Exception) {
                Toast.makeText(context, "Error al iniciar la descarga", Toast.LENGTH_SHORT).show()
            }
        }
    }

    /**
     * Triggers the APK installation intent.
     */
    fun triggerInstall(context: Context, apkFile: File) {
        if (!apkFile.exists()) {
            Toast.makeText(context, "Archivo de instalación no encontrado.", Toast.LENGTH_SHORT).show()
            return
        }

        try {
            val intent = Intent(Intent.ACTION_VIEW)
            val apkUri: Uri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                FileProvider.getUriForFile(
                    context,
                    "${context.packageName}.fileprovider",
                    apkFile
                )
            } else {
                Uri.fromFile(apkFile)
            }

            intent.setDataAndType(apkUri, "application/vnd.android.package-archive")
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Error triggering APK install", e)
            Toast.makeText(context, "Error al abrir el instalador del APK: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    /**
     * Retrieves current application version name.
     */
    fun getCurrentVersionName(context: Context): String {
        return try {
            val pInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            pInfo.versionName ?: "1.0.0"
        } catch (e: Exception) {
            "1.0.0"
        }
    }

    /**
     * Compares version strings (e.g., "2.5.0" > "2.4.0").
     */
    fun isVersionNewer(latestVersion: String, currentVersion: String): Boolean {
        val latestParts = latestVersion.split(".").map { it.toIntOrNull() ?: 0 }
        val currentParts = currentVersion.split(".").map { it.toIntOrNull() ?: 0 }
        val maxLength = maxOf(latestParts.size, currentParts.size)

        for (i in 0 until maxLength) {
            val latest = if (i < latestParts.size) latestParts[i] else 0
            val current = if (i < currentParts.size) currentParts[i] else 0
            if (latest > current) return true
            if (latest < current) return false
        }
        return false
    }
}
