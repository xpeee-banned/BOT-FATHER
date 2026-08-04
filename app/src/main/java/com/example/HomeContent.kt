package com.example

import androidx.compose.material3.MaterialTheme
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.ui.theme.*

@Composable
fun HomeContent(onNavigate: (String) -> Unit) {
    var isLoggedIn by remember { mutableStateOf(false) }
    
    val testimonials = listOf(
        Testimonial("Carlos M.", "Increíble app, descargo todo al instante sin problemas."),
        Testimonial("Ana Gómez", "La mejor herramienta para Telegram. ¡Muy rápida y fluida!"),
        Testimonial("Juan Perez", "Me encanta la sección de recompensas y su diseño."),
        Testimonial("Laura F.", "Súper fácil de usar, la recomiendo a todos mis amigos.")
    )

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 100.dp)
    ) {
        item {
            HeroSection()
        }
        
        if (!isLoggedIn) {
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.primaryContainer),
                    shape = RoundedCornerShape(20.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .padding(16.dp)
                            .fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Tus Monedas", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                            Text("Inicia sesión para no perder recompensas", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Button(
                            onClick = { isLoggedIn = true },
                            colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = MaterialTheme.colorScheme.onBackground),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primaryContainer),
                            shape = RoundedCornerShape(12.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Text("Iniciar Sesion", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        item {
            QuickActions(onNavigate)
        }

        item {
            GamesThatPaySection(onNavigate)
        }

        item {
            AiTrendsSection()
        }

        item {
            SectionHeader("Trending Telegram Channels")
        }

        items(trendingChannels) { channel ->
            ChannelCard(channel)
        }
        
        item {
            RewardNativeBanner()
        }
        
        item {
            SectionHeader("Lo que dicen los usuarios")
        }
        
        items(testimonials.chunked(2)) { rowItems ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                for (item in rowItems) {
                    TestimonialCard(item, Modifier.weight(1f))
                }
                if (rowItems.size == 1) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
        
        item {
            // ESPACIO PARA TU LINK DE SOCIAL TRAFFIC DE MONETAG AQUÍ
            // Reemplaza la siguiente URL con tu link directo (Social Traffic):
            val socialTrafficUrl = "https://omg10.com/4/11368455"
            
            val context = LocalContext.current
            
            Card(
                onClick = { 
                    val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(socialTrafficUrl))
                    context.startActivity(intent)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                colors = CardDefaults.cardColors(containerColor = GreenContainer),
                border = BorderStroke(1.dp, GreenBorder),
                shape = RoundedCornerShape(20.dp)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.RocketLaunch, contentDescription = null, tint = OnGreenContainer)
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text("Acceso Exclusivo / VIP", fontWeight = FontWeight.Bold, color = OnGreenContainer)
                        Text("Únete ahora (Social Traffic Link)", fontSize = 10.sp, color = OnGreenContainer.copy(alpha = 0.8f))
                    }
                }
            }
        }

        item {
            UpdateCheckButton()
        }
        
        item {
            AppFooter()
        }
    }
}

@Composable
fun HeroSection() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .clip(RoundedCornerShape(32.dp))
            .background(
                Brush.linearGradient(
                    colors = listOf(MaterialTheme.colorScheme.primary, MaterialTheme.colorScheme.onBackground)
                )
            )
            .padding(24.dp)
    ) {
        Column {
            Text(
                text = "Portal de Monetización",
                style = MaterialTheme.typography.labelSmall,
                color = Color.White.copy(alpha = 0.8f),
                fontWeight = FontWeight.Bold
            )
            Spacer(Modifier.height(8.dp))
            Row(verticalAlignment = Alignment.Bottom) {
                Text(
                    text = "$1,248.50",
                    style = MaterialTheme.typography.headlineLarge,
                    color = Color.White,
                    fontWeight = FontWeight.Black
                )
                Spacer(Modifier.width(8.dp))
                Surface(
                    color = Color(0xFF22C55E),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.padding(bottom = 6.dp)
                ) {
                    Text(
                        text = "+12% hoy",
                        color = Color.White,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                    )
                }
            }
            Spacer(Modifier.height(24.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Button(
                    onClick = { /* Retirar */ },
                    modifier = Modifier.weight(1f).height(48.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer,
                        contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                    ),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Text("Retirar", fontWeight = FontWeight.Bold)
                }
                OutlinedButton(
                    onClick = { /* Historial */ },
                    modifier = Modifier.weight(1f).height(48.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = Color.White
                    ),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.2f)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Text("Historial", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun AiTrendsSection() {
    var trends by remember { mutableStateOf("Loading trends...") }
    
    LaunchedEffect(Unit) {
        trends = getTelegramTrends()
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(28.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.primaryContainer)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.TrendingUp, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Spacer(Modifier.width(8.dp))
                Text("Insights - Telegram Trends", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
            }
            Spacer(Modifier.height(12.dp))
            Surface(
                color = SurfaceVariantLight,
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = trends,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier.padding(16.dp)
                )
            }
            Spacer(Modifier.height(8.dp))
            Text(
                "Updated regularly",
                fontSize = 10.sp,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.align(Alignment.End)
            )
        }
    }
}

@Composable
fun QuickActions(onNavigate: (String) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        ActionCard("Invitar Amigos", "Gana 20% de su tráfico", Icons.Default.RocketLaunch, GreenContainer, OnGreenContainer, GreenBorder, Modifier.weight(1f)) {
            onNavigate("downloader")
        }
        ActionCard("Giro Diario", "Premios hasta $10.00", Icons.Default.LocalPlay, OrangeContainer, OnOrangeContainer, OrangeBorder, Modifier.weight(1f)) {
            onNavigate("rewards")
        }
    }
}

@Composable
fun ActionCard(title: String, subtitle: String, icon: ImageVector, bgColor: Color, contentColor: Color, borderColor: Color, modifier: Modifier, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        modifier = modifier.height(120.dp),
        shape = RoundedCornerShape(28.dp),
        color = bgColor,
        border = BorderStroke(1.dp, borderColor)
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(icon, contentDescription = null, tint = contentColor, modifier = Modifier.size(28.dp))
            Spacer(Modifier.height(8.dp))
            Text(title, style = MaterialTheme.typography.labelLarge, color = contentColor, fontWeight = FontWeight.Bold)
            Text(subtitle, fontSize = 10.sp, color = contentColor.copy(alpha = 0.8f))
        }
    }
}

