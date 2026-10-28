package com.cheeselouise.romantiverse

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.unit.dp

/** Pure board coordinates: a line runs between the centers of its end squares. */
internal data class BingoLinePath(
    val x0: Float, val y0: Float, val x1: Float, val y1: Float
)

internal object BingoLineGeometry {
    fun path(indices: List<Int>): BingoLinePath? {
        // Never animate an arbitrary path from untrusted room or catalog data.
        if (indices !in BingoEngine.lines) return null
        val first = indices.first()
        val last = indices.last()
        return BingoLinePath(
            (first % 5 + .5f) / 5f,
            (first / 5 + .5f) / 5f,
            (last % 5 + .5f) / 5f,
            (last / 5 + .5f) / 5f
        )
    }
}

/**
 * GPU-light native line sweep. The engine/server selects the newly completed
 * lines; this Canvas only illustrates them and never changes scoring.
 * Canvas does not consume pointer events from the squares beneath it.
 */
@Composable
internal fun BingoLineSweep(
    event: BingoCelebration?,
    reducedMotion: Boolean,
    modifier: Modifier = Modifier
) {
    val progress = remember { Animatable(0f) }
    LaunchedEffect(event?.id, reducedMotion) {
        progress.snapTo(if (event != null && reducedMotion) 1f else 0f)
        if (event != null && !reducedMotion) {
            progress.animateTo(1f, tween(420, easing = FastOutSlowInEasing))
        }
    }
    if (event == null || event.winningLines.isEmpty()) return
    val gold = Color(0xFFFFCC79)
    val rose = Color(0xFFFF70B7)
    Canvas(modifier) {
        event.winningLines.forEach { indices ->
            val line = BingoLineGeometry.path(indices) ?: return@forEach
            val start = Offset(line.x0 * size.width, line.y0 * size.height)
            val end = Offset(line.x1 * size.width, line.y1 * size.height)
            val tip = Offset(
                start.x + (end.x - start.x) * progress.value,
                start.y + (end.y - start.y) * progress.value
            )
            drawLine(gold.copy(alpha = .30f), start, tip,
                strokeWidth = 13.dp.toPx(), cap = StrokeCap.Round)
            drawLine(Brush.linearGradient(listOf(rose, gold), start, tip),
                start, tip, strokeWidth = 4.dp.toPx(), cap = StrokeCap.Round)
            drawCircle(gold, radius = 4.dp.toPx(), center = tip)
        }
    }
}
