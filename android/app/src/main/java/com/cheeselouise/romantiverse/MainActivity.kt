package com.cheeselouise.romantiverse

import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.Crossfade
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import java.security.SecureRandom

private val burgundy = Color(0xFF63283F)
private val plum = Color(0xFF321C35)
private val cream = Color(0xFFFFF4DE)
private val gold = Color(0xFFEAC078)
private val sage = Color(0xFF284B46)
private val pale = Color(0xFFF9E6CF)
private const val ATTRIBUTION = "Brought to you by the Cheese Louise Podcast"
private val themes = listOf("Romance", "Christmas", "Fall", "Horror")

class MainActivity : ComponentActivity() {
    private var incomingCode by mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        incomingCode = RoomInvites.fromUrl(intent?.dataString)
        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = gold,
                    onPrimary = plum,
                    background = plum,
                    surface = burgundy,
                    onSurface = cream,
                    onBackground = cream
                )
            ) { NativeBingoApp(incomingCode) }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        incomingCode = RoomInvites.fromUrl(intent.dataString)
    }
}

@Composable
private fun NativeBingoApp(incomingCode: String?) {
    val context = LocalContext.current
    val haptic = LocalHapticFeedback.current
    val prefs = remember { context.getSharedPreferences("bingo-native-v1", 0) }
    var movies by remember { mutableStateOf(MovieCatalog.load(context)) }
    var selectedId by rememberSaveable { mutableStateOf(prefs.getString("movie_id", "") ?: "") }
    var theme by rememberSaveable { mutableStateOf(prefs.getString("theme", "Romance") ?: "Romance") }
    var seed by rememberSaveable { mutableLongStateOf(prefs.getLong("seed", 1L)) }
    var marks by remember { mutableStateOf(BingoEngine.decodeMarks(prefs.getString("marks", "") ?: "")) }
    // Resolve the score against the current movie, including when a saved movie
    // appears only after the offline catalog has been refreshed. Never let a
    // temporary missing movie overwrite its stored personal best.
    // Reopen an in-progress card after the app is restarted, rather than losing the movie-night context.
    var tab by rememberSaveable {
        mutableStateOf(if (selectedId.isBlank()) "discover" else "play")
    }
    LaunchedEffect(incomingCode) {
        if (incomingCode != null) tab = "together"
    }
    var haptics by rememberSaveable { mutableStateOf(prefs.getBoolean("haptics", true)) }
    var posters by remember { mutableStateOf(PosterRepository.cached(context)) }
    val reduceMotion = remember(context) {
        runCatching {
            Settings.Global.getFloat(
                context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f
            ) == 0f
        }.getOrDefault(false)
    }
    LaunchedEffect(Unit) { posters = PosterRepository.refresh(context) }
    // Public-only updates appear without an APK release; bundled movies work offline.
    LaunchedEffect(Unit) { movies = MovieCatalog.refresh(context) }
    val movie = movies.firstOrNull { it.id == selectedId }
    val bestScore = remember(movie?.key, marks) {
        SoloScoreProgress.restore(movie, marks) { key ->
            prefs.getInt("best:$key", 0)
        }
    }
    LaunchedEffect(movie?.key, bestScore) {
        // Persist an earned line from an older saved card, but never write a
        // zero or another movie's score while the catalog is still loading.
        SoloScoreProgress.improvement(movie, bestScore) { key ->
            prefs.getInt("best:$key", 0)
        }?.let { (key, score) ->
            prefs.edit().putInt("best:$key", score).apply()
        }
    }
    val card = remember(movie?.id, seed, theme) {
        if (movie == null) emptyList() else BingoEngine.deal(BingoEngine.pool(theme), seed)
    }
    fun newSeed(): Long = SecureRandom().nextLong().ushr(1)
    fun choose(next: Movie) {
        selectedId = next.id
        theme = if (next.collection in themes) next.collection else "Romance"
        seed = newSeed()
        marks = emptySet()
        prefs.edit().putString("movie_id", selectedId).putString("theme", theme)
            .putLong("seed", seed).putString("marks", "").apply()
        tab = "play"
    }
    fun setTheme(next: String) {
        if (next !in themes || next == theme) return
        theme = next
        seed = newSeed()
        marks = emptySet()
        prefs.edit().putString("theme", theme).putLong("seed", seed)
            .putString("marks", "").apply()
    }
    fun mark(index: Int) {
        if (index == BingoEngine.CENTER) return
        marks = BingoEngine.toggle(marks, index)
        val editor = prefs.edit().putString("marks", BingoEngine.encodeMarks(marks))
        val updatedBest = SoloScoreProgress.restore(movie, marks) { key ->
            prefs.getInt("best:$key", 0)
        }
        SoloScoreProgress.improvement(movie, updatedBest) { key ->
            prefs.getInt("best:$key", 0)
        }?.let { (key, score) ->
            editor.putInt("best:$key", score)
        }
        editor.apply()
        if (haptics) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
    }

    Scaffold(
        containerColor = Color.Transparent,
        bottomBar = {
            NavigationBar(containerColor = plum) {
                listOf("discover" to "Movies", "play" to "My card", "together" to "Together").forEach { (id, label) ->
                    NavigationBarItem(
                        selected = tab == id,
                        onClick = { tab = id },
                        icon = { Text(when (id) { "discover" -> "✦"; "play" -> "▦"; else -> "♡" }, fontSize = 21.sp) },
                        label = { Text(label) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = gold,
                            selectedTextColor = cream,
                            indicatorColor = burgundy,
                            unselectedIconColor = pale,
                            unselectedTextColor = pale
                        )
                    )
                }
            }
        }
    ) { padding ->
        Column(
            Modifier.fillMaxSize().padding(padding)
                .background(Brush.verticalGradient(listOf(plum, burgundy, plum)))
        ) {
            Column(Modifier.fillMaxWidth().padding(horizontal = 18.dp, vertical = 12.dp)) {
                Text("ROMANTIVERSE", color = gold, fontWeight = FontWeight.Black,
                    fontSize = 19.sp, letterSpacing = 2.sp)
                Text("B I N G O", color = cream, fontWeight = FontWeight.SemiBold,
                    fontSize = 13.sp, letterSpacing = 3.sp)
            }
            HorizontalDivider(color = gold.copy(alpha = .28f))
            Crossfade(
                targetState = tab,
                animationSpec = if (reduceMotion) snap() else tween(260),
                label = "Native screen transition"
            ) { current ->
                if (current == "discover") {
                    DiscoverMovies(movies, posters, ::choose)
                } else if (current == "together") {
                    LiveRoomScreen(movie, movie?.let { posters[it.key]?.url }, incomingCode)
                } else if (movie == null) {
                    Column(
                        Modifier.fillMaxSize().padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text("Your movie night starts here", style = MaterialTheme.typography.headlineSmall)
                        Spacer(Modifier.height(12.dp))
                        Button(onClick = { tab = "discover" }) { Text("Choose a movie") }
                    }
                } else {
                    PlayCard(
                        movie = movie,
                        posterUrl = posters[movie.key]?.url,
                        card = card,
                        marks = marks,
                        bestScore = bestScore,
                        theme = theme,
                        reducedMotion = reduceMotion,
                        haptics = haptics,
                        onTheme = ::setTheme,
                        onMark = ::mark,
                        onHaptics = {
                            haptics = it
                            prefs.edit().putBoolean("haptics", it).apply()
                        },
                        onNewCard = {
                            seed = newSeed()
                            marks = emptySet()
                            prefs.edit().putLong("seed", seed).putString("marks", "").apply()
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun DiscoverMovies(
    movies: List<Movie>,
    posters: Map<String, PosterRepository.Entry>,
    onChoose: (Movie) -> Unit
) {
    var query by rememberSaveable { mutableStateOf("") }
    var filter by rememberSaveable { mutableStateOf("All") }
    val filtered = remember(movies, query, filter) {
        movies.filter {
            (filter == "All" || it.collection == filter) &&
                (query.isBlank() || it.title.contains(query.trim(), ignoreCase = true))
        }
    }
    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Card(colors = CardDefaults.cardColors(containerColor = sage),
                shape = RoundedCornerShape(18.dp)) {
                Column {
                    MovieArtwork(Modifier.fillMaxWidth().height(150.dp), "Fall")
                    Column(Modifier.padding(16.dp)) {
                        Text("THE MOVIE NIGHT COLLECTION", color = gold,
                            fontWeight = FontWeight.Bold, fontSize = 11.sp, letterSpacing = 1.sp)
                        Text("Every cliché deserves its moment.",
                            style = MaterialTheme.typography.titleLarge, color = cream)
                        Text("Choose a movie, then play an original randomized card. No account needed.",
                            color = pale, fontSize = 13.sp)
                    }
                }
            }
        }
        item {
            OutlinedTextField(
                value = query, onValueChange = { query = it },
                label = { Text("Search movies") },
                singleLine = true, modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp)
            )
        }
        item {
            Row(Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("All", "Christmas", "Fall", "Horror", "Unspecified").forEach { item ->
                    FilterChip(selected = filter == item, onClick = { filter = item },
                        label = { Text(item) })
                }
            }
        }
        item {
            Text("${filtered.size} movies · catalog collections are never guessed",
                color = pale, fontSize = 12.sp)
        }
        items(filtered, key = { it.id }) { movie ->
            Card(
                modifier = Modifier.fillMaxWidth().clickable { onChoose(movie) },
                colors = CardDefaults.cardColors(containerColor = cream),
                shape = RoundedCornerShape(15.dp)
            ) {
                Row(Modifier.fillMaxWidth().padding(10.dp),
                    verticalAlignment = Alignment.CenterVertically) {
                    PosterThumbnail(movie, posters[movie.key]?.url,
                        Modifier.width(82.dp).height(112.dp))
                    Spacer(Modifier.width(14.dp))
                    Column(Modifier.weight(1f)) {
                        Text(movie.title, color = plum, fontSize = 17.sp,
                            fontWeight = FontWeight.Bold, maxLines = 2,
                            overflow = TextOverflow.Ellipsis)
                        Spacer(Modifier.height(5.dp))
                        Text(listOfNotNull(movie.year?.toString(),
                            movie.collection.takeUnless { it == "Unspecified" }).joinToString(" · ")
                            .ifBlank { "Collection unverified" }, color = burgundy, fontSize = 12.sp)
                        Spacer(Modifier.height(12.dp))
                        Text("PLAY THIS MOVIE  ›", color = burgundy,
                            fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }
        }
        item { Attribution() }
    }
}

@Composable
private fun PlayCard(
    movie: Movie,
    posterUrl: String?,
    card: List<String>,
    marks: Set<Int>,
    bestScore: Int,
    theme: String,
    reducedMotion: Boolean,
    haptics: Boolean,
    onTheme: (String) -> Unit,
    onMark: (Int) -> Unit,
    onHaptics: (Boolean) -> Unit,
    onNewCard: () -> Unit
) {
    val completed = BingoEngine.winningLines(marks)
    val winningIndices = completed.flatten().toSet()
    LazyColumn(
        contentPadding = PaddingValues(14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Card(colors = CardDefaults.cardColors(containerColor = sage),
                shape = RoundedCornerShape(16.dp)) {
                Row(Modifier.fillMaxWidth().padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically) {
                    PosterThumbnail(movie, posterUrl, Modifier.width(90.dp).height(122.dp))
                    Spacer(Modifier.width(14.dp))
                    Column(Modifier.weight(1f)) {
                        Text("TONIGHT'S FEATURE", color = gold, fontSize = 11.sp,
                            fontWeight = FontWeight.Bold)
                        Text(movie.title, color = cream, fontSize = 20.sp,
                            fontWeight = FontWeight.Bold, lineHeight = 23.sp)
                        Text(listOfNotNull(movie.year?.toString(),
                            movie.collection.takeUnless { it == "Unspecified" })
                            .joinToString(" · ").ifBlank { "Collection unverified" },
                            color = pale, fontSize = 12.sp)
                        Spacer(Modifier.height(8.dp))
                        Text("Scenes are predictions until you mark them.",
                            color = pale, fontSize = 11.sp)
                    }
                }
            }
        }
        item {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text("MY BINGO CARD", color = gold, fontSize = 13.sp,
                        fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                    Text("${completed.size} lines  ·  ${BingoEngine.score(marks)} points",
                        color = cream, fontSize = 15.sp)
                    Text("Personal best for this movie: $bestScore points",
                        color = pale, fontSize = 12.sp)
                }
                OutlinedButton(onClick = onNewCard) { Text("New card") }
            }
        }
        item {
            Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp))
                .background(cream).padding(5.dp)) {
                Row(Modifier.fillMaxWidth()) {
                    "BINGO".forEach { letter ->
                        Text(letter.toString(), Modifier.weight(1f), textAlign = TextAlign.Center,
                            color = burgundy, fontWeight = FontWeight.Black, fontSize = 22.sp)
                    }
                }
                for (row in 0..4) {
                    Row(Modifier.fillMaxWidth()) {
                        for (col in 0..4) {
                            val index = row * 5 + col
                            BingoSquare(
                                label = card[index],
                                index = index,
                                marked = index == BingoEngine.CENTER || index in marks,
                                inLine = index in winningIndices,
                                reducedMotion = reducedMotion,
                                onClick = { onMark(index) },
                                modifier = Modifier.weight(1f).aspectRatio(1f)
                            )
                        }
                    }
                }
            }
        }
        if (completed.isNotEmpty()) {
            item {
                Card(colors = CardDefaults.cardColors(containerColor = sage)) {
                    Column(Modifier.fillMaxWidth().padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("✦  BINGO!  ✦", color = gold, fontSize = 27.sp,
                            fontWeight = FontWeight.Black)
                        Text("${completed.size} completed ${if (completed.size == 1) "line" else "lines"}",
                            color = cream)
                    }
                }
            }
        }
        item {
            Text("Bingo card theme (independent of the movie's actual collection)",
                color = pale, fontSize = 12.sp)
            Row(Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                themes.forEach { item ->
                    FilterChip(selected = theme == item, onClick = { onTheme(item) },
                        label = { Text(item) })
                }
            }
        }
        item {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Haptic feedback", color = cream)
                Switch(checked = haptics, onCheckedChange = onHaptics)
            }
        }
        item { Attribution() }
    }
}

@Composable
private fun BingoSquare(
    label: String,
    index: Int,
    marked: Boolean,
    inLine: Boolean,
    reducedMotion: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val shade by animateColorAsState(
        targetValue = when {
            inLine -> sage
            marked -> gold
            else -> Color(0xFFFFF7EA)
        },
        animationSpec = if (reducedMotion) snap() else tween(180),
        label = "Square marking"
    )
    val isFree = index == BingoEngine.CENTER
    Box(
        modifier.padding(2.dp).clip(RoundedCornerShape(7.dp))
            .background(shade)
            .border(1.dp, burgundy.copy(alpha = .2f), RoundedCornerShape(7.dp))
            .toggleable(
                value = marked,
                enabled = !isFree,
                role = Role.Checkbox,
                onValueChange = { onClick() }
            )
            .semantics(mergeDescendants = true) {
                contentDescription = LiveSquareAccessibility.label(index, label)
                stateDescription = LiveSquareAccessibility.state(index, marked, inLine)
            },
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(3.dp)) {
            Text(
                if (isFree) "♥" else if (marked) "✦" else "♡",
                color = if (inLine) gold else burgundy,
                fontSize = 17.sp, lineHeight = 18.sp
            )
            Text(
                label, textAlign = TextAlign.Center,
                color = if (inLine) cream else plum,
                fontWeight = FontWeight.SemiBold,
                fontSize = if (isFree) 9.sp else 10.sp,
                lineHeight = 11.sp, maxLines = 3,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun PosterThumbnail(movie: Movie, posterUrl: String?, modifier: Modifier) {
    var failed by remember(movie.id, posterUrl) { mutableStateOf(false) }
    Box(modifier.clip(RoundedCornerShape(10.dp))) {
        if (posterUrl == null || failed) {
            MovieArtwork(Modifier.fillMaxSize(), movie.collection)
        } else {
            AsyncImage(
                model = posterUrl,
                contentDescription = "Poster for ${movie.title}",
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize(),
                onError = { failed = true }
            )
        }
    }
}

@Composable
internal fun MovieArtwork(modifier: Modifier = Modifier, collection: String) {
    val sky = when (collection) {
        "Christmas" -> Color(0xFF294F68)
        "Horror" -> Color(0xFF29233E)
        else -> Color(0xFFB65F61)
    }
    Canvas(modifier) {
        val w = size.width
        val h = size.height
        drawRect(brush = Brush.verticalGradient(listOf(sky, Color(0xFFF0B777))))
        drawCircle(color = gold.copy(alpha = .9f), radius = h * .16f,
            center = Offset(w * .73f, h * .30f))
        val far = Path().apply {
            moveTo(0f, h * .72f)
            lineTo(w * .28f, h * .32f)
            lineTo(w * .51f, h * .62f)
            lineTo(w * .72f, h * .38f)
            lineTo(w, h * .75f)
            lineTo(w, h)
            lineTo(0f, h)
            close()
        }
        drawPath(far, Color(0xFF5C4B64))
        val near = Path().apply {
            moveTo(0f, h * .91f)
            lineTo(w * .31f, h * .61f)
            lineTo(w * .58f, h * .85f)
            lineTo(w * .82f, h * .62f)
            lineTo(w, h * .84f)
            lineTo(w, h)
            lineTo(0f, h)
            close()
        }
        drawPath(near, sage)
        drawCircle(color = cream.copy(alpha = .8f), radius = h * .014f,
            center = Offset(w * .17f, h * .19f))
        drawCircle(color = cream.copy(alpha = .8f), radius = h * .009f,
            center = Offset(w * .44f, h * .13f))
    }
}

@Composable
private fun Attribution() {
    Text(
        ATTRIBUTION,
        color = pale, textAlign = TextAlign.Center, fontSize = 11.sp,
        modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp)
    )
}
