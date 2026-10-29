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
 * One-to-one original, small-format storybook scenes for the 72 canonical tropes.
 *
 * Keys are the engine's exact canonical labels, never shortened display text.
 * A scene is a distinct composition, not a shared generic symbol or a
 * label-hash decoration. Unknown future labels retain the existing vector
 * fallback until new independent scenes are approved.
 *
 * Drawn natively and offline; no network images or private HQ assets.
 */
internal enum class StoryScene {
    CHARMING_STRANGER, SECOND_CHANCE, CHANGED_PLANS, AWKWARD_DATE,
    HEARTFELT_APOLOGY, SURPRISE_VISITOR, HOT_COCOA, HELPFUL_NEIGHBOR,
    PUBLIC_DECLARATION, SHARED_SECRET, SCENIC_WALK, DECORATED_TREE,
    MISSED_CALL, GIFT_EXCHANGE, FAMILY_HEIRLOOM, ROMANTIC_GESTURE,
    DANCE_TOGETHER, MISTLETOE, COZY_CAFE, HOMETOWN_REUNION,
    GRAND_GESTURE, COMMUNITY_FUNDRAISER, SURPRISE_INVITATION, OLD_FLAME,
    FIRST_MEETING, MISUNDERSTANDING, ALMOST_KISS, BIG_CONFESSION, TOWN_FESTIVAL, FAMILY_SECRET, CAREER_DILEMMA, SENTIMENTAL_GIFT,
    MEDDLING_RELATIVE, ROMANTIC_RIVAL, LAST_MINUTE_ARRIVAL, UNEXPECTED_KISS, MEANINGFUL_LOOK, INCONVENIENT_DEADLINE, SMALL_TOWN_CELEBRATION, SHARED_MEAL,
    TREE_LIGHTING, SNOWSTORM, CHRISTMAS_COOKIES, HOLIDAY_PARADE, FESTIVE_MARKET, CHRISTMAS_WISH, COZY_FIREPLACE, HOLIDAY_TRADITION,
    PUMPKIN_PATCH, AUTUMN_FESTIVAL, HAYRIDE, HARVEST_MARKET, PIE_CONTEST, COZY_SWEATER, FALLING_LEAVES, APPLE_ORCHARD, BONFIRE, FALL_FUNDRAISER, PUMPKIN_CARVING, FOLIAGE_DRIVE,
    CREAKING_DOOR, OMINOUS_SHADOW, SUDDEN_SCREAM, FLASHLIGHT_FAILS, STRANGE_NOISE, CREEPY_HALLWAY, MYSTERIOUS_WARNING, JUMP_SCARE, EERIE_PHONE_CALL, LOCKED_DOOR, ABANDONED_HOUSE, FINAL_REVEAL
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
        "An old flame" to StoryScene.OLD_FLAME,
        "First meeting" to StoryScene.FIRST_MEETING,
        "A misunderstanding" to StoryScene.MISUNDERSTANDING,
        "The almost-kiss" to StoryScene.ALMOST_KISS,
        "The big confession" to StoryScene.BIG_CONFESSION,
        "A town festival" to StoryScene.TOWN_FESTIVAL,
        "A family secret" to StoryScene.FAMILY_SECRET,
        "A career dilemma" to StoryScene.CAREER_DILEMMA,
        "A sentimental gift" to StoryScene.SENTIMENTAL_GIFT,
        "A meddling relative" to StoryScene.MEDDLING_RELATIVE,
        "A romantic rival" to StoryScene.ROMANTIC_RIVAL,
        "A last-minute arrival" to StoryScene.LAST_MINUTE_ARRIVAL,
        "An unexpected kiss" to StoryScene.UNEXPECTED_KISS,
        "A meaningful look" to StoryScene.MEANINGFUL_LOOK,
        "An inconvenient deadline" to StoryScene.INCONVENIENT_DEADLINE,
        "A small-town celebration" to StoryScene.SMALL_TOWN_CELEBRATION,
        "A shared meal" to StoryScene.SHARED_MEAL,
        "A tree lighting" to StoryScene.TREE_LIGHTING,
        "A snowstorm" to StoryScene.SNOWSTORM,
        "Christmas cookies" to StoryScene.CHRISTMAS_COOKIES,
        "A holiday parade" to StoryScene.HOLIDAY_PARADE,
        "A festive market" to StoryScene.FESTIVE_MARKET,
        "A Christmas wish" to StoryScene.CHRISTMAS_WISH,
        "A cozy fireplace" to StoryScene.COZY_FIREPLACE,
        "A holiday tradition" to StoryScene.HOLIDAY_TRADITION,
        "A pumpkin patch" to StoryScene.PUMPKIN_PATCH,
        "An autumn festival" to StoryScene.AUTUMN_FESTIVAL,
        "A hayride" to StoryScene.HAYRIDE,
        "A harvest market" to StoryScene.HARVEST_MARKET,
        "A pie contest" to StoryScene.PIE_CONTEST,
        "A cozy sweater" to StoryScene.COZY_SWEATER,
        "Falling leaves" to StoryScene.FALLING_LEAVES,
        "An apple orchard" to StoryScene.APPLE_ORCHARD,
        "A bonfire" to StoryScene.BONFIRE,
        "A fall fundraiser" to StoryScene.FALL_FUNDRAISER,
        "A pumpkin carving" to StoryScene.PUMPKIN_CARVING,
        "A scenic foliage drive" to StoryScene.FOLIAGE_DRIVE,
        "A creaking door" to StoryScene.CREAKING_DOOR,
        "An ominous shadow" to StoryScene.OMINOUS_SHADOW,
        "A sudden scream" to StoryScene.SUDDEN_SCREAM,
        "A flashlight fails" to StoryScene.FLASHLIGHT_FAILS,
        "A strange noise" to StoryScene.STRANGE_NOISE,
        "A creepy hallway" to StoryScene.CREEPY_HALLWAY,
        "A mysterious warning" to StoryScene.MYSTERIOUS_WARNING,
        "A jump scare" to StoryScene.JUMP_SCARE,
        "An eerie phone call" to StoryScene.EERIE_PHONE_CALL,
        "A locked door" to StoryScene.LOCKED_DOOR,
        "An abandoned house" to StoryScene.ABANDONED_HOUSE,
        "A final reveal" to StoryScene.FINAL_REVEAL
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
    val skin = Color(0xFFE9B99A)
    val pineHighlight = Color(0xFF73947A)
}

