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

    data class Entry(val url: String, val locked: Boolean)
    fun key(title: String, year: Int?): String =
        title.trim().replace(Regex("\\s+"), " ").lowercase(Locale.ROOT) + "|" + (year ?: "")

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

    fun merge(
        current: Map<String, Entry>,
        cache: List<Pair<String, Entry>>,
        published: List<Pair<String, Entry>>
    ): Map<String, Entry> {
        val result = current.toMutableMap()
        for ((key, value) in cache) {
            if (result[key]?.locked != true) result[key] = value.copy(locked = false)
        }
        for ((key, value) in published) {
            if (value.locked || key !in result) result[key] = value
        }
        return result
    }

    private fun entries(json: String, isPublished: Boolean): List<Pair<String, Entry>> {
        val parsed = JSONObject(json)
        val rows: JSONArray = if (isPublished) {
            JSONArray(json)
        } else {
            if (parsed.optInt("version") != 1) return emptyList()
            parsed.optJSONArray("movies") ?: return emptyList()
        }
        val output = mutableListOf<Pair<String, Entry>>()
        for (i in 0 until minOf(rows.length(), 500)) {
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
            return connection.inputStream.bufferedReader().use { it.readText().take(512_000) }
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
        val merged = merge(old, cache.orEmpty(), published.orEmpty())
        val json = JSONObject()
        for ((key, value) in merged) {
            json.put(key, JSONObject().put("url", value.url).put("locked", value.locked))
        }
        context.getSharedPreferences(PREF, Context.MODE_PRIVATE).edit()
            .putString("entries", json.toString()).apply()
        merged
    }
}
