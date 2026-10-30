package com.cheeselouise.romantiverse

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URI
import java.net.URL
import java.net.URLDecoder
import java.io.Reader
import java.util.Locale
import java.text.Normalizer

/** Launch-only multiplayer scope; archived horror content belongs in a separate future app. */
object LaunchRoomScope {
    val themes = listOf("Romance", "Christmas", "Fall")
    const val UNSUPPORTED_MESSAGE = "This invitation is for a game not available in Romantiverse Bingo."

    fun supports(theme: String?, collection: String?): Boolean =
        theme != null && theme in themes &&
            collection?.trim()?.equals("Horror", ignoreCase = true) != true
}

/** Public room code only. Player credentials must never appear in invitations. */
object RoomInvites {
    private val codePattern = Regex("^[A-HJ-NP-Z2-9]{7}$")
    private const val base = "https://moldavite333.github.io/Romantiverse-Bingo-App/"

    fun normalize(value: String?): String? =
        value?.trim()?.uppercase(Locale.ROOT)?.takeIf { codePattern.matches(it) }

    fun url(code: String): String = base + "?room=" +
        (normalize(code) ?: throw IllegalArgumentException("Invalid room code"))

    /** Never silently abandon a saved multiplayer session when opening a different invite. */
    fun shouldOfferRoomSwitch(incomingCode: String?, activeCode: String?): Boolean {
        val incoming = normalize(incomingCode) ?: return false
        return activeCode != null && incoming != activeCode
    }

    /**
     * Accept a room code, a full HTTPS invitation URL, or the multiline text
     * produced by Android Share. Only our exact public invite origin is trusted.
     * Ambiguous messages containing multiple invitation URLs are rejected.
     */
    fun fromInput(value: String?): String? {
        val text = value?.trim() ?: return null
        normalize(text)?.let { return it }
        fromUrl(text)?.let { return it }
        return text.lineSequence().mapNotNull { fromUrl(it.trim()) }.singleOrNull()
    }

    /** Turn a pasted invitation into a short, editable room code. */
    fun editableInput(value: String): String {
        fromInput(value)?.let { return it }
        val text = value.trim()
        return if ("://" in text || '\n' in text) text.take(512)
            else text.uppercase(Locale.ROOT).take(7)
    }

    fun fromUrl(value: String?): String? {
        if (value.isNullOrBlank()) return null
        return runCatching {
            val uri = URI(value)
            if (uri.scheme != "https" || uri.host != "moldavite333.github.io" ||
                uri.port != -1 || uri.userInfo != null ||
                uri.path !in listOf("/Romantiverse-Bingo-App/", "/Romantiverse-Bingo-App")) return null
            val params = uri.rawQuery?.split("&")?.map { part ->
                val pair = part.split("=", limit = 2)
                URLDecoder.decode(pair[0], "UTF-8") to
                    URLDecoder.decode(pair.getOrElse(1) { "" }, "UTF-8")
            } ?: return null
            val codes = params.filter { it.first == "room" }
            if (codes.size != 1) null else normalize(codes.single().second)
        }.getOrNull()
    }
}

/** Spoken square labels stay readable even when the compact grid truncates text. */
object LiveSquareAccessibility {
    fun label(index: Int, text: String): String {
        require(index in 0..24) { "Invalid square" }
        return "${"BINGO"[index % 5]}${index / 5 + 1}: $text"
    }

    fun state(index: Int, marked: Boolean, winning: Boolean): String = when {
        index == BingoEngine.CENTER -> "Free center square"
        winning -> "Marked, part of a completed Bingo line"
        marked -> "Marked"
        else -> "Not marked"
    }
}

data class LiveSession(val code: String, val token: String, val playerId: String) {
    fun valid(): Boolean = RoomInvites.normalize(code) == code &&
        Regex("^[0-9a-f]{64}$").matches(token) && playerId.isNotBlank()
}

data class LivePlayer(val id: String, val name: String, val lines: Int, val marked: Int)
data class LiveMovie(
    val title: String, val collection: String, val theme: String,
    val year: Int?, val poster: String?, val mode: String, val status: String
)
data class LiveRoom(
    val code: String, val movie: LiveMovie, val players: List<LivePlayer>,
    val hostPlayerId: String? = null
)
data class LiveSnapshot(
    val room: LiveRoom, val card: List<String>, val marks: Set<Int>,
    val revision: Int, val session: LiveSession?
) {
    /** Host-only controls are available only when the server explicitly identifies this player. */
    val canControlRoom: Boolean get() = session?.playerId?.let { it == room.hostPlayerId } ?: false
    val lines: Int get() = BingoEngine.winningLines(marks).size
    val score: Int get() = BingoEngine.score(marks)
    val blackout: Boolean get() = marks.size == 25 || marks.size == 24 && 12 !in marks
}

