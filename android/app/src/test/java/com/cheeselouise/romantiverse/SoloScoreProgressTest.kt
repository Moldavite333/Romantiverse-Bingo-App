package com.cheeselouise.romantiverse

import org.junit.Assert.*
import org.junit.Test

class SoloScoreProgressTest {
    private val first = Movie("first", "Autumn Dreams", 2015, "Fall")
    private val second = Movie("second", "Christmas in July", 2024, "Unspecified")
    private val completedRow = setOf(0, 1, 2, 3, 4)

    @Test fun missingMovieDuringCatalogHydrationCannotReadOrOverwriteSavedBest() {
        var reads = 0
        val read: (String) -> Int = { reads++; 300 }
        assertEquals(0, SoloScoreProgress.restore(null, completedRow, read))
        assertNull(SoloScoreProgress.improvement(null, 0, read))
        assertEquals(0, reads)
    }

    @Test fun lateCatalogHydrationRestoresCorrectMovieBestWithoutRollingItBack() {
        val saved = mapOf(first.key to 300, second.key to 100)
        val read: (String) -> Int = { saved[it] ?: 0 }

        // The selected movie initially cannot be resolved in the bundled catalog.
        assertEquals(0, SoloScoreProgress.restore(null, emptySet(), read))
        // When the remote catalog arrives, restore its own previously earned score.
        assertEquals(300, SoloScoreProgress.restore(first, emptySet(), read))
        assertNull(SoloScoreProgress.improvement(first, 300, read))
        // Selecting another movie must not inherit the first movie's best.
        assertEquals(100, SoloScoreProgress.restore(second, emptySet(), read))
        assertNull(SoloScoreProgress.improvement(second, 100, read))
    }

    @Test fun onlyNewlyEarnedScoresArePersistedForTheActiveMovie() {
        val saved = mutableMapOf(first.key to 0, second.key to 200)
        val read: (String) -> Int = { saved[it] ?: 0 }
        val earned = SoloScoreProgress.restore(first, completedRow, read)
        assertEquals(100, earned)
        assertEquals(first.key to 100, SoloScoreProgress.improvement(first, earned, read))
        saved[first.key] = earned

        assertNull(SoloScoreProgress.improvement(first, 0, read))
        assertEquals(100, SoloScoreProgress.restore(first, emptySet(), read))
        assertEquals(200, SoloScoreProgress.restore(second, completedRow, read))
        assertNull(SoloScoreProgress.improvement(second, 100, read))
        assertEquals(200, saved[second.key])
    }

    @Test fun savedCardWithUnpersistedCompletedLineIsUpgradedOnlyUpward() {
        val saved = mapOf(first.key to 100)
        val read: (String) -> Int = { saved[it] ?: 0 }
        val twoRows = completedRow + setOf(5, 6, 7, 8, 9)
        assertEquals(200, SoloScoreProgress.restore(first, twoRows, read))
        assertEquals(first.key to 200, SoloScoreProgress.improvement(first, 200, read))
    }
    @Test fun releaseYearCorrectionMigratesOldBestWithoutCrossingMovies() {
        val corrected = Movie("wikidata-q130582183", "Holiday Date", 2019, "Christmas")
        val unrelated = Movie("unrelated", "Another Holiday Date", 2019, "Christmas")
        val legacyKey = PosterRepository.key("Holiday Date", 2022)
        val stored = mutableMapOf(legacyKey to 400, corrected.key to 100)
        val read: (String) -> Int = { stored[it] ?: 0 }

        assertEquals(400, SoloScoreProgress.restore(corrected, emptySet(), read))
        assertEquals(corrected.key to 400,
            SoloScoreProgress.improvement(corrected, 400, read))
        stored[corrected.key] = 400
        assertNull(SoloScoreProgress.improvement(corrected, 400, read))
        // The legacy key must never be used for a different canonical ID.
        assertEquals(0, SoloScoreProgress.restore(unrelated, emptySet(), read))
        assertTrue(MovieCatalog.legacyScoreKeys(unrelated).isEmpty())
    }

}