/** Lightweight 48-unit mini-paintings, legible in a narrow five-column board. */
@Composable
internal fun StorySceneIllustration(scene: StoryScene, modifier: Modifier = Modifier) {
    Canvas(modifier.size(30.dp)) {
        val unit = size.minDimension / 48f
        withTransform({ scale(unit, unit, pivot = Offset.Zero) }) {
            val p = StoryInk
            fun tile(color: Color = p.sky) {
                drawRoundRect(color, cornerRadius = CornerRadius(8f), size = Size(48f, 48f))
                // A quiet inset frame ties 72 distinct scenes into one illustrated collection.
                drawRoundRect(
                    p.paper.copy(alpha = .3f), Offset(1.5f, 1.5f),
                    Size(45f, 45f), CornerRadius(7f), style = Stroke(1.3f)
                )
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
                // Warm faces, hair, scarves and sleeves instead of featureless dots.
                // Keep the silhouette readable when reduced to a 30dp Bingo painting.
                dot(x, y - .6f, 4.7f, p.ink)
                dot(x, y + .7f, 3.4f, p.skin)
                oval(x - 5.2f, y + 4f, 10.4f, 12f, coat)
                line(x - 4f, y + 7f, x - 6f, y + 11f, coat, 2.3f)
                line(x + 4f, y + 7f, x + 6f, y + 11f, coat, 2.3f)
                line(x - 2.4f, y + 5.7f, x + 2.4f, y + 5.7f, p.paper, 1.5f)
                dot(x, y + 10.5f, .9f, p.gold)
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
                // Offset foliage layers add depth without changing the scene's subject.
                shape(p.pineHighlight, (x to (y - height * .8f)),
                    ((x - height * .26f) to (y - height * .28f)),
                    ((x + height * .16f) to (y - height * .28f)))
                line(x - height * .1f, y - height * .55f,
                    x + height * .03f, y - height * .68f, p.paper.copy(alpha = .65f), 1f)
            }
            fun cottage(x: Float, y: Float) {
                box(x, y + 9f, 22f, 17f, p.paper)
                box(x + 17f, y + 1f, 3f, 8f, p.cocoa, 1f)
                shape(p.cranberry, ((x - 3f) to (y + 10f)), ((x + 11f) to y),
                    ((x + 25f) to (y + 10f)))
                line(x - 1f, y + 10f, x + 23f, y + 10f, p.gold, 1.5f)
                box(x + 8f, y + 15f, 6f, 11f, p.cocoa)
                dot(x + 12.5f, y + 21f, .8f, p.gold)
                box(x + 2f, y + 14f, 5f, 5f, p.gold)
                box(x + 16f, y + 14f, 4f, 5f, p.gold)
                line(x + 4.5f, y + 14f, x + 4.5f, y + 19f, p.paper, 1f)
                line(x + 18f, y + 14f, x + 18f, y + 19f, p.paper, 1f)
            }
            fun envelope(x: Float, y: Float, color: Color = p.paper) {
                box(x, y, 27f, 17f, color)
                line(x + 1f, y + 1f, x + 13.5f, y + 10f, p.cocoa, 1.5f)
                line(x + 26f, y + 1f, x + 13.5f, y + 10f, p.cocoa, 1.5f)
            }
            when (scene) {
                StoryScene.CHARMING_STRANGER -> {
                    tile(p.blush)
                    // A glowing café doorway and an unfamiliar arrival.
                    box(3f, 10f, 27f, 35f, p.paper)
                    box(6f, 15f, 21f, 7f, p.cranberry)
                    line(7f, 19f, 26f, 19f, p.gold, 1.6f)
                    box(10f, 24f, 12f, 20f, p.blue)
                    box(12f, 27f, 7f, 12f, p.gold.copy(alpha = .75f))
                    dot(21f, 34f, 1.1f, p.paper)
                    box(4f, 36f, 5f, 8f, p.evergreen)
                    dot(6f, 34f, 3.5f, p.cranberry)
                    person(37f, 22f, p.evergreen)
                    dot(35f, 11f, 3f, p.gold)
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

                StoryScene.FIRST_MEETING -> {
                    tile(p.sky); box(3f, 6f, 15f, 34f, p.cocoa)
                    listOf(10f, 17f, 24f, 31f).forEach { y ->
                        box(5f, y, 11f, 4f, if (y == 17f) p.gold else p.paper)
                    }
                    person(25f, 21f, p.cranberry); person(37f, 22f, p.evergreen)
                    box(27f, 32f, 12f, 9f, p.gold)
                    heart(31f, 11f, .35f)
                }
                StoryScene.MISUNDERSTANDING -> {
                    tile(p.blush); person(10f, 22f, p.blue); person(38f, 22f, p.cranberry)
                    box(3f, 6f, 17f, 10f, p.paper, 5f)
                    box(28f, 6f, 17f, 10f, p.paper, 5f)
                    line(8f, 10f, 15f, 10f, p.ink, 1.5f)
                    line(33f, 10f, 40f, 10f, p.ink, 1.5f)
                    line(20f, 21f, 28f, 29f, p.cranberry, 2f)
                    line(28f, 21f, 20f, 29f, p.cranberry, 2f)
                }
                StoryScene.ALMOST_KISS -> {
                    tile(p.blush); line(5f, 7f, 43f, 7f, p.cocoa, 1.5f)
                    dot(24f, 10f, 5f, p.gold)
                    person(15f, 22f, p.cranberry); person(32f, 22f, p.blue)
                    line(18f, 28f, 23f, 27f, p.cocoa, 2f)
                    line(30f, 28f, 25f, 27f, p.cocoa, 2f)
                    heart(24f, 20f, .4f, p.gold)
                    line(23f, 39f, 25f, 39f, p.ink, 1.5f)
                }
                StoryScene.BIG_CONFESSION -> {
                    tile(p.sky); box(5f, 28f, 38f, 14f, p.paper)
                    shape(p.cranberry, 3f to 28f, 24f to 11f, 45f to 28f)
                    person(23f, 19f, p.evergreen)
                    box(30f, 7f, 14f, 9f, p.paper, 5f)
                    heart(37f, 11f, .35f)
                    line(24f, 33f, 37f, 33f, p.cocoa, 2f)
                }
                StoryScene.TOWN_FESTIVAL -> {
                    tile(p.sky); line(2f, 7f, 46f, 7f, p.cocoa, 1f)
                    listOf(6f, 15f, 24f, 33f, 42f).forEachIndexed { i, x ->
                        shape(if (i % 2 == 0) p.cranberry else p.gold,
                            x to 7f, (x + 6f) to 7f, (x + 3f) to 15f)
                    }
                    shape(p.cranberry, 5f to 27f, 24f to 15f, 43f to 27f)
                    box(9f, 27f, 30f, 16f, p.paper)
                    box(14f, 31f, 20f, 6f, p.gold)
                    person(6f, 31f, p.blue); person(42f, 31f, p.evergreen)
                }
                StoryScene.FAMILY_SECRET -> {
                    tile(p.blush); box(5f, 7f, 25f, 34f, p.cocoa)
                    box(8f, 10f, 19f, 27f, p.paper)
                    oval(13f, 13f, 10f, 11f, p.gold)
                    dot(18f, 16f, 3f, p.ink)
                    box(14f, 21f, 8f, 9f, p.cranberry)
                    box(27f, 24f, 17f, 17f, p.evergreen)
                    dot(35f, 30f, 3f, p.gold)
                    line(35f, 33f, 35f, 37f, p.gold, 2f)
                }
                StoryScene.CAREER_DILEMMA -> {
                    tile(p.sky); line(24f, 16f, 24f, 44f, p.cocoa, 3f)
                    shape(p.gold, 22f to 45f, 15f to 30f, 22f to 24f)
                    shape(p.gold, 26f to 45f, 33f to 30f, 26f to 24f)
                    box(3f, 11f, 14f, 18f, p.blue)
                    listOf(6f, 12f).forEach { x -> box(x, 14f, 3f, 4f, p.paper) }
                    cottage(29f, 6f)
                    person(24f, 7f, p.cranberry)
                }
                StoryScene.SENTIMENTAL_GIFT -> {
                    tile(p.blush); box(6f, 23f, 36f, 20f, p.cocoa, 4f)
                    box(8f, 19f, 32f, 8f, p.gold)
                    oval(14f, 9f, 20f, 16f, p.paper)
                    line(24f, 25f, 24f, 31f, p.gold, 2f)
                    heart(24f, 17f, .6f, p.cranberry)
                    dot(12f, 35f, 2f, p.gold); dot(36f, 35f, 2f, p.gold)
                }
                StoryScene.MEDDLING_RELATIVE -> {
                    tile(p.sky); box(3f, 4f, 24f, 40f, p.paper)
                    box(7f, 8f, 16f, 26f, p.blue)
                    person(15f, 14f, p.gold)
                    line(24f, 7f, 24f, 35f, p.cranberry, 3f)
                    person(34f, 23f, p.cranberry)
                    person(43f, 24f, p.evergreen)
                    heart(37f, 14f, .35f)
                }
                StoryScene.ROMANTIC_RIVAL -> {
                    tile(p.blush); person(8f, 19f, p.evergreen)
                    person(24f, 10f, p.gold); person(40f, 19f, p.blue)
                    line(10f, 34f, 19f, 29f, p.cocoa, 2f)
                    line(38f, 34f, 29f, 29f, p.cocoa, 2f)
                    dot(19f, 28f, 4f, p.cranberry)
                    dot(29f, 28f, 4f, p.cranberry)
                    heart(24f, 40f, .45f)
                }
                StoryScene.LAST_MINUTE_ARRIVAL -> {
                    tile(p.sky); box(2f, 14f, 32f, 22f, p.blue, 3f)
                    box(5f, 18f, 9f, 10f, p.paper)
                    box(18f, 18f, 9f, 10f, p.paper)
                    dot(9f, 37f, 4f, p.ink); dot(28f, 37f, 4f, p.ink)
                    person(40f, 16f, p.cranberry)
                    box(34f, 33f, 12f, 11f, p.cocoa)
                    line(38f, 33f, 38f, 28f, p.gold, 2f)
                    dot(41f, 7f, 5f, p.gold)
                }
                StoryScene.UNEXPECTED_KISS -> {
                    tile(p.sky); line(24f, 6f, 24f, 24f, p.cocoa, 2f)
                    shape(p.cranberry, 4f to 20f, 24f to 5f, 44f to 20f)
                    person(19f, 25f, p.blue); person(29f, 25f, p.evergreen)
                    heart(24f, 25f, .4f, p.gold)
                    listOf(8f, 14f, 36f, 42f).forEach { x ->
                        line(x, 28f, x - 2f, 35f, p.blue, 1.3f)
                    }
                }
                StoryScene.MEANINGFUL_LOOK -> {
                    tile(p.blush); box(4f, 8f, 17f, 31f, p.paper)
                    box(27f, 8f, 17f, 31f, p.paper)
                    line(12f, 8f, 12f, 39f, p.cocoa, 1.5f)
                    line(35f, 8f, 35f, 39f, p.cocoa, 1.5f)
                    person(13f, 19f, p.cranberry); person(35f, 19f, p.blue)
                    line(19f, 18f, 29f, 18f, p.gold, 2f)
                    heart(24f, 8f, .4f)
                }
                StoryScene.INCONVENIENT_DEADLINE -> {
                    tile(p.sky); box(4f, 16f, 22f, 27f, p.paper)
                    line(9f, 24f, 21f, 24f, p.blue, 1.5f)
                    line(9f, 30f, 21f, 30f, p.blue, 1.5f)
                    dot(33f, 19f, 12f, p.gold)
                    dot(33f, 19f, 9f, p.paper)
                    line(33f, 19f, 33f, 12f, p.ink, 2f)
                    line(33f, 19f, 39f, 23f, p.ink, 2f)
                    box(25f, 35f, 20f, 8f, p.cranberry)
                }
                StoryScene.SMALL_TOWN_CELEBRATION -> {
                    tile(p.sky); cottage(13f, 9f)
                    line(3f, 5f, 45f, 5f, p.cocoa, 1.3f)
                    listOf(8f, 18f, 28f, 38f).forEachIndexed { i, x ->
                        dot(x, 8f, 3f, if (i % 2 == 0) p.gold else p.cranberry)
                    }
                    person(7f, 30f, p.blue); person(40f, 30f, p.cranberry)
                    dot(23f, 42f, 3f, p.gold)
                    dot(15f, 42f, 2f, p.cranberry); dot(32f, 42f, 2f, p.cranberry)
                }
                StoryScene.SHARED_MEAL -> {
                    tile(p.blush); box(4f, 30f, 40f, 6f, p.cocoa)
                    line(9f, 36f, 9f, 45f); line(39f, 36f, 39f, 45f)
                    person(10f, 16f, p.blue); person(38f, 16f, p.cranberry)
                    oval(13f, 28f, 12f, 5f, p.paper)
                    oval(25f, 28f, 12f, 5f, p.paper)
                    box(23f, 20f, 3f, 9f, p.gold)
                    dot(24.5f, 18f, 3f, p.cranberry)
                    heart(24f, 8f, .4f)
                }


                // Christmas: eight distinct seasonal compositions, not generic snowflake icons.
                StoryScene.TREE_LIGHTING -> {
                    tile(p.sky); tree(24f, 40f, 34f)
                    listOf(18f to 22f, 29f to 24f, 24f to 30f).forEach { (x, y) ->
                        dot(x, y, 3f, p.gold)
                    }
                    person(7f, 31f, p.cranberry); person(41f, 31f, p.blue)
                    line(7f, 6f, 41f, 6f, p.cocoa, 1.2f)
                    dot(24f, 5f, 4f, p.gold)
                }
                StoryScene.SNOWSTORM -> {
                    tile(p.blue); cottage(5f, 13f)
                    listOf(8f to 7f, 20f to 5f, 38f to 9f, 42f to 24f, 8f to 35f,
                        28f to 37f).forEach { (x, y) ->
                        line(x - 2f, y, x + 2f, y, p.snow, 1.5f)
                        line(x, y - 2f, x, y + 2f, p.snow, 1.5f)
                    }
                    shape(p.snow, 2f to 42f, 19f to 37f, 31f to 42f, 46f to 39f, 46f to 48f, 2f to 48f)
                }
                StoryScene.CHRISTMAS_COOKIES -> {
                    tile(p.blush); box(4f, 15f, 40f, 29f, p.cocoa, 4f)
                    dot(15f, 25f, 8f, p.gold); dot(33f, 32f, 8f, p.gold)
                    listOf(12f to 23f, 18f to 27f, 33f to 28f, 36f to 34f).forEach { (x, y) ->
                        dot(x, y, 1.6f, p.cranberry)
                    }
                    box(9f, 4f, 30f, 7f, p.paper)
                    line(12f, 8f, 35f, 8f, p.gold, 1.5f)
                }
                StoryScene.HOLIDAY_PARADE -> {
                    tile(p.sky); line(3f, 6f, 45f, 6f, p.cocoa, 1f)
                    listOf(7f, 19f, 31f, 43f).forEach { x ->
                        shape(p.cranberry, x to 6f, (x + 4f) to 6f, (x + 2f) to 13f)
                    }
                    box(6f, 26f, 35f, 12f, p.gold)
                    dot(13f, 39f, 4f, p.ink); dot(35f, 39f, 4f, p.ink)
                    person(15f, 13f, p.cranberry); person(30f, 13f, p.evergreen)
                    dot(41f, 17f, 3f, p.gold)
                }
                StoryScene.FESTIVE_MARKET -> {
                    tile(p.sky); box(5f, 21f, 38f, 23f, p.paper)
                    shape(p.cranberry, 3f to 21f, 10f to 12f, 38f to 12f, 45f to 21f)
                    listOf(9f, 20f, 31f).forEach { x -> box(x, 22f, 8f, 6f, p.gold) }
                    box(11f, 32f, 27f, 8f, p.cocoa)
                    dot(17f, 31f, 4f, p.evergreen); dot(30f, 31f, 4f, p.cranberry)
                    dot(39f, 8f, 4f, p.gold)
                }
                StoryScene.CHRISTMAS_WISH -> {
                    tile(p.blue); box(6f, 9f, 36f, 34f, p.paper, 4f)
                    box(10f, 13f, 28f, 26f, p.sky)
                    dot(24f, 22f, 9f, p.gold)
                    shape(p.paper, 24f to 7f, 27f to 17f, 38f to 21f,
                        27f to 25f, 24f to 36f, 21f to 25f, 10f to 21f, 21f to 17f)
                    person(16f, 28f, p.cranberry)
                }
                StoryScene.COZY_FIREPLACE -> {
                    tile(p.blush); box(6f, 13f, 36f, 31f, p.cocoa, 3f)
                    box(12f, 20f, 24f, 24f, p.ink, 5f)
                    shape(p.cranberry, 17f to 41f, 17f to 30f, 25f to 22f,
                        31f to 33f, 31f to 41f)
                    shape(p.gold, 22f to 41f, 22f to 34f, 26f to 30f, 29f to 41f)
                    box(3f, 10f, 42f, 5f, p.paper)
                    box(33f, 4f, 7f, 6f, p.evergreen)
                }
                StoryScene.HOLIDAY_TRADITION -> {
                    tile(p.sky); box(7f, 12f, 34f, 31f, p.paper)
                    box(11f, 16f, 26f, 23f, p.cranberry)
                    box(14f, 19f, 20f, 17f, p.paper)
                    line(24f, 21f, 24f, 34f, p.gold, 2f)
                    heart(24f, 27f, .5f)
                    dot(9f, 7f, 3f, p.gold); dot(39f, 7f, 3f, p.gold)
                    line(9f, 7f, 39f, 7f, p.evergreen, 1.5f)
                }


                // Fall: distinctive harvest scenes rather than a shared pumpkin glyph.
                StoryScene.PUMPKIN_PATCH -> {
                    tile(p.sky); line(2f, 34f, 46f, 34f, p.evergreen, 3f)
                    listOf(11f to 30f, 27f to 34f, 39f to 29f).forEach { (x, y) ->
                        oval(x - 8f, y - 7f, 16f, 13f, p.gold)
                        line(x, y - 8f, x + 2f, y - 12f, p.evergreen, 2f)
                    }
                    tree(5f, 20f, 15f)
                    dot(39f, 8f, 6f, p.gold)
                }
                StoryScene.AUTUMN_FESTIVAL -> {
                    tile(p.blush); shape(p.gold, 3f to 25f, 24f to 12f, 45f to 25f)
                    box(6f, 25f, 36f, 19f, p.paper)
                    line(4f, 6f, 44f, 6f, p.cocoa, 1f)
                    listOf(9f, 19f, 29f, 39f).forEach { x ->
                        shape(p.cranberry, x to 6f, (x + 6f) to 6f, (x + 3f) to 13f)
                    }
                    person(14f, 28f, p.evergreen); person(34f, 28f, p.blue)
                    dot(24f, 37f, 4f, p.gold)
                }
                StoryScene.HAYRIDE -> {
                    tile(p.sky); box(5f, 24f, 34f, 14f, p.cocoa)
                    listOf(8f, 18f, 28f).forEach { x -> box(x, 21f, 9f, 11f, p.gold) }
                    dot(12f, 40f, 5f, p.ink); dot(33f, 40f, 5f, p.ink)
                    person(16f, 13f, p.cranberry); person(29f, 13f, p.evergreen)
                    line(39f, 30f, 46f, 28f, p.cocoa, 2f)
                    dot(43f, 8f, 4f, p.gold)
                }
                StoryScene.HARVEST_MARKET -> {
                    tile(p.blush); box(4f, 18f, 40f, 26f, p.paper)
                    shape(p.evergreen, 2f to 18f, 9f to 9f, 39f to 9f, 46f to 18f)
                    box(8f, 28f, 32f, 10f, p.cocoa)
                    listOf(14f, 24f, 34f).forEachIndexed { i, x ->
                        dot(x, 27f, 5f, if (i == 1) p.cranberry else p.gold)
                    }
                    box(13f, 5f, 22f, 5f, p.gold)
                }
                StoryScene.PIE_CONTEST -> {
                    tile(p.sky); oval(4f, 23f, 40f, 19f, p.cocoa)
                    oval(7f, 20f, 34f, 17f, p.gold)
                    listOf(13f, 22f, 31f).forEach { x ->
                        line(x, 23f, x + 5f, 32f, p.cranberry, 2f)
                    }
                    box(17f, 5f, 14f, 13f, p.paper)
                    dot(24f, 8f, 4f, p.gold)
                    line(24f, 12f, 24f, 17f, p.cranberry, 2f)
                }
                StoryScene.COZY_SWEATER -> {
                    tile(p.blush)
                    shape(p.evergreen, 13f to 8f, 20f to 5f, 28f to 5f, 35f to 8f,
                        45f to 20f, 39f to 28f, 34f to 23f, 34f to 43f,
                        14f to 43f, 14f to 23f, 9f to 28f, 3f to 20f)
                    box(15f, 22f, 18f, 4f, p.paper)
                    listOf(19f, 25f, 31f).forEach { x -> dot(x, 32f, 2f, p.gold) }
                    heart(24f, 17f, .55f, p.cranberry)
                }
                StoryScene.FALLING_LEAVES -> {
                    tile(p.sky); tree(24f, 39f, 31f)
                    listOf(5f to 9f, 41f to 14f, 9f to 30f, 36f to 34f, 25f to 5f).forEachIndexed { i, (x, y) ->
                        oval(x, y, 7f, 4f, if (i % 2 == 0) p.gold else p.cranberry)
                        line(x + 2f, y + 3f, x + 7f, y + 7f, p.cocoa, 1f)
                    }
                    line(3f, 44f, 45f, 44f, p.cocoa, 2f)
                }
                StoryScene.APPLE_ORCHARD -> {
                    tile(p.sky); tree(15f, 35f, 30f); tree(39f, 35f, 24f)
                    listOf(10f to 18f, 19f to 25f, 36f to 20f, 43f to 28f).forEach { (x, y) ->
                        dot(x, y, 3f, p.cranberry)
                    }
                    box(19f, 34f, 15f, 10f, p.cocoa)
                    line(22f, 34f, 25f, 29f, p.gold, 2f)
                    line(25f, 29f, 30f, 34f, p.gold, 2f)
                }
                StoryScene.BONFIRE -> {
                    tile(p.blue); line(3f, 42f, 45f, 42f, p.cocoa, 2f)
                    line(13f, 40f, 36f, 33f, p.cocoa, 5f)
                    line(35f, 40f, 14f, 33f, p.cocoa, 5f)
                    shape(p.cranberry, 15f to 33f, 17f to 19f, 23f to 27f,
                        30f to 10f, 35f to 34f)
                    shape(p.gold, 21f to 35f, 24f to 23f, 30f to 35f)
                    dot(8f, 10f, 2f, p.gold); dot(42f, 16f, 2f, p.gold)
                }
                StoryScene.FALL_FUNDRAISER -> {
                    tile(p.blush); box(6f, 17f, 36f, 27f, p.paper)
                    box(10f, 22f, 28f, 16f, p.evergreen)
                    heart(24f, 30f, .65f, p.gold)
                    oval(2f, 7f, 13f, 7f, p.gold)
                    oval(33f, 6f, 13f, 7f, p.cranberry)
                    line(9f, 14f, 14f, 20f, p.cocoa, 2f)
                    line(39f, 13f, 34f, 20f, p.cocoa, 2f)
                }
                StoryScene.PUMPKIN_CARVING -> {
                    tile(p.blush); oval(4f, 16f, 40f, 28f, p.gold)
                    line(24f, 16f, 26f, 10f, p.evergreen, 3f)
                    shape(p.ink, 10f to 27f, 16f to 22f, 19f to 29f)
                    shape(p.ink, 29f to 29f, 32f to 22f, 38f to 27f)
                    shape(p.ink, 14f to 34f, 24f to 38f, 35f to 34f, 30f to 42f, 18f to 42f)
                    dot(41f, 8f, 3f, p.paper)
                }
                StoryScene.FOLIAGE_DRIVE -> {
                    tile(p.sky); tree(8f, 25f, 21f); tree(42f, 26f, 23f)
                    shape(p.gold, 17f to 48f, 21f to 29f, 28f to 29f, 34f to 48f)
                    box(10f, 28f, 28f, 12f, p.cranberry, 4f)
                    box(16f, 23f, 16f, 9f, p.paper)
                    dot(16f, 40f, 5f, p.ink); dot(33f, 40f, 5f, p.ink)
                    dot(24f, 8f, 5f, p.gold)
                }


                // Horror: original cozy-gothic mini-scenes, not neon or repeated symbols.
                StoryScene.CREAKING_DOOR -> {
                    tile(p.blue); box(8f, 4f, 32f, 42f, p.cocoa)
                    shape(p.ink, 15f to 8f, 32f to 4f, 32f to 43f, 15f to 40f)
                    dot(27f, 26f, 2f, p.gold)
                    line(33f, 10f, 41f, 5f, p.paper, 2f)
                    line(33f, 20f, 45f, 20f, p.paper, 1.5f)
                    dot(5f, 8f, 3f, p.gold)
                }
                StoryScene.OMINOUS_SHADOW -> {
                    tile(p.blue); dot(37f, 10f, 8f, p.gold)
                    shape(p.ink, 3f to 44f, 14f to 25f, 20f to 11f,
                        27f to 22f, 40f to 44f)
                    box(2f, 43f, 44f, 5f, p.cocoa)
                    dot(19f, 16f, 2f, p.paper)
                    dot(27f, 16f, 2f, p.paper)
                }
                StoryScene.SUDDEN_SCREAM -> {
                    tile(p.blush); dot(24f, 20f, 15f, p.paper)
                    dot(19f, 17f, 2.4f, p.ink); dot(29f, 17f, 2.4f, p.ink)
                    oval(20f, 24f, 8f, 11f, p.ink)
                    line(9f, 11f, 4f, 5f, p.cranberry, 2f)
                    line(39f, 11f, 44f, 5f, p.cranberry, 2f)
                    line(24f, 3f, 24f, 0f, p.cranberry, 2f)
                    line(5f, 38f, 14f, 34f, p.gold, 2f)
                }
                StoryScene.FLASHLIGHT_FAILS -> {
                    tile(p.blue); box(7f, 22f, 21f, 10f, p.cocoa, 4f)
                    box(25f, 20f, 9f, 14f, p.gold)
                    shape(p.paper, 34f to 20f, 46f to 12f, 46f to 42f, 34f to 34f)
                    line(35f, 15f, 43f, 9f, p.cranberry, 3f)
                    line(43f, 15f, 35f, 9f, p.cranberry, 3f)
                    dot(12f, 9f, 2f, p.gold)
                }
                StoryScene.STRANGE_NOISE -> {
                    tile(p.sky); box(5f, 11f, 24f, 31f, p.cocoa)
                    box(9f, 15f, 16f, 23f, p.paper)
                    dot(17f, 25f, 5f, p.gold)
                    line(31f, 12f, 37f, 8f, p.cranberry, 2f)
                    line(32f, 21f, 43f, 21f, p.cranberry, 2f)
                    line(31f, 30f, 37f, 34f, p.cranberry, 2f)
                    dot(40f, 21f, 2f, p.ink)
                }
                StoryScene.CREEPY_HALLWAY -> {
                    tile(p.blue); shape(p.ink, 3f to 2f, 45f to 2f, 31f to 46f, 17f to 46f)
                    shape(p.paper, 16f to 8f, 32f to 8f, 29f to 33f, 19f to 33f)
                    box(21f, 18f, 6f, 15f, p.cocoa)
                    line(3f, 45f, 17f, 33f, p.gold, 1.5f)
                    line(45f, 45f, 31f, 33f, p.gold, 1.5f)
                    dot(27f, 25f, 1f, p.gold)
                }
                StoryScene.MYSTERIOUS_WARNING -> {
                    tile(p.blush); box(7f, 5f, 34f, 38f, p.paper)
                    line(13f, 12f, 35f, 12f, p.cocoa, 2f)
                    line(13f, 18f, 30f, 18f, p.cocoa, 2f)
                    shape(p.cranberry, 24f to 22f, 12f to 39f, 36f to 39f)
                    line(24f, 28f, 24f, 34f, p.paper, 2.5f)
                    dot(24f, 37f, 1.5f, p.paper)
                    dot(39f, 8f, 4f, p.gold)
                }
                StoryScene.JUMP_SCARE -> {
                    tile(p.blue); box(5f, 6f, 38f, 36f, p.paper)
                    box(10f, 10f, 28f, 29f, p.ink)
                    dot(17f, 21f, 3f, p.gold); dot(31f, 21f, 3f, p.gold)
                    shape(p.paper, 16f to 30f, 24f to 36f, 32f to 30f)
                    line(4f, 4f, 11f, 12f, p.cranberry, 3f)
                    line(44f, 4f, 37f, 12f, p.cranberry, 3f)
                    line(24f, 0f, 24f, 7f, p.cranberry, 3f)
                }
                StoryScene.EERIE_PHONE_CALL -> {
                    tile(p.blush); box(9f, 5f, 30f, 38f, p.ink, 5f)
                    box(13f, 10f, 22f, 24f, p.blue)
                    shape(p.paper, 18f to 29f, 24f to 17f, 30f to 29f)
                    dot(24f, 38f, 2f, p.gold)
                    line(2f, 15f, 7f, 12f, p.cranberry, 2f)
                    line(41f, 12f, 46f, 15f, p.cranberry, 2f)
                    dot(24f, 6f, 1f, p.paper)
                }
                StoryScene.LOCKED_DOOR -> {
                    tile(p.sky); box(6f, 4f, 36f, 42f, p.cocoa)
                    box(11f, 9f, 26f, 31f, p.evergreen)
                    box(18f, 24f, 15f, 13f, p.gold, 3f)
                    oval(22f, 16f, 7f, 12f, p.paper)
                    oval(24f, 19f, 3f, 7f, p.ink)
                    dot(26f, 31f, 2f, p.ink)
                    dot(39f, 20f, 2f, p.gold)
                }
                StoryScene.ABANDONED_HOUSE -> {
                    tile(p.blue); box(7f, 22f, 34f, 23f, p.cocoa)
                    shape(p.ink, 4f to 22f, 24f to 5f, 44f to 22f)
                    box(13f, 26f, 8f, 8f, p.gold)
                    box(28f, 26f, 8f, 8f, p.paper)
                    box(22f, 34f, 8f, 11f, p.ink)
                    tree(4f, 43f, 19f); tree(44f, 43f, 17f)
                    dot(39f, 7f, 4f, p.paper)
                }
                StoryScene.FINAL_REVEAL -> {
                    tile(p.blush); box(5f, 6f, 38f, 37f, p.paper)
                    shape(p.cranberry, 5f to 6f, 21f to 6f, 15f to 43f, 5f to 43f)
                    shape(p.cranberry, 27f to 6f, 43f to 6f, 43f to 43f, 33f to 43f)
                    dot(24f, 23f, 11f, p.gold)
                    person(24f, 19f, p.evergreen)
                    heart(24f, 11f, .4f, p.cranberry)
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
