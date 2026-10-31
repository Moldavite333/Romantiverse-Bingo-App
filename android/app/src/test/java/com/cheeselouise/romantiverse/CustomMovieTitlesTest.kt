package com.cheeselouise.romantiverse

import org.junit.Assert.*
import org.junit.Test

class CustomMovieTitlesTest {
    @Test fun missingMovieCanBePlayedOfflineWithoutInventingAStudioOrYear() {
        val movie = CustomMovieTitles.create("  A Christmas Village  ", "Christmas")!!
        assertEquals("A Christmas Village", movie.title)
        assertEquals("Christmas", movie.collection)
        assertNull(movie.year)
        assertNull(movie.network)
        assertTrue(movie.id.startsWith("custom-"))
    }

    @Test fun stableIdentityRestoresAnInProgressCardAcrossAppRestarts() {
        val original = CustomMovieTitles.create("A Christmas Village", "Christmas")!!
        val restored = CustomMovieTitles.create("  a   christmas village  ", "Christmas")!!
        assertEquals(original.id, restored.id)
        assertEquals(original.key, restored.key)
    }

    @Test fun arbitraryProductionLabelsCannotBeInventedOrUnlockHorror() {
        assertEquals("Unspecified", CustomMovieTitles.create("Peacock Romance", "Peacock")!!.collection)
        assertEquals("Unspecified", CustomMovieTitles.create("Some Film", "Horror")!!.collection)
        assertEquals("Fall", CustomMovieTitles.create("Autumn Story", "Fall")!!.collection)
    }

    @Test fun blankOverlongAndControlCharacterTitlesAreRejected() {
        assertNull(CustomMovieTitles.create(" "))
        assertNull(CustomMovieTitles.create("a".repeat(121)))
        assertNull(CustomMovieTitles.create("Fake\\u0000Title"))
    }
}
