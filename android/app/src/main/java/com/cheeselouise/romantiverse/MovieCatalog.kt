package com.cheeselouise.romantiverse

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

data class Movie(
    val id: String,
    val title: String,
    val year: Int?,
    val collection: String,
    val network: String? = null
) {
    val key: String get() = PosterRepository.key(title, year)
}

/**
 * The APK always contains a playable public catalog. When online, the app can
 * replace it with a newer *public* GitHub Pages catalog without an APK update.
 * No private HQ workspace, unpublished editorial fields, or credentials are read.
 */
object MovieCatalog {
    private val collections = setOf("Christmas", "Fall", "Horror", "Unspecified")
    private val idPattern = Regex("^[a-z0-9][a-z0-9-]{0,119}$")
    // Curated original-release corrections, verified against Hallmark and
    // distributor listings. The open-data source included later re-air dates.
    // Keep the ID stable so a corrected movie remains the same saved selection.
    private val correctedYears = mapOf(
        "wikidata-q3548803" to (2020 to 2011), // A Christmas Wedding Tail
        "wikidata-q130582183" to (2022 to 2019), // Holiday Date
        "wikidata-q99292771" to (2020 to 2018), // Marrying Father Christmas
        "wikidata-q99293243" to (2023 to 2018), // Return to Christmas Creek
        "wikidata-q3549131" to (2021 to 2010) // The Wishing Well (US premiere)
    )

    /** Old score keys remain readable after correcting a film's release year. */
    fun legacyScoreKeys(movie: Movie): List<String> =
        correctedYears[movie.id]?.takeIf { movie.year == it.second }
            ?.let { listOf(PosterRepository.key(movie.title, it.first)) }.orEmpty()
    private const val PUBLIC_URL =
        "https://moldavite333.github.io/Romantiverse-Bingo-App/catalog/movies.json"
    private const val PREF = "public-movie-catalog-v1"
    private const val CACHE_KEY = "verified-json"
    private const val MAX_CHARS = 1_500_000

    /** Only public catalog metadata; never infer a distributor from a movie title. */
    fun matchesQuery(movie: Movie, query: String): Boolean {
        val term = query.trim()
        return term.isEmpty() || movie.title.contains(term, ignoreCase = true) ||
            movie.network?.contains(term, ignoreCase = true) == true
    }

    /** Validate all remote data before it can replace the offline catalog. */
    fun parse(json: String): List<Movie> {
        require(json.length <= MAX_CHARS) { "Catalog is too large" }
        val root = JSONObject(json)
        require(root.getInt("version") == 1) { "Unsupported movie catalog" }
        val movies = root.getJSONArray("movies")
        require(movies.length() in 1..3000) { "Invalid movie catalog size" }
        val seen = mutableSetOf<String>()
        val seenIds = mutableSetOf<String>()
        val result = mutableListOf<Movie>()
        for (i in 0 until movies.length()) {
            val row = movies.optJSONObject(i) ?: continue
            if (row.optBoolean("is_demo", false)) continue
            val id = row.optString("id").trim()
            val title = row.optString("title").trim()
            val collection = row.optString("season", "Unspecified").trim()
            val year = row.optInt("release_year", 0).takeIf { it in 1900..2100 }
            if (!idPattern.matches(id) || title.length !in 1..180 ||
                collection !in collections || !seenIds.add(id)) continue
            val network = row.optString("network", "").trim().takeIf {
                !row.isNull("network") && it.length in 1..80 && it.all { char -> char >= ' ' }
            }
            val movie = Movie(id, title, year, collection, network)
            if (seen.add(movie.key)) result += movie
        }
        require(result.isNotEmpty()) { "No usable movies in catalog" }
        return result.sortedWith(compareBy(String.CASE_INSENSITIVE_ORDER) { it.title })
    }

    /**
     * Count alone is not a safe update gate: an equally large (or larger) feed
     * can silently replace existing movies. Keep every established ID and its
     * canonical title/year identity so saved cards and poster keys stay valid.
     * Collection corrections are allowed; collection values are validated by parse.
     */
    fun acceptableUpdate(current: List<Movie>, incoming: List<Movie>): Boolean {
        if (incoming.isEmpty() || incoming.size < current.size) return false
        val incomingById = incoming.associateBy { it.id }
        return current.all { old ->
            val next = incomingById[old.id] ?: return@all false
            next.key == old.key || (
                old.title == next.title &&
                    correctedYears[old.id] == (old.year to next.year)
            )
        }
    }

    private fun bundled(context: Context): List<Movie> =
        context.assets.open("movies.json").bufferedReader().use { parse(it.readText()) }

    fun load(context: Context): List<Movie> {
        val offline = bundled(context)
        val cached = context.getSharedPreferences(PREF, Context.MODE_PRIVATE)
            .getString(CACHE_KEY, null)?.let { runCatching { parse(it) }.getOrNull() }
        return cached?.takeIf { acceptableUpdate(offline, it) } ?: offline
    }

    suspend fun refresh(context: Context): List<Movie> = withContext(Dispatchers.IO) {
        val current = load(context)
        runCatching {
            val connection = URL(PUBLIC_URL).openConnection() as HttpURLConnection
            val json = try {
                connection.instanceFollowRedirects = false
                connection.connectTimeout = 4500
                connection.readTimeout = 4500
                connection.setRequestProperty("Accept", "application/json")
                require(connection.responseCode == 200) { "Public catalog unavailable" }
                connection.inputStream.bufferedReader(Charsets.UTF_8).use { reader ->
                    val text = StringBuilder()
                    val chunk = CharArray(4096)
                    while (true) {
                        val count = reader.read(chunk)
                        if (count < 0) break
                        require(text.length + count <= MAX_CHARS) { "Catalog exceeds limit" }
                        text.append(chunk, 0, count)
                    }
                    text.toString()
                }
            } finally {
                connection.disconnect()
            }
            val incoming = parse(json)
            require(acceptableUpdate(current, incoming)) { "Public catalog unexpectedly shrank" }
            context.getSharedPreferences(PREF, Context.MODE_PRIVATE).edit()
                .putString(CACHE_KEY, json).apply()
            incoming
        }.getOrElse { current }
    }
}
