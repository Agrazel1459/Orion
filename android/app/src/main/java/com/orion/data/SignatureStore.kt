package com.orion.data

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.orion.scan.ScanEngine

data class SignatureBundle(
    val version: Int,
    val maliciousHashes: Set<String>,
    val maliciousDomains: Set<String>,
    val knownWalletPublishers: Map<String, String>
)

/** Encrypted-at-rest cache of the last verified signature bundle. */
object SignatureStore {
    private const val PREFS = "orion_signatures_encrypted"

    fun get(context: Context): SignatureBundle {
        val prefs = encryptedPrefs(context)
        return SignatureBundle(
            version = prefs.getInt("version", 0),
            maliciousHashes = prefs.getStringSet("hashes", emptySet()) ?: emptySet(),
            maliciousDomains = prefs.getStringSet("domains", emptySet()) ?: emptySet(),
            knownWalletPublishers = emptyMap() // decode from stored JSON in production
        )
    }

    /** Call only after SignatureVerifier.verify() has returned true for this bundle. */
    fun saveVerified(context: Context, version: Int, hashes: Set<String>, domains: Set<String>) {
        encryptedPrefs(context).edit()
            .putInt("version", version)
            .putStringSet("hashes", hashes)
            .putStringSet("domains", domains)
            .apply()
    }

    private fun encryptedPrefs(context: Context) = EncryptedSharedPreferences.create(
        context,
        PREFS,
        MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
}
