package com.cheeselouise.romantiverse

import org.junit.Assert.*
import org.junit.Test

class BingoEngineTest {
    @Test fun deterministicUniqueCards() {
        val a = BingoEngine.deal(BingoEngine.pool("Fall"), 17)
        assertEquals(a, BingoEngine.deal(BingoEngine.pool("Fall"), 17))
        assertNotEquals(a, BingoEngine.deal(BingoEngine.pool("Fall"), 18))
        assertEquals(25, a.size)
        assertEquals(25, a.toSet().size)
        assertEquals(BingoEngine.FREE_LABEL, a[12])
    }

    @Test fun everyCardHasUniqueVisibleTropes() {
        for (season in listOf("Romance", "Christmas", "Fall")) {
            for (seed in 0L..100L) {
                val card = BingoEngine.deal(BingoEngine.pool(season), seed)
                val labels = card.filterIndexed { index, _ -> index != BingoEngine.CENTER }
                    .map { BingoSquarePresentation.shortLabel(it).replace("\n", " ").trim().lowercase() }
                assertEquals("Duplicate visible trope in $season seed $seed", 24, labels.toSet().size)
            }
        }
        val collision = BingoEngine.pool("Romance") + "Family secret" + "A family secret"
        val card = BingoEngine.deal(collision, 17L)
        assertEquals(24, card.filterIndexed { i, _ -> i != 12 }
            .map { BingoSquarePresentation.shortLabel(it).lowercase() }.toSet().size)
    }

    @Test fun horrorTropesAreExcludedFromLaunchCards() {
        assertEquals(BingoEngine.pool("Romance"), BingoEngine.pool("Horror"))
    }

    @Test fun completedLinesScoreOnlyOnce() {
        val marked = setOf(0, 1, 2, 3, 4)
        assertEquals(1, BingoEngine.winningLines(marked).size)
        assertEquals(100, BingoEngine.score(marked))
        assertEquals(0, BingoEngine.score(setOf(0, 1, 2)))
    }

    @Test fun lifetimeBestSurvivesUndoAndReplay() {
        val firstLine = setOf(0, 1, 2, 3, 4)
        val earned = BingoEngine.bestScore(0, firstLine)
        assertEquals(100, earned)
        assertEquals(100, BingoEngine.bestScore(earned, setOf(0, 1, 2)))
        assertEquals(100, BingoEngine.bestScore(earned, emptySet()))
        val secondLine = firstLine + setOf(5, 6, 7, 8, 9)
        assertEquals(200, BingoEngine.bestScore(earned, secondLine))
        assertEquals(200, BingoEngine.bestScore(200, firstLine))
        assertEquals(0, BingoEngine.bestScore(-5, emptySet()))
    }

    @Test fun freeCenterCountsButCannotBeToggled() {
        assertEquals(100, BingoEngine.score(setOf(2, 7, 17, 22)))
        assertEquals(emptySet<Int>(), BingoEngine.toggle(emptySet(), 12))
    }

    @Test fun marksRoundTripAndRejectInvalidIndices() {
        assertEquals(setOf(0, 4, 24), BingoEngine.decodeMarks("24,4,0,12,99,-1,no"))
        assertEquals("0,4,24", BingoEngine.encodeMarks(setOf(24, 0, 4, 12, 99)))
        assertThrows(IllegalArgumentException::class.java) {
            BingoEngine.toggle(emptySet(), 25)
        }
    }

    @Test fun soloSquareLabelsAreFullAndWinningStatesAreSpoken() {
        val longTrope = "A sentimental family heirloom becomes important"
        assertEquals("B1: $longTrope", LiveSquareAccessibility.label(0, longTrope))
        assertEquals("O5: A heartfelt apology",
            LiveSquareAccessibility.label(24, "A heartfelt apology"))
        assertEquals("Not marked", LiveSquareAccessibility.state(0, false, false))
        assertEquals("Marked", LiveSquareAccessibility.state(0, true, false))
        assertEquals("Marked, part of a completed Bingo line",
            LiveSquareAccessibility.state(0, true, true))
        assertEquals("Free center square", LiveSquareAccessibility.state(12, true, true))
    }

    @Test fun eachSeasonHasEnoughUniqueTropes() {
        for (season in listOf("Romance", "Christmas", "Fall", "Horror")) {
            assertEquals(25, BingoEngine.deal(BingoEngine.pool(season), 1).size)
        }
    }
}
