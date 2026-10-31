package com.cheeselouise.romantiverse

import java.security.MessageDigest
import java.util.Locale
import java.text.Normalizer

/**
 * Local-only fallback for a real movie missing from the public catalog.
 * The title is never sent to HQ or treated as verified production metadata.
 * Stable IDs let an unfinished card survive a restart without an account.
 */
object CustomMovieTitles {
    /** The pre-normalization hash is used only to migrate an existing saved card. */
    internal fun legacyId(rawTitle: String): String? {
        val title = rawTitle.trim().replace(Regex("\\s+"), " ")
        if (title.length !in 2..120 || title.any { Character.isISOControl(it) }) return null
        val digest = MessageDigest.getInstance("SHA-256")
            .digest(title.lowercase(Locale.ROOT).toByteArray(Charsets.UTF_8))
        return "custom-" + digest.take(12).joinToString("") {
            "%02x".format(it.toInt() and 0xff)
        }
    }

    fun create(rawTitle: String, requestedCollection: String = "Unspecified"): Movie? {
        val title = Normalizer.normalize(rawTitle, Normalizer.Form.NFKC)
            .trim().replace(Regex("\\s+"), " ")
        if (title.length !in 2..120 || title.any { Character.isISOControl(it) }) return null
        val collection = requestedCollection.takeIf { it == "Christmas" || it == "Fall" }
            ?: "Unspecified"
        val digest = MessageDigest.getInstance("SHA-256")
            .digest(title.lowercase(Locale.ROOT).toByteArray(Charsets.UTF_8))
        val suffix = digest.take(12).joinToString("") { "%02x".format(it.toInt() and 0xff) }
        return Movie("custom-$suffix", title, null, collection)
    }
}