/** Room lifecycle never runs backwards, even when independent polls share a player's
 * card revision. Host start/finish does not increment that revision, and a delayed
 * mark response may have a newer revision but an older room status.
 */
internal object RoomStatusProgression {
    private val order = mapOf("lobby" to 0, "playing" to 1, "finished" to 2)

    fun latest(previous: String?, incoming: String): String {
        val oldRank = previous?.let { order[it] }
        val newRank = order[incoming]
        return if (previous != null && oldRank != null && newRank != null && newRank < oldRank) {
            previous
        } else incoming
    }
}

/** Parse server-authoritative cards and marks; do not regenerate a shared card locally. */
object LiveRoomProtocol {
    fun parse(
        json: String,
        previous: LiveSnapshot? = null,
        authenticatedSession: LiveSession? = null
    ): LiveSnapshot {
        val root = JSONObject(json)
        val roomData = root.getJSONObject("room")
        val code = RoomInvites.normalize(roomData.getString("code"))
            ?: error("Invalid server room code")
        val movie = LiveMovie(
            title = roomData.getString("movie_title"),
            collection = roomData.optString("movie_collection", "Unspecified"),
            theme = roomData.optString("season", "Romance"),
            year = roomData.optInt("release_year", 0).takeIf { it in 1900..2100 },
            poster = PosterRepository.approved(roomData.optString("poster_url")),
            mode = roomData.optString("mode", "classic"),
            status = roomData.optString("status", "lobby")
        )
        // A room-only response must never inherit another room's private card, marks,
        // revision, or player credentials (e.g. after switching an invitation).
        val previousForRoom = previous?.takeIf { it.room.code == code }
        val playersData = roomData.optJSONArray("players") ?: JSONArray()
        val players = (0 until playersData.length()).mapNotNull { i ->
            playersData.optJSONObject(i)?.let {
                LivePlayer(it.optString("id"), it.optString("name"),
                    it.optInt("lines"), it.optInt("marked"))
            }
        }
        val cardData = root.optJSONArray("card")
        // Missing fields are valid for public previews. Present-but-malformed
        // fields are not: never silently reuse an old private board.
        require(!root.has("card") || cardData != null) {
            "Invalid multiplayer Bingo card"
        }
        val card = if (cardData != null) {
            // A truncated or malformed authoritative card must never replace a
            // playable 5x5 board. Room previews omit card entirely.
            require(cardData.length() == 25) { "Incomplete multiplayer Bingo card" }
            val labels = (0 until cardData.length()).map { i ->
                val square = cardData.optJSONObject(i)
                val label = square?.opt("label")
                require(label is String && label.isNotBlank()) {
                    "Invalid multiplayer Bingo square"
                }
                label
            }
            // The server deals unique visible tropes, not merely unique IDs.
            // Refuse a corrupted card rather than showing two identical squares.
            val visible = labels.map {
                Normalizer.normalize(it, Normalizer.Form.NFKC)
                    .trim().replace(Regex("\\s+"), " ").lowercase(Locale.ROOT)
            }
            require(visible.toSet().size == 25) { "Duplicate multiplayer Bingo square" }
            labels
        } else previousForRoom?.card.orEmpty()
        val marksData = root.optJSONArray("marked")
        require(!root.has("marked") || marksData != null) {
            "Invalid multiplayer marked squares"
        }
        val marks = if (marksData != null) {
            // A partial or coerced server response could otherwise erase earned
            // marks or invent a Bingo. Preserve the previous snapshot on failure.
            require(marksData.length() <= 25) { "Too many multiplayer marks" }
            val indices = (0 until marksData.length()).map { i ->
                val value = marksData.opt(i)
                require(value is Int && value in 0..24) {
                    "Invalid multiplayer marked square"
                }
                value
            }
            require(indices.distinct().size == indices.size) {
                "Duplicate multiplayer marked square"
            }
            indices.toSet()
        } else previousForRoom?.marks.orEmpty()
        val revision = if (root.has("revision")) {
            // Numeric strings and fractional values must not bypass the
            // stale-response guard through optInt's coercion/truncation.
            val value = root.opt("revision")
            require(value is Int && value >= 0) { "Invalid multiplayer revision" }
            value
        } else previousForRoom?.revision ?: 0
        val token = root.optString("token")
        val playerId = root.optString("player_id")
        // State/mark/start/finish responses intentionally never echo the secret token.
        // After a process restart there is no previous snapshot, so use the restored
        // authenticated session only for this exact room and matching player ID.
        // A preview or join without credentials must never gain a session this way.
        val fallbackSession = previousForRoom?.session
            // A room preview is public and carries no player identity. After a
            // process restart, restore credentials only from a response that
            // explicitly identifies the same authenticated player.
            ?: authenticatedSession?.takeIf {
                it.code == code && it.valid() && playerId == it.playerId
            }
        val session = if (token.isNotBlank()) {
            LiveSession(code, token, playerId).takeIf { it.valid() }
        } else fallbackSession?.takeIf { playerId.isBlank() || playerId == it.playerId }
        // Room status is independent of each player's card revision. A late
        // lobby/playing response must not reopen a started/finished room.
        val stableMovie = movie.copy(status = RoomStatusProgression.latest(
            previousForRoom?.room?.movie?.status, movie.status
        ))
        val next = LiveSnapshot(
            LiveRoom(code, stableMovie, players,
                roomData.optString("host_player_id").takeIf { it.isNotBlank() }),
            card, marks, revision, session
        )
        // Poll responses may arrive after a successful mark or room transition.
        // An older revision must not roll back *any* authoritative room state:
        // restoring only the card/marks would still regress the status and roster.
        return if (previousForRoom != null && revision < previousForRoom.revision) {
            previousForRoom
        } else next
    }
}

