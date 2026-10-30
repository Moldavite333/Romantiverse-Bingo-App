package com.cheeselouise.romantiverse

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Android Studio Compose previews for the illustration sign-off gate (#51).
 *
 * These deliberately show the REAL native TropeArtwork renderer at five-column
 * phone scale, not enlarged concept art. The previews never run in production
 * navigation and do not load any network or private HQ data.
 *
 * Inspect at 320dp and 360dp, then confirm on physical Samsung hardware.
 * A successful preview/build is NOT artistic approval or a performance test.
 */
internal object ArtworkReviewCatalog {
    private val romance = BingoEngine.pool("Romance").toSet()
    private val multiplayerLaunchBatch = listOf(
        "Career versus love dilemma",
        "The entire town gets involved",
        "A relative gives unsolicited love advice",
        "Someone overhears the wrong half of a conversation",
        "A romantic deadline approaches",
        "Two people are forced to spend time together",
        "A dramatic exit",
        "A beloved business must be saved",
        "Someone arrives at the last possible moment",
        "A coincidence",
        "A secret is discovered",
        "A surprise announcement",
        "A romantic realization",
        "An inconvenient romantic rival",
        "A sentimental family heirloom",
        "Someone changes their mind",
        "A stranger knows exactly what to say",
        "An emotional reunion",
        "A Christmas carol",
        "An ugly sweater",
        "A snowball fight",
        "A Christmas ornament",
        "A sleigh ride",
        "A Christmas miracle",
        "An old flame reappears",
        "Love is confessed in public",
        "A major change of plans",
        "An interruption",
        "Someone learns the true meaning of life",
        "A big-city person returns home",
        "Pumpkin patch",
        "Apple cider",
        "Hayride",
        "Autumn leaves",
        "Harvest festival",
        "Flannel shirt",
        "Bonfire",
        "Pie contest",
        "Corn maze",
        "Pumpkin carving",
        "Family orchard",
        "Apple picking",
    )

    fun labels(theme: String): List<String> = when (theme) {
        "Multiplayer launch" -> multiplayerLaunchBatch
        "Multiplayer Fall II" -> multiplayerLaunchBatch.takeLast(6)
        "Romance" -> BingoEngine.pool(theme)
        "Christmas", "Fall", "Horror" ->
            BingoEngine.artworkPool(theme).filterNot { it in romance }
        else -> emptyList()
    }
}

@Composable
private fun ArtworkReviewTile(
    label: String,
    marked: Boolean,
    winning: Boolean,
    modifier: Modifier = Modifier
) {
    val shade = when {
        winning -> StorybookPalette.evergreen
        marked -> StorybookPalette.marked
        else -> StorybookPalette.tile
    }
    BoxWithConstraints(
        modifier
            .padding(2.dp)
            .clip(RoundedCornerShape(11.dp))
            .background(shade),
        contentAlignment = Alignment.Center
    ) {
        val artworkSize = BingoSquarePresentation.artworkSizeDp(maxWidth.value).dp
        Column(
            modifier = Modifier.fillMaxSize().padding(horizontal = 1.dp, vertical = 2.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            TropeArtwork(label, StorybookPalette.cranberry, artworkSize = artworkSize)
            Text(
                text = BingoSquarePresentation.shortLabel(label),
                color = if (marked || winning) StorybookPalette.paper
                    else StorybookPalette.background,
                fontWeight = FontWeight.SemiBold,
                fontSize = 10.sp,
                lineHeight = 11.sp,
                textAlign = TextAlign.Center,
                maxLines = 5,
                overflow = TextOverflow.Ellipsis
            )
        }
        if (marked || winning) {
            BingoMarkedBadge(Modifier.align(Alignment.TopEnd).padding(3.dp))
        }
    }
}

@Composable
private fun ArtworkReviewGallery(
    theme: String,
    marked: Boolean = false,
    winning: Boolean = false
) {
    val labels = ArtworkReviewCatalog.labels(theme)
    Column(
        modifier = Modifier.fillMaxSize()
            .background(StorybookPalette.boardBottom)
            .padding(8.dp)
    ) {
        Text(
            "$theme • ${labels.size} independent scenes • 5 columns",
            color = StorybookPalette.paper,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 6.dp)
        )
        labels.chunked(5).forEach { rowLabels ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                rowLabels.forEach { label ->
                    ArtworkReviewTile(
                        label = label,
                        marked = marked,
                        winning = winning,
                        modifier = Modifier.weight(1f).aspectRatio(BingoSquarePresentation.TILE_ASPECT_RATIO)
                    )
                }
                repeat(5 - rowLabels.size) {
                    Spacer(Modifier.weight(1f).aspectRatio(BingoSquarePresentation.TILE_ASPECT_RATIO))
                }
            }
        }
    }
}

