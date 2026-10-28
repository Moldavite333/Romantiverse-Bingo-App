package com.cheeselouise.romantiverse

/**
 * Display-only copy for narrow Android Bingo squares. Never change the engine's
 * canonical trope strings: they are used for card identity, scores and TalkBack.
 * A long-press on a square exposes its full original wording.
 */
object BingoSquarePresentation {
    fun shortLabel(label: String): String = when (label) {
        BingoEngine.FREE_LABEL -> "CHEESE\nLOUISE\nPOD"
        "A misunderstanding" -> "Mixed signals"
        "An inconvenient deadline" -> "Deadline"
        "A last-minute arrival" -> "Late arrival"
        "A sudden change of plans" -> "Plans change"
        "A public declaration" -> "Public speech"
        "A small-town celebration" -> "Town celebration"
        "A community fundraiser" -> "Fundraiser"
        "A scenic foliage drive" -> "Foliage drive"
        "A mysterious warning" -> "Warning"
        "An eerie phone call" -> "Eerie call"
        "A surprise invitation" -> "Surprise invite"
        "A missed phone call" -> "Missed call"
        "A sentimental gift" -> "Sentimental gift"
        else -> label.removePrefix("A ").removePrefix("An ").removePrefix("The ")
    }

    fun glyph(label: String): String {
        val text = label.lowercase()
        return when {
            "snow" in text || "christmas" in text -> "❄"
            "café" in text || "cocoa" in text || "meal" in text -> "☕"
            "kiss" in text || "romantic" in text -> "♥"
            "gift" in text || "heirloom" in text -> "◇"
            "phone" in text || "invitation" in text -> "✉"
            "dance" in text || "parade" in text -> "♫"
            "festival" in text || "market" in text -> "✿"
            "deadline" in text || "last-minute" in text -> "⌛"
            "tree" in text || "orchard" in text || "pumpkin" in text -> "♧"
            else -> "✦"
        }
    }
}
