package com.cheeselouise.romantiverse

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class BingoTropeArtworkTest {
    @Test fun originalVectorMotifsCoverCommonMovieNightTropes() {
        val examples = mapOf(
            "An unexpected kiss" to TropeMotif.HEART,
            "A cozy café" to TropeMotif.COFFEE,
            "A missed phone call" to TropeMotif.LETTER,
            "A sentimental gift" to TropeMotif.PRESENT,
            "A Christmas wish" to TropeMotif.SNOWFLAKE,
            "A dance together" to TropeMotif.MUSIC,
            "A pumpkin patch" to TropeMotif.PUMPKIN,
            "An inconvenient deadline" to TropeMotif.HOURGLASS,
            "A hometown reunion" to TropeMotif.HOME,
            "A scenic foliage drive" to TropeMotif.LEAF,
            "A meaningful look" to TropeMotif.STAR
        )
        examples.forEach { (label, motif) ->
            assertEquals("Wrong illustration for $label", motif, BingoTropeArtwork.motif(label))
        }
    }

    @Test fun everyNativeCardTropeHasStableArtWithoutChangingCanonicalText() {
        listOf("Romance", "Christmas", "Fall", "Horror").forEach { theme ->
            val original = BingoEngine.pool(theme)
            assertTrue(original.isNotEmpty())
            assertTrue(original.all { BingoTropeArtwork.motif(it) in TropeMotif.entries })
            assertEquals(original, BingoEngine.pool(theme))
        }
        assertEquals("CHEESE LOUISE POD", BingoEngine.FREE_LABEL)
        assertEquals(100, BingoEngine.score(setOf(0, 1, 2, 3, 4)))
    }
}
