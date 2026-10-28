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
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.unit.dp

/**
 * First set of individual, original, small-format storybook scenes.
 *
 * Keys are the engine's exact canonical labels, never shortened display text.
 * A scene is a distinct composition, not a shared generic symbol or a
 * label-hash decoration. The remaining tropes retain their existing vector
 * fallback until their own illustrations are finished.
 *
 * Drawn natively and offline; no network images or private HQ assets.
 */
internal enum class StoryScene {
    CHARMING_STRANGER, SECOND_CHANCE, CHANGED_PLANS, AWKWARD_DATE,
    HEARTFELT_APOLOGY, SURPRISE_VISITOR, HOT_COCOA, HELPFUL_NEIGHBOR,
    PUBLIC_DECLARATION, SHARED_SECRET, SCENIC_WALK, DECORATED_TREE,
    MISSED_CALL, GIFT_EXCHANGE, FAMILY_HEIRLOOM, ROMANTIC_GESTURE,
    DANCE_TOGETHER, MISTLETOE, COZY_CAFE, HOMETOWN_REUNION,
    GRAND_GESTURE, COMMUNITY_FUNDRAISER, SURPRISE_INVITATION, OLD_FLAME
}

internal object StorySceneArt {
    private val scenes = mapOf(
        "A charming stranger" to StoryScene.CHARMING_STRANGER,
        "A second chance" to StoryScene.SECOND_CHANCE,
        "A sudden change of plans" to StoryScene.CHANGED_PLANS,
        "An awkward date" to StoryScene.AWKWARD_DATE,
        "A heartfelt apology" to StoryScene.HEARTFELT_APOLOGY,
        "A surprise visitor" to StoryScene.SURPRISE_VISITOR,
        "Hot cocoa" to StoryScene.HOT_COCOA,
        "A helpful neighbor" to StoryScene.HELPFUL_NEIGHBOR,
        "A public declaration" to StoryScene.PUBLIC_DECLARATION,
        "A shared secret" to StoryScene.SHARED_SECRET,
        "A scenic walk" to StoryScene.SCENIC_WALK,
        "A decorated tree" to StoryScene.DECORATED_TREE,
        "A missed phone call" to StoryScene.MISSED_CALL,
        "A gift exchange" to StoryScene.GIFT_EXCHANGE,
        "A family heirloom" to StoryScene.FAMILY_HEIRLOOM,
        "A romantic gesture" to StoryScene.ROMANTIC_GESTURE,
        "A dance together" to StoryScene.DANCE_TOGETHER,
        "Mistletoe" to StoryScene.MISTLETOE,
        "A cozy café" to StoryScene.COZY_CAFE,
        "A hometown reunion" to StoryScene.HOMETOWN_REUNION,
        "A grand gesture" to StoryScene.GRAND_GESTURE,
        "A community fundraiser" to StoryScene.COMMUNITY_FUNDRAISER,
        "A surprise invitation" to StoryScene.SURPRISE_INVITATION,
        "An old flame" to StoryScene.OLD_FLAME
    )
    fun forLabel(label: String): StoryScene? = scenes[label]
    fun labels(): Set<String> = scenes.keys
    fun uniqueSceneCount(): Int = scenes.values.toSet().size
}

private object StoryInk {
    val paper = Color(0xFFFFF8EA)
    val sky = Color(0xFFDDECE2)
    val blush = Color(0xFFF7D9D4)
    val cranberry = Color(0xFFB34F60)
    val evergreen = Color(0xFF48735D)
    val gold = Color(0xFFE7B85E)
    val cocoa = Color(0xFF8C5D47)
    val ink = Color(0xFF5A4050)
    val blue = Color(0xFF779DA8)
    val snow = Color(0xFFFAF9EF)
}

