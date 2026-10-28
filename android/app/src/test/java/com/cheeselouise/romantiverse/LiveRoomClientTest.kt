package com.cheeselouise.romantiverse

import org.junit.Assert.*
import org.junit.Test

class LiveRoomClientTest {
    private val token = "a".repeat(64)
    private val code = "ABCD234"

    private fun snapshot(revision: Int, marks: String, title: String = "Autumn at Apple Hill"): String {
        val cardJson = (0..24).joinToString(",") { """{"label":"Square $it"}""" }
        return """{
            "room": {
                "code":"$code","movie_title":"$title","movie_collection":"Fall",
                "release_year":2024,"season":"Romance","mode":"classic","status":"playing",
                "poster_url":"https://image.tmdb.org/t/p/w500/sample.jpg",
                "players":[{"id":"player-1","name":"Host","lines":0,"marked":1}]
            },
            "token":"$token","player_id":"player-1",
            "card":[$cardJson],
            "marked":[$marks],"revision":$revision
        }"""
    }

    @Test fun invitationsContainOnlyRoomCode() {
        val url = RoomInvites.url(code)
        assertEquals("https://moldavite333.github.io/Romantiverse-Bingo-App/?room=$code", url)
        assertEquals(code, RoomInvites.fromUrl(url))
        assertFalse(url.contains(token))
        assertNull(RoomInvites.fromUrl(url + "&room=ZZZZ222"))
        assertNull(RoomInvites.fromUrl("https://evil.example/Romantiverse-Bingo-App/?room=$code"))
        assertNull(RoomInvites.fromUrl("http://moldavite333.github.io/Romantiverse-Bingo-App/?room=$code"))
        assertNull(RoomInvites.normalize("ABCDE01"))
    }

    @Test fun serverMovieCollectionAndThemeRemainSeparate() {
        val result = LiveRoomProtocol.parse(snapshot(0, "12"))
        assertEquals("Autumn at Apple Hill", result.room.movie.title)
        assertEquals("Fall", result.room.movie.collection)
        assertEquals("Romance", result.room.movie.theme)
        assertEquals(2024, result.room.movie.year)
        assertEquals(25, result.card.size)
        assertEquals(setOf(12), result.marks)
        assertEquals(code, result.session?.code)
        assertTrue(result.session!!.valid())
    }

    @Test fun olderPollCannotUndoAuthoritativeMark() {
        val marked = LiveRoomProtocol.parse(snapshot(3, "0,1,2,3,4,12"))
        assertEquals(100, marked.score)
        val stale = LiveRoomProtocol.parse(snapshot(2, "12"), marked)
        assertEquals(3, stale.revision)
        assertEquals(marked.marks, stale.marks)
        assertEquals(marked.card, stale.card)
    }

    @Test fun roomPreviewsNeverExposeSessionTokens() {
        val preview = """{
            "room":{"code":"$code","movie_title":"A Movie","movie_collection":"Unspecified",
            "season":"Romance","mode":"classic","status":"lobby","players":[]}
        }"""
        val result = LiveRoomProtocol.parse(preview)
        assertNull(result.session)
        assertEquals("Unspecified", result.room.movie.collection)
        assertEquals(emptyList<String>(), result.card)
    }

    @Test fun switchingRoomsNeverReusesPreviousPlayersPrivateCardOrCredentials() {
        val prior = LiveRoomProtocol.parse(snapshot(9, "0,1,2,3,4,12"))
        val otherRoom = """{
            "room":{"code":"WXYZ345","movie_title":"Another Movie",
                "movie_collection":"Christmas","season":"Christmas",
                "mode":"classic","status":"lobby","players":[]}
        }"""
        val switched = LiveRoomProtocol.parse(otherRoom, prior)
        assertEquals("WXYZ345", switched.room.code)
        assertEquals("Another Movie", switched.room.movie.title)
        assertEquals("Christmas", switched.room.movie.collection)
        assertEquals(emptyList<String>(), switched.card)
        assertEquals(emptySet<Int>(), switched.marks)
        assertEquals(0, switched.revision)
        assertEquals(0, switched.score)
        assertNull(switched.session)
    }

    @Test fun sameRoomStateOnlyResponseKeepsCardAndRevision() {
        val prior = LiveRoomProtocol.parse(snapshot(9, "0,1,2,3,4,12"))
        val stateOnly = """{
            "room":{"code":"$code","movie_title":"Autumn at Apple Hill",
                "movie_collection":"Fall","season":"Romance",
                "mode":"classic","status":"playing","players":[]}
        }"""
        val next = LiveRoomProtocol.parse(stateOnly, prior)
        assertEquals(prior.card, next.card)
        assertEquals(prior.marks, next.marks)
        assertEquals(9, next.revision)
        assertEquals(prior.session, next.session)
    }
}
