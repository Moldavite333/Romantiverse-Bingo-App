package com.cheeselouise.romantiverse

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.unit.dp
import kotlin.math.cos
import kotlin.math.sin

/**
 * Original, lightweight vector artwork for native Bingo squares.
 *
 * These motifs are visual decoration only. Full canonical trope labels remain
 * available to TalkBack and long-press; artwork never changes cards or scores.
 * Canvas uses no image requests, fonts, or per-frame allocations outside drawing.
 */
internal enum class TropeMotif {
    HEART, COFFEE, LETTER, PRESENT, SNOWFLAKE, MUSIC,
    PUMPKIN, HOURGLASS, HOME, LEAF, STAR
}

internal object BingoTropeArtwork {
    fun motif(label: String): TropeMotif {
        val value = label.lowercase()
        return when {
            listOf("snow", "christmas", "mistletoe", "winter").any { it in value } -> TropeMotif.SNOWFLAKE
            listOf("pumpkin", "harvest", "hayride", "orchard").any { it in value } -> TropeMotif.PUMPKIN
            listOf("coffee", "café", "cocoa", "meal", "pie", "cookies").any { it in value } -> TropeMotif.COFFEE
            listOf("phone", "invitation", "letter", "secret", "message").any { it in value } -> TropeMotif.LETTER
            listOf("gift", "heirloom", "keepsake", "exchange").any { it in value } -> TropeMotif.PRESENT
            listOf("kiss", "romantic", "love", "flame", "sweetheart").any { it in value } -> TropeMotif.HEART
            listOf("dance", "parade", "festival", "music").any { it in value } -> TropeMotif.MUSIC
            listOf("deadline", "last-minute", "time").any { it in value } -> TropeMotif.HOURGLASS
            listOf("home", "neighbor", "town", "house", "family").any { it in value } -> TropeMotif.HOME
            listOf("tree", "leaves", "foliage", "scenic", "autumn", "fall").any { it in value } -> TropeMotif.LEAF
            else -> TropeMotif.STAR
        }
    }
}

