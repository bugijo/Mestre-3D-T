package com.mestre3dt

import com.mestre3dt.data.Arc
import com.mestre3dt.data.Campaign
import com.mestre3dt.data.InMemoryRepository
import com.mestre3dt.data.RollTrigger
import com.mestre3dt.data.Scene
import com.mestre3dt.data.SessionNote
import com.mestre3dt.data.Power
import com.mestre3dt.data.SoundAsset
import com.mestre3dt.data.SoundEffect
import com.mestre3dt.data.Npc
import com.mestre3dt.data.Enemy
import com.mestre3dt.data.SoundScene
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class InMemoryRepositoryTest {
    @Test
    fun addTriggerToScene_appendsTrigger() = runBlocking {
        val repository = InMemoryRepository()
        val trigger = RollTrigger(
            situation = "Teste",
            skill = "Persuasão",
            attribute = "Habilidade",
            difficulty = "10",
            onSuccess = "Ok",
            onFailure = "Falhou"
        )

        repository.addTriggerToScene(0, 0, 0, trigger)

        val campaigns = repository.campaigns.first()
        val triggers = campaigns.first().arcs.first().scenes.first().triggers
        assertTrue(triggers.contains(trigger))
        assertEquals(triggers.last(), trigger)
    }

    @Test
    fun addCampaign_insertsOnTop() = runBlocking {
        val repository = InMemoryRepository()
        val initialSize = repository.campaigns.first().size
        val newCampaign = Campaign(
            title = "Nova", synopsis = "Teste", genre = "fantasia", system = "3D&T",
            arcs = listOf(Arc(title = "A", synopsis = "", scenes = listOf(Scene(name = "1", goal = "", mood = "", openingText = "", hooks = emptyList()))))
        )

        repository.addCampaign(newCampaign)

        val campaigns = repository.campaigns.first()
        assertEquals(initialSize + 1, campaigns.size)
        assertEquals(newCampaign, campaigns.first())
    }

    @Test
    fun enemyCrud_updatesCollectionsAndPowers() = runBlocking {
        val repository = InMemoryRepository()
        val baseEnemy = repository.enemies.first().first()
        val updated = baseEnemy.copy(name = "Lorde", powers = emptyList())

        repository.updateEnemy(0, updated)
        repository.addPowerToEnemy(0, Power("Golpe", "Forte", 2, "Alvo", null, null, null))
        repository.updatePower(0, 0, Power("Golpe 2", "Mais forte", 3, "Alvo", "Teste", "Hit", "Miss"))
        repository.removePower(0, 0)
        repository.addEnemy(baseEnemy.copy(name = "Novo"))
        repository.removeEnemy(1)

        val enemies = repository.enemies.first()
        assertEquals(updated.name, enemies.first().name)
        assertTrue(enemies.first().powers.isEmpty(), "Poder removido deve deixar lista vazia")
        assertEquals(1, enemies.size)
    }

    @Test
    fun sceneCrudAndNotes_arePersisted() = runBlocking {
        val repository = InMemoryRepository()
        val trigger = RollTrigger("Situação", "Teste", "Hab", "10", "OK", "Falha")

        repository.addArc(0, Arc(title = "Novo arco", scenes = emptyList()))
        repository.addScene(0, 1, Scene(name = "Cena nova", goal = "", mood = "", openingText = "", hooks = emptyList()))
        repository.addTriggerToScene(0, 1, 0, trigger)
        repository.updateTriggerInScene(0, 1, 0, trigger.copy(difficulty = "12"))
        repository.removeTriggerFromScene(0, 1, 0)
        repository.addNote(SessionNote("Anotação", important = true))

        val campaigns = repository.campaigns.first()
        val scenes = campaigns[0].arcs[1].scenes
        assertEquals("Cena nova", scenes[0].name)
        assertTrue(scenes[0].triggers.isEmpty(), "Trigger removido deve ser refletido")
        assertEquals(1, repository.sessionNotes.first().size)
    }

    @Test
    fun npcTriggers_sound_andSets_applyUpdates() = runBlocking {
        val repository = InMemoryRepository()
        val npcTrigger = RollTrigger("Falar", "Persuadir", "Hab", "10", "Conta", "Não conta")

        repository.addTriggerToNpc(0, npcTrigger)
        repository.updateTriggerInNpc(0, 0, npcTrigger.copy(difficulty = "14"))
        repository.removeTriggerFromNpc(0, 0)

        repository.setSoundBackground(0, SoundAsset("Nova", uri = null))
        repository.addSoundEffect(0, SoundEffect("SFX", uri = null))

        val npcs = repository.npcs.first()
        assertTrue(npcs[0].triggers.isEmpty(), "Trigger removido do NPC deve refletir lista vazia")

        val soundScenes = repository.soundScenes.first()
        assertEquals("Nova", soundScenes[0].background?.name)
        assertEquals(1, soundScenes[0].effects.size)
    }

    @Test
    fun setterMethods_replaceCollections() = runBlocking {
        val repository = InMemoryRepository()
        val emptyEnemies = emptyList<com.mestre3dt.data.Enemy>()
        val emptyCampaigns = emptyList<Campaign>()
        val emptyNpcs = emptyList<com.mestre3dt.data.Npc>()
        val emptySounds = emptyList<com.mestre3dt.data.SoundScene>()
        val emptyNotes = emptyList<SessionNote>()

        repository.updateEnemies { emptyEnemies }
        repository.setCampaigns(emptyCampaigns)
        repository.setNpcs(emptyNpcs)
        repository.setEnemies(emptyEnemies)
        repository.setSoundScenes(emptySounds)
        repository.setNotes(emptyNotes)

        assertTrue(repository.enemies.first().isEmpty())
        assertTrue(repository.campaigns.first().isEmpty())
        assertTrue(repository.npcs.first().isEmpty())
        assertTrue(repository.soundScenes.first().isEmpty())
        assertTrue(repository.sessionNotes.first().isEmpty())
    }
}
