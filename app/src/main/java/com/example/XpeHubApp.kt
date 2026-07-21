package com.example

import androidx.compose.animation.*
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.*
import com.example.ui.theme.BackgroundLight
import com.example.ui.theme.OnBackgroundLight
import com.example.ui.theme.OnPrimaryContainer
import com.example.ui.theme.PrimaryContainer
import com.example.ui.theme.SurfaceLight

@Composable
fun XpeHubApp() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    Scaffold(
        bottomBar = {
            if (currentRoute != null) {
                NavigationBar(
                    containerColor = SurfaceLight,
                    contentColor = OnBackgroundLight,
                    tonalElevation = 0.dp
                ) {
                    NavigationBarItem(
                        selected = currentRoute == "home",
                        onClick = { navController.navigate("home") { popUpTo("home") { inclusive = true } } },
                        icon = { Icon(Icons.Default.Home, null) },
                        label = { Text("Inicio") },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = OnPrimaryContainer,
                            selectedTextColor = OnBackgroundLight,
                            indicatorColor = PrimaryContainer,
                            unselectedIconColor = Color.Gray,
                            unselectedTextColor = Color.Gray
                        )
                    )
                    NavigationBarItem(
                        selected = currentRoute == "downloader",
                        onClick = { navController.navigate("downloader") },
                        icon = { Icon(Icons.Default.Download, null) },
                        label = { Text("Tareas") },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = OnPrimaryContainer,
                            selectedTextColor = OnBackgroundLight,
                            indicatorColor = PrimaryContainer,
                            unselectedIconColor = Color.Gray,
                            unselectedTextColor = Color.Gray
                        )
                    )
                    NavigationBarItem(
                        selected = currentRoute == "rewards",
                        onClick = { navController.navigate("rewards") },
                        icon = { Icon(Icons.Default.CardGiftcard, null) },
                        label = { Text("Cartera") },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = OnPrimaryContainer,
                            selectedTextColor = OnBackgroundLight,
                            indicatorColor = PrimaryContainer,
                            unselectedIconColor = Color.Gray,
                            unselectedTextColor = Color.Gray
                        )
                    )
                }
            }
        },
        containerColor = BackgroundLight
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = "home",
            modifier = Modifier.padding(innerPadding)
        ) {
            composable("home") { HomeContent(onNavigate = { navController.navigate(it) }) }
            composable("downloader") { DownloaderContent() }
            composable("rewards") { RewardContent() }
        }
    }
}