@Composable
fun SectionHeader(title: String) {
    Text(
        text = title,
        modifier = Modifier.padding(horizontal = 24.dp, vertical = 8.dp),
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.Bold,
        color = MaterialTheme.colorScheme.onBackground
    )
}

@Composable
fun ChannelCard(channel: TelegramChannel) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.primaryContainer)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AsyncImage(
                model = channel.iconUrl,
                contentDescription = null,
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(12.dp)),
                contentScale = ContentScale.Crop
            )
            Spacer(Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(channel.name, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                Text(channel.description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
            }
            Button(
                onClick = { /* Open link */ },
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                shape = RoundedCornerShape(12.dp),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
            ) {
                Text("Join", fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}



data class TelegramChannel(val name: String, val description: String, val iconUrl: String)
data class Testimonial(val name: String, val review: String, val rating: Int = 5)

@Composable
fun TestimonialCard(testimonial: Testimonial, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = SurfaceVariantLight),
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.primaryContainer)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                repeat(testimonial.rating) {
                    Icon(Icons.Default.Star, contentDescription = null, tint = Color(0xFFFFD700), modifier = Modifier.size(12.dp))
                }
            }
            Spacer(Modifier.height(4.dp))
            Text(
                text = "\"${testimonial.review}\"",
                fontSize = 10.sp,
                color = MaterialTheme.colorScheme.onBackground,
                lineHeight = 14.sp,
                fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = "- ${testimonial.name}",
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}

val trendingChannels = listOf(
    TelegramChannel("Telegram News", "Official news from Telegram team", "https://telegram.org/img/t_logo.png"),
    TelegramChannel("Xpe Tech Tips", "Best tech tips by xpe.nettt", "https://via.placeholder.com/150"),
    TelegramChannel("Global Memes", "The funniest memes on the planet", "https://via.placeholder.com/150"),
    TelegramChannel("Crypto Alerts", "Real-time crypto signals", "https://via.placeholder.com/150")
)

@Composable
fun GamesThatPaySection(onNavigate: (String) -> Unit) {
    Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.SportsEsports, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.width(8.dp))
            Text("Juegos que Pagan", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = MaterialTheme.colorScheme.onBackground)
        }
        Spacer(Modifier.height(12.dp))
        
        val games = listOf(
            GameItem("Dado Magico", "+30 monedas", Icons.Default.Casino),
            GameItem("Adivina el Numero", "+40 monedas", Icons.Default.Psychology),
            GameItem("Cara o Cruz", "+20 monedas", Icons.Default.Payments),
            GameItem("Slot Machine", "+50 monedas", Icons.Default.SportsEsports),
            GameItem("Lucky Number", "+100 monedas", Icons.Default.ConfirmationNumber),
            GameItem("High or Low", "+25 monedas", Icons.Default.Star)
        )
        
        games.chunked(2).forEach { rowGames ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                for (game in rowGames) {
                    GameCard(game, Modifier.weight(1f))
                }
                if (rowGames.size == 1) Spacer(Modifier.weight(1f))
            }
            Spacer(Modifier.height(12.dp))
        }
    }
}

data class GameItem(val name: String, val reward: String, val icon: ImageVector)

@Composable
fun GameCard(game: GameItem, modifier: Modifier = Modifier) {
    val context = LocalContext.current
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.primaryContainer)
    ) {
        Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(game.icon, contentDescription = game.name, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(32.dp))
            Spacer(Modifier.height(8.dp))
            Text(game.name, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MaterialTheme.colorScheme.onBackground, textAlign = TextAlign.Center)
            Spacer(Modifier.height(4.dp))
            Text(game.reward, fontSize = 12.sp, color = Color(0xFF00E580), fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun UpdateCheckButton() {
    val context = LocalContext.current
    Card(
        onClick = { com.example.ui.update.AutoUpdater.manualCheck(context) },
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.primaryContainer)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.SystemUpdate, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.width(12.dp))
            Column {
                Text("Buscar actualizaciones", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                Text("Ultima version: v2.1.0", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}