/** Hand-drawn-style line illustrations; intentionally simple at 20–24dp. */
@Composable
internal fun TropeArtwork(
    label: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    // Prefer a unique illustrated story scene over the old shared outline motifs.
    // The remaining tropes keep their offline vector fallback during rollout.
    val storyScene = StorySceneArt.forLabel(label)
    if (storyScene != null) {
        StorySceneIllustration(storyScene, modifier)
        return
    }
    val motif = BingoTropeArtwork.motif(label)
    Canvas(modifier.size(22.dp)) {
        val unit = size.minDimension / 24f
        withTransform({ scale(unit, unit, pivot = Offset.Zero) }) {
            val stroke = Stroke(width = 1.8f, cap = StrokeCap.Round)
            fun line(x0: Float, y0: Float, x1: Float, y1: Float) =
                drawLine(color, Offset(x0, y0), Offset(x1, y1), strokeWidth = 1.8f, cap = StrokeCap.Round)
            fun circle(x: Float, y: Float, r: Float, filled: Boolean = false) =
                drawCircle(color, radius = r, center = Offset(x, y),
                    style = if (filled) androidx.compose.ui.graphics.drawscope.Fill else stroke)
            when (motif) {
                TropeMotif.HEART -> {
                    val heart = Path().apply {
                        moveTo(12f, 20f)
                        cubicTo(5f, 15f, 2f, 11f, 5f, 7.5f)
                        cubicTo(8f, 4f, 11f, 6f, 12f, 8f)
                        cubicTo(13f, 6f, 16f, 4f, 19f, 7.5f)
                        cubicTo(22f, 11f, 19f, 15f, 12f, 20f)
                        close()
                    }
                    drawPath(heart, color, style = stroke)
                    circle(17f, 8f, .7f, filled = true)
                }
                TropeMotif.COFFEE -> {
                    drawRoundRect(color, topLeft = Offset(4f, 9f), size = Size(14f, 10f),
                        cornerRadius = CornerRadius(2f), style = stroke)
                    circle(18.5f, 13f, 3f)
                    line(5f, 21f, 20f, 21f)
                    line(8f, 3f, 8f, 6.5f)
                    line(13f, 2f, 13f, 6f)
                }
                TropeMotif.LETTER -> {
                    drawRoundRect(color, topLeft = Offset(3f, 6f), size = Size(18f, 13f),
                        cornerRadius = CornerRadius(2f), style = stroke)
                    line(3.8f, 7.4f, 12f, 13f)
                    line(20.2f, 7.4f, 12f, 13f)
                    line(4.2f, 17.5f, 9f, 13.5f)
                    line(19.8f, 17.5f, 15f, 13.5f)
                }
                TropeMotif.PRESENT -> {
                    drawRoundRect(color, topLeft = Offset(4f, 9f), size = Size(16f, 12f),
                        cornerRadius = CornerRadius(1.5f), style = stroke)
                    line(12f, 9f, 12f, 21f)
                    line(4f, 13f, 20f, 13f)
                    val leftBow = Path().apply {
                        moveTo(12f, 9f); cubicTo(5f, 9f, 5f, 2f, 9f, 3f)
                        cubicTo(12f, 3.5f, 12f, 7f, 12f, 9f)
                    }
                    val rightBow = Path().apply {
                        moveTo(12f, 9f); cubicTo(19f, 9f, 19f, 2f, 15f, 3f)
                        cubicTo(12f, 3.5f, 12f, 7f, 12f, 9f)
                    }
                    drawPath(leftBow, color, style = stroke)
                    drawPath(rightBow, color, style = stroke)
                }
                TropeMotif.SNOWFLAKE -> {
                    for (i in 0 until 6) {
                        val a = Math.PI * i / 3.0
                        val dx = cos(a).toFloat()
                        val dy = sin(a).toFloat()
                        line(12f, 12f, 12f + dx * 9f, 12f + dy * 9f)
                        val bx = 12f + dx * 6f
                        val by = 12f + dy * 6f
                        line(bx, by, bx - dx * 2f - dy * 2f, by - dy * 2f + dx * 2f)
                        line(bx, by, bx - dx * 2f + dy * 2f, by - dy * 2f - dx * 2f)
                    }
                }
                TropeMotif.MUSIC -> {
                    line(10f, 16f, 10f, 5f)
                    line(10f, 5f, 20f, 3f)
                    line(20f, 3f, 20f, 14f)
                    line(10f, 8f, 20f, 6f)
                    drawOval(color, topLeft = Offset(4f, 15f), size = Size(6f, 4f))
                    drawOval(color, topLeft = Offset(14f, 13f), size = Size(6f, 4f))
                }
                TropeMotif.PUMPKIN -> {
                    drawOval(color, topLeft = Offset(3f, 8f), size = Size(18f, 13f), style = stroke)
                    drawOval(color, topLeft = Offset(7f, 8f), size = Size(10f, 13f), style = stroke)
                    line(12f, 8f, 13f, 4f)
                    line(13f, 4f, 16f, 3f)
                    circle(17f, 5f, 1.2f)
                }
                TropeMotif.HOURGLASS -> {
                    line(5f, 3f, 19f, 3f)
                    line(5f, 21f, 19f, 21f)
                    line(7f, 4f, 7f, 7f)
                    line(17f, 4f, 17f, 7f)
                    line(7f, 7f, 12f, 12f)
                    line(17f, 7f, 12f, 12f)
                    line(12f, 12f, 7f, 18f)
                    line(12f, 12f, 17f, 18f)
                    line(7f, 18f, 7f, 20f)
                    line(17f, 18f, 17f, 20f)
                }
                TropeMotif.HOME -> {
                    val roof = Path().apply {
                        moveTo(3f, 11f); lineTo(12f, 3f); lineTo(21f, 11f)
                    }
                    drawPath(roof, color, style = stroke)
                    line(5f, 10f, 5f, 21f)
                    line(19f, 10f, 19f, 21f)
                    line(5f, 21f, 19f, 21f)
                    drawRoundRect(color, topLeft = Offset(10f, 14f), size = Size(4f, 7f),
                        cornerRadius = CornerRadius(.6f), style = stroke)
                }
                TropeMotif.LEAF -> {
                    val leaf = Path().apply {
                        moveTo(5f, 20f)
                        cubicTo(2f, 8f, 11f, 3f, 21f, 3f)
                        cubicTo(21f, 14f, 16f, 22f, 5f, 20f)
                        close()
                    }
                    drawPath(leaf, color, style = stroke)
                    line(5f, 20f, 17f, 8f)
                    line(10f, 15f, 10f, 10f)
                    line(13f, 12f, 18f, 12f)
                }
                TropeMotif.STAR -> {
                    val star = Path().apply {
                        moveTo(12f, 2f); lineTo(14.5f, 9.5f); lineTo(22f, 12f)
                        lineTo(14.5f, 14.5f); lineTo(12f, 22f)
                        lineTo(9.5f, 14.5f); lineTo(2f, 12f)
                        lineTo(9.5f, 9.5f); close()
                    }
                    drawPath(star, color, style = stroke)
                    circle(12f, 12f, 1.2f, filled = true)
                }
            }
        }
    }
}
