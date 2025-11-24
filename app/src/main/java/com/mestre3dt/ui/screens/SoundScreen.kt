package com.mestre3dt.ui.screens

import android.content.Intent
import android.media.MediaPlayer
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import com.mestre3dt.data.SoundAsset
import com.mestre3dt.data.SoundEffect
import com.mestre3dt.data.SoundScene

@Composable
fun SoundScreen(
    soundScenes: List<SoundScene>,
    activeIndex: Int,
    isPlaying: Boolean,
    musicVolume: Float,
    sfxVolume: Float,
    onSelect: (Int) -> Unit,
    onTogglePlay: () -> Unit,
    onSetBackground: (Int, SoundAsset) -> Unit,
    onAddEffect: (Int, SoundEffect) -> Unit,
    onSetMusicVolume: (Float) -> Unit,
    onSetSfxVolume: (Float) -> Unit
) {
    val context = LocalContext.current
    val backgroundPlayer = remember { ExoPlayer.Builder(context).build() }
    DisposableEffect(backgroundPlayer) {
        onDispose { backgroundPlayer.release() }
    }

    LaunchedEffect(musicVolume) {
        backgroundPlayer.volume = musicVolume
    }

    val effectPlayer: (Uri) -> Unit = remember(sfxVolume) {
        { uri ->
            MediaPlayer.create(context, uri)?.apply {
                setVolume(sfxVolume, sfxVolume)
                setOnCompletionListener { release() }
                start()
            }
        }
    }

    LaunchedEffect(activeIndex, soundScenes, isPlaying) {
        val scene = soundScenes.getOrNull(activeIndex)
        val bgUri = scene?.background?.uri
        if (bgUri != null) {
            backgroundPlayer.setMediaItem(MediaItem.fromUri(bgUri))
            backgroundPlayer.prepare()
            if (isPlaying) backgroundPlayer.play() else backgroundPlayer.pause()
        } else {
            backgroundPlayer.stop()
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text("Painel de som local", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            OutlinedCard(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text("Volume Geral", style = MaterialTheme.typography.titleSmall)
                    Text("Música: ${(musicVolume * 100).toInt()}%", style = MaterialTheme.typography.bodySmall)
                    Slider(
                        value = musicVolume,
                        onValueChange = onSetMusicVolume,
                        valueRange = 0f..1f
                    )
                    Text("Efeitos: ${(sfxVolume * 100).toInt()}%", style = MaterialTheme.typography.bodySmall)
                    Slider(
                        value = sfxVolume,
                        onValueChange = onSetSfxVolume,
                        valueRange = 0f..1f
                    )
                }
            }
        }

        if (soundScenes.isEmpty()) {
            item {
                Text("Não há cenas de som para exibir.")
            }
        }

        items(soundScenes.size) { index ->
            val scene = soundScenes[index]
            val backgroundPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
                if (uri != null) {
                    context.contentResolver.takePersistableUriPermission(
                        uri,
                        Intent.FLAG_GRANT_READ_URI_PERMISSION
                    )
                    onSetBackground(index, SoundAsset(name = scene.name, uri = uri.toString()))
                }
            }

            val effectPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
                if (uri != null) {
                    context.contentResolver.takePersistableUriPermission(
                        uri,
                        Intent.FLAG_GRANT_READ_URI_PERMISSION
                    )
                    onAddEffect(index, SoundEffect(name = "SFX ${scene.effects.size + 1}", uri = uri.toString()))
                }
            }
            OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(scene.name, style = MaterialTheme.typography.titleSmall)
                            Text(
                                "Trilha: ${scene.background?.name ?: "selecione um arquivo"}",
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                        OutlinedButton(onClick = { onSelect(index) }) {
                            Text(if (activeIndex == index) "Ativa" else "Ativar")
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(onClick = { backgroundPicker.launch(arrayOf("audio/*")) }) {
                            Text("Escolher trilha")
                        }
                        OutlinedButton(onClick = { effectPicker.launch(arrayOf("audio/*")) }) {
                            Text("Adicionar SFX")
                        }
                    }
                    if (scene.effects.isNotEmpty()) {
                        Text("Efeitos:", style = MaterialTheme.typography.labelLarge)
                        scene.effects.forEach { effect ->
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    "• ${effect.name} ${if (effect.uri == null) "(selecionar arquivo)" else ""}",
                                    style = MaterialTheme.typography.bodySmall,
                                    modifier = Modifier.weight(1f)
                                )
                                OutlinedButton(onClick = {
                                    effect.uri?.let { effectPlayer(Uri.parse(it)) }
                                }, enabled = effect.uri != null) {
                                    Text("Tocar")
                                }
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    OutlinedButton(onClick = onTogglePlay, enabled = scene.background?.uri != null) {
                        Text(
                            when {
                                scene.background?.uri == null -> "Selecione uma trilha"
                                isPlaying && activeIndex == index -> "Pausar trilha"
                                else -> "Tocar trilha"
                            }
                        )
                    }
                }
            }
        }
    }
}
