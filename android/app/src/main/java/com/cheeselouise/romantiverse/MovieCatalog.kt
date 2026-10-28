package com.cheeselouise.romantiverse

import android.content.Context
import org.json.JSONObject

data class Movie(
    val id: String,
    val title: String,
    val year: Int?,
    val collection: String
) {
    val key: String get() = PosterRepository.key(title, year)
}

object MovieCatalog {
    private val collections = setOf("Christmas", "Fall", "Horror", "Unspecified")

    fun load(context: Context): List<Movie> {
        val json = context.assets.open("movies.json").bufferedReader().use { it.readText() }
        val root = JSONObject(json)
        require(root.getInt("version") == 1) { "Unsupported movie catalog" }
        val movies = root.getJSONArray("movies")
        val seen = mutableSetOf<String>()
        val result = mutableListOf<Movie>()
        for (i in 0 until movies.length()) {
            val row = movies.optJSONObject(i) ?: continue
            if (row.optBoolean("is_demo", false)) continue
            val id = row.optString("id").trim()
            val title = row.optString("title").trim()
            val collection = row.optString("season", "Unspecified")
            val year = row.optInt("release_year", 0).takeIf { it in 1900..2100 }
            if (id.isEmpty() || title.isEmpty() || collection !in collections) continue
            val movie = Movie(id, title, year, collection)
            if (seen.add(movie.key)) result += movie
        }
        return result.sortedWith(compareBy(String.CASE_INSENSITIVE_ORDER) { it.title })
    }
}
