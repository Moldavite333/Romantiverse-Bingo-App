package com.cheeselouise.romantiverse

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertNotNull
import org.junit.Test

class BingoLineGeometryTest {
    @Test fun allTwelveEngineLinesHaveValidNormalizedPaths() {
        assertEquals(12, BingoEngine.lines.size)
        BingoEngine.lines.forEach { indices ->
            val path = BingoLineGeometry.path(indices)
            assertNotNull(path)
            listOf(path!!.x0, path.y0, path.x1, path.y1).forEach {
                assertEquals(true, it in 0f..1f)
            }
        }
    }

    @Test fun horizontalVerticalAndDiagonalEndpointsMatchGridCenters() {
        val top = BingoLineGeometry.path(listOf(0, 1, 2, 3, 4))!!
        assertEquals(.1f, top.x0, .0001f)
        assertEquals(.9f, top.x1, .0001f)
        assertEquals(.1f, top.y0, .0001f)
        assertEquals(.1f, top.y1, .0001f)
        val left = BingoLineGeometry.path(listOf(0, 5, 10, 15, 20))!!
        assertEquals(.1f, left.x0, .0001f)
        assertEquals(.9f, left.y1, .0001f)
        val reverse = BingoLineGeometry.path(listOf(4, 8, 12, 16, 20))!!
        assertEquals(.9f, reverse.x0, .0001f)
        assertEquals(.1f, reverse.x1, .0001f)
        assertEquals(.9f, reverse.y1, .0001f)
    }

    @Test fun arbitraryOrIncompleteLinesNeverDraw() {
        assertNull(BingoLineGeometry.path(listOf(0, 1, 2, 3)))
        assertNull(BingoLineGeometry.path(listOf(0, 1, 2, 3, 24)))
        assertNull(BingoLineGeometry.path(listOf(0, 0, 0, 0, 0)))
    }
}
