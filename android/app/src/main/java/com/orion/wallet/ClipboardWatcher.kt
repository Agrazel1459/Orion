package com.orion.wallet

import android.content.ClipboardManager
import android.content.Context

/**
 * Local, on-device only. Detects when a copied wallet-address-shaped string is
 * silently swapped for a different one before paste (classic "clipper" malware).
 * Requires explicit, revocable user opt-in. Never transmits clipboard contents
 * off-device.
 */
class ClipboardWatcher(private val context: Context, private val onHijackDetected: (old: String, new: String) -> Unit) {

    private var lastUserCopiedAddress: String? = null
    private val clipboard get() = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager

    private val listener = ClipboardManager.OnPrimaryClipChangedListener {
        val current = clipboard.primaryClip?.getItemAt(0)?.text?.toString() ?: return@OnPrimaryClipChangedListener
        if (!looksLikeWalletAddress(current)) return@OnPrimaryClipChangedListener

        val previous = lastUserCopiedAddress
        if (previous != null && previous != current && userDidNotInitiateCopy()) {
            onHijackDetected(previous, current)
        }
        lastUserCopiedAddress = current
    }

    fun start() = clipboard.addPrimaryClipChangedListener(listener)
    fun stop() = clipboard.removePrimaryClipChangedListener(listener)

    private fun looksLikeWalletAddress(text: String): Boolean {
        val btc = Regex("^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$")
        val eth = Regex("^0x[a-fA-F0-9]{40}$")
        return btc.matches(text) || eth.matches(text)
    }

    // Real implementation tracks a short "copy just happened via user action" window
    // (e.g. via Accessibility copy event or app-side copy callback) to distinguish
    // a legitimate copy from a background/malicious clipboard write.
    private fun userDidNotInitiateCopy(): Boolean = true
}
