package com.example

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.Diamond
import androidx.compose.material.icons.filled.MonetizationOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.*

@Composable
fun RewardContent() {
    var showAd by remember { mutableStateOf(false) }

    if (showAd) {
        Box(modifier = Modifier.fillMaxSize()) {
            AdWebView(
                // Placeholder for Monetag Smart Link
                url = "https://www.google.com", 
                modifier = Modifier.fillMaxSize()
            )
            IconButton(
                onClick = { showAd = false },
                modifier = Modifier.align(Alignment.TopEnd).padding(16.dp).background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(50))
            ) {
                Icon(Icons.Default. Diamond, contentDescription = "Close", tint = Color.White)
            }
        }
    } else {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                Icons.Default.MonetizationOn,
                contentDescription = null,
                modifier = Modifier.size(100.dp),
                tint = Color(0xFFFFD700)
            )
            Spacer(Modifier.height(24.dp))
            Text(
                "BotFather Rewards",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = OnBackgroundLight
            )
            Spacer(Modifier.height(12.dp))
            Text(
                "Support the xpe.nettt community and unlock premium tools by viewing a quick reward. This helps us keep the app automated and free!",
                textAlign = TextAlign.Center,
                color = TextSecondary
            )
            Spacer(Modifier.height(48.dp))
            MonetagInterstitialTrigger(
                buttonText = "Watch to Unlock Tools",
                onRewardEarned = { showAd = true },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(Modifier.height(16.dp))
            Text(
                "Ads by Monetag - Automated & Secure",
                fontSize = 10.sp,
                color = TextSecondary.copy(alpha = 0.5f)
            )
            Spacer(Modifier.weight(1f))
            AppFooter()
        }
    }
}
