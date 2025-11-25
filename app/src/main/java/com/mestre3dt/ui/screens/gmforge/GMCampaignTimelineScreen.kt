package com.mestre3dt.ui.screens.gmforge

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mestre3dt.ui.layout.GMSectionTitle
import com.mestre3dt.ui.layout.GlassPanel
import com.mestre3dt.ui.theme.*
import kotlin.math.cos
import kotlin.math.sin

/**
 * GM FORGE CAMPAIGN TIMELINE
 * Visual node-based scene progression with Canvas connections
 */
@Composable
fun GMCampaignTimelineScreen(
    scenes: List<TimelineScene>,
    onSceneClick: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        GMSectionTitle("CAMPAIGN TIMELINE")

        GlassPanel(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(40.dp)
            ) {
                // Canvas for drawing connections
                Canvas(modifier = Modifier.fillMaxSize()) {
                    // Draw connections between scenes
                    for (i in 0 until scenes.size - 1) {
                        val current = scenes[i]
                        val next = scenes[i + 1]

                        val startOffset = calculateNodePosition(i, scenes.size, size.width, size.height)
                        val endOffset = calculateNodePosition(i + 1, scenes.size, size.width, size.height)

                        // Draw curved path
                        val path = Path().apply {
                            moveTo(startOffset.x, startOffset.y)
                            
                            // Control points for smooth curve
                            val controlX = (startOffset.x + endOffset.x) / 2
                            val controlY = startOffset.y
                            
                            quadraticBezierTo(
                                controlX, controlY,
                                endOffset.x, endOffset.y
                            )
                        }

                        drawPath(
                            path = path,
                            color = if (current.isCompleted && next.isCompleted) 
                                NeonGreen 
                            else if (current.isCompleted)
                                NeonPurple.copy(alpha = 0.5f)
                            else 
                                Color.White.copy(alpha = 0.2f),
                            style = Stroke(width = 3f)
                        )
                    }
                }

                // Scene nodes overlay
                scenes.forEachIndexed { index, scene ->
                    val position = calculateNodePosition(index, scenes.size, constraints.maxWidth.toFloat(), constraints.maxHeight.toFloat())
                    
                    TimelineNode(
                        scene = scene,
                        modifier = Modifier.offset(
                            x = (position.x - 80).dp,
                            y = (position.y - 80).dp
                        ),
                        onClick = { onSceneClick(scene.id) }
                    )
                }
            }
        }
    }
}

@Composable
fun TimelineNode(
    scene: TimelineScene,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Column(
        modifier = modifier
            .width(160.dp)
            .clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Node circle
        Surface(
            modifier = Modifier.size(120.dp),
            shape = CircleShape,
            color = when {
                scene.isActive -> NeonPurple.copy(alpha = 0.3f)
                scene.isCompleted -> NeonGreen.copy(alpha = 0.2f)
                else -> CardBackground
            },
            border = androidx.compose.foundation.BorderStroke(
                width = 3.dp,
                color = when {
                    scene.isActive -> NeonPurple
                    scene.isCompleted -> NeonGreen
                    else -> Color.White.copy(alpha = 0.3f)
                }
            )
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.padding(16.dp)
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    // Icon or image
                    Surface(
                        modifier = Modifier.size(48.dp),
                        shape = CircleShape,
                        color = when {
                            scene.isActive -> NeonPurple
                            scene.isCompleted -> NeonGreen
                            else -> GMDarkPanel
                        }
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                scene.type.icon,
                                fontSize = 24.sp,
                                color = if (scene.isCompleted || scene.isActive) GMDarkBackground else TextGray
                            )
                        }
                    }
                }
            }
        }

        // Scene title
        Text(
            scene.name.uppercase(),
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = when {
                scene.isActive -> NeonPurple
                scene.isCompleted -> TextWhite
                else -> TextGray
            },
            textAlign = TextAlign.Center,
            letterSpacing = 0.5.sp,
            lineHeight = 14.sp
        )

        // Description card (on hover/active)
        if (scene.isActive) {
            GlassPanel(
                modifier = Modifier
                    .width(200.dp)
                    .padding(8.dp)
            ) {
                Column(
                    modifier = Modifier.padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        scene.description,
                        fontSize = 10.sp,
                        color = TextGray,
                        lineHeight = 12.sp
                    )
                }
            }
        }
    }
}

fun calculateNodePosition(index: Int, total: Int, canvasWidth: Float, canvasHeight: Float): Offset {
    // Create a flowing timeline pattern
    val rows = (total + 2) / 3 // 3 nodes per row
    val row = index / 3
    val col = index % 3

    val horizontalSpacing = canvasWidth / 4
    val verticalSpacing = canvasHeight / (rows + 1)

    val x = horizontalSpacing * (col + 1)
    val y = verticalSpacing * (row + 1)

    return Offset(x, y)
}

// Data Classes
data class TimelineScene(
    val id: String,
    val name: String,
    val description: String,
    val type: SceneType,
    val isCompleted: Boolean,
    val isActive: Boolean
)

enum class SceneType(val icon: String) {
    TAVERN("🏠"),
    FOREST("🌲"),
    DUNGEON("🏰"),
    AMBUSH("⚔️"),
    DRAGON_LAIR("🐉"),
    RUINS("🗿"),
    BOSS("👑")
}
