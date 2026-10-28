package com.cheeselouise.romantiverse

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.cos
import kotlin.math.sin

/**
 * Lightweight, dismissible native celebration. A fresh confirmed win event is
 * required; recomposition, relaunch and initial multiplayer hydration do not
 * synthesize a new event. No sound is played until the user's licensed audio
 * asset has been packaged and verified in the Android release.
 */
@Composable
internal fun BingoWinOverlay(
    event: BingoCelebration,
    reducedMotion: Boolean,
    onDismiss: () -> Unit
) {
    val scale = remember(event.id) { Animatable(if (reducedMotion) 1f else .82f) }
    val burst = remember(event.id) { Animatable(0f) }
    var visible by remember(event.id) { mutableStateOf(reducedMotion) }
    LaunchedEffect(event.id) {
        if (!reducedMotion) delay(470) // Let the winning-line sweep finish before the fanfare card.
        visible = true
        if (!reducedMotion) {
            launch { scale.animateTo(1f, tween(340)) }
            launch { burst.animateTo(1f, tween(750)) }
        }
        delay(if (reducedMotion) 1100 else 1900)
        onDismiss()
    }
    if (!visible) return

    val pink = Color(0xFFF45A9D)
    val gold = Color(0xFFFFCC79)
    val violet = Color(0xFFB59BFF)
    val white = Color(0xFFF8F6FF)
    Box(
        Modifier.fillMaxSize()
            .background(Color(0xDF121024))
            .semantics {
                liveRegion = LiveRegionMode.Assertive
                contentDescription = if (event.blackout) "Blackout!" else
                    "Bingo! ${event.newLines * 100} points for ${event.newLines} new lines"
            }
            .clickable(onClickLabel = "Dismiss celebration", onClick = onDismiss),
        contentAlignment = Alignment.Center
    ) {
        if (!reducedMotion) {
            Canvas(Modifier.fillMaxSize()) {
                val center = Offset(size.width / 2f, size.height / 2f)
                for (i in 0 until 26) {
                    val angle = 2.0 * Math.PI * i / 26.0
                    val radius = size.minDimension * (.16f + .37f * burst.value)
                    val position = Offset(
                        center.x + cos(angle).toFloat() * radius,
                        center.y + sin(angle).toFloat() * radius
                    )
                    val color = when (i % 3) { 0 -> pink; 1 -> gold; else -> violet }
                    drawCircle(color.copy(alpha = 1f - burst.value * .85f),
                        radius = (2.5f + (i % 3) * 1.4f) * density, center = position)
                }
                drawCircle(gold.copy(alpha = .45f * (1f - burst.value)),
                    radius = size.minDimension * (.16f + .30f * burst.value),
                    center = center, style = Stroke(width = 2.dp.toPx()))
            }
        }
        Column(
            Modifier.fillMaxWidth(.85f)
                .graphicsLayer { scaleX = scale.value; scaleY = scale.value }
                .clip(RoundedCornerShape(26.dp))
                .background(Brush.verticalGradient(listOf(
                    Color(0xFF432451), Color(0xFF211B3C)
                )))
                .border(2.dp, gold.copy(alpha = .9f), RoundedCornerShape(26.dp))
                .padding(horizontal = 16.dp, vertical = 30.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("✦  ${if (event.blackout) "BLACKOUT!" else "BINGO!"}  ✦",
                color = gold, fontWeight = FontWeight.Black, fontSize = 36.sp,
                textAlign = TextAlign.Center)
            Spacer(Modifier.height(8.dp))
            Text("+${event.newLines * 100} POINTS",
                color = white, fontSize = 23.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp))
            Text("${event.newLines} new ${if (event.newLines == 1) "line" else "lines"}",
                color = violet, fontSize = 15.sp)
            Spacer(Modifier.height(14.dp))
            Text("Tap anywhere to continue", color = white.copy(alpha = .8f),
                fontSize = 12.sp)
        }
    }
}
