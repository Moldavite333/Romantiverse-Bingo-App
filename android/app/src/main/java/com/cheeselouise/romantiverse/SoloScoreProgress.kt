package com.cheeselouise.romantiverse

/**
 * Solo scores belong to a canonical movie, not to whichever movie happened to
 * be loaded when Compose first created the screen. A missing catalog entry is
 * temporary and must never erase the saved best for that movie.
 */
object SoloScoreProgress {
    fun restore(movie: Movie?, marks: Set<Int>, storedBest: (String) -> Int): Int =
        movie?.let { BingoEngine.bestScore(storedBest(it.key), marks) } ?: 0

    /** Only return a write when the current movie has genuinely improved. */
    fun improvement(
        movie: Movie?,
        currentBest: Int,
        storedBest: (String) -> Int
    ): Pair<String, Int>? {
        val key = movie?.key ?: return null
        val prior = storedBest(key).coerceAtLeast(0)
        return if (currentBest > prior) key to currentBest else null
    }
}
