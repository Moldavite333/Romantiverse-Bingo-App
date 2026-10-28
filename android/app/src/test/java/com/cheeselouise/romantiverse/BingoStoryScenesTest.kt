package com.cheeselouise.romantiverse

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class BingoStoryScenesTest {
    @Test fun eachIllustratedTropeHasItsOwnCanonicalScene() {
        val labels = StorySceneArt.labels()
        assertEquals("Phase-one art should have 24 independent compositions", 24, labels.size)
        assertEquals("Never reuse a scene for a different trope", labels.size, StorySceneArt.uniqueSceneCount())
        assertEquals(StoryScene.entries.size, StorySceneArt.uniqueSceneCount())
        labels.forEach { label ->
            assertTrue("Unknown art key: $label",
                listOf("Romance", "Christmas", "Fall", "Horror")
                    .any { label in BingoEngine.pool(it) })
            assertTrue("Missing story scene: $label", StorySceneArt.forLabel(label) != null)
        }
    }

    @Test fun noGenericArtworkIsMisrepresentedAsAUniqueIllustration() {
        assertNull(StorySceneArt.forLabel("A family secret"))
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
