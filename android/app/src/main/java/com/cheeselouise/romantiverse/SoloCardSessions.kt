package com.cheeselouise.romantiverse

/** One local solo card per canonical movie ID; never keyed by mutable title/year. */
data class SoloCardSession(val seed: Long, val theme: String, val marks: Set<Int>)

object SoloCardSessions {
    private val allowedThemes = setOf("Romance", "Christmas", "Fall")
    private val allowedFields = setOf("seed", "theme", "marks")

    fun key(movieId: String, field: String): String {
        require(movieId.isNotBlank()) { "Missing movie ID" }
        require(field in allowedFields) { "Invalid card field" }
        return "solo-card:$movieId:$field"
    }

    /** A missing or damaged saved session is treated as a new card, never a different movie's. */
    fun restore(seed: Long?, theme: String?, encodedMarks: String?): SoloCardSession? {
        if (seed == null || seed < 0 || theme == null || theme !in allowedThemes || encodedMarks == null) return null
        return SoloCardSession(seed, theme, BingoEngine.decodeMarks(encodedMarks))
    }
}
