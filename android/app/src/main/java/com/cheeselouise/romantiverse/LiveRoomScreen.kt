package com.cheeselouise.romantiverse

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.repeatOnLifecycle
import coil.compose.AsyncImage
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import org.json.JSONObject

private val ink = Color(0xFF321C35)
private val parchment = Color(0xFFFFF4DE)
private val accent = Color(0xFFEAC078)
private val evergreen = Color(0xFF284B46)
private const val sessionPrefs = "romantiverse-live-session"

private fun restore(context: Context): LiveSession? {
    val prefs = context.getSharedPreferences(sessionPrefs, Context.MODE_PRIVATE)
    return LiveSession(
        prefs.getString("code", "").orEmpty(),
        prefs.getString("token", "").orEmpty(),
        prefs.getString("player_id", "").orEmpty()
    ).takeIf { it.valid() }
}

@Composable
fun LiveRoomScreen(
    selectedMovie: Movie?,
    selectedPoster: String?,
    incomingCode: String?
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val scope = rememberCoroutineScope()
    var session by remember { mutableStateOf(restore(context)) }
    var snapshot by remember { mutableStateOf<LiveSnapshot?>(null) }
    var preview by remember { mutableStateOf<LiveRoom?>(null) }
    var name by rememberSaveable { mutableStateOf("") }
    var joinCode by rememberSaveable { mutableStateOf(incomingCode.orEmpty()) }
    var theme by rememberSaveable { mutableStateOf("Romance") }
    var mode by rememberSaveable { mutableStateOf("classic") }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    var notice by remember { mutableStateOf("") }

    LaunchedEffect(selectedMovie?.id) {
        if (selectedMovie != null) theme = selectedMovie.collection
            .takeIf { it in listOf("Christmas", "Fall", "Horror") } ?: "Romance"
    }
    LaunchedEffect(incomingCode) {
        if (incomingCode != null && session?.code != incomingCode) joinCode = incomingCode
    }
    LaunchedEffect(joinCode, session) {
        if (session != null) return@LaunchedEffect
        val code = RoomInvites.normalize(joinCode) ?: run { preview = null; return@LaunchedEffect }
        delay(300)
        preview = runCatching {
            LiveRoomProtocol.parse(LiveRoomClient.request(
                LiveRoomClient.payload("preview").put("code", code)
            )).room
        }.getOrNull()
    }

    fun accept(response: String) {
        val next = LiveRoomProtocol.parse(response, snapshot)
        snapshot = next
        next.session?.let { new ->
            if (session != new) {
                session = new
                context.getSharedPreferences(sessionPrefs, Context.MODE_PRIVATE).edit()
                    .putString("code", new.code).putString("token", new.token)
                    .putString("player_id", new.playerId).apply()
            }
        }
    }

    // Poll only while this screen is visible and the app is foregrounded.
    // A stale response cannot replace a newer revision of this player's card.
    LaunchedEffect(session, lifecycleOwner) {
        val activeSession = session ?: return@LaunchedEffect
        lifecycleOwner.lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) {
            while (currentCoroutineContext().isActive) {
                if (!busy) {
                    runCatching {
                        LiveRoomClient.request(LiveRoomClient.payload("state", activeSession))
                    }.onSuccess { accept(it) }.onFailure {
                        error = "Connection interrupted. Your room will reconnect automatically."
                    }
                }
                delay(3000)
            }
        }
    }

    fun action(kind: String, index: Int? = null) {
        if (busy) return
        busy = true
        error = ""
        scope.launch {
            try {
                val request = LiveRoomClient.payload(kind,
                    if (kind in listOf("create", "join")) null else session)
                when (kind) {
                    "create" -> {
                        val movie = selectedMovie ?: error("Choose a movie first")
                        request.put("name", name.trim().take(32))
                            .put("movie_title", movie.title)
                            .put("movie_collection", movie.collection)
                            .put("release_year", movie.year ?: JSONObject.NULL)
                            .put("poster_url", PosterRepository.approved(selectedPoster) ?: JSONObject.NULL)
                            .put("season", theme).put("mode", mode)
                    }
                    "join" -> request.put("name", name.trim().take(32))
                        .put("code", RoomInvites.normalize(joinCode) ?: error("Invalid room code"))
                    "mark" -> request.put("index", index)
                        .put("revision", snapshot?.revision ?: error("Card is not ready"))
                }
                accept(LiveRoomClient.request(request))
            } catch (failure: Exception) {
                error = failure.message ?: "Room request failed"
                // A mark might have reached the server even if its response was lost.
                // Read authoritative state, never automatically retry the toggle.
                if (kind == "mark" && session != null) {
                    runCatching {
                        LiveRoomClient.request(LiveRoomClient.payload("state", session))
                    }.onSuccess { accept(it) }
                }
            } finally {
                busy = false
            }
        }
    }

    fun leave() {
        context.getSharedPreferences(sessionPrefs, Context.MODE_PRIVATE).edit().clear().apply()
        session = null
        snapshot = null
        preview = null
        error = ""
        notice = ""
    }

    val live = snapshot?.takeIf { it.room.code == session?.code }
    val room = live?.room
    val invitation = session?.let { RoomInvites.url(it.code) }
    val invitationMessage = if (invitation != null && room != null) {
        "Play Romantiverse Bingo with me!\n" +
            "${room.movie.title} · ${room.movie.collection} collection · ${room.movie.theme} card\n" +
            invitation
    } else invitation.orEmpty()

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text("PLAY TOGETHER", color = accent, fontSize = 21.sp, fontWeight = FontWeight.Black)
            Text("Free shared movie night · no login · individual cards",
                color = parchment, fontSize = 13.sp)
        }
        if (session == null) {
            if (preview != null) {
                item {
                    LiveMovieHeader(preview!!.movie.title, preview!!.movie.collection,
                        preview!!.movie.theme, preview!!.movie.year, preview!!.movie.poster,
                        "YOU'RE INVITED TO WATCH")
                }
            }
            item {
                OutlinedTextField(value = name, onValueChange = { name = it.take(32) },
                    label = { Text("Your nickname") }, singleLine = true,
                    modifier = Modifier.fillMaxWidth())
            }
            item {
                OutlinedTextField(value = joinCode, onValueChange = { joinCode = it.uppercase().take(7) },
                    label = { Text("Seven-character invitation code") }, singleLine = true,
                    modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(8.dp))
                Button(
                    onClick = { action("join") },
                    enabled = !busy && name.isNotBlank() &&
                        RoomInvites.normalize(joinCode) != null,
                    modifier = Modifier.fillMaxWidth()
                ) { Text("Join game") }
            }
            item {
                HorizontalDivider(color = accent.copy(alpha = .35f))
                Spacer(Modifier.height(12.dp))
                Text("HOST A MOVIE NIGHT", color = accent, fontWeight = FontWeight.Bold)
                Text("Choose a movie from Movies first. Its actual collection stays unchanged.",
                    color = parchment, fontSize = 12.sp)
            }
            if (selectedMovie != null) {
                item {
                    LiveMovieHeader(selectedMovie.title, selectedMovie.collection, theme,
                        selectedMovie.year, selectedPoster, "SELECTED FEATURE")
                }
            }
            item {
                Text("Bingo card theme", color = parchment)
                Row(Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf("Romance", "Christmas", "Fall", "Horror").forEach { choice ->
                        FilterChip(selected = theme == choice,
                            onClick = { theme = choice }, label = { Text(choice) })
                    }
                }
                Text("Game mode", color = parchment)
                Row(Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf("classic", "chase", "blackout", "marathon").forEach { choice ->
                        FilterChip(selected = mode == choice, onClick = { mode = choice },
                            label = { Text(choice.replaceFirstChar { it.uppercase() }) })
                    }
                }
                Button(onClick = { action("create") },
                    enabled = !busy && name.isNotBlank() && selectedMovie != null,
                    modifier = Modifier.fillMaxWidth()) { Text("Create unique room") }
            }
        } else {
            item {
                if (room != null) {
                    LiveMovieHeader(room.movie.title, room.movie.collection, room.movie.theme,
                        room.movie.year, room.movie.poster, "YOUR SHARED MOVIE")
                } else Text("Reconnecting to room ${session!!.code}…", color = parchment)
            }
            item {
                Text("ROOM ${session!!.code}", color = accent, fontWeight = FontWeight.Black)
                if (room != null) Text("Status: ${room.movie.status}", color = parchment)
                OutlinedButton(onClick = ::leave) { Text("Leave this device") }
            }
            if (invitation != null) {
                item {
                    Text("INVITE FRIENDS", color = accent, fontWeight = FontWeight.Bold)
                    SelectionContainer {
                        Text(invitationMessage, color = parchment, fontSize = 13.sp)
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(onClick = {
                            try {
                                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE)
                                    as ClipboardManager
                                clipboard.setPrimaryClip(
                                    ClipData.newPlainText("Romantiverse Bingo invitation", invitation)
                                )
                                notice = "Link copied using Android clipboard."
                            } catch (_: Exception) {
                                notice = "Clipboard unavailable. Long-press the invitation above or use Share."
                            }
                        }) { Text("Copy link") }
                        OutlinedButton(onClick = {
                            try {
                                val intent = Intent(Intent.ACTION_SEND).apply {
                                    type = "text/plain"
                                    putExtra(Intent.EXTRA_TEXT, invitationMessage)
                                }
                                context.startActivity(Intent.createChooser(intent, "Invite to Bingo"))
                            } catch (_: Exception) {
                                notice = "Share unavailable. Long-press the invitation above."
                            }
                        }) { Text("Share") }
                    }
                }
            }
            if (room != null) {
                item {
                    Text("PLAYERS", color = accent, fontWeight = FontWeight.Bold)
                    room.players.forEach { player ->
                        Text("${player.name} · ${player.lines} lines · ${player.marked} marked",
                            color = parchment)
                    }
                    if (room.movie.status == "lobby") {
                        Text("Wait for everyone to join before starting.", color = parchment)
                        Button(onClick = { action("start") }, enabled = !busy) {
                            Text("Start movie (host only)")
                        }
                    }
                }
            }
            if (live != null && live.card.size == 25) {
                item {
                    Text("MY CARD · ${live.lines} lines · ${live.score} points",
                        color = accent, fontWeight = FontWeight.Bold)
                    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp))
                        .background(parchment).padding(5.dp)) {
                        Row {
                            "BINGO".forEach { letter ->
                                Text(letter.toString(), Modifier.weight(1f),
                                    textAlign = TextAlign.Center, color = ink,
                                    fontWeight = FontWeight.Black, fontSize = 20.sp)
                            }
                        }
                        val winning = BingoEngine.winningLines(live.marks).flatten().toSet()
                        for (row in 0..4) {
                            Row {
                                for (col in 0..4) {
                                    val index = row * 5 + col
                                    val marked = index == 12 || index in live.marks
                                    val isWinning = index in winning
                                    Box(
                                        Modifier.weight(1f).aspectRatio(1f).padding(2.dp)
                                            .clip(RoundedCornerShape(7.dp))
                                            .background(when {
                                                isWinning -> evergreen
                                                marked -> accent
                                                else -> Color.White
                                            })
                                            .clickable(enabled = index != 12 && !busy &&
                                                room?.movie?.status == "playing") {
                                                action("mark", index)
                                            },
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            if (index == 12) "CHEESE LOUISE POD" else live.card[index],
                                            color = if (isWinning) parchment else ink,
                                            fontSize = 9.sp, lineHeight = 10.sp,
                                            textAlign = TextAlign.Center, maxLines = 4,
                                            overflow = TextOverflow.Ellipsis,
                                            fontWeight = if (marked) FontWeight.Bold else FontWeight.Normal,
                                            modifier = Modifier.padding(3.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                    Text("Marks are saved by the game server and restored after reconnect.",
                        color = parchment, fontSize = 12.sp)
                }
                if (if (room?.movie?.mode == "blackout") live.blackout else live.lines > 0) {
                    item {
                        Card(colors = CardDefaults.cardColors(containerColor = evergreen)) {
                            Text(if (room?.movie?.mode == "blackout") "✦ BLACKOUT! ✦" else "✦ BINGO! ✦",
                                modifier = Modifier.fillMaxWidth().padding(18.dp),
                                color = accent, textAlign = TextAlign.Center,
                                fontWeight = FontWeight.Black, fontSize = 24.sp)
                        }
                    }
                }
            }
            if (room?.movie?.status == "playing") {
                item {
                    OutlinedButton(onClick = { action("finish") }, enabled = !busy) {
                        Text("Finish movie (host only)")
                    }
                }
            }
        }
        if (error.isNotBlank()) item {
            Text(error, color = Color(0xFFFFB4AB), fontSize = 13.sp)
        }
        if (notice.isNotBlank()) item {
            Text(notice, color = accent, fontSize = 13.sp)
        }
        item {
            Text("Brought to you by the Cheese Louise Podcast", color = parchment,
                fontSize = 11.sp, textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp))
        }
    }
}

@Composable
private fun LiveMovieHeader(
    title: String, collection: String, theme: String, year: Int?,
    poster: String?, heading: String
) {
    Card(colors = CardDefaults.cardColors(containerColor = evergreen),
        shape = RoundedCornerShape(16.dp)) {
        Row(Modifier.fillMaxWidth().padding(12.dp),
            verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.width(90.dp).height(126.dp).clip(RoundedCornerShape(9.dp))
                .background(ink), contentAlignment = Alignment.Center) {
                if (poster != null) AsyncImage(model = poster,
                    contentDescription = "Poster for $title",
                    modifier = Modifier.fillMaxSize())
                else Text("🎬", fontSize = 36.sp)
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(heading, color = accent, fontSize = 10.sp,
                    fontWeight = FontWeight.Bold)
                Text(title, color = parchment, fontSize = 19.sp,
                    lineHeight = 22.sp, fontWeight = FontWeight.Bold)
                if (year != null) Text("$year", color = parchment)
                Text("Collection: $collection", color = parchment, fontSize = 12.sp)
                Text("Bingo theme: $theme", color = accent, fontSize = 12.sp)
            }
        }
    }
}
