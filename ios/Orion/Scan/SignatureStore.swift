import Foundation
import CryptoKit

/// Pinned Ed25519 public key baked into the app; every signature-bundle update
/// must verify against this before being trusted, to prevent a compromised CDN
/// or MITM from pushing fake "safe" signatures or malicious blocklists.
final class SignatureStore {
    static let shared = SignatureStore()

    private static let pinnedPublicKeyRaw = Data(base64Encoded: "REPLACE_WITH_PINNED_ED25519_PUBLIC_KEY")!

    private(set) var maliciousHashes: Set<String> = []
    private(set) var maliciousDomains: Set<String> = []

    /// Call after fetching an update over TLS. Only persists if signature verifies.
    func applyUpdate(bundleBytesWithoutSig: Data, signature: Data, hashes: Set<String>, domains: Set<String>) -> Bool {
        guard let pubKey = try? Curve25519.Signing.PublicKey(rawRepresentation: Self.pinnedPublicKeyRaw) else {
            return false
        }
        guard pubKey.isValidSignature(signature, for: bundleBytesWithoutSig) else {
            return false // fail closed
        }
        maliciousHashes = hashes
        maliciousDomains = domains
        persistToKeychain()
        return true
    }

    private func persistToKeychain() {
        // Store via Keychain (kSecClassGenericPassword) with
        // kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly, not UserDefaults.
    }
}
