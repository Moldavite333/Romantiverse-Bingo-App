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

    @Test fun launchCatalogNeverShowsHorrorButKeepsSourceDataIntact() {
        val parsed = MovieCatalog.parse(catalog(
            row("romance", "A Romance", "Unspecified", 2024),
            row("fall", "Autumn Date", "Fall", 2025),
            row("christmas", "Holiday Date", "Christmas", 2025),
            row("horror", "Haunted House", "Horror", 2025)
        ))
        val visible = MovieCatalog.launchMovies(parsed)
        assertEquals(4, parsed.size)
        assertEquals(3, visible.size)
        assertTrue(visible.none { it.collection == "Horror" })
        assertTrue(visible.any { it.id == "romance" })
        assertTrue(visible.any { it.id == "fall" })
        assertTrue(visible.any { it.id == "christmas" })
    }

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

    @Test fun sameSizeOrLargerReplacementCannotErasePreviouslySavedMovies() {
        val current = MovieCatalog.parse(catalog(
            row("one", "First Movie", year = 2024),
            row("two", "Second Movie", year = 2025)
        ))
        val sameSizeReplacement = MovieCatalog.parse(catalog(
            row("one", "First Movie", year = 2024),
            row("three", "Third Movie", year = 2026)
        ))
        val largerReplacement = MovieCatalog.parse(catalog(
            row("one", "First Movie", year = 2024),
            row("three", "Third Movie", year = 2026),
            row("four", "Fourth Movie", year = 2027)
        ))
        assertFalse(MovieCatalog.acceptableUpdate(current, sameSizeReplacement))
        assertFalse(MovieCatalog.acceptableUpdate(current, largerReplacement))
    }

    @Test fun updatePreservesMovieAndPosterIdentityButAllowsVerifiedCollectionCorrection() {
        val current = MovieCatalog.parse(catalog(
            row("one", "First Movie", "Unspecified", 2024),
            row("two", "Second Movie", "Fall", 2025)
        ))
        val corrected = MovieCatalog.parse(catalog(
            row("one", "First Movie", "Christmas", 2024),
            row("two", "Second Movie", "Fall", 2025),
            row("three", "Third Movie", "Horror", 2026)
        ))
        val changedTitle = MovieCatalog.parse(catalog(
            row("one", "A Different Movie", "Christmas", 2024),
            row("two", "Second Movie", "Fall", 2025),
            row("three", "Third Movie", "Horror", 2026)
        ))
        val changedId = MovieCatalog.parse(catalog(
            row("renamed-one", "First Movie", "Christmas", 2024),
            row("two", "Second Movie", "Fall", 2025),
            row("three", "Third Movie", "Horror", 2026)
        ))
        assertTrue(MovieCatalog.acceptableUpdate(current, corrected))
        assertFalse(MovieCatalog.acceptableUpdate(current, changedTitle))
        assertFalse(MovieCatalog.acceptableUpdate(current, changedId))
    }

    @Test fun scheduledWikidataIdsRemainVisibleInNativeSearchCatalog() {
        val imported = MovieCatalog.parse(catalog(
            row("wikidata-q12345", "Christmas in the Valley", "Christmas", 2026)
        ))
        assertEquals(1, imported.size)
        assertEquals("wikidata-q12345", imported.single().id)
        // Upstream uppercase Wikidata Q identifiers are not valid native IDs.
        assertThrows(IllegalArgumentException::class.java) {
            MovieCatalog.parse(catalog(
                row("wikidata-Q12345", "Christmas in the Valley", "Christmas", 2026)
            ))
        }
    }

    @Test fun duplicateIdsCannotCrashTheNativeMovieList() {
        val parsed = MovieCatalog.parse(catalog(
            row("shared-id", "First Movie", year = 2024),
            row("shared-id", "Second Movie", year = 2025),
            row("unique-id", "Third Movie", year = 2026)
        ))
        assertEquals(2, parsed.size)
        assertEquals(2, parsed.map { it.id }.toSet().size)
        assertTrue(parsed.any { it.title == "First Movie" })
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
    @Test fun verifiedYearCorrectionsKeepMovieIdentityAndRejectUnreviewedChanges() {
        val old = MovieCatalog.parse(catalog(
            row("wikidata-q130582183", "Holiday Date", "Unspecified", 2022),
            row("other", "Another Movie", "Fall", 2025)
        ))
        val corrected = MovieCatalog.parse(catalog(
            row("wikidata-q130582183", "Holiday Date", "Unspecified", 2019),
            row("other", "Another Movie", "Fall", 2025)
        ))
        val unreviewed = MovieCatalog.parse(catalog(
            row("wikidata-q130582183", "Holiday Date", "Unspecified", 2018),
            row("other", "Another Movie", "Fall", 2025)
        ))
        assertTrue(MovieCatalog.acceptableUpdate(old, corrected))
        assertFalse(MovieCatalog.acceptableUpdate(old, unreviewed))
        assertFalse(MovieCatalog.acceptableUpdate(corrected, old))
        assertEquals(listOf(PosterRepository.key("Holiday Date", 2022)),
            MovieCatalog.legacyScoreKeys(corrected.first { it.id == "wikidata-q130582183" }))
    }

    @Test fun allFiveDocumentedYearCorrectionsAreAccepted() {
        val rows = listOf(
            Triple("wikidata-q3548803", "A Christmas Wedding Tail", 2020 to 2011),
            Triple("wikidata-q130582183", "Holiday Date", 2022 to 2019),
            Triple("wikidata-q99292771", "Marrying Father Christmas", 2020 to 2018),
            Triple("wikidata-q99293243", "Return to Christmas Creek", 2023 to 2018),
            Triple("wikidata-q3549131", "The Wishing Well", 2021 to 2010)
        )
        for ((id, title, years) in rows) {
            val old = listOf(Movie(id, title, years.first, "Unspecified"))
            val next = listOf(Movie(id, title, years.second, "Unspecified"))
            assertTrue("Expected verified correction for $title",
                MovieCatalog.acceptableUpdate(old, next))
            assertEquals(listOf(PosterRepository.key(title, years.first)),
                MovieCatalog.legacyScoreKeys(next.single()))
        }
    }


    @Test fun nativeSearchSupportsVerifiedProducersWithoutTreatingThemAsNetworks() {
        val movies = MovieCatalog.parse(catalog(
            row("reel-one", "A Winter Promise", "Christmas", 2024)
                .put("production_company", "Reel One Entertainment"),
            row("marvista", "A Summer Promise", "Unspecified", 2023)
                .put("production_company", "MarVista Entertainment"),
            row("unknown", "A Christmas Village", "Christmas", 2018),
            row("malformed", "Another Film", "Fall", 2022)
                .put("production_company", "MarVista\\nFake")
        ))
        val reel = movies.single { it.id == "reel-one" }
        val marvista = movies.single { it.id == "marvista" }
        assertNull(reel.network)
        assertEquals("Reel One Entertainment", reel.productionCompany)
        assertTrue(MovieCatalog.matchesQuery(reel, "Reel One 2024"))
        assertTrue(MovieCatalog.matchesQuery(marvista, "MarVista"))
        assertFalse(MovieCatalog.matchesQuery(reel, "MarVista"))
        assertFalse(MovieCatalog.matchesQuery(movies.single { it.id == "unknown" }, "Reel One"))
        assertNull(movies.single { it.id == "malformed" }.productionCompany)
    }

    @Test fun nativeSearchMatchesOnlyPubliclyListedNetworksWithoutGuessing() {
        val hallmark = row("hallmark-film", "Autumn Dreams", "Fall", 2015)
            .put("network", "Hallmark Channel")
        val lifetime = row("lifetime-film", "The Perfect Proposal", "Unspecified", 2024)
            .put("network", "Lifetime")
        val unknown = row("unknown-film", "A Christmas Story", "Christmas", 2025)
        val movies = MovieCatalog.parse(catalog(hallmark, lifetime, unknown))
        val first = movies.single { it.id == "hallmark-film" }
        val second = movies.single { it.id == "lifetime-film" }
        val third = movies.single { it.id == "unknown-film" }
        assertEquals("Hallmark Channel", first.network)
        assertEquals("Lifetime", second.network)
        assertNull(third.network)
        assertTrue(MovieCatalog.matchesQuery(first, "  hallmark  "))
        assertTrue(MovieCatalog.matchesQuery(second, "LIFETIME"))
        assertTrue(MovieCatalog.matchesQuery(first, "autumn"))
        assertTrue(MovieCatalog.matchesQuery(third, "Christmas"))
        assertFalse(MovieCatalog.matchesQuery(third, "Hallmark"))
        assertFalse(MovieCatalog.matchesQuery(first, "Lifetime"))
        assertTrue(MovieCatalog.matchesQuery(third, " "))
    }

    @Test fun malformedPublicNetworkMetadataIsNotShownOrSearched() {
        val movies = MovieCatalog.parse(catalog(
            row("null-network", "One").put("network", JSONObject.NULL),
            row("long-network", "Two").put("network", "x".repeat(81)),
            row("control-network", "Three").put("network", "Hallmark\nFake")
        ))
        assertTrue(movies.all { it.network == null })
        assertFalse(movies.any { MovieCatalog.matchesQuery(it, "Hallmark") })
    }


    @Test fun nativeSearchCombinesTitleNetworkSeasonAndYearWithoutInventingMetadata() {
        val movies = MovieCatalog.parse(catalog(
            row("hallmark-2024", "An Autumn Promise", "Fall", 2024)
                .put("network", "Hallmark Channel"),
            row("lifetime-2024", "Christmas at Home", "Christmas", 2024)
                .put("network", "Lifetime"),
            row("unknown-2024", "Christmas in the Valley", "Christmas", 2024),
            row("hallmark-2023", "Christmas Reunion", "Christmas", 2023)
                .put("network", "Hallmark Mystery")
        ))
        fun titles(query: String) =
            movies.filter { MovieCatalog.matchesQuery(it, query) }.map { it.title }.toSet()

        assertEquals(setOf("An Autumn Promise"), titles("  HALLMARK   2024 "))
        assertEquals(setOf("Christmas at Home"), titles("Lifetime Christmas 2024"))
        assertEquals(setOf("Christmas Reunion"), titles("Mystery 2023 Christmas"))
        assertEquals(setOf("An Autumn Promise"), titles("Autumn Fall"))
        assertEquals(setOf("Christmas in the Valley"), titles("Valley 2024"))
        assertTrue(titles("Lifetime 2023").isEmpty())
        assertTrue(titles("Hallmark Valley").isEmpty())
        assertEquals(4, titles("  ").size)
    }

}
