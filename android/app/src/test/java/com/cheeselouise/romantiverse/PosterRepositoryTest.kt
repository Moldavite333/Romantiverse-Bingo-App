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
}
