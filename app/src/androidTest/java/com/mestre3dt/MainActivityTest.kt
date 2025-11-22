package com.mestre3dt

import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class MainActivityTest {

    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun whenNavigatingTabs_sectionsAreVisible() {
        composeRule.onNodeWithText("Dashboard").assertExists()
        composeRule.onNodeWithText("Sessão").performClick()
        composeRule.onNodeWithText("Sessão em andamento").assertExists()

        composeRule.onNodeWithText("Campanhas").performClick()
        composeRule.onNodeWithText("Campanhas e cenas").assertExists()

        composeRule.onNodeWithText("NPCs").performClick()
        composeRule.onNodeWithText("NPCs").assertExists()

        composeRule.onNodeWithText("Combate").performClick()
        composeRule.onNodeWithText("Encontro atual").assertExists()

        composeRule.onNodeWithText("Som").performClick()
        composeRule.onNodeWithText("Painel de som local").assertExists()
    }
}
