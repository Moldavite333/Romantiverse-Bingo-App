package com.cheeselouise.romantiverse

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Original Cheese Louise free-space illustration. A little cheese wedge and heart
 * replace the platform-dependent emoji; both native game modes render the same art.
 * Decorative only: the full canonical free-space label remains available to TalkBack.
 */
@Composable
internal fun FreeSpaceArtwork(modifier: Modifier = Modifier, artworkSize: Dp = 36.dp) {
    // Build paths once, not on every frame of a Bingo celebration.
    val heart = remember {
        Path().apply {
            moveTo(20f, 15f)
            cubicTo(12f, 10f, 13f, 4f, 17f, 5f)
            cubicTo(19f, 5f, 20f, 7f, 20f, 8f)
            cubicTo(20f, 7f, 22f, 5f, 24f, 5f)
            cubicTo(29f, 4f, 29f, 10f, 20f, 15f)
            close()
        }
    }
    val cheeseTop = remember {
        Path().apply {
            moveTo(5f, 19f)
            lineTo(27f, 13f)
            lineTo(35f, 23f)
            lineTo(13f, 29f)
            close()
        }
    }
    val cheeseFront = remember {
        Path().apply {
            moveTo(13f, 29f)
            lineTo(35f, 23f)
            lineTo(35f, 32f)
            lineTo(13f, 37f)
            close()
        }
    }
    val cheeseSide = remember {
        Path().apply {
            moveTo(5f, 19f)
            lineTo(13f, 29f)
            lineTo(13f, 37f)
            lineTo(5f, 28f)
            close()
        }
    }

    Canvas(modifier.size(artworkSize)) {
        val factor = size.minDimension / 40f
        withTransform({ scale(factor, factor, pivot = Offset.Zero) }) {
            val outline = StorybookPalette.background
            // Dark medallion separates the golden cheese from the gold free tile.
            drawCircle(outline, radius = 18.5f, center = Offset(20f, 20f))
            drawPath(heart, StorybookPalette.cranberry)
            drawPath(cheeseFront, Color(0xFFF3BE58))
            drawPath(cheeseSide, Color(0xFFDCA148))
            drawPath(cheeseTop, Color(0xFFFFE0A0))
            drawPath(cheeseTop, outline, style = Stroke(width = 1.1f))
            drawPath(cheeseFront, outline, style = Stroke(width = 1.1f))
            drawPath(cheeseSide, outline, style = Stroke(width = 1.1f))
            // Three distinct cheese holes remain visible even at 36dp.
            drawCircle(Color(0xFFCE8B40), radius = 2.4f, center = Offset(23f, 22f))
            drawCircle(Color(0xFFCE8B40), radius = 1.7f, center = Offset(13f, 21f))
            drawCircle(Color(0xFFCE8B40), radius = 2.2f, center = Offset(28f, 29f))
            // Tiny hand-drawn glints echo the gold Bingo celebration.
            drawLine(StorybookPalette.paper, Offset(4f, 8f), Offset(4f, 13f),
                strokeWidth = 1.5f, cap = StrokeCap.Round)
            drawLine(StorybookPalette.paper, Offset(1.5f, 10.5f), Offset(6.5f, 10.5f),
                strokeWidth = 1.5f, cap = StrokeCap.Round)
            drawCircle(StorybookPalette.paper, radius = 1.2f, center = Offset(34f, 9f))
        }
    }
}
