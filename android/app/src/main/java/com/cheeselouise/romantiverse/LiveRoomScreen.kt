package com.cheeselouise.romantiverse

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.combinedClickable
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.Hyphens
import androidx.compose.ui.text.style.LineBreak
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

private val ink = Color(0xFF121024)
private val parchment = Color(0xFFF8F6FF)
private val accent = Color(0xFFFFCC79)
private val evergreen = Color(0xFF282342)
private val rose = Color(0xFFF45A9D)
private val unmarkedSquare = Color(0xFF292541)
private val markedSquare = Color(0xFF74355F)
private val winningSquare = Color(0xFF146C78)
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
    incomingCode: String?,
    hapticsEnabled: Boolean,
    reduceMotion: Boolean
) {
    val context = LocalContext.current
    val haptic = LocalHapticFeedback.current
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
    // Increment whenever the player leaves; invalidate every in-flight request.
    var roomGeneration by remember { mutableIntStateOf(0) }
    var error by remember { mutableStateOf("") }
    var notice by remember { mutableStateOf("") }
    var celebration by remember { mutableStateOf<BingoCelebration?>(null) }
    var celebrationId by remember { mutableIntStateOf(0) }

    LaunchedEffect(selectedMovie?.id) {
        if (selectedMovie != null) theme = selectedMovie.collection
            .takeIf { it in listOf("Christmas", "Fall", "Horror") } ?: "Romance"
    }
    LaunchedEffect(incomingCode) {
        if (incomingCode != null && session?.code != incomingCode) joinCode = incomingCode
    }
    LaunchedEffect(joinCode, session, roomGeneration) {
        preview = null
        if (session != null) return@LaunchedEffect
        val code = RoomInvites.fromInput(joinCode) ?: return@LaunchedEffect
        val requestGeneration = roomGeneration
        delay(300)
        val received = runCatching {
            LiveRoomProtocol.parse(LiveRoomClient.request(
                LiveRoomClient.payload("preview").put("code", code)
            )).room
        }.getOrNull()
        if (received != null && RoomResponseGuard.acceptsPreview(
                requestGeneration, roomGeneration, RoomInvites.fromInput(joinCode),
                session, received.code
            )) preview = received
    }

    fun accept(response: String, requestGeneration: Int, expectedCode: String? = null) {
        val next = LiveRoomProtocol.parse(response, snapshot, session)
        if (!RoomResponseGuard.accepts(
                requestGeneration, roomGeneration, expectedCode, session, next
            )) return
        val newLines = BingoCelebrationRules.newlyConfirmed(snapshot, next)
        val blackoutMode = next.room.movie.mode == "blackout"
        if (next.room.movie.status == "playing" && newLines.isNotEmpty() &&
            (!blackoutMode || (snapshot?.blackout == false && next.blackout))
        ) {
            celebrationId++
            celebration = BingoCelebration(celebrationId, newLines.size, blackoutMode, newLines)
            if (hapticsEnabled) haptic.performHapticFeedback(HapticFeedbackType.LongPress)
        }
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
    LaunchedEffect(session, lifecycleOwner, roomGeneration) {
        val activeSession = session ?: return@LaunchedEffect
        val requestGeneration = roomGeneration
        lifecycleOwner.lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) {
            while (currentCoroutineContext().isActive) {
                if (!busy) {
                    runCatching {
                        LiveRoomClient.request(LiveRoomClient.payload("state", activeSession))
                    }.onSuccess {
                        accept(it, requestGeneration, activeSession.code)
                    }.onFailure {
                        if (roomGeneration == requestGeneration && session == activeSession)
                            error = "Connection interrupted. Your room will reconnect automatically."
                    }
                }
                delay(3000)
            }
        }
    }

    fun action(kind: String, index: Int? = null) {
        if (busy) return
        val requestGeneration = roomGeneration
        val actionSession = session
        val expectedCode = if (kind == "join") RoomInvites.fromInput(joinCode)
            else if (kind == "create") null else actionSession?.code
        busy = true
        error = ""
        scope.launch {
            try {
                val request = LiveRoomClient.payload(kind,
                    if (kind in listOf("create", "join")) null else actionSession)
                when (kind) {
                    "create" -> {
                        val movie = selectedMovie ?: kotlin.error("Choose a movie first")
                        request.put("name", name.trim().take(32))
                            .put("movie_title", movie.title)
                            .put("movie_collection", movie.collection)
                            .put("release_year", movie.year ?: JSONObject.NULL)
                            .put("poster_url", PosterRepository.approved(selectedPoster) ?: JSONObject.NULL)
                            .put("season", theme).put("mode", mode)
                    }
                    "join" -> request.put("name", name.trim().take(32))
                        .put("code", RoomInvites.fromInput(joinCode) ?: kotlin.error("Invalid room code or invitation link"))
                    "mark" -> request.put("index", index)
                        .put("revision", snapshot?.revision ?: kotlin.error("Card is not ready"))
                }
                accept(LiveRoomClient.request(request), requestGeneration, expectedCode)
            } catch (failure: Exception) {
                if (roomGeneration == requestGeneration) {
                    error = failure.message ?: "Room request failed"
                    // A mark might have reached the server even if its response was lost.
                    // Read authoritative state, never automatically retry the toggle.
                    if (kind == "mark" && actionSession != null) {
                        runCatching {
                            LiveRoomClient.request(LiveRoomClient.payload("state", actionSession))
                        }.onSuccess { accept(it, requestGeneration, actionSession.code) }
                    }
                }
            } finally {
                if (roomGeneration == requestGeneration) busy = false
            }
        }
    }

    fun leave() {
        roomGeneration++
        busy = false
        context.getSharedPreferences(sessionPrefs, Context.MODE_PRIVATE).edit().clear().apply()
        session = null
        snapshot = null
        celebration = null
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

    Box(Modifier.fillMaxSize()) {
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
                OutlinedTextField(value = joinCode, onValueChange = { joinCode = RoomInvites.editableInput(it) },
                    label = { Text("Room code or invitation link") }, singleLine = true,
                    modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(8.dp))
                Button(
                    onClick = { action("join") },
                    enabled = !busy && name.isNotBlank() &&
                        RoomInvites.fromInput(joinCode) != null,
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
            if (incomingCode != null && incomingCode != session?.code) {
                item {
                    Text("You were invited to room $incomingCode, but this device is still in room ${session?.code}.",
                        color = accent)
                    Button(onClick = {
                        leave()
                        joinCode = incomingCode
                    }) { Text("Switch to invited room") }
                }
            }
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
                    Column(
                        Modifier.fillMaxWidth()
                            .clip(RoundedCornerShape(18.dp))
                            .background(Brush.verticalGradient(
                                listOf(Color(0xFF322849), Color(0xFF211D38))
                            ))
                            .border(1.dp, rose.copy(alpha = .3f), RoundedCornerShape(18.dp))
                            .padding(6.dp)
                    ) {
                        Row(Modifier.fillMaxWidth().padding(bottom = 3.dp)) {
                            "BINGO".forEach { letter ->
                                Text(letter.toString(), Modifier.weight(1f),
                                    textAlign = TextAlign.Center, color = accent,
                                    fontWeight = FontWeight.Black, fontSize = 17.sp)
                            }
                        }
                        val winning = BingoEngine.winningLines(live.marks).flatten().toSet()
                        Box(Modifier.fillMaxWidth()) {
                            Column(Modifier.fillMaxWidth()) {
                                for (row in 0..4) {
                                    Row(Modifier.fillMaxWidth()) {
                                        for (col in 0..4) {
                                            val index = row * 5 + col
                                            val marked = index == BingoEngine.CENTER || index in live.marks
                                            LiveBingoSquare(
                                                label = if (index == BingoEngine.CENTER) BingoEngine.FREE_LABEL else live.card[index],
                                                index = index,
                                                marked = marked,
                                                winning = index in winning,
                                                enabled = !busy && room?.movie?.status == "playing",
                                                reducedMotion = reduceMotion,
                                                modifier = Modifier.weight(1f).aspectRatio(.78f),
                                                onToggle = {
                                                    if (hapticsEnabled) {
                                                        haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                                    }
                                                    action("mark", index)
                                                }
                                            )
                                        }
                                    }
                                }
                            }
                            BingoLineSweep(celebration, reduceMotion, Modifier.matchParentSize())
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
    celebration?.let { event ->
        BingoWinOverlay(event, reduceMotion) {
            if (celebration?.id == event.id) celebration = null
        }
    }
    }
}

/**
 * Multiplayer uses the same compact, display-only labels and native visual language
 * as solo play. Full canonical labels remain available to TalkBack and long-press;
 * neither server cards nor scoring data are modified for presentation.
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun LiveBingoSquare(
    label: String,
    index: Int,
    marked: Boolean,
    winning: Boolean,
    enabled: Boolean,
    reducedMotion: Boolean,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier
) {
    val free = index == BingoEngine.CENTER
    var showDetails by remember(label) { mutableStateOf(false) }
    val shade by animateColorAsState(
        targetValue = when {
            winning -> winningSquare
            marked -> markedSquare
            else -> unmarkedSquare
        },
        animationSpec = if (reducedMotion) snap() else tween(180),
        label = "Shared square marking"
    )
    Box(
        modifier.padding(2.dp)
            .clip(RoundedCornerShape(11.dp))
            .background(if (free) accent else shade)
            .border(
                1.dp,
                if (marked) accent.copy(alpha = .65f) else parchment.copy(alpha = .12f),
                RoundedCornerShape(11.dp)
            )
            .combinedClickable(
                enabled = enabled && !free,
                role = Role.Checkbox,
                onClick = onToggle,
                onLongClickLabel = "Read full trope",
                onLongClick = { showDetails = true }
            )
            .semantics(mergeDescendants = true) {
                contentDescription = LiveSquareAccessibility.label(index, label)
                stateDescription = LiveSquareAccessibility.state(index, marked, winning)
            },
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(horizontal = 2.dp, vertical = 3.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            if (free || marked) {
                Text(
                    if (free) "♥" else "✓",
                    color = if (free) ink else if (winning) accent else rose,
                    fontSize = 14.sp, lineHeight = 16.sp
                )
            } else {
                TropeArtwork(label, rose)
            }
            Text(
                BingoSquarePresentation.shortLabel(label),
                style = TextStyle(lineBreak = LineBreak.Simple, hyphens = Hyphens.None),
                color = if (free) ink else parchment,
                textAlign = TextAlign.Center,
                fontSize = if (free) 9.sp else 10.sp,
                lineHeight = 11.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 5,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
    if (showDetails) {
        AlertDialog(
            onDismissRequest = { showDetails = false },
            title = { Text("Bingo trope") },
            text = { Text(label) },
            confirmButton = {
                TextButton(onClick = { showDetails = false }) { Text("Close") }
            }
        )
    }
}

@Composable
private fun LiveMovieHeader(
    title: String, collection: String, theme: String, year: Int?,
    poster: String?, heading: String
) {
    // Offline play and broken poster links should still look intentional.
    // Reuse the native, original scenic illustration rather than a blank image.
    var posterFailed by remember(title, poster) { mutableStateOf(false) }
    Card(colors = CardDefaults.cardColors(containerColor = evergreen),
        shape = RoundedCornerShape(16.dp)) {
        Row(Modifier.fillMaxWidth().padding(12.dp),
            verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.width(90.dp).height(126.dp).clip(RoundedCornerShape(9.dp))
                .background(ink), contentAlignment = Alignment.Center) {
                if (poster == null || posterFailed) {
                    MovieArtwork(Modifier.fillMaxSize(), collection)
                } else {
                    AsyncImage(
                        model = poster,
                        contentDescription = "Poster for $title",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize(),
                        onError = { posterFailed = true }
                    )
                }
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
