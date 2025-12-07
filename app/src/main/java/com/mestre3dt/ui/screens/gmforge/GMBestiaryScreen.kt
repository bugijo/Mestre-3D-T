package com.mestre3dt.ui.screens.gmforge

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.mestre3dt.ui.layout.GMSectionTitle
import com.mestre3dt.ui.theme.GlassBorder
import com.mestre3dt.ui.theme.GlassSurface
import com.mestre3dt.ui.theme.NeonGreen
import com.mestre3dt.ui.theme.NeonPurple
import com.mestre3dt.ui.theme.TextGray
import com.mestre3dt.ui.theme.TextWhite

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun GMBestiaryScreen(entries: List<BestiaryEntry>) {
    var query by remember { mutableStateOf("") }
    var selectedTag by remember { mutableStateOf<String?>(null) }
    val availableTags = remember(entries) { entries.flatMap { it.tags }.distinct().sorted() }
    val filtered = entries.filter {
        val matchesQuery = query.isBlank() ||
            it.name.contains(query, ignoreCase = true) ||
            it.tags.any { tag -> tag.contains(query, ignoreCase = true) }
        val matchesTag = selectedTag == null || it.tags.contains(selectedTag)
        matchesQuery && matchesTag
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            GMSectionTitle("LORE & BESTIARY")
            Text(
                "${filtered.size} criaturas",
                color = TextGray,
                fontSize = 14.sp
            )
        }

        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            placeholder = { Text("Buscar por nome ou tag") },
            modifier = Modifier.fillMaxWidth()
        )

        if (availableTags.isNotEmpty()) {
            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                TagFilterChip(
                    text = "Todas",
                    selected = selectedTag == null,
                    onClick = { selectedTag = null }
                )

                availableTags.forEach { tag ->
                    TagFilterChip(
                        text = tag,
                        selected = selectedTag == tag,
                        onClick = { selectedTag = tag }
                    )
                }
            }
        }

        val featured = filtered.maxByOrNull { it.threatScore } ?: filtered.firstOrNull()
        if (featured != null) {
            FeaturedMonsterCard(entry = featured)
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "Bestiário",
                color = TextGray,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp
            )
            if (filtered.isEmpty()) {
                Text("Nenhum resultado", color = TextGray, fontSize = 12.sp)
            }
        }

        if (filtered.isEmpty()) {
            EmptyState()
        } else {
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(filtered) { entry ->
                    MonsterCard(entry = entry)
                }
            }
        }
    }
}

@Composable
private fun FeaturedMonsterCard(entry: BestiaryEntry) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(260.dp),
        colors = CardDefaults.cardColors(containerColor = GlassSurface),
        shape = RoundedCornerShape(20.dp),
        border = GlassBorder
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(entry.imageUri)
                    .crossfade(true)
                    .build(),
                contentDescription = entry.name,
                modifier = Modifier
                    .matchParentSize()
                    .clip(RoundedCornerShape(20.dp)),
                contentScale = ContentScale.Crop,
                alpha = 0.45f
            )

            Box(
                modifier = Modifier
                    .matchParentSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                Color(0xAA0C081A),
                                Color(0xAA0C081A)
                            )
                        )
                    )
            )

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        "FEATURED MONSTER",
                        color = NeonGreen,
                        fontSize = 12.sp,
                        letterSpacing = 2.sp
                    )
                    Text(
                        entry.name,
                        color = TextWhite,
                        fontSize = 26.sp,
                        fontWeight = FontWeight.Black
                    )
                    Text(
                        entry.description,
                        color = TextGray,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    entry.tags.take(3).forEach { tag ->
                        TagChip(tag)
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    AttributeBar("HP", entry.currentHp, entry.maxHp, Color(0xFF00E676))
                    AttributeBar("MP", entry.currentMp ?: 0, entry.maxMp ?: 0, NeonPurple)
                    AttributeBar("CR", entry.challengeRating, 30, Color(0xFFFFC107))
                }
            }
        }
    }
}

