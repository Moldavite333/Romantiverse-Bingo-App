package com.cheeselouise.romantiverse

import java.util.Random
import java.util.Locale

/** Pure native rules. No browser, network, analytics, or mutable shared state. */
object BingoEngine {
    const val CENTER = 12
    const val FREE_LABEL = "CHEESE LOUISE POD"

    val lines: List<List<Int>> =
        (0..4).map { row -> (0..4).map { col -> row * 5 + col } } +
        (0..4).map { col -> (0..4).map { row -> row * 5 + col } } +
        listOf(listOf(0, 6, 12, 18, 24), listOf(4, 8, 12, 16, 20))

    // Original short, observable tropes. These are predictions, not verified scenes.
    private val romance = listOf(
        "First meeting", "A misunderstanding", "The almost-kiss",
        "An old flame", "A romantic gesture", "A surprise visitor",
        "The big confession", "A town festival", "A family secret",
        "A career dilemma", "An awkward date", "A charming stranger",
        "A sentimental gift", "A missed phone call", "A second chance",
        "A meddling relative", "A public declaration", "A romantic rival",
        "A last-minute arrival", "A cozy café", "An unexpected kiss",
        "A meaningful look", "A family heirloom", "A surprise invitation",
        "An inconvenient deadline", "A helpful neighbor", "A heartfelt apology",
        "A dance together", "A small-town celebration", "A shared secret",
        "A grand gesture", "A community fundraiser", "A sudden change of plans",
        "A shared meal", "A scenic walk", "A hometown reunion"
    )
    private val seasonal = mapOf(
        "Christmas" to listOf(
            "A tree lighting", "Hot cocoa", "Mistletoe", "A snowstorm",
            "Christmas cookies", "A holiday parade", "A festive market",
            "A gift exchange", "A Christmas wish", "A decorated tree",
            "A cozy fireplace", "A holiday tradition"
        ),
        "Fall" to listOf(
            "A pumpkin patch", "An autumn festival", "A hayride",
            "A harvest market", "A pie contest", "A cozy sweater",
            "Falling leaves", "An apple orchard", "A bonfire",
            "A fall fundraiser", "A pumpkin carving", "A scenic foliage drive"
        ),
        "Horror" to listOf(
            "A creaking door", "An ominous shadow", "A sudden scream",
            "A flashlight fails", "A strange noise", "A creepy hallway",
            "A mysterious warning", "A jump scare", "An eerie phone call",
            "A locked door", "An abandoned house", "A final reveal"
        )
    )

    fun pool(theme: String): List<String> {
        val seasonalTropes = if (theme == "Christmas" || theme == "Fall") {
            seasonal[theme].orEmpty()
        } else emptyList()
        return (romance + seasonalTropes).distinct()
    }

    fun deal(pool: List<String>, seed: Long): List<String> {
        require(seed >= 0) { "Seed must be nonnegative" }
        val unique = pool.map { it.trim() }.filter { it.isNotEmpty() && it != FREE_LABEL }
            .distinctBy { BingoSquarePresentation.shortLabel(it).replace("\n", " ").trim().lowercase(Locale.ROOT) }
        require(unique.size >= 24) { "At least 24 distinct tropes required" }
        val shuffled = unique.toMutableList()
        val random = Random(seed)
        for (i in shuffled.lastIndex downTo 1) {
            val j = random.nextInt(i + 1)
            val old = shuffled[i]
            shuffled[i] = shuffled[j]
            shuffled[j] = old
        }
        return shuffled.take(24).toMutableList().apply { add(CENTER, FREE_LABEL) }
    }

    fun toggle(marked: Set<Int>, index: Int): Set<Int> {
        require(index in 0..24) { "Invalid square" }
        if (index == CENTER) return marked
        return if (index in marked) marked - index else marked + index
    }

    fun winningLines(marked: Set<Int>): List<List<Int>> {
        val active = marked.filter { it in 0..24 }.toSet() + CENTER
        return lines.filter { line -> line.all { it in active } }
    }

    fun score(marked: Set<Int>): Int = winningLines(marked).size * 100

    /** Replaying or undoing a square cannot reduce a movie's lifetime best. */
    fun bestScore(previousBest: Int, marked: Set<Int>): Int =
        maxOf(previousBest.coerceAtLeast(0), score(marked))

    fun decodeMarks(encoded: String): Set<Int> = encoded.split(",")
        .mapNotNull { it.toIntOrNull() }.filter { it in 0..24 && it != CENTER }.toSet()

    fun encodeMarks(marked: Set<Int>): String = marked.filter { it in 0..24 && it != CENTER }
        .sorted().joinToString(",")
}
