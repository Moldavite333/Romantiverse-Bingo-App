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
                "code":"$code","host_player_id":"player-1","movie_title":"$title","movie_collection":"Fall",
                "release_year":2024,"season":"Romance","mode":"classic","status":"playing",
                "poster_url":"https://image.tmdb.org/t/p/w500/sample.jpg",
                "players":[{"id":"player-1","name":"Host","lines":0,"marked":1}]
            },
            "token":"$token","player_id":"player-1",
            "card":[$cardJson],
            "marked":[$marks],"revision":$revision
        }"""
    }

    @Test fun nativeRoomLaunchScopeExcludesHorrorFromThemesAndInvites() {
        assertEquals(listOf("Romance", "Christmas", "Fall"), LaunchRoomScope.themes)
        for (theme in LaunchRoomScope.themes) {
            assertTrue(LaunchRoomScope.supports(theme, "Unspecified"))
            assertTrue(LaunchRoomScope.supports(theme, "Christmas"))
            assertFalse(LaunchRoomScope.supports(theme, "Horror"))
            assertFalse(LaunchRoomScope.supports(theme, " horror "))
            assertFalse(LaunchRoomScope.supports(theme, "HORROR"))
        }
        assertFalse(LaunchRoomScope.supports("Horror", "Fall"))
        assertFalse(LaunchRoomScope.supports("Unknown", "Unspecified"))
        assertFalse(LaunchRoomScope.supports(null, "Unspecified"))
    }

    @Test fun roomHttpResponsesAreBoundedBeforeAllocation() {
        assertEquals("", LiveRoomClient.readBounded(java.io.StringReader(""), 4096))
        assertEquals("ok", LiveRoomClient.readBounded(java.io.StringReader("ok"), 4096))
        val exact = "x".repeat(4096)
        assertEquals(exact, LiveRoomClient.readBounded(java.io.StringReader(exact), 4096))
        assertThrows(IllegalArgumentException::class.java) {
            LiveRoomClient.readBounded(java.io.StringReader(exact + "y"), 4096)
        }
        assertThrows(IllegalArgumentException::class.java) {
            LiveRoomClient.readBounded(java.io.StringReader("ok"), 0)
        }
    }

    @Test fun spokenMultiplayerSquaresIncludePositionFullTropeAndWinState() {
        assertEquals("B1: First meeting", LiveSquareAccessibility.label(0, "First meeting"))
        assertEquals("O5: A sentimental family heirloom",
            LiveSquareAccessibility.label(24, "A sentimental family heirloom"))
        assertEquals("N3: CHEESE LOUISE POD",
            LiveSquareAccessibility.label(12, "CHEESE LOUISE POD"))
        assertEquals("Free center square", LiveSquareAccessibility.state(12, true, true))
        assertEquals("Not marked", LiveSquareAccessibility.state(3, false, false))
        assertEquals("Marked", LiveSquareAccessibility.state(3, true, false))
        assertEquals("Marked, part of a completed Bingo line",
            LiveSquareAccessibility.state(3, true, true))
        assertThrows(IllegalArgumentException::class.java) {
            LiveSquareAccessibility.label(25, "Invalid")
        }
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

    @Test fun aNewInviteMustNotSilentlyReplaceAnActiveRoom() {
        assertFalse(RoomInvites.shouldOfferRoomSwitch(null, code))
        assertFalse(RoomInvites.shouldOfferRoomSwitch("not-a-code", code))
        assertFalse(RoomInvites.shouldOfferRoomSwitch(code, null))
        assertFalse(RoomInvites.shouldOfferRoomSwitch(code, code))
        assertTrue(RoomInvites.shouldOfferRoomSwitch("WXYZ345", code))
        assertTrue(RoomInvites.shouldOfferRoomSwitch("wxyz345", code))
        // A pasted URL must be parsed before reaching the switch decision.
        assertTrue(RoomInvites.shouldOfferRoomSwitch(
            RoomInvites.fromInput(RoomInvites.url("WXYZ345")), code))
    }

    @Test fun nativeJoinAcceptsPastedCodeLinkAndSharedInvitationMessage() {
        val invite = RoomInvites.url(code)
        val shared = "Play Romantiverse Bingo with me!\n" +
            "Autumn at Apple Hill · Fall collection · Romance card\n" + invite
        assertEquals(code, RoomInvites.fromInput(code.lowercase()))
        assertEquals(code, RoomInvites.fromInput("  $invite  "))
        assertEquals(code, RoomInvites.fromInput(shared))
        assertEquals(code, RoomInvites.editableInput(invite))
        assertEquals(code, RoomInvites.editableInput(shared))
        assertEquals("AB", RoomInvites.editableInput("ab"))
    }

    @Test fun nativeJoinRejectsForgedAmbiguousOrMalformedInvitations() {
        val invite = RoomInvites.url(code)
        val forged = "https://evil.example/Romantiverse-Bingo-App/?room=$code"
        val duplicate = "$invite\n${RoomInvites.url("WXYZ345")}"
        assertNull(RoomInvites.fromInput(forged))
        assertNull(RoomInvites.fromInput(duplicate))
        assertNull(RoomInvites.fromInput(invite + "&room=WXYZ345"))
        assertNull(RoomInvites.fromInput("not a room"))
        assertNull(RoomInvites.fromInput(null))
        assertEquals(forged, RoomInvites.editableInput(forged))
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

    @Test fun hostOnlyRoomControlsRequireMatchingServerHostIdentity() {
        val host = LiveRoomProtocol.parse(snapshot(1, "12"))
        assertEquals("player-1", host.room.hostPlayerId)
        assertTrue(host.canControlRoom)

        // A guest may have a perfectly valid private session, but never
        // receives the host's Start/Finish buttons.
        val guestJson = snapshot(1, "12")
            .replace("\"player_id\":\"player-1\"", "\"player_id\":\"guest-2\"")
            .replace("\"id\":\"player-1\"", "\"id\":\"guest-2\"")
        val guest = LiveRoomProtocol.parse(guestJson)
        assertEquals("player-1", guest.room.hostPlayerId)
        assertFalse(guest.canControlRoom)

        // A public preview identifies the host for display only. It grants
        // no player credentials or room-control authority.
        val preview = LiveRoomProtocol.parse(
            """{"room":{"code":"$code","host_player_id":"player-1",
                "movie_title":"A Movie","season":"Romance","status":"lobby"}}"""
        )
        assertNull(preview.session)
        assertFalse(preview.canControlRoom)

        // Older server versions without host metadata must fail closed.
        val missingHost = LiveRoomProtocol.parse(snapshot(1, "12")
            .replace("\"host_player_id\":\"player-1\",", ""))
        assertNull(missingHost.room.hostPlayerId)
        assertFalse(missingHost.canControlRoom)
    }

    @Test fun olderPollCannotUndoAuthoritativeMark() {
        val marked = LiveRoomProtocol.parse(snapshot(3, "0,1,2,3,4,12"))
        assertEquals(100, marked.score)
        val stale = LiveRoomProtocol.parse(snapshot(2, "12"), marked)
        assertEquals(3, stale.revision)
        assertEquals(marked.marks, stale.marks)
        assertEquals(marked.card, stale.card)
    }

    @Test fun olderPollCannotReopenLobbyOrRollBackPlayerRoster() {
        val current = LiveRoomProtocol.parse(snapshot(8, "0,1,2,3,4,12")
            .replace("\"status\":\"playing\"", "\"status\":\"finished\"")
            .replace("\"name\":\"Host\"", "\"name\":\"Host Updated\""))
        val stale = LiveRoomProtocol.parse(snapshot(7, "12")
            .replace("\"status\":\"playing\"", "\"status\":\"lobby\""), current)
        assertEquals(current, stale)
        assertEquals("finished", stale.room.movie.status)
        assertEquals("Host Updated", stale.room.players.single().name)
        assertEquals(100, stale.score)
    }

    @Test fun delayedSameRevisionPollCannotReopenStartedOrFinishedRoom() {
        // Host start/finish changes room status without changing a player's
        // revision, so revision checks alone cannot order these responses.
        val lobbyJson = snapshot(4, "12")
            .replace("\"status\":\"playing\"", "\"status\":\"lobby\"")
        val finishedJson = snapshot(4, "12")
            .replace("\"status\":\"playing\"", "\"status\":\"finished\"")
        val lobby = LiveRoomProtocol.parse(lobbyJson)
        val playing = LiveRoomProtocol.parse(snapshot(4, "12"), lobby)
        assertEquals("playing", playing.room.movie.status)
        val lateLobby = LiveRoomProtocol.parse(lobbyJson, playing)
        assertEquals("playing", lateLobby.room.movie.status)
        val finished = LiveRoomProtocol.parse(finishedJson, lateLobby)
        assertEquals("finished", finished.room.movie.status)
        val latePlaying = LiveRoomProtocol.parse(snapshot(4, "12"), finished)
        assertEquals("finished", latePlaying.room.movie.status)
    }

    @Test fun newerMarkRevisionCannotRollBackFinishedRoomStatus() {
        val finishedJson = snapshot(4, "12")
            .replace("\"status\":\"playing\"", "\"status\":\"finished\"")
        val finished = LiveRoomProtocol.parse(finishedJson)
        val delayedMark = LiveRoomProtocol.parse(snapshot(5, "0,12"), finished)
        // Keep the newer authoritative mark and revision while retaining the
        // terminal room state observed from a newer host response.
        assertEquals(5, delayedMark.revision)
        assertEquals(setOf(0, 12), delayedMark.marks)
        assertEquals("finished", delayedMark.room.movie.status)
        // A new room is independent and must not inherit another room's status.
        val differentRoom = LiveRoomProtocol.parse(
            snapshot(0, "12").replace(code, "WXYZ345"), delayedMark
        )
        assertEquals("playing", differentRoom.room.movie.status)
    }

    @Test fun malformedServerCardsNeverReplaceAPlayableBoard() {
        val valid = snapshot(4, "0,1,12")
        val prior = LiveRoomProtocol.parse(valid)
        val shortCard = valid.replace(
            """{"label":"Square 24"}""", ""
        ).replace("},]", "}]")
        assertEquals(24, org.json.JSONObject(shortCard).getJSONArray("card").length())
        assertThrows(IllegalArgumentException::class.java) {
            LiveRoomProtocol.parse(shortCard, prior)
        }
        val blankSquare = valid.replace(
            """{"label":"Square 8"}""", """{"label":"  "}"""
        )
        assertThrows(IllegalArgumentException::class.java) {
            LiveRoomProtocol.parse(blankSquare, prior)
        }
        val missingLabel = valid.replace(
            """{"label":"Square 8"}""", """{"id":"missing"}"""
        )
        assertThrows(IllegalArgumentException::class.java) {
            LiveRoomProtocol.parse(missingLabel, prior)
        }
        val nullLabel = valid.replace(
            """{"label":"Square 8"}""", """{"label":null}"""
        )
        assertThrows(IllegalArgumentException::class.java) {
            LiveRoomProtocol.parse(nullLabel, prior)
        }
        // Distinct server IDs cannot excuse duplicate text on the visible board.
        val duplicateLabel = valid.replace(
            """{"label":"Square 8"}""", """{"id":"different","label":"  SQUARE   0  "}"""
        )
        assertThrows(IllegalArgumentException::class.java) {
            LiveRoomProtocol.parse(duplicateLabel, prior)
        }
        val unicodeDuplicate = valid.replace(
            """{"label":"Square 8"}""", """{"label":"Ｓｑｕａｒｅ ０"}"""
        )
        assertThrows(IllegalArgumentException::class.java) {
            LiveRoomProtocol.parse(unicodeDuplicate, prior)
        }
        // A number is not a trope label even if JSON can coerce it to text.
        val numericLabel = valid.replace(
            """{"label":"Square 8"}""", """{"label":8}"""
        )
        assertThrows(IllegalArgumentException::class.java) {
            LiveRoomProtocol.parse(numericLabel, prior)
        }
        assertEquals(25, prior.card.size)
        assertEquals(setOf(0, 1, 12), prior.marks)
        assertEquals(4, prior.revision)
    }

    @Test fun malformedServerMarksAndRevisionsCannotOverwriteEarnedProgress() {
        val valid = snapshot(6, "0,1,12")
        val prior = LiveRoomProtocol.parse(valid)
        assertEquals(setOf(0, 1, 12), prior.marks)
        for (entries in listOf(
            "\"0\",1,12", // numeric strings must not be coerced
            "0,1.5,12",    // fractional indices must not be truncated
            "0,25,12",     // out of range
            "0,0,12",      // duplicate marks
            "0,null,12",   // missing index
            "0,true,12"    // booleans are not indices
        )) {
            val malformed = valid.replace("\"marked\":[0,1,12]", "\"marked\":[$entries]")
            assertNotEquals(valid, malformed)
            assertThrows(IllegalArgumentException::class.java) {
                LiveRoomProtocol.parse(malformed, prior)
            }
        }
        for (value in listOf("\"6\"", "6.5", "-1", "null", "true")) {
            val malformed = valid.replace("\"revision\":6", "\"revision\":$value")
            assertNotEquals(valid, malformed)
            assertThrows(IllegalArgumentException::class.java) {
                LiveRoomProtocol.parse(malformed, prior)
            }
        }
        val objectMarks = org.json.JSONObject(valid)
            .put("marked", org.json.JSONObject()).toString()
        val objectCard = org.json.JSONObject(valid)
            .put("card", org.json.JSONObject()).toString()
        assertThrows(IllegalArgumentException::class.java) {
            LiveRoomProtocol.parse(objectMarks, prior)
        }
        assertThrows(IllegalArgumentException::class.java) {
            LiveRoomProtocol.parse(objectCard, prior)
        }
        assertEquals(setOf(0, 1, 12), prior.marks)
        assertEquals(6, prior.revision)
        assertEquals(25, prior.card.size)
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

    @Test fun latePollAfterLeaveCannotResurrectAbandonedSession() {
        val old = LiveRoomProtocol.parse(snapshot(4, "0,1,2,3,4"))
        assertTrue(RoomResponseGuard.accepts(3, 3, code, old.session, old))
        assertFalse(RoomResponseGuard.accepts(3, 4, code, null, old))
    }

    @Test fun wrongRoomOrPlayerCredentialsCannotOverwriteActiveRoom() {
        val current = LiveRoomProtocol.parse(snapshot(4, "0,1"))
        val another = LiveRoomProtocol.parse(
            snapshot(5, "0,1,2").replace(code, "WXYZ345")
        )
        assertFalse(RoomResponseGuard.accepts(2, 2, code, current.session, another))
        assertFalse(RoomResponseGuard.accepts(2, 2, null, current.session, another))
        val changedToken = LiveRoomProtocol.parse(
            snapshot(5, "0,1,2").replace(token, "b".repeat(64))
        )
        assertFalse(RoomResponseGuard.accepts(2, 2, code, current.session, changedToken))
    }

    @Test fun stalePreviewCannotReplaceNewInviteOrActiveSession() {
        val active = LiveRoomProtocol.parse(snapshot(1, "0"))
        assertTrue(RoomResponseGuard.acceptsPreview(2, 2, code, null, code))
        assertFalse(RoomResponseGuard.acceptsPreview(2, 3, code, null, code))
        assertFalse(RoomResponseGuard.acceptsPreview(2, 2, "WXYZ345", null, code))
        assertFalse(RoomResponseGuard.acceptsPreview(2, 2, code, active.session, code))
    }

    @Test fun joinRequiresMatchingCodeAndValidCredentials() {
        val joining = LiveRoomProtocol.parse(snapshot(1, "0"))
        assertTrue(RoomResponseGuard.accepts(7, 7, code, null, joining))
        assertFalse(RoomResponseGuard.accepts(7, 7, "WXYZ345", null, joining))
        val previewOnly = LiveRoomProtocol.parse(
            """{"room":{"code":"$code","movie_title":"A Movie","season":"Romance"}}"""
        )
        assertFalse(RoomResponseGuard.accepts(7, 7, code, null, previewOnly))
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

    @Test fun processRestartRestoresRoomFromTokenlessServerState() {
        // Real state responses contain player_id/card/marks/revision but never
        // echo the player's secret token. This must work with no prior snapshot.
        val restored = LiveSession(code, token, "player-1")
        val state = snapshot(7, "0,1,12").replace("\"token\":\"$token\",", "")
        assertFalse(state.contains("\"token\""))
        val next = LiveRoomProtocol.parse(state, authenticatedSession = restored)
        assertEquals(restored, next.session)
        assertEquals(setOf(0, 1, 12), next.marks)
        assertEquals(25, next.card.size)
        assertEquals(7, next.revision)
        assertTrue(RoomResponseGuard.accepts(3, 3, code, restored, next))
        // An unauthenticated preview or join cannot borrow restored credentials.
        assertNull(LiveRoomProtocol.parse(state).session)
    }

    @Test fun sameRoomPublicPreviewCannotBorrowRestoredPlayerCredentials() {
        val restored = LiveSession(code, token, "player-1")
        val preview = """{
            "room":{"code":"$code","movie_title":"Autumn at Apple Hill",
                "movie_collection":"Fall","season":"Romance","status":"lobby","players":[]}
        }"""
        val result = LiveRoomProtocol.parse(preview, authenticatedSession = restored)
        assertNull(result.session)
        assertTrue(result.card.isEmpty())
        assertFalse(RoomResponseGuard.accepts(1, 1, code, restored, result))

        // Even a response with a private card is not proof of player identity
        // when the server omits player_id.
        val missingIdentity = snapshot(4, "0,12")
            .replace("\"token\":\"$token\",", "")
            .replace("\"player_id\":\"player-1\",", "")
        assertNull(LiveRoomProtocol.parse(
            missingIdentity, authenticatedSession = restored
        ).session)

        // A real authenticated state response still restores a session.
        val validState = snapshot(4, "0,12").replace("\"token\":\"$token\",", "")
        assertEquals(restored, LiveRoomProtocol.parse(
            validState, authenticatedSession = restored
        ).session)
    }

    @Test fun restoredCredentialsNeverCrossRoomsOrPlayers() {
        val restored = LiveSession(code, token, "player-1")
        val state = snapshot(2, "0,12").replace("\"token\":\"$token\",", "")
        val otherRoom = state.replace("\"code\":\"$code\"", "\"code\":\"WXYZ345\"")
        assertNull(LiveRoomProtocol.parse(otherRoom, authenticatedSession = restored).session)
        val otherPlayer = state.replace("\"player_id\":\"player-1\"",
            "\"player_id\":\"player-2\"")
        assertNull(LiveRoomProtocol.parse(otherPlayer, authenticatedSession = restored).session)
        val prior = LiveRoomProtocol.parse(snapshot(1, "12"))
        assertNull(LiveRoomProtocol.parse(otherPlayer, prior, restored).session)
    }
}
