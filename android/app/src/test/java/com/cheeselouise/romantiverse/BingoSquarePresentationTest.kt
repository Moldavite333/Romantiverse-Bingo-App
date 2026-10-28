package com.cheeselouise.romantiverse

import org.junit.Assert.assertEquals
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
        }
    }

    @Test fun freeCenterIsLegibleAndCanonicalDataRemainsUntouched() {
        assertEquals("CHEESE\nLOUISE\nPOD",
            BingoSquarePresentation.shortLabel(BingoEngine.FREE_LABEL))
        assertEquals("CHEESE LOUISE POD", BingoEngine.FREE_LABEL)
        assertEquals("Mixed signals", BingoSquarePresentation.shortLabel("A misunderstanding"))
        assertEquals("A misunderstanding", BingoEngine.pool("Romance").first {
            it == "A misunderstanding"
        })
    }

    @Test fun everyTropeHasAnIcon() {
        listOf("Romance", "Christmas", "Fall", "Horror").forEach { theme ->
            assertTrue(BingoEngine.pool(theme).all {
                BingoSquarePresentation.glyph(it).isNotBlank()
            })
        }
    }
}
