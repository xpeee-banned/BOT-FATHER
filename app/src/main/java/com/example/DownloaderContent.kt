package com.example

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Link
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.ui.theme.*

@Composable
fun DownloaderContent() {
    var url by remember { mutableStateOf("") }
    var isProcessing by remember { mutableStateOf(false) }
    var downloadResult by remember { mutableStateOf<String?>(null) }
    
    val clipboardManager = LocalClipboardManager.current
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(48.dp))
        Text(
            "RewardNexus Downloader",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = OnBackgroundLight
        )
        Spacer(Modifier.height(8.dp))
        Text(
            "Paste a Telegram media link to download instantly",
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary
        )
        Spacer(Modifier.height(32.dp))
        
        OutlinedTextField(
            value = url,
            onValueChange = { 
                url = it
                downloadResult = null // clear result when typing
            },
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("https://t.me/...") },
            leadingIcon = { Icon(Icons.Default.Link, contentDescription = null) },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = PrimaryBlue,
                unfocusedBorderColor = PrimaryContainer,
                focusedTextColor = OnBackgroundLight,
                unfocusedTextColor = OnBackgroundLight,
                cursorColor = PrimaryBlue,
                unfocusedContainerColor = SurfaceLight,
                focusedContainerColor = SurfaceLight
            ),
            shape = RoundedCornerShape(16.dp)
        )
        
        Spacer(Modifier.height(24.dp))
        
        if (isProcessing) {
            Button(
                onClick = { },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                shape = RoundedCornerShape(16.dp),
                enabled = false
            ) {
                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
            }
        } else {
            RewardAdTrigger(
                buttonText = "Process Link",
                onRewardEarned = {
                    if (url.isNotEmpty()) {
                        isProcessing = true
                        downloadResult = null
                    } else {
                        Toast.makeText(context, "Please enter a valid link first.", Toast.LENGTH_SHORT).show()
                    }
                },
                modifier = Modifier.fillMaxWidth()
            )
        }
        
        if (isProcessing) {
            LaunchedEffect(url) {
                kotlinx.coroutines.delay(2000) // Simulate network request
                isProcessing = false
                downloadResult = "https://xpe.nettt/download?id=(simulated_file)"
            }
        }
        
        if (downloadResult != null) {
            Spacer(Modifier.height(24.dp))
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceVariantLight),
                border = BorderStroke(1.dp, PrimaryContainer),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Ready to Download!",
                        fontWeight = FontWeight.Bold,
                        color = OnBackgroundLight
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = downloadResult!!,
                        color = TextSecondary,
                        style = MaterialTheme.typography.bodySmall
                    )
                    Spacer(Modifier.height(16.dp))
                    Button(
                        onClick = {
                            clipboardManager.setText(AnnotatedString(downloadResult!!))
                            Toast.makeText(context, "URL Copied to Clipboard!", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryContainer, contentColor = OnPrimaryContainer),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Copy Link")
                    }
                }
            }
        }
        
        Spacer(Modifier.weight(1f))
        AppFooter()
    }
}
