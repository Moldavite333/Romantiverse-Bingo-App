package com.cheeselouise.romantiverse

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class BingoStoryScenesTest {
    @Test fun eachIllustratedTropeHasItsOwnCanonicalScene() {
        val labels = StorySceneArt.labels()
        assertEquals("Each mapped scene must be an independent composition", 72, labels.size)
        assertEquals("Never reuse a scene for a different trope", labels.size, StorySceneArt.uniqueSceneCount())
        assertEquals(StoryScene.entries.size, StorySceneArt.uniqueSceneCount())
        labels.forEach { label ->
            assertTrue("Unknown art key: $label",
                listOf("Romance", "Christmas", "Fall", "Horror")
                    .any { label in BingoEngine.pool(it) })
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
            val additions = BingoEngine.pool(theme).toSet() - romance
            assertEquals("Each seasonal theme must have 12 distinct tropes: $theme", 12, additions.size)
            additions
        }.toSet()
        val all = romance + seasonal
        assertEquals(72, all.size)
        assertEquals("No canonical trope may silently fall back to a shared icon", all, StorySceneArt.labels())
        assertEquals(all.size, all.mapNotNull(StorySceneArt::forLabel).toSet().size)
    }

    @Test fun noGenericArtworkIsMisrepresentedAsAUniqueIllustration() {
        assertNull(StorySceneArt.forLabel("A ghost train"))
        assertNull(StorySceneArt.forLabel("A pumpkin patch"))
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
