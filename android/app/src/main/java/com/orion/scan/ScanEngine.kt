package com.orion.scan

import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import java.security.MessageDigest
import java.util.UUID

data class Finding(
    val id: String = UUID.randomUUID().toString(),
    val type: String,
    val severity: String,
    val path: String?,
    val description: String,
    val remediation: String
)

data class ScanResult(
    val scanId: String = UUID.randomUUID().toString(),
    val timestamp: Long = System.currentTimeMillis(),
    val itemsScanned: Int,
    val findings: List<Finding>
)

/**
 * Scans only what Android's scoped-storage model grants: app sandbox, user-picked
 * SAF files, and installed-app metadata. Never attempts to read another app's
 * private storage.
 */
class ScanEngine(
    private val context: Context,
    private val maliciousHashes: Set<String>,
    private val knownWalletPublishers: Map<String, String> // packageName -> signing cert sha256
) {
    fun scanUserPickedFiles(uris: List<Uri>): ScanResult {
        val findings = mutableListOf<Finding>()
        var scanned = 0
        for (uri in uris) {
            scanned++
            val hash = hashUri(uri) ?: continue
            if (hash in maliciousHashes) {
                findings += Finding(
                    type = "hash_match",
                    severity = "high",
                    path = uri.toString(),
                    description = "This file matches a known-malicious file signature.",
                    remediation = "Delete or quarantine this file."
                )
            }
        }
        return ScanResult(itemsScanned = scanned, findings = findings)
    }

    fun scanInstalledApps(): ScanResult {
        val pm = context.packageManager
        val packages = pm.getInstalledPackages(PackageManager.GET_PERMISSIONS or PackageManager.GET_SIGNING_CERTIFICATES)
        val findings = mutableListOf<Finding>()

        for (pkg in packages) {
            val dangerousCount = pkg.requestedPermissions?.count { isDangerous(it) } ?: 0
            val installerPkg = try {
                pm.getInstallSourceInfo(pkg.packageName).installingPackageName
            } catch (e: Exception) { null }
            val sideloaded = installerPkg == null // no known installer (Play/OEM store)

            if (sideloaded && dangerousCount >= 4) {
                findings += Finding(
                    type = "heuristic_apk",
                    severity = "medium",
                    path = pkg.packageName,
                    description = "This app was sideloaded and requests an unusually high number of sensitive permissions.",
                    remediation = "Review this app's permissions in Settings and uninstall if unrecognized."
                )
            }

            knownWalletPublishers[pkg.packageName]?.let { expectedCertHash ->
                val actualCertHash = signingCertSha256(pkg)
                if (actualCertHash != null && actualCertHash != expectedCertHash) {
                    findings += Finding(
                        type = "clone_wallet",
                        severity = "high",
                        path = pkg.packageName,
                        description = "This app uses the package name of a known wallet app but its signing certificate doesn't match — it may be a fake/clone.",
                        remediation = "Uninstall immediately and reinstall the wallet from the official store listing only."
                    )
                }
            }
        }
        return ScanResult(itemsScanned = packages.size, findings = findings)
    }

    private fun isDangerous(permission: String): Boolean =
        permission in setOf(
            "android.permission.READ_SMS", "android.permission.SEND_SMS",
            "android.permission.SYSTEM_ALERT_WINDOW", "android.permission.BIND_ACCESSIBILITY_SERVICE",
            "android.permission.READ_CONTACTS", "android.permission.RECORD_AUDIO",
            "android.permission.CAMERA", "android.permission.READ_CALL_LOG"
        )

    private fun hashUri(uri: Uri): String? = try {
        context.contentResolver.openInputStream(uri)?.use { stream ->
            val digest = MessageDigest.getInstance("SHA-256")
            val buf = ByteArray(8192)
            var read: Int
            while (stream.read(buf).also { read = it } != -1) digest.update(buf, 0, read)
            digest.digest().joinToString("") { "%02x".format(it) }
        }
    } catch (e: Exception) { null }

    private fun signingCertSha256(pkg: android.content.pm.PackageInfo): String? = try {
        val signers = pkg.signingInfo?.apkContentsSigners ?: return null
        if (signers.isEmpty()) null else {
            val digest = MessageDigest.getInstance("SHA-256")
            digest.digest(signers[0].toByteArray()).joinToString("") { "%02x".format(it) }
        }
    } catch (e: Exception) { null }
}
