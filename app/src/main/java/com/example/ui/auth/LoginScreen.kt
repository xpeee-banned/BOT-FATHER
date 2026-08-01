package com.example.ui.auth

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.*
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val NavyDark = Color(0xFF0A0F1E)
private val NavyDarker = Color(0xFF070B16)
private val GreenPrimary = Color(0xFF00E580)
private val BlueAccent = Color(0xFF3B82F6)
private val SurfaceCard = Color(0xFF111827)
private val BorderSubtle = Color(0xFF1E293B)
private val TextPrimary = Color(0xFFF1F5F9)
private val TextSecondary = Color(0xFF94A3B8)

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    onGuestLogin: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var selectedTab by remember { mutableStateOf(0) }
    var isLoading by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(colors = listOf(NavyDarker, NavyDark)))
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(GreenPrimary.copy(alpha = 0.08f), Color.Transparent),
                        radius = 600f
                    )
                )
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(60.dp))

            Box(
                modifier = Modifier
                    .size(72.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(Brush.linearGradient(colors = listOf(GreenPrimary, BlueAccent))),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.TrendingUp, contentDescription = "RewardNexus", tint = NavyDarker, modifier = Modifier.size(40.dp))
            }

            Spacer(modifier = Modifier.height(16.dp))
            Text("RewardNexus", fontSize = 28.sp, fontWeight = FontWeight.Black, color = TextPrimary)
            Spacer(modifier = Modifier.height(4.dp))
            Text("Gana dinero real desde tu celular", fontSize = 14.sp, color = TextSecondary)

            Spacer(modifier = Modifier.height(40.dp))

            // Google Login
            Surface(
                onClick = { isLoading = true; onLoginSuccess() },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                color = SurfaceCard,
                border = BorderStroke(1.dp, BorderSubtle)
            ) {
                Row(
                    modifier = Modifier.padding(vertical = 16.dp, horizontal = 24.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(Icons.Default.AccountCircle, contentDescription = "Google", tint = Color(0xFFEA4335), modifier = Modifier.size(24.dp))
                    Spacer(modifier = Modifier.width(12.dp))
                    Text("Continuar con Google", fontWeight = FontWeight.Bold, color = TextPrimary, fontSize = 16.sp)
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                HorizontalDivider(modifier = Modifier.weight(1f), color = BorderSubtle)
                Text("o registrate con", fontSize = 12.sp, color = TextSecondary, modifier = Modifier.padding(horizontal = 12.dp))
                HorizontalDivider(modifier = Modifier.weight(1f), color = BorderSubtle)
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Tab selector
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(SurfaceCard)
                    .padding(4.dp)
            ) {
                TabBtn("Correo", selectedTab == 0) { selectedTab = 0 }
                TabBtn("Telefono", selectedTab == 1) { selectedTab = 1 }
            }

            Spacer(modifier = Modifier.height(20.dp))

            AnimatedContent(
                targetState = selectedTab,
                transitionSpec = { fadeIn(tween(300)) togetherWith fadeOut(tween(300)) },
                label = "auth_tabs"
            ) { tab ->
                Column(modifier = Modifier.fillMaxWidth()) {
                    if (tab == 0) {
                        AuthField(email, { email = it }, "Correo electronico", Icons.Default.Email, KeyboardType.Email)
                        Spacer(modifier = Modifier.height(12.dp))
                        AuthField(
                            password, { password = it }, "Contrasena", Icons.Default.Lock, KeyboardType.Password,
                            if (showPassword) VisualTransformation.None else PasswordVisualTransformation()
                        ) {
                            IconButton(onClick = { showPassword = !showPassword }) {
                                Icon(
                                    if (showPassword) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    contentDescription = "Toggle", tint = TextSecondary
                                )
                            }
                        }
                    } else {
                        AuthField(phone, { phone = it }, "Numero de telefono", Icons.Default.Phone, KeyboardType.Phone)
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("Te enviaremos un codigo de verificacion por SMS", fontSize = 12.sp, color = TextSecondary, modifier = Modifier.padding(horizontal = 16.dp))
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = { isLoading = true; onLoginSuccess() },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = GreenPrimary, contentColor = NavyDarker),
                enabled = !isLoading
            ) {
                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = NavyDarker, strokeWidth = 2.dp)
                } else {
                    Text("Crear cuenta / Entrar", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            TextButton(onClick = onGuestLogin) {
                Text("Continuar como invitado", color = TextSecondary, fontSize = 14.sp)
            }

            Spacer(modifier = Modifier.height(32.dp))

            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                FeatureChip(Icons.Default.PlayCircle, "Juegos")
                FeatureChip(Icons.Default.Paid, "Retiros")
                FeatureChip(Icons.Default.People, "Referidos")
            }

            Spacer(modifier = Modifier.height(24.dp))
            Text(
                "Al continuar aceptas los Terminos y la Politica de Privacidad de RewardNexus",
                fontSize = 11.sp, color = TextSecondary.copy(alpha = 0.6f),
                textAlign = TextAlign.Center, modifier = Modifier.padding(horizontal = 24.dp)
            )
            Spacer(modifier = Modifier.height(40.dp))
        }
    }
}

@Composable
private fun TabBtn(text: String, isSelected: Boolean, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        modifier = Modifier.weight(1f),
        shape = RoundedCornerShape(8.dp),
        color = if (isSelected) GreenPrimary.copy(alpha = 0.15f) else Color.Transparent
    ) {
        Text(text, fontSize = 14.sp, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
            color = if (isSelected) GreenPrimary else TextSecondary,
            modifier = Modifier.padding(vertical = 10.dp), textAlign = TextAlign.Center)
    }
}

@Composable
private fun AuthField(
    value: String, onValueChange: (String) -> Unit, label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    keyboardType: KeyboardType = KeyboardType.Text,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    trailingIcon: @Composable (() -> Unit)? = null
) {
    OutlinedTextField(
        value = value, onValueChange = onValueChange,
        label = { Text(label, color = TextSecondary) },
        leadingIcon = { Icon(icon, contentDescription = null, tint = TextSecondary) },
        trailingIcon = trailingIcon,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedTextColor = TextPrimary, unfocusedTextColor = TextPrimary,
            focusedBorderColor = GreenPrimary, unfocusedBorderColor = BorderSubtle,
            focusedLabelColor = GreenPrimary, cursorColor = GreenPrimary,
            focusedContainerColor = SurfaceCard, unfocusedContainerColor = SurfaceCard
        ),
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        visualTransformation = visualTransformation, singleLine = true
    )
}

@Composable
private fun FeatureChip(icon: androidx.compose.ui.graphics.vector.ImageVector, text: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(icon, contentDescription = text, tint = GreenPrimary.copy(alpha = 0.7f), modifier = Modifier.size(28.dp))
        Spacer(modifier = Modifier.height(4.dp))
        Text(text, fontSize = 10.sp, color = TextSecondary)
    }
}
