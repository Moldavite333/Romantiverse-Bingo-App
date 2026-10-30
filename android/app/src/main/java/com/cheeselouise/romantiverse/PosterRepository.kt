package com.cheeselouise.romantiverse

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URI
import java.net.URL
import java.util.Locale

/** Public poster projections only. Never reads or bundles private HQ tables. */
object PosterRepository {
    private const val CACHE_URL = "https://wgvsnmukiaobcbyqhkkt.supabase.co/functions/v1/bingo-public-posters"
    private const val HQ_URL = "https://wgvsnmukiaobcbyqhkkt.supabase.co/rest/v1/rpc/published_movie_posters"
    // Public anon/publishable key, not a service-role key.
    private const val PUBLISHABLE_KEY = "sb_publishable_3xcqfNu-mJPuDWivmlBXug_3Tw60QoM"
    private const val PREF = "public-poster-projection"
    private const val MAX_POSTERS = 3000
    private const val MAX_FEED_CHARS = 2_000_000

    data class Entry(val url: String, val locked: Boolean)
    fun key(title: String, year: Int?): String =
        title.trim().replace(Regex("\\s+"), " ").lowercase(Locale.ROOT) + "|" + (year ?: "")

    /**
     * Five verified original-release corrections changed a movie's public key.
     * Accept the former year only for those exact curated movie IDs; never
     * fall back by title alone, which could attach a remake's poster.
     * A still-published HQ lock wins over automatic artwork on either key.
     */
    fun forMovie(movie: Movie, entries: Map<String, Entry>): Entry? {
        val candidates = (listOf(movie.key) + MovieCatalog.legacyScoreKeys(movie))
            .mapNotNull { entries[it] }
        return candidates.firstOrNull { it.locked } ?: candidates.firstOrNull()
    }

    fun approved(url: String?): String? {
        if (url.isNullOrBlank()) return null
        return try {
            val uri = URI(url)
            if (uri.scheme != "https" || uri.userInfo != null || uri.port != -1 ||
                uri.rawQuery != null || uri.rawFragment != null) return null
            val host = uri.host ?: return null
            val path = uri.path ?: return null
            when (host) {
                "image.tmdb.org" -> if (Regex("^/t/p/(w[0-9]+|original)/[A-Za-z0-9_.-]+$").matches(path)) url else null
                "upload.wikimedia.org" -> if (path.startsWith("/wikipedia/commons/")) url else null
                else -> null
            }
        } catch (_: Exception) { null }
    }

    /**
     * A successful HQ response is authoritative for which *locked* posters are
     * still published. Remove old locked artwork before reconciling that feed:
     * an unpublished or unlocked poster must not remain pinned indefinitely.
     * If HQ is unavailable, keep the last known public artwork for offline play.
     */
    fun merge(
        current: Map<String, Entry>,
        cache: List<Pair<String, Entry>>,
        published: List<Pair<String, Entry>>,
        publishedAuthoritative: Boolean = false,
        cacheAuthoritative: Boolean = false
    ): Map<String, Entry> {
        // A successfully fetched automatic feed is authoritative for automatic art.
        // Do not keep an old, potentially misidentified poster after it disappears
        // from the public cache. Preserve HQ locks if HQ is offline, and preserve
        // all last-known artwork when both feeds are unavailable.
        val result = current.filterValues { entry ->
            (!cacheAuthoritative || entry.locked) &&
                (!publishedAuthoritative || !entry.locked)
        }.toMutableMap()
        for ((key, value) in cache) {
            if (result[key]?.locked != true) result[key] = value.copy(locked = false)
        }
        for ((key, value) in published) {
            if (value.locked || key !in result) result[key] = value
        }
        return result
    }

    internal fun entries(json: String, isPublished: Boolean): List<Pair<String, Entry>> {
        val rows: JSONArray = if (isPublished) {
            JSONArray(json)
        } else {
            val parsed = JSONObject(json)
            require(parsed.getInt("version") == 1) { "Unsupported poster feed version" }
            parsed.getJSONArray("movies")
        }
        require(rows.length() <= MAX_POSTERS) { "Poster feed exceeds supported size" }
        val output = mutableListOf<Pair<String, Entry>>()
        for (i in 0 until rows.length()) {
            val row = rows.optJSONObject(i) ?: continue
            val title = row.optString("title").trim()
            val year = row.optInt("release_year", 0)
            val poster = approved(row.optString("poster_url")) ?: continue
            if (title.isBlank() || year !in 1900..2100) continue
            output += key(title, year) to Entry(poster, isPublished && row.optBoolean("poster_locked"))
        }
        return output
    }

    private fun fetch(url: String, publishable: Boolean): String {
        val connection = URL(url).openConnection() as HttpURLConnection
        try {
            connection.connectTimeout = 4500
            connection.readTimeout = 4500
            connection.setRequestProperty("Accept", "application/json")
            if (publishable) connection.setRequestProperty("apikey", PUBLISHABLE_KEY)
            if (connection.responseCode !in 200..299) error("Poster feed unavailable")
            return connection.inputStream.bufferedReader(Charsets.UTF_8).use { reader ->
                val text = StringBuilder()
                val chunk = CharArray(4096)
                while (true) {
                    val count = reader.read(chunk)
                    if (count < 0) break
                    require(text.length + count <= MAX_FEED_CHARS) { "Poster feed exceeds size limit" }
                    text.append(chunk, 0, count)
                }
                text.toString()
            }
        } finally { connection.disconnect() }
    }

    fun cached(context: Context): Map<String, Entry> {
        val text = context.getSharedPreferences(PREF, Context.MODE_PRIVATE).getString("entries", null)
            ?: return emptyMap()
        return runCatching {
            val root = JSONObject(text)
            root.keys().asSequence().mapNotNull { key ->
                val row = root.optJSONObject(key) ?: return@mapNotNull null
                val url = approved(row.optString("url")) ?: return@mapNotNull null
                key to Entry(url, row.optBoolean("locked"))
            }.toMap()
        }.getOrDefault(emptyMap())
    }

    suspend fun refresh(context: Context): Map<String, Entry> = withContext(Dispatchers.IO) {
        val old = cached(context)
        val cache = runCatching { entries(fetch(CACHE_URL, false), false) }.getOrNull()
        val published = runCatching { entries(fetch(HQ_URL, true), true) }.getOrNull()
        if (cache == null && published == null) return@withContext old
        // Only a validated successful feed may revoke its own previously
        // cached entries. A failed fetch must never masquerade as an empty feed.
        val merged = merge(old, cache.orEmpty(), published.orEmpty(),
            publishedAuthoritative = published != null,
            cacheAuthoritative = cache != null)
        val json = JSONObject()
        for ((key, value) in merged) {
            json.put(key, JSONObject().put("url", value.url).put("locked", value.locked))
        }
        context.getSharedPreferences(PREF, Context.MODE_PRIVATE).edit()
            .putString("entries", json.toString()).apply()
        merged
    }
}
