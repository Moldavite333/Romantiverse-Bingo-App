package com.cheeselouise.romantiverse

import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test

class MovieCatalogTest {
    private fun row(
        id: String,
        title: String,
        collection: String = "Unspecified",
        year: Int? = null,
        demo: Boolean = false
    ): JSONObject = JSONObject()
        .put("id", id)
        .put("title", title)
        .put("season", collection)
        .put("release_year", year ?: JSONObject.NULL)
        .put("is_demo", demo)

    private fun catalog(vararg rows: JSONObject, version: Int = 1): String =
        JSONObject().put("version", version)
            .put("movies", JSONArray().apply { rows.forEach { put(it) } }).toString()

    @Test fun preservesCatalogCollectionWithoutGuessingFromTitle() {
        val result = MovieCatalog.parse(catalog(
            row("movie-one", "Christmas in July", "Unspecified", 2024),
            row("movie-two", "Autumn Dreams", "Fall", 2015)
        ))
        assertEquals(2, result.size)
        assertEquals("Unspecified", result.single { it.id == "movie-one" }.collection)
        assertEquals("Fall", result.single { it.id == "movie-two" }.collection)
    }

    @Test fun excludesDemosAndDeduplicatesOnlyMatchingTitleAndYear() {
        val result = MovieCatalog.parse(catalog(
            row("first", "Autumn Dreams", "Fall", 2015),
            row("duplicate", " AUTUMN   DREAMS ", "Fall", 2015),
            row("remake", "Autumn Dreams", "Fall", 2025),
            row("demo", "Demo Movie", "Christmas", 2024, demo = true)
        ))
        assertEquals(2, result.size)
        assertTrue(result.any { it.year == 2015 })
        assertTrue(result.any { it.year == 2025 })
        assertFalse(result.any { it.id == "demo" })
    }

    @Test fun invalidOrUnsupportedPublicCatalogCannotReplaceOfflineMovies() {
        assertThrows(IllegalArgumentException::class.java) {
            MovieCatalog.parse(catalog(row("movie", "A Movie"), version = 2))
        }
        assertThrows(IllegalArgumentException::class.java) {
            MovieCatalog.parse(catalog(row("bad", "A Movie", "Guessed Spring", 2024)))
        }
        assertThrows(IllegalArgumentException::class.java) {
            MovieCatalog.parse(catalog(row("demo", "Demo", demo = true)))
        }
    }

    @Test fun truncatedRemoteCatalogCannotShrinkExistingOfflineOrCachedCatalog() {
        val bundled = MovieCatalog.parse(catalog(
            row("one", "One", year = 2024),
            row("two", "Two", year = 2025)
        ))
        val truncated = MovieCatalog.parse(catalog(row("one", "One", year = 2024)))
        val expanded = MovieCatalog.parse(catalog(
            row("one", "One", year = 2024),
            row("two", "Two", year = 2025),
            row("three", "Three", year = 2026)
        ))
        assertFalse(MovieCatalog.acceptableUpdate(bundled, truncated))
        assertTrue(MovieCatalog.acceptableUpdate(bundled, expanded))
    }
}
