package com.mestre3dt.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.pagerTabIndicatorOffset
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material3.DismissValue
import androidx.compose.material3.SwipeToDismiss
import androidx.compose.material3.rememberDismissState
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.mestre3dt.data.models.*
import com.mestre3dt.ui.theme.*
import kotlinx.coroutines.launch

/**
 * SESSION COCKPIT - The DM's Command Center
 * Premium AAA interface with Arcane Dark theme
 */
@OptIn(ExperimentalFoundationApi::class, ExperimentalMaterial3Api::class)
@Composable
fun SessionCockpitScreen(
    combat: Combat?,
    scene: Scene?,
    onDamageParticipant: (String, Int) -> Unit,
    onAddCondition: (String, Condition) -> Unit,
    onRemoveCondition: (String, String) -> Unit,
    onNextTurn: () -> Unit,
    onEndCombat: () -> Unit
) {
    val pagerState = rememberPagerState(
        initialPage = 0,
        initialPageOffsetFraction = 0f,
        pageCount = { 4 }
    )
    val scope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF1A1A2E),
                        Color(0xFF0F0F1E)
                    )
                )
            )
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Header
            SessionHeader(
                scene = scene,
                combat = combat
            )

            // Tab Row
            TabRow(
                selectedTabIndex = pagerState.currentPage,
                containerColor = SurfaceVariant,
                contentColor = TextPrimary,
                indicator = { tabPositions ->
                    TabRowDefaults.Indicator(
                        Modifier.pagerTabIndicatorOffset(pagerState, tabPositions),
                        color = PrimaryPurple,
                        height = 4.dp
                    )
                }
            ) {
                Tab(
                    selected = pagerState.currentPage == 0,
                    onClick = { scope.launch { pagerState.animateScrollToPage(0) } },
                    icon = { Icon(Icons.Default.Map, null) },
                    text = { Text("Mapa") }
                )
                Tab(
                    selected = pagerState.currentPage == 1,
                    onClick = { scope.launch { pagerState.animateScrollToPage(1) } },
                    icon = { Icon(Icons.Default.Shield, null) },
                    text = { Text("Combate") }
                )
                Tab(
                    selected = pagerState.currentPage == 2,
                    onClick = { scope.launch { pagerState.animateScrollToPage(2) } },
                    icon = { Icon(Icons.Default.Description, null) },
                    text = { Text("Notas") }
                )
                Tab(
                    selected = pagerState.currentPage == 3,
                    onClick = { scope.launch { pagerState.animateScrollToPage(3) } },
                    icon = { Icon(Icons.Default.Casino, null) },
                    text = { Text("Dados") }
                )
            }

            // Pager Content
            HorizontalPager(
                pageCount = 4,
                state = pagerState,
                modifier = Modifier.weight(1f)
            ) { page ->
                when (page) {
                    0 -> MapTab(scene = scene)
                    1 -> CombatTab(
                        combat = combat,
                        onDamage = onDamageParticipant,
                        onAddCondition = onAddCondition,
                        onNextTurn = onNextTurn
                    )
                    2 -> NotesTab(scene = scene)
                    3 -> DiceTab()
                }
            }

            // Footer - Music Player
            scene?.soundtrackId?.let {
                MusicPlayerBar(soundtrackId = it)
            }
        }
    }
}

@Composable
fun SessionHeader(
    scene: Scene?,
    combat: Combat?
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = SurfaceContainer,
        tonalElevation = 4.dp
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = scene?.name ?: "Sem cena ativa",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = scene?.mood?.uppercase() ?: "",
                        style = MaterialTheme.typography.labelMedium,
                        color = PrimaryPurple
                    )
                }

                if (combat?.isActive == true) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = CriticalRed.copy(alpha = 0.2f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, CriticalRed)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.SportsMma,
                                contentDescription = null,
                                tint = CriticalRed,
                                modifier = Modifier.size(20.dp)
                            )
                            Text(
                                "ROUND ${combat.round}",
                                fontWeight = FontWeight.Bold,
                                color = CriticalRed,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
            }

            // Quick Stats
            combat?.let {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    StatChip(
                        icon = Icons.Default.People,
                        label = "Combatentes",
                        value = "${it.participants.size}",
                        color = Info
                    )
                    StatChip(
                        icon = Icons.Default.Favorite,
                        label = "Vivos",
                        value = "${it.participants.count { p -> !p.isDefeated }}",
                        color = Success
                    )
                }
            }
        }
    }
}

