package com.cheeselouise.romantiverse

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class BingoCelebrationRulesTest {
    private val row = setOf(0, 1, 2, 3, 4)
    private val column = setOf(0, 5, 10, 15, 20)

    @Test fun screenReaderCelebrationWaitsForExplicitDismissal() {
        assertEquals(null, BingoCelebrationTiming.autoDismissMillis(false, true))
        assertEquals(null, BingoCelebrationTiming.autoDismissMillis(true, true))
        assertEquals(1900L, BingoCelebrationTiming.autoDismissMillis(false, false))
        assertEquals(1100L, BingoCelebrationTiming.autoDismissMillis(true, false))
    }

    @Test fun onlyNewLinesTriggerAndUndoDoesNotCelebrate() {
        assertEquals(1, BingoCelebrationRules.newlyCompleted(row - 4, row).size)
        assertTrue(BingoCelebrationRules.newlyCompleted(row, row).isEmpty())
        assertTrue(BingoCelebrationRules.newlyCompleted(row, row - 4).isEmpty())
        assertEquals(1, BingoCelebrationRules.newlyCompleted(row, row + column).size)
    }

    @Test fun simultaneousLinesAreCountedWithoutInflatingScore() {
        val previous = (row + column) - 0
        val after = row + column
        assertEquals(2, BingoCelebrationRules.newlyCompleted(previous, after).size)
        assertEquals(200, BingoEngine.score(after))
    }

    private fun snapshot(
        marks: Set<Int>, revision: Int, code: String = "ABCDEFG",
        playerId: String = "player-one"
    ): LiveSnapshot {
        val session = LiveSession(code, "a".repeat(64), playerId)
        val movie = LiveMovie("Movie", "Fall", "Fall", 2026, null, "classic", "playing")
        return LiveSnapshot(LiveRoom(code, movie, emptyList()),
            List(25) { "Trope $it" }, marks, revision, session)
    }

    @Test fun multiplayerOnlyCelebratesNewAuthoritativeRevisions() {
        val before = snapshot(row - 4, 7)
        val after = snapshot(row, 8)
        assertEquals(1, BingoCelebrationRules.newlyConfirmed(before, after).size)
        assertTrue(BingoCelebrationRules.newlyConfirmed(null, after).isEmpty())
        assertTrue(BingoCelebrationRules.newlyConfirmed(after, after).isEmpty())
        assertTrue(BingoCelebrationRules.newlyConfirmed(after, snapshot(row - 4, 7)).isEmpty())
        assertTrue(BingoCelebrationRules.newlyConfirmed(before, snapshot(row, 8, "BCDEFGH")).isEmpty())
        assertTrue(BingoCelebrationRules.newlyConfirmed(before, snapshot(row, 8, playerId = "another")).isEmpty())
    }
}
