package com.mestre3dt.ui.screens.gmforge

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.mestre3dt.ui.layout.*
import com.mestre3dt.ui.theme.*

/**
 * GM FORGE SESSION VIEW
 * 3-Panel layout: Initiative Tracker (20%) | Map View (60%) | Tools (20%)
 */
@Composable
fun GMSessionScreen(
    participants: List<SessionParticipant>,
    mapUri: String?,
    combatLog: List<LogEntry>,
    onRollDice: () -> Unit,
    onTokenMove: (String, Offset) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        // Main 3-Panel Row
        Row(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Left Panel - Initiative Tracker (20%)
            InitiativeTrackerPanel(
                participants = participants,
                modifier = Modifier
                    .weight(0.2f)
                    .fillMaxHeight()
            )

            // Center Panel - Map View (60%)
            MapViewPanel(
                mapUri = mapUri,
                tokens = participants.map { it.toToken() },
                onTokenMove = onTokenMove,
                modifier = Modifier
                    .weight(0.6f)
                    .fillMaxHeight()
            )

            // Right Panel - Tools (20%)
            ToolsPanel(
                combatLog = combatLog,
                onRollDice = onRollDice,
                modifier = Modifier
                    .weight(0.2f)
                    .fillMaxHeight()
            )
        }

        // Footer - Media Player
        MediaPlayerBar(
            trackName = "Dragon's Lair - Epic Score",
            isPlaying = true
        )
    }
}

/**
 * LEFT PANEL - Initiative Tracker
 */
@Composable
fun InitiativeTrackerPanel(
    participants: List<SessionParticipant>,
    modifier: Modifier = Modifier
) {
    GlassPanel(modifier = modifier) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            GMSectionTitle("INITIATIVE")

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(participants) { participant ->
                    InitiativeCard(participant)
                }
            }
        }
    }
}

@Composable
fun InitiativeCard(participant: SessionParticipant) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = if (participant.isCurrentTurn) 
            NeonPurple.copy(alpha = 0.15f) 
        else CardBackground,
        border = if (participant.isCurrentTurn)
            androidx.compose.foundation.BorderStroke(2.dp, NeonPurple)
        else null
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar
            GMAvatarWithStatus(
                imageUri = participant.avatarUri,
                name = participant.name,
                isOnline = participant.isOnline,
                size = 48
            )

            // Info
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    participant.name,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (participant.isCurrentTurn) NeonPurple else TextWhite
                )
                Text(
                    participant.initiative.toString(),
                    fontSize = 11.sp,
                    color = TextGray
                )
            }
        }
    }
    
    // HP Bar below
    val hpPercentage = participant.currentHp.toFloat() / participant.maxHp
    LinearProgressIndicator(
        progress = hpPercentage,
        modifier = Modifier
            .fillMaxWidth()
            .height(4.dp),
        color = when {
            hpPercentage < 0.25f -> HPRed
            hpPercentage < 0.5f -> HPYellow
            else -> HPGreen
        },
        trackColor = ProgressTrack
    )
}

/**
 * CENTER PANEL - Map View with Draggable Tokens
 */
@Composable
fun MapViewPanel(
    mapUri: String?,
    tokens: List<MapToken>,
    onTokenMove: (String, Offset) -> Unit,
    modifier: Modifier = Modifier
) {
    GlassPanel(modifier = modifier) {
        Box(modifier = Modifier.fillMaxSize()) {
            // Map Background
            if (mapUri != null) {
                AsyncImage(
                    model = ImageRequest.Builder(LocalContext.current)
                        .data(mapUri)
                        .crossfade(true)
                        .build(),
                    contentDescription = "Battle Map",
                    contentScale = ContentScale.FillBounds,
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                // Grid pattern placeholder
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val gridSize = 50f
                    for (i in 0 until (size.width / gridSize).toInt()) {
                        drawLine(
                            color = Color.White.copy(alpha = 0.1f),
                            start = Offset(i * gridSize, 0f),
                            end = Offset(i * gridSize, size.height),
                            strokeWidth = 1f
                        )
                    }
                    for (i in 0 until (size.height / gridSize).toInt()) {
                        drawLine(
                            color = Color.White.copy(alpha = 0.1f),
                            start = Offset(0f, i * gridSize),
                            end = Offset(size.width, i * gridSize),
                            strokeWidth = 1f
                        )
                    }
                }
            }

            // Tokens overlay
            tokens.forEach { token ->
                var offsetX by remember { mutableStateOf(token.position.x) }
                var offsetY by remember { mutableStateOf(token.position.y) }

                Box(
                    modifier = Modifier
                        .offset(offsetX.dp, offsetY.dp)
                        .size(64.dp)
                        .pointerInput(token.id) {
                            detectDragGestures { change, dragAmount ->
                                change.consume()
                                offsetX += dragAmount.x
                                offsetY += dragAmount.y
                                onTokenMove(token.id, Offset(offsetX, offsetY))
                            }
                        }
                ) {
                    // Token circle with glow
                    Surface(
                        modifier = Modifier.size(56.dp),
                        shape = CircleShape,
                        color = if (token.isPlayer) NeonGreen.copy(alpha = 0.3f) else NeonPurple.copy(alpha = 0.3f),
                        border = androidx.compose.foundation.BorderStroke(
                            3.dp,
                            if (token.isPlayer) NeonGreen else NeonPurple
                        )
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            GMAvatarWithStatus(
                                imageUri = token.avatarUri,
                                name = token.name,
                                isOnline = true,
                                size = 48
                            )
                        }
                    }
                }
            }
        }
    }
}