@Preview(name = "Romance • 320dp narrow phone", widthDp = 320, heightDp = 840)
@Composable
private fun PreviewRomanceNarrow() = ArtworkReviewGallery("Romance")

@Preview(name = "Romance • 360dp phone", widthDp = 360, heightDp = 880)
@Composable
private fun PreviewRomance() = ArtworkReviewGallery("Romance")

@Preview(name = "Christmas • 360dp phone", widthDp = 360, heightDp = 380)
@Composable
private fun PreviewChristmas() = ArtworkReviewGallery("Christmas")

@Preview(name = "Fall • 360dp phone", widthDp = 360, heightDp = 380)
@Composable
private fun PreviewFall() = ArtworkReviewGallery("Fall")

@Preview(name = "Horror • 360dp phone", widthDp = 360, heightDp = 380)
@Composable
private fun PreviewHorror() = ArtworkReviewGallery("Horror")

@Preview(name = "Marked artwork • 320dp", widthDp = 320, heightDp = 840)
@Composable
private fun PreviewMarked() = ArtworkReviewGallery("Romance", marked = true)

@Preview(name = "Winning artwork • 360dp", widthDp = 360, heightDp = 880)
@Composable
private fun PreviewWinning() = ArtworkReviewGallery("Romance", marked = true, winning = true)

@Preview(name = "Large text • 320dp", widthDp = 320, heightDp = 900, fontScale = 1.3f)
@Composable
private fun PreviewLargeText() = ArtworkReviewGallery("Romance")


@Preview(name = "Multiplayer original scenes • 320dp", widthDp = 320, heightDp = 760)
@Composable
private fun PreviewMultiplayerNarrow() = ArtworkReviewGallery("Multiplayer launch")

@Preview(name = "Multiplayer marked scenes • 360dp", widthDp = 360, heightDp = 850)
@Composable
private fun PreviewMultiplayerMarked() = ArtworkReviewGallery("Multiplayer launch", marked = true)

@Preview(name = "Multiplayer winning scenes • large text", widthDp = 320, heightDp = 810, fontScale = 1.3f)
@Composable
private fun PreviewMultiplayerWinningLargeText() =
    ArtworkReviewGallery("Multiplayer launch", marked = true, winning = true)

@Preview(name = "Fall II original scenes • 320dp", widthDp = 320, heightDp = 270)
@Composable
private fun PreviewFallTwoNarrow() = ArtworkReviewGallery("Multiplayer Fall II")

@Preview(name = "Fall II marked • 360dp", widthDp = 360, heightDp = 290)
@Composable
private fun PreviewFallTwoMarked() = ArtworkReviewGallery("Multiplayer Fall II", marked = true)

@Preview(name = "Fall II winning • large text", widthDp = 320, heightDp = 300, fontScale = 1.3f)
@Composable
private fun PreviewFallTwoWinningLargeText() =
    ArtworkReviewGallery("Multiplayer Fall II", marked = true, winning = true)

@Preview(name = "Cheese Louise free square • phone scale", widthDp = 80, heightDp = 118)
@Composable
private fun PreviewCheeseLouiseFreeSquare() {
    Box(
        Modifier.fillMaxSize()
            .padding(2.dp)
            .clip(RoundedCornerShape(11.dp))
            .background(StorybookPalette.gold),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            FreeSpaceArtwork(artworkSize = 36.dp)
            Text(
                BingoSquarePresentation.shortLabel(BingoEngine.FREE_LABEL),
                color = StorybookPalette.background,
                fontSize = 9.sp,
                lineHeight = 11.sp,
                textAlign = TextAlign.Center,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}
