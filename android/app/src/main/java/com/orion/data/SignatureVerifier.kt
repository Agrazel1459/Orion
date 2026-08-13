package com.orion.data

import android.util.Base64
import java.security.KeyFactory
import java.security.Signature
import java.security.spec.X509EncodedKeySpec

/**
 * Verifies signed SignatureBundle updates before they are trusted.
 * PINNED_PUBLIC_KEY_B64 must match the private key held by Orion's backend.
 * Never trust an unsigned or unverified bundle as executable rule data.
 */
object SignatureVerifier {

    // Replace with the real pinned Ed25519 public key at release build time.
    private const val PINNED_PUBLIC_KEY_B64 = "REPLACE_WITH_PINNED_ED25519_PUBLIC_KEY"

    fun verify(canonicalBundleBytesWithoutSig: ByteArray, signatureB64: String): Boolean {
        return try {
            val pubKeyBytes = Base64.decode(PINNED_PUBLIC_KEY_B64, Base64.NO_WRAP)
            val keySpec = X509EncodedKeySpec(pubKeyBytes)
            val keyFactory = KeyFactory.getInstance("Ed25519")
            val publicKey = keyFactory.generatePublic(keySpec)

            val sig = Signature.getInstance("Ed25519")
            sig.initVerify(publicKey)
            sig.update(canonicalBundleBytesWithoutSig)
            sig.verify(Base64.decode(signatureB64, Base64.NO_WRAP))
        } catch (e: Exception) {
            false // fail closed: any error means "not trusted"
        }
    }
}