/**
 * RIGHT PANEL - Tools (Combat Log + Dice Roller)
 */
@Composable
fun ToolsPanel(
    combatLog: List<LogEntry>,
    onRollDice: () -> Unit,
    modifier: Modifier = Modifier
) {
    GlassPanel(modifier = modifier) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Combat Log
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                GMSectionTitle("COMBAT LOG")

                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    items(combatLog) { entry ->
                        LogEntryItem(entry)
                    }
                }
            }

            // Dice Roller Button
            Button(
                onClick = onRollDice,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(64.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = NeonPurple
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        Icons.Default.Casino,
                        contentDescription = null,
                        modifier = Modifier.size(28.dp)
                    )
                    Text(
                        "ROLL D20",
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }
            }
        }
    }
}

@Composable
fun LogEntryItem(entry: LogEntry) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.Top
    ) {
        Icon(
            entry.icon,
            contentDescription = null,
            tint = entry.color,
            modifier = Modifier.size(14.dp)
        )
        Column {
            Text(
                entry.actor,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = entry.color
            )
            Text(
                entry.message,
                fontSize = 10.sp,
                color = TextGray,
                lineHeight = 12.sp
            )
        }
    }
}

/**
 * MEDIA PLAYER BAR with Waveform
 */
@Composable
fun MediaPlayerBar(
    trackName: String,
    isPlaying: Boolean
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .height(80.dp),
        color = GMDarkPanel,
        tonalElevation = 4.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Play/Pause
            IconButton(
                onClick = {},
                modifier = Modifier
                    .size(48.dp)
                    .background(NeonPurple.copy(alpha = 0.2f), CircleShape)
            ) {
                Icon(
                    if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                    contentDescription = null,
                    tint = NeonPurple
                )
            }

            // Track info
            Column(modifier = Modifier.width(200.dp)) {
                Text(
                    trackName,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextWhite
                )
                Text(
                    "Battle Theme",
                    fontSize = 10.sp,
                    color = TextGray
                )
            }

            // Waveform visualization
            WaveformVisualization(
                modifier = Modifier.weight(1f).height(40.dp),
                isPlaying = isPlaying
            )

            // Volume
            IconButton(onClick = {}) {
                Icon(Icons.Default.VolumeUp, null, tint = TextGray)
            }

            // Shuffle/Repeat
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                IconButton(onClick = {}) {
                    Icon(Icons.Default.Shuffle, null, tint = TextGray, modifier = Modifier.size(20.dp))
                }
                IconButton(onClick = {}) {
                    Icon(Icons.Default.Repeat, null, tint = NeonGreen, modifier = Modifier.size(20.dp))
                }
            }
        }
    }
}

@Composable
fun WaveformVisualization(
    modifier: Modifier = Modifier,
    isPlaying: Boolean
) {
    val barCount = 60
    val bars = remember { List(barCount) { (0.2f..1f).random() } }
    var animatedBars by remember { mutableStateOf(bars) }

    LaunchedEffect(isPlaying) {
        while (isPlaying) {
            kotlinx.coroutines.delay(100)
            animatedBars = List(barCount) { (0.2f..1f).random() }
        }
    }

    Canvas(modifier = modifier) {
        val barWidth = (size.width / barCount) * 0.7f
        val spacing = size.width / barCount

        animatedBars.forEachIndexed { index, height ->
            val barHeight = size.height * height
            val x = index * spacing + (spacing - barWidth) / 2

            drawRect(
                color = NeonPurple.copy(alpha = 0.8f),
                topLeft = Offset(x, (size.height - barHeight) / 2),
                size = androidx.compose.ui.geometry.Size(barWidth, barHeight)
            )
        }
    }
}

// Data Classes
data class SessionParticipant(
    val id: String,
    val name: String,
    val avatarUri: String?,
    val initiative: Int,
    val currentHp: Int,
    val maxHp: Int,
    val isPlayer: Boolean,
    val isCurrentTurn: Boolean,
    val isOnline: Boolean,
    val position: Offset = Offset.Zero
) {
    fun toToken() = MapToken(id, name, avatarUri, position, isPlayer)
}

data class MapToken(
    val id: String,
    val name: String,
    val avatarUri: String?,
    val position: Offset,
    val isPlayer: Boolean
)

data class LogEntry(
    val actor: String,
    val message: String,
    val icon: ImageVector,
    val color: Color
)
