package com.mestre3dt

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import org.junit.Rule
import org.junit.Test

class MestreAppSmokeTest {

    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun dashboard_showsBackupCard_andAllowsNavigation() {
        composeRule.onNodeWithText("Backup em nuvem").assertIsDisplayed()
        composeRule.onNodeWithText("Sessão").performClick()
        composeRule.onNodeWithText("Mesa do Mestre 3D&T").assertIsDisplayed()
    }

    @Test
    fun sound_tab_showsLocalPanel() {
        composeRule.onNodeWithText("Som").performClick()
        composeRule.onNodeWithText("Painel de som local").assertIsDisplayed()
    }
}