/** Lightweight 48-unit mini-paintings, legible in a narrow five-column board. */
@Composable
internal fun StorySceneIllustration(scene: StoryScene, modifier: Modifier = Modifier) {
    Canvas(modifier.size(36.dp)) {
        val unit = size.minDimension / 48f
        withTransform({ scale(unit, unit, pivot = Offset.Zero) }) {
            val p = StoryInk
            fun tile(color: Color = p.sky) {
                drawRoundRect(color, cornerRadius = CornerRadius(8f), size = Size(48f, 48f))
            }
            fun box(x: Float, y: Float, w: Float, h: Float, color: Color, radius: Float = 2f) {
                drawRoundRect(color, Offset(x, y), Size(w, h), CornerRadius(radius))
            }
            fun line(x: Float, y: Float, x2: Float, y2: Float, color: Color = p.ink, width: Float = 2f) {
                drawLine(color, Offset(x, y), Offset(x2, y2), strokeWidth = width, cap = StrokeCap.Round)
            }
            fun dot(x: Float, y: Float, r: Float, color: Color) {
                drawCircle(color, radius = r, center = Offset(x, y))
            }
            fun oval(x: Float, y: Float, w: Float, h: Float, color: Color) {
                drawOval(color, Offset(x, y), Size(w, h))
            }
            fun shape(color: Color, vararg points: Pair<Float, Float>) {
                val path = Path().apply {
                    moveTo(points.first().first, points.first().second)
                    points.drop(1).forEach { lineTo(it.first, it.second) }
                    close()
                }
                drawPath(path, color)
            }
            fun person(x: Float, y: Float, coat: Color = p.cranberry) {
                dot(x, y, 4f, p.cocoa)
                oval(x - 5f, y + 4f, 10f, 12f, coat)
            }
            fun heart(x: Float, y: Float, s: Float = 1f, color: Color = p.cranberry) {
                val path = Path().apply {
                    moveTo(x, y + 6f * s)
                    cubicTo(x - 11f * s, y, x - 6f * s, y - 6f * s, x, y - 1f * s)
                    cubicTo(x + 6f * s, y - 6f * s, x + 11f * s, y, x, y + 6f * s)
                    close()
                }
                drawPath(path, color)
            }
            fun tree(x: Float, y: Float, height: Float = 24f) {
                box(x - 2f, y - height * .2f, 4f, height * .4f, p.cocoa)
                shape(p.evergreen, (x to (y - height)), ((x - height * .4f) to (y - 2f)),
                    ((x + height * .4f) to (y - 2f)))
            }
            fun cottage(x: Float, y: Float) {
                box(x, y + 9f, 22f, 17f, p.paper)
                shape(p.cranberry, ((x - 3f) to (y + 10f)), ((x + 11f) to y),
                    ((x + 25f) to (y + 10f)))
                box(x + 8f, y + 15f, 6f, 11f, p.cocoa)
                box(x + 2f, y + 14f, 5f, 5f, p.gold)
            }
            fun envelope(x: Float, y: Float, color: Color = p.paper) {
                box(x, y, 27f, 17f, color)
                line(x + 1f, y + 1f, x + 13.5f, y + 10f, p.cocoa, 1.5f)
                line(x + 26f, y + 1f, x + 13.5f, y + 10f, p.cocoa, 1.5f)
            }
            when (scene) {
                StoryScene.CHARMING_STRANGER -> {
                    tile(p.blush); box(4f, 11f, 25f, 34f, p.paper)
                    box(7f, 16f, 19f, 5f, p.cranberry)
                    box(11f, 23f, 10f, 21f, p.blue)
                    person(37f, 22f, p.evergreen); dot(36f, 18f, 1.3f, p.gold)
                }
                StoryScene.SECOND_CHANCE -> {
                    tile(); tree(7f, 31f, 21f); tree(43f, 32f, 19f)
                    line(12f, 34f, 36f, 34f, p.cocoa, 4f)
                    line(15f, 35f, 15f, 42f); line(33f, 35f, 33f, 42f)
                    person(20f, 21f, p.cranberry); person(29f, 21f, p.blue)
                    heart(24f, 12f, .5f)
                }
                StoryScene.CHANGED_PLANS -> {
                    tile(p.blush); box(4f, 5f, 28f, 31f, p.paper)
                    box(4f, 5f, 28f, 8f, p.cranberry)
                    line(10f, 20f, 25f, 31f, p.cranberry, 3f)
                    line(25f, 20f, 10f, 31f, p.cranberry, 3f)
                    box(28f, 28f, 17f, 15f, p.cocoa)
                    box(33f, 24f, 7f, 5f, p.gold)
                }
                StoryScene.AWKWARD_DATE -> {
                    tile(p.blush); person(10f, 12f, p.blue); person(39f, 12f)
                    box(9f, 31f, 31f, 5f, p.cocoa)
                    line(13f, 36f, 13f, 44f); line(36f, 36f, 36f, 44f)
                    dot(18f, 27f, 5f, p.paper)
                    oval(30f, 26f, 10f, 4f, p.cranberry)
                    line(31f, 27f, 37f, 34f, p.cranberry, 2f)
                }
                StoryScene.HEARTFELT_APOLOGY -> {
                    tile(); cottage(4f, 14f); person(35f, 21f, p.blue)
                    line(31f, 31f, 25f, 30f, p.cocoa, 2.5f)
                    dot(24f, 27f, 4f, p.cranberry); dot(27f, 25f, 3f, p.gold)
                    dot(21f, 24f, 3f, p.cranberry)
                }
                StoryScene.SURPRISE_VISITOR -> {
                    tile(p.blush); box(4f, 6f, 26f, 40f, p.paper)
                    box(9f, 11f, 16f, 35f, p.cocoa)
                    dot(22f, 30f, 1.6f, p.gold)
                    person(37f, 20f, p.evergreen)
                    box(31f, 34f, 15f, 10f, p.cranberry)
                    line(35f, 34f, 35f, 30f); line(35f, 30f, 42f, 30f)
                }
                StoryScene.HOT_COCOA -> {
                    tile(p.blush); oval(5f, 37f, 38f, 7f, p.cocoa)
                    box(11f, 15f, 25f, 24f, p.cranberry, 5f)
                    drawCircle(p.cocoa, 6f, Offset(37f, 25f), style = Stroke(3f))
                    box(13f, 14f, 21f, 5f, p.cocoa)
                    dot(18f, 15f, 3f, p.paper); dot(25f, 14f, 3f, p.paper)
                    dot(30f, 16f, 2f, p.paper)
                    line(19f, 5f, 17f, 10f, p.paper); line(29f, 4f, 27f, 10f, p.paper)
                }
                StoryScene.HELPFUL_NEIGHBOR -> {
                    tile(); cottage(2f, 12f); person(35f, 17f, p.evergreen)
                    oval(23f, 30f, 15f, 8f, p.gold)
                    line(23f, 32f, 17f, 31f, p.cocoa)
                    dot(29f, 29f, 3f, p.cranberry); dot(34f, 29f, 3f, p.cranberry)
                    heart(40f, 12f, .4f)
                }
                StoryScene.PUBLIC_DECLARATION -> {
                    tile(p.blush); box(11f, 25f, 25f, 20f, p.cocoa)
                    person(23f, 9f, p.evergreen)
                    line(30f, 13f, 35f, 8f, p.ink)
                    dot(36f, 8f, 2f, p.ink)
                    heart(8f, 10f, .55f); heart(40f, 22f, .4f)
                }
                StoryScene.SHARED_SECRET -> {
                    tile(); person(14f, 19f, p.cranberry); person(36f, 19f, p.blue)
                    line(19f, 23f, 29f, 19f, p.cocoa, 1.5f)
                    dot(24f, 14f, 2f, p.gold); dot(27f, 11f, 1.5f, p.gold)
                    box(16f, 35f, 17f, 9f, p.paper)
                    line(20f, 39f, 29f, 39f, p.ink, 1.5f)
                }
                StoryScene.SCENIC_WALK -> {
                    tile(); tree(8f, 33f, 26f); tree(41f, 33f, 23f)
                    val path = Path().apply {
                        moveTo(23f, 48f); cubicTo(10f, 37f, 40f, 36f, 26f, 24f)
                    }
                    drawPath(path, p.gold, style = Stroke(6f, cap = StrokeCap.Round))
                    person(26f, 16f, p.cranberry)
                    dot(36f, 6f, 5f, p.gold)
                }
                StoryScene.DECORATED_TREE -> {
                    tile(p.blush); tree(24f, 40f, 34f)
                    listOf(18f to 20f, 28f to 18f, 22f to 28f, 32f to 32f, 15f to 34f).forEachIndexed { i, (x, y) ->
                        dot(x, y, 2.8f, if (i % 2 == 0) p.cranberry else p.gold)
                    }
                    shape(p.gold, 24f to 2f, 27f to 8f, 34f to 9f, 29f to 13f,
                        30f to 19f, 24f to 16f, 18f to 19f, 19f to 13f,
                        14f to 9f, 21f to 8f)
                }
                StoryScene.MISSED_CALL -> {
                    tile(p.blush); box(12f, 3f, 24f, 42f, p.ink, 5f)
                    box(15f, 8f, 18f, 29f, p.paper)
                    drawArc(p.cranberry, 30f, 120f, false, Offset(19f, 16f), Size(12f, 12f),
                        style = Stroke(3f))
                    line(19f, 30f, 29f, 20f, p.cranberry, 2f)
                    dot(24f, 41f, 2f, p.gold)
                    dot(36f, 9f, 7f, p.cranberry); line(34f, 6f, 38f, 12f, p.paper, 2f)
                }
                StoryScene.GIFT_EXCHANGE -> {
                    tile(); box(4f, 22f, 19f, 19f, p.cranberry)
                    box(25f, 17f, 19f, 24f, p.gold)
                    line(13f, 22f, 13f, 41f, p.paper, 3f)
                    line(34f, 17f, 34f, 41f, p.paper, 3f)
                    line(4f, 27f, 23f, 27f, p.paper, 3f)
                    line(25f, 24f, 44f, 24f, p.paper, 3f)
                    heart(13f, 13f, .6f); heart(34f, 8f, .5f)
                }
                StoryScene.FAMILY_HEIRLOOM -> {
                    tile(p.blush); box(6f, 23f, 36f, 20f, p.cocoa)
                    shape(p.gold, 6f to 23f, 14f to 11f, 34f to 11f, 42f to 23f)
                    box(11f, 27f, 26f, 12f, p.paper)
                    line(24f, 16f, 24f, 29f, p.gold, 2f)
                    heart(24f, 33f, .7f, p.cranberry)
                }
                StoryScene.ROMANTIC_GESTURE -> {
                    tile(); envelope(3f, 27f, p.paper)
                    line(34f, 40f, 37f, 15f, p.evergreen, 2f)
                    dot(37f, 13f, 7f, p.cranberry)
                    dot(32f, 10f, 3f, p.blush); dot(41f, 9f, 3f, p.blush)
                    heart(14f, 17f, .6f, p.cranberry)
                }
                StoryScene.DANCE_TOGETHER -> {
                    tile(p.blush); person(18f, 13f, p.cranberry); person(31f, 13f, p.blue)
                    line(20f, 27f, 27f, 26f, p.cocoa, 2f)
                    line(17f, 32f, 11f, 42f, p.ink); line(22f, 32f, 27f, 42f, p.ink)
                    line(29f, 32f, 25f, 42f, p.ink); line(34f, 32f, 40f, 42f, p.ink)
                    line(4f, 7f, 44f, 7f, p.cocoa, 1f)
                    listOf(8f, 18f, 30f, 40f).forEach { dot(it, 9f, 2f, p.gold) }
                }
                StoryScene.MISTLETOE -> {
                    tile(); line(24f, 2f, 24f, 13f, p.cocoa)
                    oval(11f, 11f, 13f, 7f, p.evergreen)
                    oval(24f, 11f, 13f, 7f, p.evergreen)
                    dot(24f, 17f, 3f, p.cranberry)
                    person(16f, 24f, p.cranberry); person(32f, 24f, p.blue)
                    heart(24f, 25f, .4f)
                }
                StoryScene.COZY_CAFE -> {
                    tile(p.blush); box(5f, 15f, 38f, 29f, p.paper)
                    box(5f, 12f, 38f, 10f, p.cranberry)
                    listOf(12f, 25f, 38f).forEach { box(it, 12f, 5f, 10f, p.gold) }
                    box(10f, 26f, 12f, 14f, p.blue)
                    box(27f, 25f, 11f, 19f, p.cocoa)
                    line(30f, 33f, 35f, 33f, p.gold, 2f)
                    line(15f, 5f, 13f, 9f, p.cocoa); line(24f, 4f, 23f, 9f, p.cocoa)
                }
                StoryScene.HOMETOWN_REUNION -> {
                    tile(); cottage(4f, 12f)
                    person(35f, 20f, p.cranberry)
                    line(34f, 34f, 29f, 37f, p.cocoa, 2f)
                    box(30f, 37f, 13f, 8f, p.gold)
                    heart(28f, 12f, .6f)
                }
                StoryScene.GRAND_GESTURE -> {
                    tile(p.blush); box(5f, 27f, 38f, 12f, p.paper)
                    line(8f, 33f, 40f, 33f, p.cranberry, 2f)
                    heart(24f, 32f, .75f)
                    dot(9f, 12f, 6f, p.gold); dot(38f, 10f, 6f, p.cranberry)
                    line(9f, 18f, 15f, 27f, p.cocoa, 1.5f)
                    line(38f, 16f, 34f, 27f, p.cocoa, 1.5f)
                }
                StoryScene.COMMUNITY_FUNDRAISER -> {
                    tile(); box(10f, 15f, 28f, 28f, p.paper, 4f)
                    box(13f, 20f, 22f, 19f, p.gold)
                    line(19f, 19f, 29f, 19f, p.cocoa, 2f)
                    heart(24f, 31f, .65f)
                    dot(35f, 7f, 6f, p.gold)
                    line(35f, 13f, 30f, 21f, p.cocoa, 2f)
                }
                StoryScene.SURPRISE_INVITATION -> {
                    tile(p.blush); envelope(8f, 19f)
                    dot(22f, 29f, 5f, p.cranberry)
                    heart(22f, 28f, .35f, p.gold)
                    line(9f, 11f, 15f, 14f, p.gold, 2f)
                    line(35f, 10f, 30f, 15f, p.gold, 2f)
                    dot(37f, 37f, 2f, p.gold)
                }
                StoryScene.OLD_FLAME -> {
                    tile(); person(11f, 21f, p.blue); person(37f, 21f, p.cranberry)
                    line(13f, 42f, 35f, 42f, p.cocoa, 3f)
                    shape(p.cranberry, 23f to 39f, 17f to 29f, 22f to 24f,
                        25f to 14f, 32f to 29f, 28f to 39f)
                    shape(p.gold, 23f to 39f, 22f to 30f, 26f to 25f, 29f to 38f)
                    heart(24f, 9f, .4f)
                }
            }
        }
    }
}
