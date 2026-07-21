package com.example

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.PlayCircleFilled
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.*

@Composable
fun MonetagNativeBanner(modifier: Modifier = Modifier) {
    var isVisible by remember { mutableStateOf(true) }

    if (isVisible) {
        Card(
            modifier = modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceVariantLight),
            shape = RoundedCornerShape(20.dp),
            border = BorderStroke(1.dp, PrimaryContainer)
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Simulated Ad Icon / Image
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .background(PrimaryContainer, RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text("AD", color = PrimaryBlue, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Sponsored", fontSize = 10.sp, color = TextSecondary, fontWeight = FontWeight.Bold)
                    }
                    Text("Boost your Channels", fontWeight = FontWeight.Bold, color = OnBackgroundLight, fontSize = 14.sp)
                    Text("Get real subscribers fast.", fontSize = 12.sp, color = TextSecondary)
                }
                IconButton(onClick = { isVisible = false }) {
                    Icon(Icons.Default.Close, contentDescription = "Close Ad", tint = TextSecondary)
                }
            }
        }
    }
}

@Composable
fun MonetagInterstitialTrigger(
    buttonText: String,
    onRewardEarned: () -> Unit,
    modifier: Modifier = Modifier
) {
    var showInterstitial by remember { mutableStateOf(false) }

    Button(
        onClick = { showInterstitial = true },
        modifier = modifier.height(48.dp),
        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
        shape = RoundedCornerShape(16.dp)
    ) {
        Icon(Icons.Default.PlayCircleFilled, contentDescription = null, tint = Color.White)
        Spacer(Modifier.width(8.dp))
        Text(buttonText, fontWeight = FontWeight.Bold, color = Color.White)
    }

    if (showInterstitial) {
        // Full screen dialog simulating Monetag Interstitial/Reward video
        AlertDialog(
            onDismissRequest = { /* Prevent dismiss to force watch */ },
            confirmButton = {
                TextButton(onClick = { 
                    showInterstitial = false
                    onRewardEarned()
                }) {
                    Text("Claim Reward")
                }
            },
            title = { Text("Sponsored Content") },
            text = {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                        .background(Color.Black, RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Monetag Video Ad Playing...", color = Color.White)
                }
            },
            properties = androidx.compose.ui.window.DialogProperties(
                dismissOnBackPress = false,
                dismissOnClickOutside = false
            )
        )
    }
}
