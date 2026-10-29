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
                    // Two people reconnect on the same park bench beneath autumn trees.
                    tile(p.sky)
                    tree(6f, 30f, 18f); tree(43f, 30f, 18f)
                    dot(9f, 36f, 2.2f, p.gold); dot(39f, 38f, 2f, p.cranberry)
                    box(11f, 31f, 27f, 4f, p.cocoa, 1f)
                    line(14f, 35f, 14f, 43f, p.ink, 2f)
                    line(35f, 35f, 35f, 43f, p.ink, 2f)
                    person(19f, 20f, p.cranberry); person(30f, 20f, p.blue)
                    line(23f, 31f, 26f, 31f, p.skin, 2.5f)
                    heart(24.5f, 10f, .38f)
                }
                StoryScene.CHANGED_PLANS -> {
                    // Crossed-out calendar, fresh ticket and packed suitcase.
                    tile(p.blush)
                    box(3f, 5f, 29f, 32f, p.paper)
                    box(3f, 5f, 29f, 8f, p.cranberry)
                    dot(9f, 7f, 1.5f, p.gold); dot(26f, 7f, 1.5f, p.gold)
                    line(9f, 18f, 25f, 18f, p.blue, 1.2f)
                    line(9f, 23f, 25f, 23f, p.blue, 1.2f)
                    line(11f, 18f, 25f, 31f, p.cranberry, 2.6f)
                    line(25f, 18f, 11f, 31f, p.cranberry, 2.6f)
                    box(26f, 29f, 19f, 15f, p.cocoa, 2.5f)
                    box(32f, 25f, 7f, 5f, p.gold, 1f)
                    line(35.5f, 32f, 35.5f, 40f, p.gold, 1.4f)
                    dot(30f, 44f, 1.5f, p.ink); dot(41f, 44f, 1.5f, p.ink)
                }
                StoryScene.AWKWARD_DATE -> {
                    // Candlelit dinner goes wrong: a tipped glass spills across the table.
                    tile(p.blush)
                    person(10f, 12f, p.blue); person(39f, 12f, p.cranberry)
                    box(7f, 31f, 34f, 5f, p.cocoa, 1f)
                    line(12f, 36f, 12f, 44f); line(36f, 36f, 36f, 44f)
                    oval(11f, 27f, 12f, 3f, p.paper)
                    box(23f, 22f, 2.5f, 9f, p.gold, 1f)
                    dot(24f, 19f, 2f, p.cranberry)
                    // Tilted glass and a bright, unmistakable spill.
                    line(32f, 23f, 38f, 28f, p.blue, 2f)
                    line(34f, 20f, 39f, 24f, p.paper, 2.3f)
                    oval(29f, 29f, 12f, 3.5f, p.cranberry)
                    dot(42f, 32f, 1.5f, p.cranberry)
                }
                StoryScene.HEARTFELT_APOLOGY -> {
                    // A doorstep apology: flowers held out toward the warmly lit home.
                    tile(p.sky); cottage(3f, 13f)
                    person(37f, 19f, p.blue)
                    line(32f, 31f, 26f, 27f, p.skin, 2.7f)
                    line(26f, 28f, 23f, 21f, p.evergreen, 1.8f)
                    line(26f, 28f, 29f, 20f, p.evergreen, 1.8f)
                    dot(22f, 20f, 3.3f, p.cranberry)
                    dot(29f, 19f, 3f, p.gold)
                    dot(26f, 17f, 2.5f, p.cranberry)
                    dot(26f, 27f, 2f, p.paper)
                    heart(39f, 10f, .32f, p.gold)
                }
                StoryScene.SURPRISE_VISITOR -> {
                    // Open door, surprised host and guest arriving with a suitcase.
                    tile(p.blush)
                    box(3f, 6f, 27f, 40f, p.paper)
                    box(7f, 11f, 19f, 35f, p.cocoa)
                    box(9f, 14f, 15f, 30f, p.sky)
                    person(16f, 20f, p.cranberry)
                    line(25f, 12f, 29f, 17f, p.gold, 1.8f)
                    dot(27f, 27f, 1.5f, p.gold)
                    person(38f, 18f, p.evergreen)
                    box(30f, 34f, 16f, 10f, p.cranberry, 2f)
                    line(35f, 34f, 35f, 30f, p.cocoa, 2f)
                    line(35f, 30f, 42f, 30f, p.cocoa, 2f)
                    dot(33f, 44f, 1.3f, p.ink); dot(43f, 44f, 1.3f, p.ink)
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
                    // A neighbor brings a full grocery bag to a warmly lit doorstep.
                    tile(p.sky)
                    cottage(1f, 10f)
                    person(38f, 18f, p.evergreen)
                    // Oversized tote and visible produce make the act of helping legible.
                    box(23f, 31f, 13f, 11f, p.gold, 2f)
                    line(26f, 31f, 27f, 27f, p.cocoa, 1.8f)
                    line(27f, 27f, 33f, 27f, p.cocoa, 1.8f)
                    line(33f, 27f, 34f, 31f, p.cocoa, 1.8f)
                    dot(27f, 30f, 3f, p.cranberry)
                    dot(32f, 29f, 2.5f, p.evergreen)
                    line(34f, 30f, 30f, 33f, p.skin, 2.5f)
                    line(23f, 34f, 19f, 32f, p.skin, 2f)
                    dot(42f, 8f, 3.5f, p.gold)
                }
                StoryScene.PUBLIC_DECLARATION -> {
                    // One person speaks into a microphone before a little town crowd.
                    tile(p.blush)
                    box(4f, 4f, 40f, 8f, p.paper, 2f)
                    heart(24f, 8f, .46f)
                    box(5f, 33f, 38f, 10f, p.cocoa, 1f)
                    line(33f, 18f, 33f, 34f, p.ink, 2f)
                    line(33f, 18f, 28f, 16f, p.ink, 1.8f)
                    dot(27f, 16f, 2.2f, p.ink)
                    person(21f, 17f, p.evergreen)
                    line(25f, 27f, 30f, 23f, p.skin, 2.4f)
                    // Audience silhouettes in the foreground, not another generic heart.
                    dot(9f, 41f, 4.3f, p.ink)
                    dot(23f, 43f, 4.8f, p.cranberry)
                    dot(39f, 41f, 4.3f, p.blue)
                }
                StoryScene.SHARED_SECRET -> {
                    // Two friends lean toward a tiny folded note kept between them.
                    tile(p.sky)
                    person(13f, 17f, p.cranberry)
                    person(36f, 17f, p.blue)
                    box(19f, 28f, 11f, 10f, p.paper, 1.5f)
                    line(20f, 29f, 24.5f, 33f, p.cocoa, 1.5f)
                    line(29f, 29f, 24.5f, 33f, p.cocoa, 1.5f)
                    dot(24.5f, 34f, 2f, p.cranberry)
                    line(18f, 29f, 21f, 31f, p.skin, 2.4f)
                    line(31f, 31f, 28f, 32f, p.skin, 2.4f)
                    // Small whisper marks are secondary to the unmistakable shared note.
                    line(18f, 18f, 24f, 16f, p.gold, 1.7f)
                    dot(26f, 14f, 1.4f, p.gold)
                    dot(29f, 12f, 1f, p.gold)
                }
                StoryScene.SCENIC_WALK -> {
                    // Two walkers reconnect hand-in-hand along a winding wooded path.
                    tile(p.sky)
                    shape(p.pineHighlight.copy(alpha = .35f),
                        0f to 32f, 13f to 23f, 27f to 30f, 48f to 21f,
                        48f to 48f, 0f to 48f)
                    tree(6f, 33f, 24f); tree(43f, 32f, 21f)
                    val path = Path().apply {
                        moveTo(19f, 48f); cubicTo(10f, 38f, 36f, 37f, 25f, 26f)
                    }
                    drawPath(path, p.gold, style = Stroke(7f, cap = StrokeCap.Round))
                    person(20f, 19f, p.cranberry); person(31f, 19f, p.blue)
                    line(24f, 31f, 27f, 31f, p.skin, 2.8f)
                    dot(36f, 7f, 4f, p.gold)
                }
                StoryScene.DECORATED_TREE -> {
                    // A family member reaches to hang the last ornament on a glowing tree.
                    tile(p.blush)
                    box(3f, 7f, 14f, 21f, p.paper)
                    box(5f, 9f, 10f, 17f, p.gold.copy(alpha = .6f))
                    line(10f, 9f, 10f, 26f, p.paper, 1.2f)
                    tree(30f, 41f, 34f)
                    listOf(23f to 20f, 33f to 19f, 28f to 29f, 38f to 32f, 21f to 34f)
                        .forEachIndexed { i, (x, y) ->
                            dot(x, y, 2.5f, if (i % 2 == 0) p.cranberry else p.gold)
                        }
                    shape(p.gold, 30f to 3f, 33f to 8f, 39f to 9f,
                        34f to 13f, 35f to 18f, 30f to 15f,
                        25f to 18f, 26f to 13f, 21f to 9f, 27f to 8f)
                    person(10f, 26f, p.blue)
                    line(14f, 34f, 20f, 26f, p.skin, 2.5f)
                    dot(21f, 24f, 2.6f, p.gold)
                    box(30f, 40f, 11f, 6f, p.cranberry, 1f)
                    line(35f, 40f, 35f, 46f, p.gold, 1.5f)
                }
                StoryScene.MISSED_CALL -> {
                    // Portrait on the unanswered phone, a red missed-call alert.
                    tile(p.blush)
                    box(10f, 2f, 28f, 44f, p.ink, 5f)
                    box(13f, 7f, 22f, 32f, p.paper, 2f)
                    dot(24f, 15f, 5f, p.blue)
                    oval(17f, 20f, 14f, 7f, p.blue)
                    line(17f, 31f, 30f, 31f, p.cranberry, 2f)
                    line(27f, 28f, 30f, 31f, p.cranberry, 2f)
                    line(27f, 34f, 30f, 31f, p.cranberry, 2f)
                    dot(24f, 42f, 1.7f, p.gold)
                    dot(37f, 10f, 7f, p.cranberry)
                    dot(34f, 10f, 1.5f, p.paper)
                    dot(39f, 10f, 1.5f, p.paper)
                }
                StoryScene.GIFT_EXCHANGE -> {
                    // Two neighbors trade wrapped gifts instead of a pair of anonymous boxes.
                    tile(p.sky)
                    person(10f, 15f, p.evergreen); person(39f, 15f, p.cranberry)
                    box(15f, 28f, 16f, 13f, p.cranberry, 1.5f)
                    box(14f, 26f, 18f, 4f, p.gold, 1f)
                    line(23f, 26f, 23f, 41f, p.paper, 2f)
                    line(17f, 28f, 29f, 28f, p.paper, 1.2f)
                    line(16f, 30f, 11f, 28f, p.skin, 2.5f)
                    line(32f, 30f, 37f, 28f, p.skin, 2.5f)
                    // A second little parcel is tucked under one arm.
                    box(35f, 36f, 10f, 8f, p.gold, 1f)
                    line(40f, 36f, 40f, 44f, p.cranberry, 1.5f)
                    heart(24f, 11f, .5f)
                }
                StoryScene.FAMILY_HEIRLOOM -> {
                    // An antique locket displayed in an open wooden keepsake chest.
                    tile(p.blush)
                    box(5f, 28f, 38f, 15f, p.cocoa, 3f)
                    box(8f, 31f, 32f, 8f, p.cranberry, 2f)
                    shape(p.gold, 5f to 28f, 12f to 19f, 36f to 19f, 43f to 28f)
                    box(12f, 23f, 24f, 5f, p.paper, 1f)
                    // Chain and large oval locket stay identifiable at 30dp.
                    line(18f, 7f, 24f, 11f, p.gold, 1.5f)
                    line(30f, 7f, 24f, 11f, p.gold, 1.5f)
                    oval(16f, 10f, 16f, 18f, p.gold)
                    oval(19f, 13f, 10f, 12f, p.paper)
                    heart(24f, 18f, .38f, p.cranberry)
                    dot(24f, 35f, 1.8f, p.gold)
                }
                StoryScene.ROMANTIC_GESTURE -> {
                    // A handwritten love note and single rose offered face-to-face.
                    tile(p.sky)
                    person(9f, 18f, p.evergreen)
                    person(40f, 18f, p.cranberry)
                    box(17f, 28f, 15f, 11f, p.paper, 1.5f)
                    line(19f, 31f, 29f, 31f, p.cocoa, 1.1f)
                    line(19f, 34f, 25f, 34f, p.cocoa, 1.1f)
                    heart(28f, 36f, .28f)
                    line(15f, 30f, 18f, 32f, p.skin, 2.4f)
                    line(34f, 30f, 31f, 32f, p.skin, 2.4f)
                    line(25f, 28f, 29f, 14f, p.evergreen, 2f)
                    dot(29f, 12f, 5f, p.cranberry)
                    dot(25f, 11f, 2f, p.blush)
                    dot(32f, 9f, 2f, p.blush)
                }
                StoryScene.DANCE_TOGETHER -> {
                    // A couple dances beneath café string lights; one skirt spins.
                    tile(p.blush)
                    oval(5f, 36f, 38f, 9f, p.gold.copy(alpha = .35f))
                    line(3f, 7f, 45f, 7f, p.cocoa, 1.2f)
                    listOf(7f, 18f, 30f, 41f).forEach { dot(it, 9f, 2.5f, p.gold) }
                    person(17f, 16f, p.cranberry); person(30f, 16f, p.blue)
                    line(21f, 29f, 26f, 27f, p.skin, 2.8f)
                    shape(p.cranberry, 13f to 30f, 21f to 30f,
                        27f to 40f, 7f to 40f)
                    line(13f, 39f, 10f, 45f, p.ink, 2f)
                    line(22f, 39f, 25f, 45f, p.ink, 2f)
                    line(28f, 32f, 25f, 43f, p.ink, 2f)
                    line(33f, 32f, 39f, 43f, p.ink, 2f)
                    dot(41f, 20f, 2f, p.cocoa)
                    line(43f, 20f, 43f, 13f, p.cocoa, 1.6f)
                    line(43f, 13f, 46f, 12f, p.cocoa, 1.6f)
                }
                StoryScene.MISTLETOE -> {
                    // Two shy sweethearts meet beneath a doorway's hanging sprig.
                    tile(p.sky)
                    box(4f, 7f, 40f, 39f, p.paper, 7f)
                    box(7f, 10f, 34f, 36f, p.blush, 5f)
                    line(24f, 3f, 24f, 14f, p.cocoa, 1.5f)
                    oval(13f, 12f, 12f, 7f, p.evergreen)
                    oval(23f, 12f, 12f, 7f, p.pineHighlight)
                    dot(22f, 18f, 2.5f, p.cranberry)
                    dot(27f, 18f, 2f, p.cranberry)
                    person(18f, 25f, p.cranberry); person(30f, 25f, p.blue)
                    heart(24f, 24f, .28f, p.gold)
                    line(21f, 37f, 26f, 37f, p.skin, 2.3f)
                }
                StoryScene.COZY_CAFE -> {
                    // Warm café windows frame two people sharing a steaming cup.
                    tile(p.blush)
                    box(3f, 11f, 42f, 34f, p.paper)
                    box(5f, 18f, 38f, 22f, p.gold)
                    box(7f, 20f, 34f, 18f, p.sky)
                    box(3f, 9f, 42f, 10f, p.cranberry)
                    listOf(8f, 18f, 28f, 38f).forEach { x ->
                        box(x, 9f, 5f, 10f, p.paper, 1f)
                    }
                    person(14f, 23f, p.evergreen); person(34f, 23f, p.blue)
                    oval(17f, 36f, 14f, 4f, p.cocoa)
                    box(21f, 30f, 7f, 6f, p.paper, 1.5f)
                    line(23f, 24f, 22f, 28f, p.paper, 1.1f)
                    line(27f, 23f, 26f, 28f, p.paper, 1.1f)
                    dot(24f, 5f, 2f, p.gold)
                }
                StoryScene.HOMETOWN_REUNION -> {
                    // A homecoming hug outside a familiar house with welcome bunting.
                    tile(p.sky)
                    cottage(2f, 10f)
                    line(2f, 5f, 46f, 5f, p.cocoa, 1.5f)
                    shape(p.cranberry, 8f to 5f, 13f to 5f, 10.5f to 12f)
                    shape(p.gold, 19f to 5f, 24f to 5f, 21.5f to 12f)
                    shape(p.evergreen, 32f to 5f, 37f to 5f, 34.5f to 12f)
                    person(32f, 21f, p.cranberry)
                    person(41f, 21f, p.blue)
                    line(34f, 31f, 39f, 31f, p.skin, 3f)
                    heart(37f, 16f, .38f, p.gold)
                    oval(27f, 41f, 20f, 4f, p.gold)
                }
                StoryScene.GRAND_GESTURE -> {
                    // An enormous bouquet of heart balloons and an offered flower.
                    tile(p.blush)
                    person(12f, 23f, p.evergreen)
                    line(17f, 33f, 24f, 29f, p.skin, 2.7f)
                    line(24f, 30f, 26f, 22f, p.evergreen, 1.8f)
                    dot(26f, 21f, 4f, p.cranberry)
                    // The oversized balloon bouquet is the focal point.
                    heart(32f, 13f, 1.05f, p.cranberry)
                    dot(40f, 10f, 5f, p.gold)
                    dot(24f, 7f, 4.5f, p.blue)
                    dot(40f, 24f, 4.3f, p.evergreen)
                    line(32f, 19f, 32f, 39f, p.cocoa, 1.1f)
                    line(40f, 15f, 32f, 39f, p.cocoa, 1.1f)
                    line(24f, 11f, 32f, 39f, p.cocoa, 1.1f)
                    line(40f, 28f, 32f, 39f, p.cocoa, 1.1f)
                    box(29f, 38f, 6f, 4f, p.gold, 1f)
                }
                StoryScene.COMMUNITY_FUNDRAISER -> {
                    // A little town charity booth with a large donation box and visitors.
                    tile(p.sky)
                    shape(p.cranberry, 4f to 17f, 12f to 8f, 36f to 8f, 44f to 17f)
                    box(5f, 17f, 38f, 5f, p.paper, 1f)
                    listOf(9f, 19f, 29f, 39f).forEach {
                        box(it, 17f, 5f, 5f, p.gold, 1f)
                    }
                    line(7f, 22f, 7f, 43f, p.cocoa, 2f)
                    line(41f, 22f, 41f, 43f, p.cocoa, 2f)
                    box(17f, 27f, 15f, 15f, p.gold, 2f)
                    box(20f, 27f, 9f, 2f, p.cocoa, .5f)
                    heart(24.5f, 35f, .6f)
                    person(8f, 28f, p.blue)
                    person(40f, 28f, p.evergreen)
                    dot(35f, 25f, 2.3f, p.gold)
                    line(35f, 24f, 29f, 30f, p.skin, 2f)
                }
                StoryScene.SURPRISE_INVITATION -> {
                    // A gold-trimmed party invitation pops out of an opened envelope.
                    tile(p.sky)
                    box(6f, 19f, 36f, 25f, p.cranberry, 3f)
                    box(12f, 7f, 24f, 27f, p.paper, 2f)
                    box(14f, 9f, 20f, 3f, p.gold, 1f)
                    heart(24f, 17f, .45f)
                    line(17f, 26f, 31f, 26f, p.cocoa, 1.2f)
                    line(19f, 29f, 29f, 29f, p.cocoa, 1.2f)
                    shape(p.paper, 7f to 25f, 24f to 38f, 41f to 25f,
                        41f to 43f, 7f to 43f)
                    line(7f, 43f, 20f, 33f, p.gold, 1.3f)
                    line(41f, 43f, 28f, 33f, p.gold, 1.3f)
                    dot(39f, 8f, 2.2f, p.gold)
                    dot(6f, 11f, 1.7f, p.cranberry)
                }
                StoryScene.FIRST_MEETING -> {
                    // Two strangers reach for the same book in a small-town bookshop.
                    tile(p.sky)
                    box(3f, 5f, 12f, 38f, p.cocoa, 1f)
                    listOf(9f, 17f, 25f, 33f).forEach { y ->
                        box(5f, y, 8f, 5f, if (y == 17f) p.gold else p.paper, 1f)
                    }
                    person(22f, 17f, p.cranberry)
                    person(39f, 17f, p.evergreen)
                    box(27f, 29f, 8f, 10f, p.gold, 1f)
                    line(31f, 29f, 31f, 39f, p.paper, 1.2f)
                    line(26f, 29f, 29f, 32f, p.skin, 2.3f)
                    line(36f, 29f, 33f, 32f, p.skin, 2.3f)
                    // A little fallen book and surprised spark sell the meet-cute.
                    box(17f, 41f, 13f, 3f, p.blue, 1f)
                    heart(31f, 11f, .35f)
                }
                StoryScene.MISUNDERSTANDING -> {
                    // Crossed messages leave two neighbors talking past one another.
                    tile(p.blush)
                    box(20f, 27f, 8f, 15f, p.cocoa, 1f)
                    box(18f, 23f, 12f, 7f, p.blue, 1f)
                    line(24f, 30f, 24f, 41f, p.ink, 1.3f)
                    person(10f, 23f, p.blue); person(38f, 23f, p.cranberry)
                    // Opposing speech balloons and the misplaced invitation.
                    box(2f, 4f, 18f, 12f, p.paper, 4f)
                    shape(p.paper, 13f to 14f, 18f to 14f, 17f to 20f)
                    box(28f, 4f, 18f, 12f, p.paper, 4f)
                    shape(p.paper, 30f to 14f, 35f to 14f, 31f to 20f)
                    line(6f, 9f, 16f, 9f, p.blue, 1.4f)
                    line(32f, 9f, 42f, 9f, p.cranberry, 1.4f)
                    line(7f, 12f, 14f, 12f, p.blue, 1f)
                    line(34f, 12f, 41f, 12f, p.cranberry, 1f)
                    // A letter sits undelivered between them.
                    box(20f, 25f, 8f, 5f, p.paper, .7f)
                    line(20f, 25f, 24f, 28f, p.cranberry, .9f)
                    line(28f, 25f, 24f, 28f, p.cranberry, .9f)
                }
                StoryScene.ALMOST_KISS -> {
                    // Two people lean together under porch lanterns; a doorbell interrupts.
                    tile(p.blush)
                    box(3f, 28f, 42f, 15f, p.paper, 1f)
                    line(3f, 28f, 45f, 28f, p.cocoa, 2f)
                    line(5f, 5f, 43f, 5f, p.cocoa, 1.4f)
                    line(9f, 5f, 9f, 10f, p.cocoa, 1f)
                    line(39f, 5f, 39f, 10f, p.cocoa, 1f)
                    dot(9f, 11f, 3f, p.gold); dot(39f, 11f, 3f, p.gold)
                    person(17f, 20f, p.cranberry); person(31f, 20f, p.blue)
                    line(20f, 29f, 24f, 28f, p.skin, 2.5f)
                    line(28f, 29f, 24f, 28f, p.skin, 2.5f)
                    heart(24f, 17f, .25f, p.gold)
                    // Ringing bell at the edge of the porch.
                    box(39f, 30f, 6f, 8f, p.evergreen, 1f)
                    dot(42f, 34f, 1.5f, p.gold)
                    line(37f, 31f, 35f, 29f, p.cranberry, 1f)
                    line(45f, 29f, 47f, 27f, p.cranberry, 1f)
                }
                StoryScene.BIG_CONFESSION -> {
                    // A nervous doorstep confession with a handwritten letter.
                    tile(p.sky)
                    cottage(2f, 14f)
                    box(26f, 35f, 20f, 8f, p.gold, 1f)
                    person(33f, 21f, p.cranberry)
                    // A folded note is held toward the person in the doorway.
                    box(18f, 26f, 11f, 8f, p.paper, 1f)
                    line(19f, 27f, 23.5f, 31f, p.cocoa, 1.1f)
                    line(28f, 27f, 23.5f, 31f, p.cocoa, 1.1f)
                    line(29f, 31f, 32f, 31f, p.skin, 2.2f)
                    heart(39f, 10f, .5f, p.cranberry)
                    dot(43f, 6f, 1.3f, p.gold)
                    dot(45f, 12f, 1.1f, p.gold)
                }
                StoryScene.TOWN_FESTIVAL -> {
                    // Main-street fair: bunting, a bright stall and a tiny Ferris wheel.
                    tile(p.sky)
                    line(1f, 6f, 47f, 6f, p.cocoa, 1.3f)
                    listOf(5f, 14f, 23f, 32f, 41f).forEachIndexed { i, x ->
                        shape(if (i % 2 == 0) p.cranberry else p.gold,
                            x to 6f, (x + 6f) to 6f, (x + 3f) to 13f)
                    }
                    drawCircle(p.blue, radius = 9f, center = Offset(11f, 25f), style = Stroke(1.6f))
                    line(11f, 16f, 11f, 34f, p.blue, 1.1f)
                    line(2f, 25f, 20f, 25f, p.blue, 1.1f)
                    line(5f, 19f, 17f, 31f, p.blue, 1f)
                    line(17f, 19f, 5f, 31f, p.blue, 1f)
                    line(11f, 25f, 6f, 43f, p.cocoa, 1.5f)
                    line(11f, 25f, 17f, 43f, p.cocoa, 1.5f)
                    shape(p.cranberry, 23f to 25f, 35f to 16f, 47f to 25f)
                    box(25f, 25f, 20f, 17f, p.paper)
                    box(27f, 28f, 16f, 6f, p.gold, 1f)
                    line(27f, 37f, 43f, 37f, p.cocoa, 2f)
                    person(25f, 35f, p.evergreen); person(43f, 35f, p.cranberry)
                }
                StoryScene.FAMILY_SECRET -> {
                    // An old family portrait hides a sealed letter and a brass key.
                    tile(p.blush)
                    box(3f, 5f, 28f, 35f, p.cocoa, 1.5f)
                    box(6f, 8f, 22f, 29f, p.gold, 1f)
                    box(8f, 10f, 18f, 25f, p.paper, 1f)
                    dot(17f, 18f, 5f, p.ink)
                    dot(17f, 19f, 3.5f, p.skin)
                    oval(10f, 23f, 14f, 10f, p.evergreen)
                    // A note slides out from behind the frame.
                    box(27f, 19f, 17f, 17f, p.paper, 1f)
                    line(29f, 23f, 42f, 23f, p.cocoa, 1f)
                    line(29f, 27f, 39f, 27f, p.cocoa, 1f)
                    heart(37f, 32f, .3f, p.cranberry)
                    // Key and lock at the bottom of the portrait.
                    dot(34f, 40f, 3.2f, p.gold)
                    dot(34f, 40f, 1.3f, p.blush)
                    line(37f, 40f, 45f, 40f, p.gold, 2f)
                    line(43f, 40f, 43f, 44f, p.gold, 1.5f)
                }
                StoryScene.CAREER_DILEMMA -> {
                    // One choice leads to the city office; the other, home.
                    tile(p.sky)
                    box(2f, 9f, 17f, 24f, p.blue, 1f)
                    listOf(5f, 11f).forEach { x ->
                        box(x, 13f, 4f, 5f, p.paper, .5f)
                        box(x, 22f, 4f, 5f, p.paper, .5f)
                    }
                    cottage(27f, 7f)
                    // A forked path and a traveler holding a briefcase.
                    shape(p.paper, 21f to 46f, 23f to 30f, 25f to 46f)
                    line(23f, 36f, 10f, 40f, p.gold, 2f)
                    line(23f, 36f, 39f, 40f, p.gold, 2f)
                    person(23f, 24f, p.cranberry)
                    box(28f, 36f, 8f, 6f, p.cocoa, 1f)
                    box(30f, 33f, 4f, 4f, p.gold, .7f)
                    line(27f, 35f, 29f, 38f, p.skin, 1.8f)
                }
                StoryScene.SENTIMENTAL_GIFT -> {
                    // An open gift box reveals a framed photograph, not generic jewelry.
                    tile(p.blush)
                    box(5f, 29f, 38f, 14f, p.cranberry, 2f)
                    box(7f, 26f, 34f, 6f, p.gold, 1f)
                    line(24f, 29f, 24f, 43f, p.paper, 2f)
                    // A portrait frame makes the keepsake personal.
                    box(13f, 6f, 22f, 24f, p.cocoa, 2f)
                    box(16f, 9f, 16f, 18f, p.paper, 1f)
                    dot(24f, 15f, 4f, p.skin)
                    oval(19f, 18f, 10f, 8f, p.evergreen)
                    heart(33f, 9f, .35f, p.gold)
                    // Loose ribbon curling from the opened lid.
                    line(7f, 26f, 4f, 19f, p.gold, 2f)
                    line(41f, 26f, 44f, 19f, p.gold, 2f)
                }
                StoryScene.MEDDLING_RELATIVE -> {
                    // A matchmaking aunt peeks through curtains while arranging a date.
                    tile(p.sky)
                    box(2f, 5f, 25f, 38f, p.paper)
                    box(5f, 9f, 19f, 27f, p.blue)
                    // Open curtains frame the very unsubtle family observer.
                    shape(p.cranberry, 5f to 9f, 11f to 9f, 8f to 34f, 5f to 36f)
                    shape(p.cranberry, 18f to 9f, 24f to 9f, 24f to 36f, 21f to 34f)
                    person(15f, 19f, p.gold)
                    line(15f, 30f, 23f, 34f, p.skin, 2f)
                    // A heart-stamped invitation in the aunt's hand.
                    box(19f, 30f, 11f, 9f, p.paper, 1f)
                    heart(24.5f, 34f, .35f)
                    person(35f, 24f, p.evergreen)
                    person(44f, 24f, p.cranberry)
                    line(37f, 35f, 42f, 35f, p.skin, 2f)
                    dot(39f, 13f, 3f, p.gold)
                }
                StoryScene.ROMANTIC_RIVAL -> {
                    // Two would-be suitors arrive with competing bouquets.
                    tile(p.blush)
                    box(3f, 35f, 42f, 9f, p.paper)
                    person(9f, 20f, p.evergreen)
                    person(24f, 15f, p.gold)
                    person(40f, 20f, p.blue)
                    // Both bouquets are offered toward the same surprised person.
                    line(14f, 32f, 20f, 28f, p.skin, 2.3f)
                    line(35f, 32f, 28f, 28f, p.skin, 2.3f)
                    line(19f, 29f, 18f, 20f, p.evergreen, 1.5f)
                    line(30f, 29f, 32f, 20f, p.evergreen, 1.5f)
                    dot(18f, 19f, 4f, p.cranberry)
                    dot(32f, 19f, 4f, p.gold)
                    dot(14f, 21f, 2f, p.gold)
                    dot(36f, 20f, 2f, p.cranberry)
                    // A tiny question mark conveys the romantic predicament.
                    dot(24f, 5f, 2.5f, p.ink)
                    line(24f, 7f, 26f, 9f, p.ink, 1.5f)
                    dot(26f, 12f, 1f, p.ink)
                }
                StoryScene.LAST_MINUTE_ARRIVAL -> {
                    // The last bus pulls in as a traveler rushes to the reunion.
                    tile(p.sky)
                    box(2f, 14f, 30f, 23f, p.blue, 3f)
                    box(5f, 18f, 9f, 10f, p.paper)
                    box(17f, 18f, 9f, 10f, p.paper)
                    line(3f, 30f, 30f, 30f, p.gold, 1.6f)
                    dot(9f, 37f, 4f, p.ink); dot(26f, 37f, 4f, p.ink)
                    // The open bus door and luggage distinguish this from a parked vehicle.
                    box(28f, 22f, 5f, 15f, p.cocoa, 1f)
                    line(30f, 23f, 30f, 35f, p.gold, 1f)
                    person(40f, 19f, p.cranberry)
                    box(32f, 34f, 14f, 10f, p.cocoa, 2f)
                    line(36f, 34f, 36f, 30f, p.gold, 1.6f)
                    line(36f, 30f, 42f, 30f, p.gold, 1.6f)
                    dot(35f, 44f, 1.4f, p.ink); dot(43f, 44f, 1.4f, p.ink)
                    // Almost midnight: clock hands crowd the top-right.
                    dot(40f, 8f, 6f, p.paper)
                    drawCircle(p.ink, 6f, Offset(40f, 8f), style = Stroke(1.3f))
                    line(40f, 8f, 40f, 3.5f, p.ink, 1.3f)
                    line(40f, 8f, 43f, 6f, p.ink, 1.3f)
                }
                StoryScene.UNEXPECTED_KISS -> {
                    // A spontaneous kiss beneath one umbrella in the rain.
                    tile(p.blue)
                    // Umbrella canopy is large enough to read on a five-column card.
                    shape(p.cranberry, 3f to 21f, 11f to 11f, 24f to 7f,
                        37f to 11f, 45f to 21f)
                    line(4f, 21f, 44f, 21f, p.gold, 1.8f)
                    line(24f, 7f, 24f, 36f, p.cocoa, 2f)
                    line(24f, 36f, 28f, 39f, p.cocoa, 2f)
                    person(18f, 29f, p.evergreen)
                    person(29f, 29f, p.cranberry)
                    line(20f, 30f, 27f, 30f, p.skin, 2f)
                    heart(24f, 23f, .27f, p.gold)
                    listOf(7f, 13f, 36f, 42f).forEach { x ->
                        line(x, 26f, x - 2f, 32f, p.paper, 1.4f)
                        line(x + 1f, 36f, x - 1f, 42f, p.paper, 1.2f)
                    }
                    oval(3f, 44f, 15f, 2f, p.paper)
                    oval(31f, 44f, 14f, 2f, p.paper)
                }
                StoryScene.MEANINGFUL_LOOK -> {
                    // Across a café table, a quiet glance says everything.
                    tile(p.blush)
                    box(3f, 4f, 42f, 24f, p.paper)
                    box(5f, 6f, 38f, 20f, p.sky)
                    line(24f, 6f, 24f, 26f, p.cocoa, 1.6f)
                    line(5f, 26f, 43f, 26f, p.cocoa, 1.6f)
                    person(13f, 24f, p.cranberry)
                    person(35f, 24f, p.evergreen)
                    // Eyes turn toward each other; warm highlights mark the shared gaze.
                    dot(15f, 24f, 1.1f, p.ink)
                    dot(33f, 24f, 1.1f, p.ink)
                    line(18f, 22f, 30f, 22f, p.gold, 1.1f)
                    dot(24f, 22f, 1.7f, p.gold)
                    box(7f, 37f, 34f, 4f, p.cocoa, 1f)
                    box(21f, 32f, 6f, 6f, p.paper, 1f)
                    line(23f, 29f, 22f, 31f, p.paper, 1f)
                    line(26f, 28f, 25f, 31f, p.paper, 1f)
                    heart(24f, 12f, .35f)
                }
                StoryScene.INCONVENIENT_DEADLINE -> {
                    // A nearly expired deadline interrupts a handwritten love letter.
                    tile(p.sky)
                    // Oversized calendar with one date emphatically circled.
                    box(3f, 8f, 27f, 35f, p.paper)
                    box(3f, 8f, 27f, 7f, p.cranberry)
                    dot(10f, 9f, 1.5f, p.gold); dot(23f, 9f, 1.5f, p.gold)
                    line(8f, 21f, 25f, 21f, p.blue, 1.2f)
                    line(8f, 27f, 25f, 27f, p.blue, 1.2f)
                    drawCircle(p.cranberry, 6f, Offset(19f, 34f), style = Stroke(2f))
                    // Clock hands approach midnight beside the calendar.
                    dot(37f, 18f, 10f, p.gold)
                    dot(37f, 18f, 7.5f, p.paper)
                    line(37f, 18f, 37f, 12f, p.ink, 1.8f)
                    line(37f, 18f, 42f, 15f, p.ink, 1.8f)
                    // Unfinished note and a pen below the ticking clock.
                    box(30f, 33f, 16f, 10f, p.paper, 1f)
                    line(32f, 36f, 42f, 36f, p.cocoa, 1f)
                    line(32f, 39f, 38f, 39f, p.cocoa, 1f)
                    line(40f, 45f, 46f, 35f, p.cranberry, 2f)
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