@Composable
fun StatChip(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String,
    color: Color
) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            icon,
            contentDescription = null,
            tint = color,
            modifier = Modifier.size(16.dp)
        )
        Text(
            "$label: $value",
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary
        )
    }
}

@Composable
fun MapTab(scene: Scene?) {
    var scale by remember { mutableStateOf(1f) }
    var offset by remember { mutableStateOf(Offset.Zero) }
    var rotation by remember { mutableStateOf(0f) }

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        if (scene?.mapImageUri != null) {
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(scene.mapImageUri)
                    .crossfade(true)
                    .build(),
                contentDescription = "Mapa da cena",
                contentScale = ContentScale.Fit,
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer {
                        scaleX = scale.coerceIn(0.5f, 5f)
                        scaleY = scale.coerceIn(0.5f, 5f)
                        translationX = offset.x
                        translationY = offset.y
                        rotationZ = rotation
                    }
                    .pointerInput(Unit) {
                        detectTransformGestures { _, pan, zoom, rotate ->
                            scale *= zoom
                            offset += pan
                            rotation += rotate
                        }
                    }
            )

            // Reset button
            FloatingActionButton(
                onClick = {
                    scale = 1f
                    offset = Offset.Zero
                    rotation = 0f
                },
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(16.dp),
                containerColor = SurfaceContainer
            ) {
                Icon(Icons.Default.Refresh, "Reset View")
            }
        } else {
            EmptyStateCard(
                icon = Icons.Default.Map,
                title = "Sem Mapa",
                subtitle = "Adicione um mapa à cena para visualizar aqui"
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CombatTab(
    combat: Combat?,
    onDamage: (String, Int) -> Unit,
    onAddCondition: (String, Condition) -> Unit,
    onNextTurn: () -> Unit
) {
    if (combat == null || !combat.isActive) {
        EmptyStateCard(
            icon = Icons.Default.Shield,
            title = "Nenhum Combate Ativo",
            subtitle = "Inicie um combate para \ngerenciar a iniciativa"
        )
        return
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // Turn indicator
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(SurfaceContainer)
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "Turno Atual:",
                style = MaterialTheme.typography.titleMedium,
                color = TextSecondary
            )
            val currentParticipant = combat.participants.getOrNull(combat.currentTurnIndex)
            Text(
                currentParticipant?.name ?: "—",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = PrimaryPurple
            )
            Button(
                onClick = onNextTurn,
                colors = ButtonDefaults.buttonColors(
                    containerColor = PrimaryPurple
                )
            ) {
                Icon(Icons.Default.NavigateNext, null)
                Spacer(Modifier.width(8.dp))
                Text("Próximo")
            }
        }

        // Participants List
        LazyColumn(
            modifier = Modifier.weight(1f).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(combat.participants) { participant ->
                CombatParticipantCard(
                    participant = participant,
                    isCurrentTurn = combat.participants[combat.currentTurnIndex].id == participant.id,
                    onDamage = { amount -> onDamage(participant.id, amount) },
                    onAddCondition = { condition -> onAddCondition(participant.id, condition) }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CombatParticipantCard(
    participant: CombatParticipant,
    isCurrentTurn: Boolean,
    onDamage: (Int) -> Unit,
    onAddCondition: (Condition) -> Unit
) {
    var showQuickActions by remember { mutableStateOf(false) }
    
    val dismissState = rememberDismissState(
        confirmValueChange = { dismissValue ->
            when (dismissValue) {
                DismissValue.DismissedToEnd -> {
                    onAddCondition(
                        Condition(
                            type = ConditionType.BURNING,
                            name = "Queimando",
                            value = 2,
                            duration = 3
                        )
                    )
                    false
                }
                else -> false
            }
        }
    )

    SwipeToDismiss(
        state = dismissState,
        background = {
            Box(
                Modifier
                    .fillMaxSize()
                    .background(Burning.copy(alpha = 0.3f))
                    .padding(horizontal = 20.dp),
                contentAlignment = Alignment.CenterStart
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Default.Whatshot, "Burn", tint = Burning, modifier = Modifier.size(32.dp))
                    Text("QUEIMANDO", fontWeight = FontWeight.Bold, color = Burning, fontSize = 18.sp)
                }
            }
        },
        dismissContent = {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = if (isCurrentTurn) SurfaceContainerHigh else Surface
                ),
                elevation = CardDefaults.elevatedCardElevation(
                    if (isCurrentTurn) 12.dp else 4.dp
                ),
                shape = RoundedCornerShape(16.dp),
                border = if (isCurrentTurn) androidx.compose.foundation.BorderStroke(2.dp, PrimaryPurple) else null
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    // Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(
                                modifier = Modifier.size(48.dp),
                                shape = CircleShape,
                                color = if (participant.isPlayer) Info.copy(alpha = 0.2f) else CriticalRed.copy(alpha = 0.2f)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        if (participant.isPlayer) Icons.Default.Person else Icons.Default.Shield,
                                        contentDescription = null,
                                        tint = if (participant.isPlayer) Info else CriticalRed
                                    )
                                }
                            }
                            Column {
                                Text(
                                    participant.name,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                Text(
                                    "Iniciativa: ${participant.initiative}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextSecondary
                                )
                            }
                        }

                        IconButton(onClick = { showQuickActions = !showQuickActions }) {
                            Icon(Icons.Default.MoreVert, null, tint = TextSecondary)
                        }
                    }

                    // HP Bar
                    val hpPercentage = participant.currentHp.toFloat() / participant.maxHp
                    val animatedProgress by animateFloatAsState(
                        targetValue = hpPercentage.coerceIn(0f, 1f),
                        animationSpec = tween(500)
                    )

                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("PV", fontWeight = FontWeight.Bold, color = HealthGreen, fontSize = 12.sp)
                            Text(
                                "${participant.currentHp}/${participant.maxHp}",
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary,
                                fontSize = 14.sp
                            )
                        }
                        LinearProgressIndicator(
                            progress = animatedProgress,
                            modifier = Modifier.fillMaxWidth().height(12.dp).clip(RoundedCornerShape(6.dp)),
                            color = when {
                                hpPercentage < 0.25f -> CriticalRed
                                hpPercentage < 0.5f -> Warning
                                else -> HealthGreen
                            },
                            trackColor = Surface
                        )
                    }

                    // MP Bar (if exists)
                    participant.maxMp?.let { maxMp ->
                        val mpPercentage = (participant.currentMp ?: 0).toFloat() / maxMp
                        val animatedMpProgress by animateFloatAsState(
                            targetValue = mpPercentage.coerceIn(0f, 1f),
                            animationSpec = tween(500)
                        )

                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("PM", fontWeight = FontWeight.Bold, color = ManaBlue, fontSize = 12.sp)
                                Text(
                                    "${participant.currentMp ?: 0}/$maxMp",
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary,
                                    fontSize = 14.sp
                                )
                            }
                            LinearProgressIndicator(
                                progress = animatedMpProgress,
                                modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                                color = ManaBlue,
                                trackColor = Surface
                            )
                        }
                    }

                    // Conditions
                    if (participant.activeConditions.isNotEmpty()) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            participant.activeConditions.forEach { condition ->
                                ConditionChip(condition)
                            }
                        }
                    }

                    // Quick Actions
                    AnimatedVisibility(visible = showQuickActions) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = { onDamage(-5) },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = CriticalRed)
                            ) {
                                Text("-5 PV")
                            }
                            Button(
                                onClick = { onDamage(-1) },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = Warning)
                            ) {
                                Text("-1 PV")
                            }
                            OutlinedButton(
                                onClick = { onDamage(5) },
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("+5 PV")
                            }
                        }
                    }
                }
            }
        }
    )
}