@Composable
private fun MonsterCard(entry: BestiaryEntry) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = GlassSurface),
        shape = RoundedCornerShape(16.dp),
        border = GlassBorder
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0x3300FFAA)),
                    contentAlignment = Alignment.Center
                ) {
                    AsyncImage(
                        model = entry.imageUri,
                        contentDescription = entry.name,
                        modifier = Modifier.matchParentSize(),
                        contentScale = ContentScale.Crop
                    )
                }

                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(entry.name, color = TextWhite, fontWeight = FontWeight.Bold)
                    Text(entry.type, color = TextGray, fontSize = 12.sp)
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                entry.tags.take(2).forEach { TagChip(it) }
            }

            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                AttributeProgress("Força", entry.strength)
                AttributeProgress("Habilidade", entry.skill)
                AttributeProgress("Resistência", entry.resistance)
                AttributeProgress("Armadura", entry.armor)
                AttributeProgress("PdF", entry.firepower)
            }

            if (entry.powers.isNotEmpty()) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Poderes", color = TextGray, fontSize = 12.sp)
                    entry.powers.take(3).forEach { power ->
                        Text("• $power", color = TextWhite, fontSize = 12.sp)
                    }
                    if (entry.powers.size > 3) {
                        Text(
                            "+${entry.powers.size - 3} extras",
                            color = NeonPurple,
                            fontSize = 11.sp
                        )
                    }
                }
            }

            TextButton(onClick = { /* Future: open detail */ }) {
                Text("Ver detalhes", color = NeonPurple)
            }
        }
    }
}

@Composable
private fun AttributeProgress(label: String, value: Int) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(label, color = TextGray, fontSize = 12.sp)
            Text(value.toString(), color = TextWhite, fontWeight = FontWeight.Bold)
        }
        LinearProgressIndicator(
            progress = { (value / 6f).coerceIn(0f, 1f) },
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp)
                .clip(RoundedCornerShape(12.dp)),
            color = NeonPurple,
            trackColor = Color(0x33000000)
        )
    }
}

@Composable
private fun AttributeBar(label: String, current: Int, max: Int, color: Color) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(label, color = TextGray, fontSize = 12.sp)
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Box(
                modifier = Modifier
                    .height(8.dp)
                    .weight(1f)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0x33000000))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(fraction = if (max == 0) 0f else (current / max.toFloat()).coerceIn(0f, 1f))
                        .fillMaxHeight()
                        .clip(RoundedCornerShape(12.dp))
                        .background(color)
                )
            }
            Text("$current/$max", color = TextWhite, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun TagChip(text: String) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0x2200FFAA))
            .border(1.dp, NeonGreen.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
            .padding(horizontal = 10.dp, vertical = 6.dp)
    ) {
        Text(text.uppercase(), color = NeonGreen, fontSize = 11.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun TagFilterChip(text: String, selected: Boolean, onClick: () -> Unit) {
    val background = if (selected) NeonPurple.copy(alpha = 0.15f) else Color(0x2200FFAA)
    val borderColor = if (selected) NeonPurple else NeonGreen.copy(alpha = 0.4f)
    val contentColor = if (selected) TextWhite else NeonGreen

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(14.dp))
            .background(background)
            .border(1.dp, borderColor, RoundedCornerShape(14.dp))
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 8.dp)
    ) {
        Text(text.uppercase(), color = contentColor, fontSize = 11.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun EmptyState() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Nada encontrado", color = TextWhite, fontWeight = FontWeight.Bold)
        Text(
            "Ajuste a busca ou filtros para visualizar criaturas.",
            color = TextGray,
            fontSize = 12.sp
        )
    }
}

@Immutable
data class BestiaryEntry(
    val id: String,
    val name: String,
    val type: String,
    val description: String,
    val imageUri: String?,
    val strength: Int,
    val skill: Int,
    val resistance: Int,
    val armor: Int,
    val firepower: Int,
    val maxHp: Int,
    val currentHp: Int,
    val maxMp: Int?,
    val currentMp: Int?,
    val tags: List<String>,
    val challengeRating: Int,
    val powers: List<String>
) {
    val threatScore: Int = strength + skill + resistance + armor + firepower + challengeRating
}
