package com.cheeselouise.romantiverse

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class BingoStoryScenesTest {
    @Test fun eachIllustratedTropeHasItsOwnCanonicalScene() {
        val labels = StorySceneArt.labels()
        assertEquals("Each mapped scene must be an independent composition", 96, labels.size)
        assertEquals("Never reuse a scene for a different trope", labels.size, StorySceneArt.uniqueSceneCount())
        assertEquals(StoryScene.entries.size, StorySceneArt.uniqueSceneCount())
        val canonical = listOf("Romance", "Christmas", "Fall", "Horror")
            .flatMap(BingoEngine::artworkPool).toSet()
        assertEquals(72, canonical.size)
        assertTrue("All original canonical scenes must remain mapped", labels.containsAll(canonical))
        assertEquals("Twenty-four independent multiplayer launch scenes added", 24, (labels - canonical).size)
        labels.forEach { label ->
            assertTrue("Missing story scene: $label", StorySceneArt.forLabel(label) != null)
        }
    }

    @Test fun everyRomanceTropeNowHasIndependentArtwork() {
        val romance = BingoEngine.pool("Romance")
        assertEquals(36, romance.size)
        romance.forEach { label ->
            assertTrue("Romance trope still has a generic icon: $label",
                StorySceneArt.forLabel(label) != null)
        }
        assertEquals(36, romance.mapNotNull(StorySceneArt::forLabel).toSet().size)
    }

    @Test fun everyChristmasTropeHasItsOwnArtwork() {
        val christmas = BingoEngine.pool("Christmas").toSet() - BingoEngine.pool("Romance").toSet()
        assertEquals(12, christmas.size)
        christmas.forEach { label ->
            assertTrue("Christmas trope still has a generic icon: $label",
                StorySceneArt.forLabel(label) != null)
        }
        assertEquals(12, christmas.mapNotNull(StorySceneArt::forLabel).toSet().size)
    }

    @Test fun everyCanonicalTropeHasExactlyOneDedicatedScene() {
        val romance = BingoEngine.pool("Romance").toSet()
        val seasonal = listOf("Christmas", "Fall", "Horror").flatMap { theme ->
            val additions = BingoEngine.artworkPool(theme).toSet() - romance
            assertEquals("Each seasonal theme must have 12 distinct tropes: $theme", 12, additions.size)
            additions
        }.toSet()
        val all = romance + seasonal
        assertEquals(72, all.size)
        assertEquals("No canonical trope may silently fall back to a shared icon", all, StorySceneArt.labels().intersect(all))
        assertEquals(all.size, all.mapNotNull(StorySceneArt::forLabel).toSet().size)
    }

    @Test fun sixMultiplayerLaunchScenesAreIndependentAndExactLabelOnly() {
        val launch = listOf(
            "Career versus love dilemma",
            "The entire town gets involved",
            "A relative gives unsolicited love advice",
            "Someone overhears the wrong half of a conversation",
            "A romantic deadline approaches",
            "Two people are forced to spend time together"
        )
        val art = launch.map { label ->
            requireNotNull(StorySceneArt.forLabel(label)) { "Missing multiplayer scene: $label" }
        }
        assertEquals("Each multiplayer scene must have its own composition", launch.size, art.toSet().size)
        assertNull(StorySceneArt.forLabel("career versus love dilemma"))
    }

    @Test fun secondMultiplayerLaunchBatchHasSixIndependentExactLabelScenes() {
        val launch = listOf(
            "A dramatic exit",
            "A beloved business must be saved",
            "Someone arrives at the last possible moment",
            "A coincidence",
            "A secret is discovered",
            "A surprise announcement"
        )
        val scenes = launch.map { label ->
            requireNotNull(StorySceneArt.forLabel(label)) { "Missing original scene: $label" }
        }
        assertEquals(6, scenes.toSet().size)
        assertNull(StorySceneArt.forLabel("a dramatic exit"))
        assertNull(StorySceneArt.forLabel("Someone arrives at the last possible moment!"))
    }


    @Test fun thirdMultiplayerLaunchBatchHasSixIndependentExactLabelScenes() {
        val launch = listOf(
            "A romantic realization",
            "An inconvenient romantic rival",
            "A sentimental family heirloom",
            "Someone changes their mind",
            "A stranger knows exactly what to say",
            "An emotional reunion"
        )
        val scenes = launch.map { label ->
            requireNotNull(StorySceneArt.forLabel(label)) { "Missing original scene: $label" }
        }
        assertEquals(6, scenes.toSet().size)
        assertNull(StorySceneArt.forLabel("a romantic realization"))
        assertNull(StorySceneArt.forLabel("An emotional reunion!"))
    }


    @Test fun christmasMultiplayerLaunchBatchHasSixDistinctNativeScenes() {
        val labels = listOf(
            "A Christmas carol",
            "An ugly sweater",
            "A snowball fight",
            "A Christmas ornament",
            "A sleigh ride",
            "A Christmas miracle"
        )
        val scenes = labels.map { label ->
            requireNotNull(StorySceneArt.forLabel(label)) { "Missing original scene: $label" }
        }
        assertEquals(6, scenes.toSet().size)
        assertNull(StorySceneArt.forLabel("a christmas carol"))
        assertNull(StorySceneArt.forLabel("A Christmas miracle!"))
    }

    @Test fun noGenericArtworkIsMisrepresentedAsAUniqueIllustration() {
        assertNull(StorySceneArt.forLabel("A ghost train"))
        assertNull(StorySceneArt.forLabel("An unlisted trope"))
        assertNull(StorySceneArt.forLabel("Made up trope"))
        assertNull(StorySceneArt.forLabel("Charming stranger"))
    }

    @Test fun visualUpgradeCannotChangeCardRulesOrFreeSquare() {
        val seed = 20261028L
        val card = BingoEngine.deal(BingoEngine.pool("Christmas"), seed)
        assertEquals(25, card.size)
        assertEquals(BingoEngine.FREE_LABEL, card[BingoEngine.CENTER])
        assertEquals(card, BingoEngine.deal(BingoEngine.pool("Christmas"), seed))
        assertEquals(100, BingoEngine.score(setOf(0, 1, 2, 3, 4)))
    }
}