@Composable
fun ConditionChip(condition: Condition) {
    val color =when (condition.type) {
        ConditionType.BURNING -> Burning
        ConditionType.POISONED -> Poisoned
        ConditionType.PARALYZED -> Paralyzed
        ConditionType.BLEEDING -> Bleeding
        else -> TextSecondary
    }

    Surface(
        shape = RoundedCornerShape(8.dp),
        color = color.copy(alpha = 0.2f),
        border = androidx.compose.foundation.BorderStroke(1.dp, color)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                condition.name,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = color
            )
            if (condition.duration > 0) {
                Text("(${condition.duration})", fontSize = 10.sp, color = color)
            }
        }
    }
}

@Composable
fun NotesTab(scene: Scene?) {
    if (scene == null) {
        EmptyStateCard(
            icon = Icons.Default.Description,
            title = "Sem Cena Ativa",
            subtitle = "Selecione uma cena para ver as notas"
        )
        return
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            NoteCard(
                title = "🎯 Objetivo",
                content = scene.objective,
                color = PrimaryPurple
            )
        }
        item {
            NoteCard(
                title = "📖 Opening",
                content = scene.opening,
                color = Info
            )
        }
        if (scene.hooks.isNotEmpty()) {
            item {
                NoteCard(
                    title = "🪝 Ganchos",
                    content = scene.hooks.joinToString("\n") { "• $it" },
                    color = Success
                )
            }
        }
    }
}

