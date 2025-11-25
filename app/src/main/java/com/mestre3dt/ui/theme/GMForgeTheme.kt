package com.mestre3dt.ui.theme

import androidx.compose.ui.graphics.Color

/**
 * GM FORGE THEME - High Fidelity Clone
 * Dark glassmorphism aesthetic with neon accents
 */

// Base Dark Theme
val GMDarkBackground = Color(0xFF121212)
val GMDarkSurface = Color(0xFF1E1E1E)
val GMDarkPanel = Color(0xFF282828)

// Glassmorphism
val GlassPanel = Color(0x0DFFFFFF) // 5% white opacity
val GlassBorder = Color(0x1AFFFFFF) // 10% white for borders
val GlassBlur = 20f // dp for blur effect

// Neon Accents
val NeonGreen = Color(0xFF00FF9D)
val NeonPurple = Color(0xFFBB86FC)
val NeonPurpleDark = Color(0xFF9D5BD2)
val NeonBlue = Color(0xFF03DAC6)

// Semantic Colors
val GMSuccess = NeonGreen
val GMWarning = Color(0xFFFFB74D)
val GMError = Color(0xFFFF5252)
val GMInfo = NeonBlue

// HP/MP Colors
val HPGreen = Color(0xFF4CAF50)
val HPYellow = Color(0xFFFFC107)
val HPRed = Color(0xFFFF5252)
val MPBlue = Color(0xFF2196F3)

// Text Colors
val TextWhite = Color(0xFFFFFFFF)
val TextGray = Color(0xFFB0B0B0)
val TextDim = Color(0xFF707070)

// Navigation Rail
val NavRailBackground = Color(0xFF1A1A1A)
val NavRailSelected = NeonPurple.copy(alpha = 0.2f)
val NavRailHover = Color(0xFF2A2A2A)

// Progress Bar
val ProgressGreen = NeonGreen
val ProgressTrack = Color(0xFF2A2A2A)

// Card/Panel
val CardBackground = Color(0xFF1E1E1E)
val CardBorder = GlassBorder
val CardHover = Color(0xFF252525)

// Overlay
val OverlayDark = Color(0xCC000000) // 80% black
val OverlayPurple = NeonPurple.copy(alpha = 0.1f)
