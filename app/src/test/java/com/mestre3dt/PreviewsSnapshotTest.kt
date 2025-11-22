package com.mestre3dt

import androidx.compose.material3.ExperimentalMaterial3Api
import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.mestre3dt.ui.theme.Mestre3DTTheme
import org.junit.Rule
import org.junit.Test

class PreviewsSnapshotTest {
    @get:Rule
    val paparazzi = Paparazzi(
        deviceConfig = DeviceConfig.PIXEL_5.copy(softButtons = false)
    )

    @OptIn(ExperimentalMaterial3Api::class)
    @Test
    fun dashboardPreview() {
        paparazzi.snapshot(name = "dashboard") {
            Mestre3DTTheme { DashboardScreen(uiState = previewUiState(), onPushSync = {}, onPullSync = {}) }
        }
    }

    @OptIn(ExperimentalMaterial3Api::class)
    @Test
    fun sessionPreview() {
        paparazzi.snapshot(name = "session") {
            Mestre3DTTheme {
                SessionScreen(
                    uiState = previewUiState(),
                    onAdjustHp = { _, _ -> },
                    onAdjustMp = { _, _ -> },
                    onToggleDown = {},
                    onRemoveEnemy = {},
                    onAddNote = { _, _ -> },
                    onAddTrigger = { _, _, _, _ -> },
                    onUpdateTrigger = { _, _, _, _, _ -> },
                    onRemoveTrigger = { _, _, _, _ -> },
                    onStartSession = {},
                    onEndSession = {},
                    onResetEncounter = {}
                )
            }
        }
    }

    @Test
    fun campaignsPreview() {
        paparazzi.snapshot(name = "campaigns") {
            Mestre3DTTheme {
                CampaignsScreen(
                    uiState = previewUiState(),
                    onAddCampaign = {},
                    onAddArc = { _, _ -> },
                    onAddScene = { _, _, _ -> },
                    onSetActiveCampaign = {},
                    onSetActiveArc = {},
                    onSetActiveScene = {}
                )
            }
        }
    }

    @Test
    fun npcsPreview() {
        paparazzi.snapshot(name = "npcs") {
            Mestre3DTTheme { NpcsScreen(npcs = previewUiState().npcs, onAddTrigger = { _, _ -> }, onUpdateTrigger = { _, _, _ -> }, onRemoveTrigger = { _, _ -> }) }
        }
    }

    @Test
    fun enemiesPreview() {
        paparazzi.snapshot(name = "enemies") {
            Mestre3DTTheme {
                EnemiesScreen(
                    enemies = previewUiState().enemies,
                    onAddEnemy = {},
                    onUpdateEnemy = { _, _ -> },
                    onRemoveEnemy = {},
                    onAddPower = { _, _ -> },
                    onUpdatePower = { _, _, _ -> },
                    onRemovePower = { _, _ -> },
                    onAddInstance = { _, _ -> },
                    onReset = {}
                )
            }
        }
    }

    @Test
    fun soundPreview() {
        paparazzi.snapshot(name = "sound") {
            Mestre3DTTheme {
                SoundScreen(
                    soundScenes = previewUiState().soundScenes,
                    activeIndex = 0,
                    isPlaying = false,
                    preferences = previewUiState().soundPreferences,
                    onSelect = {},
                    onTogglePlay = {},
                    onSetBackground = { _, _ -> },
                    onAddEffect = { _, _ -> },
                    onPreferencesChanged = {}
                )
            }
        }
    }
}
