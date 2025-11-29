package com.mestre3dt.ui.screens.gmforge

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.mestre3dt.ui.layout.*
import com.mestre3dt.ui.theme.*
import kotlinx.coroutines.delay
import java.util.concurrent.TimeUnit

/**
 * GM FORGE DASHBOARD
 * Hero banner with countdown + campaign grid
 */
@Composable
fun GMDashboardScreen(
    campaigns: List<CampaignCardData>,
    nextSessionTimestamp: Long,
    onCampaignClick: (String) -> Unit,
    onPrepareSession: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        verticalArrangement = Arrangement.spacedBy(32.dp)
    ) {
        // Hero Banner - Next Session Countdown
        NextSessionHeroBanner(
            timestamp = nextSessionTimestamp,
            sessionTitle = "The Siege of Blackwood",
            sessionDate = "Saturday, 7:00 PM",
            onPrepare = onPrepareSession
        )

        // Section Title
        GMSectionTitle("YOUR CAMPAIGNS")

        // Campaign Grid
        LazyVerticalGrid(
            columns = GridCells.Fixed(4),
            horizontalArrangement = Arrangement.spacedBy(20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            items(campaigns) { campaign ->
                CampaignCard(
                    campaign = campaign,
                    onClick = { onCampaignClick(campaign.id) }
                )
            }
        }
    }
}

@Composable
fun NextSessionHeroBanner(
    timestamp: Long,
    sessionTitle: String,
    sessionDate: String,
    onPrepare: () -> Unit
) {
    var timeRemaining by remember { mutableStateOf(calculateTimeRemaining(timestamp)) }

    LaunchedEffect(timestamp) {
        while (true) {
            delay(1000)
            val updated = calculateTimeRemaining(timestamp)
            timeRemaining = updated
            if (updated == TimeRemaining(0, 0, 0, 0)) break
        }
    }

    GlassPanel(
        modifier = Modifier
            .fillMaxWidth()
            .height(240.dp)
    ) {
        // Background image with overlay
        Box(modifier = Modifier.fillMaxSize()) {
            // Gradient overlay
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                Color(0xFF1A0033),
                                Color(0xFF330066),
                                Color(0xFF1A0033)
                            )
                        )
                    )
            )

            // Content
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(40.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    "NEXT SESSION",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextWhite,
                    letterSpacing = 3.sp
                )

                Spacer(Modifier.height(16.dp))

                // Countdown
                Row(
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CountdownUnit(timeRemaining.days, "DAYS")
                    CountdownSeparator()
                    CountdownUnit(timeRemaining.hours, "HOURS")
                    CountdownSeparator()
                    CountdownUnit(timeRemaining.minutes, "MINS")
                    CountdownSeparator()
                    CountdownUnit(timeRemaining.seconds, "SECS")
                }

                Spacer(Modifier.height(16.dp))

                Text(
                    "Session Title: $sessionTitle | Date: $sessionDate",
                    fontSize = 13.sp,
                    color = TextGray
                )

                Spacer(Modifier.height(16.dp))

                Button(
                    onClick = onPrepare,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = NeonPurple
                    ),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        "PREPARE NOW",
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }
            }
        }
    }
}

@Composable
fun CountdownUnit(value: Int, label: String) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Text(
            value.toString().padStart(2, '0'),
            fontSize = 48.sp,
            fontWeight = FontWeight.Black,
            color = NeonPurple,
            letterSpacing = 2.sp
        )
        Text(
            label,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            color = TextGray,
            letterSpacing = 1.sp
        )
    }
}

@Composable
fun CountdownSeparator() {
    Text(
        ":",
        fontSize = 48.sp,
        fontWeight = FontWeight.Black,
        color = NeonPurple.copy(alpha = 0.5f)
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CampaignCard(
    campaign: CampaignCardData,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(280.dp),
        colors = CardDefaults.cardColors(
            containerColor = CardBackground
        ),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.elevatedCardElevation(4.dp)
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            // Campaign Cover Image
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(campaign.coverUri)
                    .crossfade(true)
                    .build(),
                contentDescription = campaign.title,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )

            // Gradient overlay
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                Color.Transparent,
                                Color.Black.copy(alpha = 0.8f)
                            ),
                            startY = 100f
                        )
                    )
            )

            // Content
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.Bottom
            ) {
                Text(
                    campaign.title.uppercase(),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextWhite,
                    letterSpacing = 1.sp,
                    maxLines = 1
                )

                Spacer(Modifier.height(4.dp))

                Text(
                    campaign.description,
                    fontSize = 11.sp,
                    color = TextGray,
                    maxLines = 2,
                    lineHeight = 14.sp
                )

                Spacer(Modifier.height(12.dp))

                // Progress
                GMProgressBar(
                    progress = campaign.progress
                )

                Spacer(Modifier.height(8.dp))

                // Players count
                Row(
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Groups,
                        contentDescription = null,
                        tint = TextGray,
                        modifier = Modifier.size(14.dp)
                    )
                    Text(
                        "${campaign.playerCount}",
                        fontSize = 11.sp,
                        color = TextGray
                    )
                }
            }
        }
    }
}

data class CampaignCardData(
    val id: String,
    val title: String,
    val description: String,
    val coverUri: String,
    val progress: Float,
    val playerCount: Int
)

data class TimeRemaining(
    val days: Int,
    val hours: Int,
    val minutes: Int,
    val seconds: Int
)

fun calculateTimeRemaining(timestamp: Long): TimeRemaining {
    val now = System.currentTimeMillis()
    val diff = timestamp - now
    
    if (diff <= 0) {
        return TimeRemaining(0, 0, 0, 0)
    }
    
    val days = TimeUnit.MILLISECONDS.toDays(diff).toInt()
    val hours = TimeUnit.MILLISECONDS.toHours(diff).toInt() % 24
    val minutes = TimeUnit.MILLISECONDS.toMinutes(diff).toInt() % 60
    val seconds = TimeUnit.MILLISECONDS.toSeconds(diff).toInt() % 60
    
    return TimeRemaining(days, hours, minutes, seconds)
}
