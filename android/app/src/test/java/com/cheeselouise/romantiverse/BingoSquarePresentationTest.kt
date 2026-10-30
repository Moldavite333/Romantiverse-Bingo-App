package com.cheeselouise.romantiverse

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class BingoSquarePresentationTest {
    @Test fun compactLabelsStayDistinctAcrossEveryTheme() {
        listOf("Romance", "Christmas", "Fall", "Horror").forEach { theme ->
            val canonical = BingoEngine.pool(theme)
            val compact = canonical.map(BingoSquarePresentation::shortLabel)
            assertEquals("Display labels must not collide in $theme", compact.size, compact.toSet().size)
            assertTrue("Empty display label in $theme", compact.all { it.isNotBlank() })
            assertTrue("Overlong display label in $theme", compact.all { it.length <= 22 })
            assertTrue("Single words must fit narrow Android squares in $theme",
                compact.all { label ->
                    label.split(Regex("[\\s\\n]+")).all { it.length <= 9 }
                })
        }
    }

    @Test fun freeCenterIsLegibleAndCanonicalDataRemainsUntouched() {
        assertEquals("CHEESE\nLOUISE\nPOD",
            BingoSquarePresentation.shortLabel(BingoEngine.FREE_LABEL))
        assertEquals("CHEESE LOUISE POD", BingoEngine.FREE_LABEL)
        assertEquals("Mixed signals", BingoSquarePresentation.shortLabel("A misunderstanding"))
        assertEquals("Snow\nstorm", BingoSquarePresentation.shortLabel("A snowstorm"))
        assertTrue(BingoEngine.pool("Christmas").contains("A snowstorm"))
        assertEquals("A misunderstanding", BingoEngine.pool("Romance").first {
            it == "A misunderstanding"
        })
    }

    @Test fun multiplayerUsesCompactDisplayWithoutChangingServerLabels() {
        val original = "A sentimental gift"
        assertEquals("Keepsake gift", BingoSquarePresentation.shortLabel(original))
        assertEquals("A sentimental gift", original)
        assertEquals("CHEESE\nLOUISE\nPOD",
            BingoSquarePresentation.shortLabel(BingoEngine.FREE_LABEL))
        assertEquals("CHEESE LOUISE POD", BingoEngine.FREE_LABEL)
        assertEquals(100, BingoEngine.score(setOf(0, 1, 2, 3, 4)))
    }

    @Test fun artworkGrowsOnPhoneAndTabletWithoutChangingFiveColumnCard() {
        assertEquals(0.68f, BingoSquarePresentation.TILE_ASPECT_RATIO, 0.0001f)
        assertEquals(36f, BingoSquarePresentation.artworkSizeDp(52f), 0.001f)
        assertEquals(40.96f, BingoSquarePresentation.artworkSizeDp(64f), 0.001f)
        assertEquals(56f, BingoSquarePresentation.artworkSizeDp(120f), 0.001f)
        assertTrue(BingoSquarePresentation.artworkSizeDp(64f) >
            BingoSquarePresentation.artworkSizeDp(52f))
    }

    @Test fun markedTilesRetainTheirOwnIllustrationsAndShowASeparateSeal() {
        for (index in 0 until 25) {
            val free = index == BingoEngine.CENTER
            assertEquals("Artwork visibility at square $index", !free,
                BingoSquarePresentation.showArtwork(index))
            assertFalse("Unmarked squares cannot have a mark seal",
                BingoSquarePresentation.showMarkBadge(index, false))
            assertEquals("Only marked non-free squares get the seal", !free,
                BingoSquarePresentation.showMarkBadge(index, true))
        }
        assertEquals(78, StorySceneArt.labels().size)
    }

    @Test fun everyTropeHasAnIcon() {
        listOf("Romance", "Christmas", "Fall", "Horror").forEach { theme ->
            assertTrue(BingoEngine.pool(theme).all {
                BingoSquarePresentation.glyph(it).isNotBlank()
            })
        }
    }
}
