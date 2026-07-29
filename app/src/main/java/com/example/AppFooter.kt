package com.example

import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.TextSecondary

@Composable
fun AppFooter(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Powered by RewardNexus",
            color = TextSecondary.copy(alpha = 0.8f),
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.5.sp
        )
        Spacer(modifier = Modifier.height(2.dp))
        Text(
            text = "© 2024 xpe.nettt",
            color = TextSecondary.copy(alpha = 0.6f),
            fontSize = 9.sp,
            fontWeight = FontWeight.Medium,
            letterSpacing = 1.sp
        )
    }
}
