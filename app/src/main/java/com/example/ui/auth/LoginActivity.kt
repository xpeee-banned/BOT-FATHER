package com.example.ui.auth

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.LaunchedEffect
import com.example.MainActivity
import com.example.ui.update.AutoUpdater
import com.example.ui.theme.MyApplicationTheme

class LoginActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Check for updates on app start
        AutoUpdater.checkForUpdate(this) { hasUpdate, downloadUrl ->
            if (hasUpdate) {
                AutoUpdater.showUpdateDialog(this, downloadUrl)
            }
        }

        setContent {
            MyApplicationTheme(darkTheme = true) {
                LoginScreen(
                    onLoginSuccess = {
                        startActivity(Intent(this, MainActivity::class.java))
                        finish()
                    },
                    onGuestLogin = {
                        startActivity(Intent(this, MainActivity::class.java))
                        finish()
                    }
                )
            }
        }
    }
}