/**
 * Guards asynchronous room responses against late network completions.
 * A response from an abandoned room must never restore credentials or private cards.
 */
object RoomResponseGuard {
    fun accepts(
        requestGeneration: Int,
        currentGeneration: Int,
        expectedCode: String?,
        currentSession: LiveSession?,
        next: LiveSnapshot
    ): Boolean {
        if (requestGeneration != currentGeneration) return false
        if (expectedCode != null && next.room.code != expectedCode) return false
        if (currentSession != null && next.room.code != currentSession.code) return false
        // All responses used to establish/update a player session need credentials.
        if (next.session == null) return false
        if (currentSession != null && next.session != currentSession) return false
        return true
    }

    fun acceptsPreview(
        requestGeneration: Int,
        currentGeneration: Int,
        requestedCode: String?,
        currentSession: LiveSession?,
        responseCode: String
    ): Boolean = requestGeneration == currentGeneration &&
        currentSession == null && requestedCode == responseCode
}

/** Native HTTPS transport; no web view, account, or private Supabase credentials. */
object LiveRoomClient {
    private const val MAX_RESPONSE_CHARS = 512_000

    /** Bound network reads before allocation; take() after readText() is too late. */
    internal fun readBounded(reader: Reader, limit: Int = MAX_RESPONSE_CHARS): String {
        require(limit > 0) { "Invalid response limit" }
        val result = StringBuilder()
        val chunk = CharArray(4096)
        while (true) {
            val count = reader.read(chunk)
            if (count < 0) break
            require(result.length + count <= limit) { "Game response exceeds supported size" }
            result.append(chunk, 0, count)
        }
        return result.toString()
    }

    private const val endpoint = "https://yxpamyibhclilgdhgsjd.supabase.co/functions/v1/game-room"

    suspend fun request(payload: JSONObject): String = withContext(Dispatchers.IO) {
        val connection = URL(endpoint).openConnection() as HttpURLConnection
        try {
            connection.requestMethod = "POST"
            connection.instanceFollowRedirects = false
            connection.connectTimeout = 6000
            connection.readTimeout = 12000
            connection.setRequestProperty("Content-Type", "application/json")
            connection.setRequestProperty("Accept", "application/json")
            connection.doOutput = true
            connection.outputStream.use { it.write(payload.toString().toByteArray(Charsets.UTF_8)) }
            val status = connection.responseCode
            val stream = if (status in 200..299) connection.inputStream else connection.errorStream
            val body = stream?.bufferedReader(Charsets.UTF_8)?.use { readBounded(it) }.orEmpty()
            if (status !in 200..299) {
                val reason = runCatching { JSONObject(body).optString("error") }.getOrNull()
                throw IllegalStateException(reason?.takeIf { it.isNotBlank() }
                    ?: "Game service returned HTTP $status")
            }
            body
        } finally {
            connection.disconnect()
        }
    }

    fun payload(action: String, session: LiveSession? = null): JSONObject =
        JSONObject().put("action", action).apply {
            if (session != null) {
                put("code", session.code)
                put("token", session.token)
            }
        }
}
