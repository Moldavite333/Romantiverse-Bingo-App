package com.cheeselouise.romantiverse

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class BingoStoryScenesTest {
    @Test fun eachIllustratedTropeHasItsOwnCanonicalScene() {
        val labels = StorySceneArt.labels()
        assertEquals("Each mapped scene must be an independent composition", 120, labels.size)
        assertEquals("Never reuse a scene for a different trope", labels.size, StorySceneArt.uniqueSceneCount())
        assertEquals(StoryScene.entries.size, StorySceneArt.uniqueSceneCount())
        val canonical = listOf("Romance", "Christmas", "Fall", "Horror")
            .flatMap(BingoEngine::artworkPool).toSet()
        assertEquals(72, canonical.size)
        assertTrue("All original canonical scenes must remain mapped", labels.containsAll(canonical))
        assertEquals("Forty-eight independent multiplayer launch scenes added", 48, (labels - canonical).size)
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


    @Test fun cheeseMultiplayerLaunchBatchHasSixIndependentExactLabelScenes() {
        val labels = listOf(
            "An old flame reappears",
            "Love is confessed in public",
            "A major change of plans",
            "An interruption",
            "Someone learns the true meaning of life",
            "A big-city person returns home"
        )
        val scenes = labels.map { label ->
            requireNotNull(StorySceneArt.forLabel(label)) { "Missing original scene: $label" }
        }
        assertEquals(6, scenes.toSet().size)
        assertNull(StorySceneArt.forLabel("An old flame reappears!"))
        assertNull(StorySceneArt.forLabel("a big-city person returns home"))
    }

    @Test fun fallMultiplayerLaunchBatchHasSixIndependentExactLabelScenes() {
        val labels = listOf(
            "Pumpkin patch",
            "Apple cider",
            "Hayride",
            "Autumn leaves",
            "Harvest festival",
            "Flannel shirt"
        )
        val scenes = labels.map { label ->
            requireNotNull(StorySceneArt.forLabel(label)) { "Missing fall scene: $label" }
        }
        assertEquals("Fall multiplayer scenes must not share artwork", 6, scenes.toSet().size)
        assertNull(StorySceneArt.forLabel("pumpkin patch"))
        assertNull(StorySceneArt.forLabel("Flannel shirt!"))
        // The local engine's differently named art remains independently mapped.
        assertTrue(StorySceneArt.forLabel("A pumpkin patch") != StorySceneArt.forLabel("Pumpkin patch"))
        assertTrue(StorySceneArt.forLabel("A hayride") != StorySceneArt.forLabel("Hayride"))
    }


    @Test fun secondFallMultiplayerBatchHasSixIndependentExactLabelScenes() {
        val labels = listOf(
            "Bonfire", "Pie contest", "Corn maze", "Pumpkin carving",
            "Family orchard", "Apple picking"
        )
        val scenes = labels.map { label ->
            requireNotNull(StorySceneArt.forLabel(label)) { "Missing Fall multiplayer scene: $label" }
        }
        assertEquals("Each Fall scene must have an independent composition", 6, scenes.toSet().size)
        assertNull(StorySceneArt.forLabel("bonfire"))
        assertNull(StorySceneArt.forLabel("Apple picking!"))
        assertTrue(StorySceneArt.forLabel("A bonfire") != StorySceneArt.forLabel("Bonfire"))
        assertTrue(StorySceneArt.forLabel("A pie contest") != StorySceneArt.forLabel("Pie contest"))
        assertTrue(StorySceneArt.forLabel("A pumpkin carving") != StorySceneArt.forLabel("Pumpkin carving"))
    }

    @Test fun thirdFallMultiplayerBatchHasSixIndependentExactLabelScenes() {
        val labels = listOf(
            "Cozy sweater", "Fall decorations", "Small-town fair",
            "Farm stand", "Harvest dance", "Autumn sunset"
        )
        val scenes = labels.map { label ->
            requireNotNull(StorySceneArt.forLabel(label)) { "Missing Fall III scene: $label" }
        }
        assertEquals("Fall III scenes must be independent", 6, scenes.toSet().size)
        assertNull(StorySceneArt.forLabel("cozy sweater"))
        assertNull(StorySceneArt.forLabel("Autumn sunset!"))
        assertTrue(StorySceneArt.forLabel("A cozy sweater") != StorySceneArt.forLabel("Cozy sweater"))
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
