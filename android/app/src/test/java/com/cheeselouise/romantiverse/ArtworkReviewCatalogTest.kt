package com.cheeselouise.romantiverse

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ArtworkReviewCatalogTest {
    @Test fun galleryShowsEveryCanonicalSceneExactlyOnce() {
        val themes = listOf("Romance", "Christmas", "Fall", "Horror")
        val labels = themes.flatMap(ArtworkReviewCatalog::labels)
        assertEquals(72, labels.size)
        assertEquals(72, labels.toSet().size)
        assertEquals(36, ArtworkReviewCatalog.labels("Romance").size)
        themes.drop(1).forEach { theme ->
            assertEquals(12, ArtworkReviewCatalog.labels(theme).size)
        }
        labels.forEach { label ->
            assertTrue("Gallery contains trope without native scene: $label",
                StorySceneArt.forLabel(label) != null)
        }
    }

    @Test fun multiplayerLaunchPreviewContainsOnlyNewDedicatedScenes() {
        val labels = ArtworkReviewCatalog.labels("Multiplayer launch")
        assertEquals(48, labels.size)
        assertEquals(labels.size, labels.toSet().size)
        labels.forEach { label ->
            assertTrue("Shared multiplayer motif still used for $label",
                StorySceneArt.forLabel(label) != null)
        }
    }

    @Test fun fallTwoGalleryShowsAllSixAtPhoneScale() {
        val labels = ArtworkReviewCatalog.labels("Multiplayer Fall II")
        assertEquals(
            listOf("Bonfire", "Pie contest", "Corn maze", "Pumpkin carving",
                "Family orchard", "Apple picking"), labels
        )
        assertEquals(6, labels.mapNotNull(StorySceneArt::forLabel).toSet().size)
    }

    @Test fun fallThreeGalleryShowsSixDistinctNativeScenes() {
        val labels = ArtworkReviewCatalog.labels("Multiplayer Fall III")
        assertEquals(
            listOf("Cozy sweater", "Fall decorations", "Small-town fair",
                "Farm stand", "Harvest dance", "Autumn sunset"), labels
        )
        assertEquals(6, labels.mapNotNull(StorySceneArt::forLabel).toSet().size)
        assertTrue(ArtworkReviewCatalog.labels("Multiplayer Fall II").intersect(labels.toSet()).isEmpty())
    }

    @Test fun previewDoesNotSilentlyTreatUnknownThemesAsRomance() {
        assertTrue(ArtworkReviewCatalog.labels("Unlisted").isEmpty())
    }
}