@Composable
fun NoteCard(title: String, content: String, color: Color) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Surface
        ),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.elevatedCardElevation(4.dp)
    ) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(
                title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = color
            )
            Text(
                content,
                style = MaterialTheme.typography.bodyLarge,
                color = TextPrimary,
                lineHeight = 24.sp
            )
        }
    }
}

@Composable
fun DiceTab() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            Icons.Default.Casino,
            contentDescription = null,
            modifier = Modifier.size(80.dp),
            tint = PrimaryPurple.copy(alpha = 0.5f)
        )
        Spacer(Modifier.height(16.dp))
        Text(
            "Rolador de Dados",
            style = MaterialTheme.typography.headlineMedium,
            color = TextPrimary
        )
        Text(
            "Em breve...",
            style = MaterialTheme.typography.bodyLarge,
            color = TextSecondary
        )
    }
}

@Composable
fun MusicPlayerBar(soundtrackId: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = SurfaceContainer,
        tonalElevation = 2.dp
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Icon(Icons.Default.MusicNote, null, tint = PrimaryPurple)
            Text(
                "Epic Battle Theme",
                modifier = Modifier.weight(1f),
                color = TextPrimary
            )
            IconButton(onClick = {}) {
                Icon(Icons.Default.PlayArrow, null, tint = Success)
            }
            IconButton(onClick = {}) {
                Icon(Icons.Default.Pause, null)
            }
            IconButton(onClick = {}) {
                Icon(Icons.Default.Loop, null)
            }
        }
    }
}

@Composable
fun EmptyStateCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(40.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Surface(
            modifier = Modifier.size(100.dp),
            shape = CircleShape,
            color = SurfaceContainer
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    icon,
                    contentDescription = null,
                    modifier = Modifier.size(48.dp),
                    tint = TextHint
                )
            }
        }
        Spacer(Modifier.height(24.dp))
        Text(
            title,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = TextPrimary
        )
        Spacer(Modifier.height(8.dp))
        Text(
            subtitle,
            style = MaterialTheme.typography.bodyLarge,
            color = TextSecondary,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center
        )
    }
}
