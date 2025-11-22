package com.mestre3dt.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = PurplePrimary,
    onPrimary = Color.White,
    background = OffWhite,
    surface = Color.White,
    onSurface = Color(0xFF1F1A2E)
)

private val DarkColors = darkColorScheme(
    primary = PurpleDark,
    onPrimary = DeepNight,
    background = Color(0xFF0D0815),
    surface = Color(0xFF131026),
    onSurface = Color(0xFFEAE0FF)
)

@Composable
fun Mestre3DTTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) DarkColors else LightColors

    MaterialTheme(
        colorScheme = colors,
        typography = Typography,
        shapes = Shapes,
        content = content
    )
}
