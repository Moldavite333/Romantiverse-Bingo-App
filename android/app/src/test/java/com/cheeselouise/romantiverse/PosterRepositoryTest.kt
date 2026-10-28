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
