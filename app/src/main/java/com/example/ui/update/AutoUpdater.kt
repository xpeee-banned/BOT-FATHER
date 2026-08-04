package com.example.ui.update

import android.content.Context
import com.rewardnexus.botfather.util.UpdateManager

object AutoUpdater {

    fun checkForUpdate(context: Context, onResult: (Boolean, String) -> Unit) {
        UpdateManager.checkForUpdate(context) { hasUpdate, releaseInfo ->
            onResult(hasUpdate, releaseInfo?.downloadUrl ?: "")
        }
    }

    fun showUpdateDialog(context: Context, downloadUrl: String) {
        UpdateManager.checkForUpdate(context) { _, releaseInfo ->
            if (releaseInfo != null) {
                UpdateManager.showUpdateDialog(context, releaseInfo)
            } else {
                UpdateManager.downloadAndInstallApk(context, downloadUrl)
            }
        }
    }

    fun manualCheck(context: Context) {
        UpdateManager.checkAndPrompt(context, isManualCheck = true)
    }
}
