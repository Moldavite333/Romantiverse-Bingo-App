package com.cheeselouise.romantiverse

import java.security.MessageDigest
import java.util.Locale

/**
 * Local-only fallback for a real movie missing from the public catalog.
 * The title is never sent to HQ or treated as verified production metadata.
 * Stable IDs let an unfinished card survive a restart without an account.
 */
object CustomMovieTitles {
    fun create(rawTitle: String, requestedCollection: String = "Unspecified"): Movie? {
        val title = rawTitle.trim().replace(Regex("\\s+"), " ")
        if (title.length !in 2..120 || title.any { Character.isISOControl(it) }) return null
        val collection = requestedCollection.takeIf { it == "Christmas" || it == "Fall" }
            ?: "Unspecified"
        val digest = MessageDigest.getInstance("SHA-256")
            .digest(title.lowercase(Locale.ROOT).toByteArray(Charsets.UTF_8))
        val suffix = digest.take(12).joinToString("") { "%02x".format(it.toInt() and 0xff) }
        return Movie("custom-$suffix", title, null, collection)
    }
}
