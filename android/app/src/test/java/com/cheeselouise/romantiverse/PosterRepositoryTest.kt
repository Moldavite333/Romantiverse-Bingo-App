package com.cheeselouise.romantiverse

import org.junit.Assert.*
import org.junit.Test

class PosterRepositoryTest {
    private fun entry(name: String, locked: Boolean = false) =
        PosterRepository.Entry("https://image.tmdb.org/t/p/w500/$name.jpg", locked)

    @Test fun lockedPublishedPosterOverridesAutomaticArt() {
        val key = PosterRepository.key("Autumn Dreams", 2015)
        val result = PosterRepository.merge(
            emptyMap(),
            listOf(key to entry("automatic")),
            listOf(key to entry("editorial", locked = true))
        )
        assertEquals(entry("editorial", locked = true), result[key])
    }

    @Test fun unapprovedOrDifferentYearCannotReplaceArtwork() {
        val older = PosterRepository.key("Autumn Dreams", 2015)
        val newer = PosterRepository.key("Autumn Dreams", 2025)
        val result = PosterRepository.merge(
            mapOf(older to entry("locked", locked = true)),
            listOf(older to entry("automatic"), newer to entry("newer")),
            emptyList()
        )
        assertEquals(entry("locked", locked = true), result[older])
        assertEquals(entry("newer"), result[newer])
    }

    @Test fun successfulPublishedRefreshRevokesUnpublishedLockedPoster() {
        val key = PosterRepository.key("Autumn Dreams", 2015)
        val result = PosterRepository.merge(
            mapOf(key to entry("previous-hq", locked = true)),
            listOf(key to entry("automatic")),
            emptyList(),
            publishedAuthoritative = true
        )
        assertEquals(entry("automatic"), result[key])
    }

    @Test fun successfulPublishedRefreshRemovesRevokedPosterWhenNoFallbackExists() {
        val key = PosterRepository.key("Autumn Dreams", 2015)
        val result = PosterRepository.merge(
            mapOf(key to entry("previous-hq", locked = true)),
            emptyList(),
            emptyList(),
            publishedAuthoritative = true
        )
        assertFalse(result.containsKey(key))
    }

    @Test fun unavailablePublishedFeedKeepsPreviouslyPublishedArtworkOffline() {
        val key = PosterRepository.key("Autumn Dreams", 2015)
        val result = PosterRepository.merge(
            mapOf(key to entry("previous-hq", locked = true)),
            listOf(key to entry("automatic")),
            emptyList()
        )
        assertEquals(entry("previous-hq", locked = true), result[key])
    }

    @Test fun unlockedPublishedPosterDoesNotRemainPinnedAboveAutomaticArt() {
        val key = PosterRepository.key("Autumn Dreams", 2015)
        val result = PosterRepository.merge(
            mapOf(key to entry("previous-hq", locked = true)),
            listOf(key to entry("automatic")),
            listOf(key to entry("new-hq", locked = false)),
            publishedAuthoritative = true
        )
        assertEquals(entry("automatic"), result[key])
    }

    @Test fun stillPublishedLockedPosterWinsAfterAuthoritativeReconciliation() {
        val key = PosterRepository.key("Autumn Dreams", 2015)
        val result = PosterRepository.merge(
            mapOf(key to entry("previous-hq", locked = true)),
            listOf(key to entry("automatic")),
            listOf(key to entry("current-hq", locked = true)),
            publishedAuthoritative = true
        )
        assertEquals(entry("current-hq", locked = true), result[key])
    }

    @Test fun successfulAutomaticRefreshRemovesWithdrawnPoster() {
        val key = PosterRepository.key("Autumn Dreams", 2015)
        val result = PosterRepository.merge(
            mapOf(key to entry("incorrect-automatic")),
            emptyList(),
            emptyList(),
            cacheAuthoritative = true
        )
        assertFalse(result.containsKey(key))
    }

    @Test fun failedAutomaticRefreshKeepsOfflinePoster() {
        val key = PosterRepository.key("Autumn Dreams", 2015)
        val result = PosterRepository.merge(
            mapOf(key to entry("last-known-automatic")),
            emptyList(),
            emptyList()
        )
        assertEquals(entry("last-known-automatic"), result[key])
    }

    @Test fun automaticRefreshCannotRevokeHQLockWhilePublishedFeedIsOffline() {
        val key = PosterRepository.key("Autumn Dreams", 2015)
        val result = PosterRepository.merge(
            mapOf(key to entry("editorial", locked = true)),
            emptyList(),
            emptyList(),
            cacheAuthoritative = true
        )
        assertEquals(entry("editorial", locked = true), result[key])
    }

    @Test fun bothSuccessfulFeedsRemoveWithdrawnArtwork() {
        val automaticKey = PosterRepository.key("Autumn Dreams", 2015)
        val lockedKey = PosterRepository.key("Christmas Wishes", 2020)
        val result = PosterRepository.merge(
            mapOf(
                automaticKey to entry("incorrect-automatic"),
                lockedKey to entry("unpublished-hq", locked = true)
            ),
            emptyList(),
            emptyList(),
            cacheAuthoritative = true,
            publishedAuthoritative = true
        )
        assertTrue(result.isEmpty())
    }

