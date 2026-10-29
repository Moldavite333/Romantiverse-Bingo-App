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

    @Test fun previewDoesNotSilentlyTreatUnknownThemesAsRomance() {
        assertTrue(ArtworkReviewCatalog.labels("Unlisted").isEmpty())
    }
}
