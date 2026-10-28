package com.cheeselouise.romantiverse

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URI
import java.net.URL
import java.net.URLDecoder
import java.util.Locale

/** Public room code only. Player credentials must never appear in invitations. */
object RoomInvites {
    private val codePattern = Regex("^[A-HJ-NP-Z2-9]{7}$")
    private const val base = "https://moldavite333.github.io/Romantiverse-Bingo-App/"

    fun normalize(value: String?): String? =
        value?.trim()?.uppercase(Locale.ROOT)?.takeIf { codePattern.matches(it) }

    fun url(code: String): String = base + "?room=" +
        (normalize(code) ?: throw IllegalArgumentException("Invalid room code"))

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
    val code: String, val movie: LiveMovie, val players: List<LivePlayer>
)
data class LiveSnapshot(
    val room: LiveRoom, val card: List<String>, val marks: Set<Int>,
    val revision: Int, val session: LiveSession?
) {
    val lines: Int get() = BingoEngine.winningLines(marks).size
    val score: Int get() = BingoEngine.score(marks)
    val blackout: Boolean get() = marks.size == 25 || marks.size == 24 && 12 !in marks
}

/** Parse server-authoritative cards and marks; do not regenerate a shared card locally. */
object LiveRoomProtocol {
    fun parse(json: String, previous: LiveSnapshot? = null): LiveSnapshot {
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
        val card = if (cardData != null) (0 until cardData.length()).map { i ->
            cardData.optJSONObject(i)?.optString("label") ?: ""
        } else previousForRoom?.card.orEmpty()
        val marksData = root.optJSONArray("marked")
        val marks = if (marksData != null) (0 until marksData.length()).mapNotNull { i ->
            marksData.optInt(i, -1).takeIf { it in 0..24 }
        }.toSet() else previousForRoom?.marks.orEmpty()
        val revision = root.optInt("revision", previousForRoom?.revision ?: 0)
        val token = root.optString("token")
        val playerId = root.optString("player_id")
        val session = if (token.isNotBlank() && playerId.isNotBlank()) {
            LiveSession(code, token, playerId).takeIf { it.valid() }
        } else previousForRoom?.session
        val next = LiveSnapshot(LiveRoom(code, movie, players), card, marks, revision, session)
        // Poll responses may arrive after a successful mark. Never roll a card back.
        return if (previousForRoom != null && revision < previousForRoom.revision) {
            next.copy(card = previousForRoom.card,
                marks = previousForRoom.marks, revision = previousForRoom.revision)
        } else next
    }
}

/** Native HTTPS transport; no web view, account, or private Supabase credentials. */
object LiveRoomClient {
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
            val body = stream?.bufferedReader()?.use { it.readText().take(512_000) }.orEmpty()
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
