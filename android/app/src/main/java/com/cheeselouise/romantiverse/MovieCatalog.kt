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
    val collection: String
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
    private const val PUBLIC_URL =
        "https://moldavite333.github.io/Romantiverse-Bingo-App/catalog/movies.json"
    private const val PREF = "public-movie-catalog-v1"
    private const val CACHE_KEY = "verified-json"
    private const val MAX_CHARS = 1_500_000

    /** Validate all remote data before it can replace the offline catalog. */
    fun parse(json: String): List<Movie> {
        require(json.length <= MAX_CHARS) { "Catalog is too large" }
        val root = JSONObject(json)
        require(root.getInt("version") == 1) { "Unsupported movie catalog" }
        val movies = root.getJSONArray("movies")
        require(movies.length() in 1..3000) { "Invalid movie catalog size" }
        val seen = mutableSetOf<String>()
        val result = mutableListOf<Movie>()
        for (i in 0 until movies.length()) {
            val row = movies.optJSONObject(i) ?: continue
            if (row.optBoolean("is_demo", false)) continue
            val id = row.optString("id").trim()
            val title = row.optString("title").trim()
            val collection = row.optString("season", "Unspecified").trim()
            val year = row.optInt("release_year", 0).takeIf { it in 1900..2100 }
            if (!idPattern.matches(id) || title.length !in 1..180 ||
                collection !in collections) continue
            val movie = Movie(id, title, year, collection)
            if (seen.add(movie.key)) result += movie
        }
        require(result.isNotEmpty()) { "No usable movies in catalog" }
        return result.sortedWith(compareBy(String.CASE_INSENSITIVE_ORDER) { it.title })
    }

    /** A transient or truncated feed must not erase movies already on the device. */
    fun acceptableUpdate(current: List<Movie>, incoming: List<Movie>): Boolean =
        incoming.size >= current.size && incoming.isNotEmpty()

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
