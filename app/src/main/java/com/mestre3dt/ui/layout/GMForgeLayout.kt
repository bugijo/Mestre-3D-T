package com.mestre3dt.ui.layout

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mestre3dt.ui.theme.*

/**
 * GM FORGE MAIN LAYOUT
 * Navigation Rail + Content Area with Glassmorphism
 */
@Composable
fun GMForgeLayout(
    selectedRoute: String,
    onNavigate: (String) -> Unit,
    content: @Composable () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxSize()
            .background(GMDarkBackground)
    ) {
        // Navigation Rail (Left Sidebar)
        GMNavigationRail(
            selectedRoute = selectedRoute,
            onNavigate = onNavigate
        )

        // Main Content Area
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxHeight()
        ) {
            content()
        }
    }
}

@Composable
fun GMNavigationRail(
    selectedRoute: String,
    onNavigate: (String) -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxHeight()
            .width(160.dp),
        color = NavRailBackground,
        tonalElevation = 4.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(vertical = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Logo/Brand
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        "GM",
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Black,
                        color = NeonGreen,
                        letterSpacing = 2.sp
                    )
                    Text(
                        "FORGE",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextWhite,
                        letterSpacing = 3.sp
                    )
                }
            }

            // Navigation Items
            val navItems = listOf(
                NavItem("dashboard", "Dashboard", Icons.Default.Dashboard),
                NavItem("campaigns", "Campaigns", Icons.Default.Campaign),
                NavItem("characters", "Characters", Icons.Default.People),
                NavItem("encounters", "Encounters", Icons.Default.Shield),
                NavItem("maps", "Maps", Icons.Default.Map),
                NavItem("lore", "Bestiary", Icons.Default.MenuBook)
            )

            navItems.forEach { item ->
                GMNavRailItem(
                    route = item.route,
                    label = item.label,
                    icon = item.icon,
                    selected = selectedRoute == item.route,
                    onClick = { onNavigate(item.route) }
                )
            }

            Spacer(Modifier.weight(1f))

            // Settings at bottom
            GMNavRailItem(
                route = "settings",
                label = "Settings",
                icon = Icons.Default.Settings,
                selected = selectedRoute == "settings",
                onClick = { onNavigate("settings") }
            )
        }
    }
}

@Composable
fun GMNavRailItem(
    route: String,
    label: String,
    icon: ImageVector,
    selected: Boolean,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp)
            .height(64.dp),
        shape = RoundedCornerShape(12.dp),
        color = if (selected) NavRailSelected else Color.Transparent,
        onClick = onClick
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .then(
                    if (selected) Modifier.border(
                        width = 1.dp,
                        color = NeonPurple.copy(alpha = 0.5f),
                        shape = RoundedCornerShape(12.dp)
                    ) else Modifier
                ),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Icon(
                    icon,
                    contentDescription = label,
                    tint = if (selected) NeonPurple else TextGray,
                    modifier = Modifier.size(24.dp)
                )
                Text(
                    label,
                    fontSize = 11.sp,
                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                    color = if (selected) TextWhite else TextGray,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

data class NavItem(
    val route: String,
    val label: String,
    val icon: ImageVector
)

/**
 * GM FORGE GLASS PANEL
 * Reusable glassmorphism panel component
 */
@Composable
fun GlassPanel(
    modifier: Modifier = Modifier,
    withBorder: Boolean = true,
    content: @Composable BoxScope.() -> Unit
) {
    Box(
        modifier = modifier
            .background(
                color = GlassPanel,
                shape = RoundedCornerShape(16.dp)
            )
            .then(
                if (withBorder) Modifier.border(
                    width = 1.dp,
                    color = GlassBorder,
                    shape = RoundedCornerShape(16.dp)
                ) else Modifier
            )
            .clip(RoundedCornerShape(16.dp)),
        content = content
    )
}

/**
 * GM FORGE SECTION TITLE
 * Uppercase styled title
 */
@Composable
fun GMSectionTitle(
    text: String,
    modifier: Modifier = Modifier,
    color: Color = NeonGreen
) {
    Text(
        text = text.uppercase(),
        fontSize = 14.sp,
        fontWeight = FontWeight.Bold,
        color = color,
        letterSpacing = 2.sp,
        modifier = modifier
    )
}

/**
 * GM FORGE PROGRESS BAR
 * Neon green progress indicator
 */
@Composable
fun GMProgressBar(
    progress: Float,
    modifier: Modifier = Modifier,
    label: String? = null
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        label?.let {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    "Progress:",
                    fontSize = 11.sp,
                    color = TextGray
                )
                Text(
                    "${(progress * 100).toInt()}%",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = NeonGreen
                )
            }
        }
        
        LinearProgressIndicator(
            progress = progress,
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp)
                .clip(RoundedCornerShape(3.dp)),
            color = ProgressGreen,
            trackColor = ProgressTrack
        )
    }
}

/**
 * GM FORGE AVATAR
 * Circular avatar with online indicator
 */
@Composable
fun GMAvatarWithStatus(
    imageUri: String?,
    name: String,
    isOnline: Boolean = false,
    size: Int = 48,
    modifier: Modifier = Modifier
) {
    Box(modifier = modifier) {
        Surface(
            modifier = Modifier.size(size.dp),
            shape = CircleShape,
            color = GMDarkPanel
        ) {
            Box(contentAlignment = Alignment.Center) {
                Text(
                    name.take(1).uppercase(),
                    fontSize = (size / 2).sp,
                    fontWeight = FontWeight.Bold,
                    color = NeonPurple
                )
            }
        }
        
        if (isOnline) {
            Surface(
                modifier = Modifier
                    .size((size / 5).dp)
                    .align(Alignment.BottomEnd)
                    .border(2.dp, GMDarkBackground, CircleShape),
                shape = CircleShape,
                color = NeonGreen
            ) {}
        }
    }
}
