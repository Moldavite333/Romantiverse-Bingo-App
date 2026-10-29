package com.cheeselouise.romantiverse

/**
 * Celebrations are presentation-only. The deterministic engine/server remains
 * the sole source of truth for marks, completed lines, and points.
 */
object BingoCelebrationRules {
    fun newlyCompleted(before: Set<Int>, after: Set<Int>): List<List<Int>> {
        val previous = BingoEngine.winningLines(before).toSet()
        return BingoEngine.winningLines(after).filterNot { it in previous }
    }

    /**
     * Never celebrate the first room hydration, a stale/duplicate poll, or
     * a response for a different room/player. Only confirmed server changes
     * can trigger multiplayer effects.
     */
    fun newlyConfirmed(before: LiveSnapshot?, after: LiveSnapshot): List<List<Int>> {
        if (before == null || before.room.code != after.room.code ||
            before.session?.playerId == null ||
            before.session?.playerId != after.session?.playerId ||
            after.revision <= before.revision
        ) return emptyList()
        return newlyCompleted(before.marks, after.marks)
    }
}

data class BingoCelebration(
    val id: Int,
    val newLines: Int,
    val blackout: Boolean = false,
    // The exact new authoritative lines, never inferred from presentation state.
    val winningLines: List<List<Int>> = emptyList()
)

/** Screen-reader users dismiss celebrations themselves after hearing the announcement. */
internal object BingoCelebrationTiming {
    fun autoDismissMillis(reducedMotion: Boolean, touchExploration: Boolean): Long? =
        if (touchExploration) null else if (reducedMotion) 1100L else 1900L
}