    @Test fun malformedAutomaticFeedIsNotAnAuthoritativeEmptyRefresh() {
        assertThrows(org.json.JSONException::class.java) {
            PosterRepository.entries("""{"version":1}""", false)
        }
        assertThrows(IllegalArgumentException::class.java) {
            PosterRepository.entries("""{"version":2,"movies":[]}""", false)
        }
        assertTrue(PosterRepository.entries("""{"version":1,"movies":[]}""", false).isEmpty())
    }

    @Test fun growingCatalogDoesNotSilentlyDropPostersAfterFiveHundred() {
        val rows = (1..501).joinToString(",") { year ->
            """{"title":"Movie $year","release_year":2026,"poster_url":"https://image.tmdb.org/t/p/w500/$year.jpg"}"""
        }
        val parsed = PosterRepository.entries("""{"version":1,"movies":[$rows]}""", false)
        assertEquals(501, parsed.size)
        assertTrue(parsed.any { it.first == PosterRepository.key("Movie 501", 2026) })
    }

    @Test fun oversizedFeedFailsRatherThanRevokingUnseenPosters() {
        val rows = (1..3001).joinToString(",") { i ->
            """{"title":"Movie $i","release_year":2026,"poster_url":"https://image.tmdb.org/t/p/w500/$i.jpg"}"""
        }
        assertThrows(IllegalArgumentException::class.java) {
            PosterRepository.entries("""{"version":1,"movies":[$rows]}""", false)
        }
    }

    @Test fun onlyTrustedHttpsImageHostsAreAccepted() {
        assertNull(PosterRepository.approved("http://image.tmdb.org/t/p/w500/x.jpg"))
        assertNull(PosterRepository.approved("https://evil.example/t/p/w500/x.jpg"))
        assertNull(PosterRepository.approved("https://image.tmdb.org/t/p/w500/../x.jpg"))
        assertNull(PosterRepository.approved("https://image.tmdb.org/t/p/w500/x.jpg?token=secret"))
        assertEquals(
            "https://image.tmdb.org/t/p/w500/x.jpg",
            PosterRepository.approved("https://image.tmdb.org/t/p/w500/x.jpg")
        )
    }

    @Test fun canonicallyEquivalentPosterTitlesMatchAcrossPublicFeeds() {
        val composed = Movie("cafe-christmas", "Café Christmas", 2025, "Christmas")
        val decomposed = "Cafe\u0301 Christmas"
        val published = mapOf(PosterRepository.key(decomposed, 2025) to entry("hq-lock", locked = true))
        assertEquals(PosterRepository.key(composed.title, 2025), PosterRepository.key(decomposed, 2025))
        assertEquals(entry("hq-lock", locked = true), PosterRepository.forMovie(composed, published))
        assertNotEquals(PosterRepository.key(composed.title, 2024), PosterRepository.key(decomposed, 2025))
    }

    @Test fun titleAndYearMustMatchExactly() {
        assertNotEquals(
            PosterRepository.key("Autumn Dreams", 2015),
            PosterRepository.key("Autumn Dreams", 2025)
        )
        assertEquals(
            PosterRepository.key(" AUTUMN   DREAMS ", 2015),
            PosterRepository.key("Autumn Dreams", 2015)
        )
    }

    @Test fun verifiedYearCorrectionFindsLastKnownPosterWithoutMixingRemakes() {
        val corrected = Movie("wikidata-q130582183", "Holiday Date", 2019, "Christmas")
        val oldKey = PosterRepository.key("Holiday Date", 2022)
        val posters = mapOf(oldKey to entry("old-release-year"))
        assertEquals(entry("old-release-year"), PosterRepository.forMovie(corrected, posters))
        // The fallback is tied to the exact verified catalog ID and corrected year.
        assertNull(PosterRepository.forMovie(
            Movie("unrelated-remake", "Holiday Date", 2019, "Christmas"), posters
        ))
        assertNull(PosterRepository.forMovie(
            Movie(corrected.id, corrected.title, 2018, "Christmas"), posters
        ))
    }

    @Test fun hqLockOnVerifiedLegacyYearOverridesAutomaticCorrectedYear() {
        val corrected = Movie("wikidata-q130582183", "Holiday Date", 2019, "Christmas")
        val canonical = PosterRepository.key("Holiday Date", 2019)
        val legacy = PosterRepository.key("Holiday Date", 2022)
        val posters = mapOf(
            canonical to entry("automatic-new"),
            legacy to entry("hq-locked-old", locked = true)
        )
        assertEquals(entry("hq-locked-old", locked = true),
            PosterRepository.forMovie(corrected, posters))
        assertEquals(entry("automatic-new"),
            PosterRepository.forMovie(corrected, posters - legacy))
    }

    @Test fun canonicalLockedPosterWinsIfBothYearsHavePublishedLocks() {
        val corrected = Movie("wikidata-q130582183", "Holiday Date", 2019, "Christmas")
        val posters = mapOf(
            PosterRepository.key("Holiday Date", 2019) to entry("hq-current", locked = true),
            PosterRepository.key("Holiday Date", 2022) to entry("hq-old", locked = true)
        )
        assertEquals(entry("hq-current", locked = true),
            PosterRepository.forMovie(corrected, posters))
    }
}
