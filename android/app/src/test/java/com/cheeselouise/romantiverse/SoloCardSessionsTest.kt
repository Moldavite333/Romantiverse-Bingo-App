package com.cheeselouise.romantiverse

import org.junit.Assert.*
import org.junit.Test

class SoloCardSessionsTest {
    @Test fun cardFieldsAreIsolatedByCanonicalMovieId() {
        val first = "wikidata-q123"
        val second = "wikidata-q124"
        assertNotEquals(SoloCardSessions.key(first, "marks"),
            SoloCardSessions.key(second, "marks"))
        assertNotEquals(SoloCardSessions.key(first, "seed"),
            SoloCardSessions.key(first, "marks"))
    }

    @Test fun savedCardRestoresOriginalSeedThemeAndMarks() {
        val marks = setOf(0, 1, 2, 3, 4, 18)
        val encoded = BingoEngine.encodeMarks(marks)
        val restored = SoloCardSessions.restore(12345L, "Christmas", encoded)
        assertEquals(12345L, restored?.seed)
        assertEquals("Christmas", restored?.theme)
        assertEquals(marks, restored?.marks)
        assertEquals(100, BingoEngine.score(restored!!.marks))
    }

    @Test fun missingOrDamagedCardDoesNotReplaceTheActiveCard() {
        assertNull(SoloCardSessions.restore(null, "Fall", "0,1"))
        assertNull(SoloCardSessions.restore(-1L, "Fall", "0,1"))
        assertNull(SoloCardSessions.restore(9L, "Horror", "0,1"))
        assertNull(SoloCardSessions.restore(9L, "Romance", null))
        assertEquals(emptySet<Int>(), SoloCardSessions.restore(9L, "Romance", "")?.marks)
    }

    @Test fun invalidAndFreeSpaceMarksCannotBeRestoredAsEarnedSquares() {
        val restored = SoloCardSessions.restore(8L, "Fall", "0,0,12,-1,25,24")
        assertEquals(setOf(0, 24), restored?.marks)
    }

    @Test fun noOtherFieldCanBeUsedToReadOrWriteCardState() {
        try {
            SoloCardSessions.key("movie", "token")
            fail("Unexpected private session field")
        } catch (_: IllegalArgumentException) { }
    }
}
