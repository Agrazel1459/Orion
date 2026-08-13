package com.orion.network

import android.net.VpnService
import android.os.ParcelFileDescriptor
import com.orion.data.SignatureStore

/**
 * On-device DNS/connection-metadata filter. Does NOT inspect full packet payloads
 * unless the user has explicitly opted in elsewhere. Blocks connections to domains
 * in the signed malicious-domain blocklist and notifies the user; never uploads
 * traffic off-device.
 */
class OrionVpnService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null

    override fun onCreate() {
        super.onCreate()
        val blockedDomains = SignatureStore.get(applicationContext).maliciousDomains
        vpnInterface = Builder()
            .addAddress("10.0.0.2", 32)
            .addDnsServer("10.0.0.1") // loopback DNS resolver enforcing the blocklist
            .setSession("Orion Protection")
            .establish()
        DnsFilterEngine.start(vpnInterface, blockedDomains, onBlocked = { domain ->
            NotificationHelper.notifyBlockedDomain(applicationContext, domain)
        })
    }

    override fun onDestroy() {
        DnsFilterEngine.stop()
        vpnInterface?.close()
        super.onDestroy()
    }
}

/** Placeholder for the packet-loop/DNS-resolution logic; keep off main thread. */
object DnsFilterEngine {
    fun start(fd: ParcelFileDescriptor?, blockedDomains: Set<String>, onBlocked: (String) -> Unit) {
        // Real implementation: read the TUN fd on a background thread, parse
        // outgoing DNS queries, drop/NXDOMAIN queries matching blockedDomains,
        // forward everything else to a real upstream resolver over TLS.
    }
    fun stop() { /* signal background thread to exit, close sockets */ }
}

object NotificationHelper {
    fun notifyBlockedDomain(context: android.content.Context, domain: String) {
        // Post a factual, non-alarmist notification: "Blocked a connection to a known
        // malicious domain (<domain>)." No fear-based copy per spec §5.5.
    }
}
