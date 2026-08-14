import Foundation
import CryptoKit

/// Tracks files the user has explicitly granted access to via the Files/Photos
/// picker (security-scoped bookmarks). No background/system-wide file access —
/// not possible, and never attempted, in the App Store sandbox.
final class UserPickedFileStore {
    static let shared = UserPickedFileStore()
    private var urls: [URL] = []

    func currentURLs() -> [URL] { urls }

    func add(_ url: URL) {
        urls.append(url)
    }
}

struct Finding: Codable {
    let id: String
    let type: String
    let severity: String
    let path: String?
    let description: String
    let remediation: String
}

struct ScanResult: Codable {
    let scanId: String
    let timestamp: Date
    let itemsScanned: Int
    let findings: [Finding]
}

/// Scans only Orion's own sandbox and files the user explicitly picked via the
/// Files/Photos picker. No background access to other apps' storage or iCloud —
/// not possible in the App Store sandbox, and never attempted.
final class ScanOperation: Operation {
    private(set) var result: ScanResult?
    private let maliciousHashes: Set<String>

    init(maliciousHashes: Set<String> = SignatureStore.shared.maliciousHashes) {
        self.maliciousHashes = maliciousHashes
    }

    override func main() {
        guard !isCancelled else { return }
        let urls = UserPickedFileStore.shared.currentURLs()
        var findings: [Finding] = []

        for url in urls {
            if isCancelled { break }
            guard let data = try? Data(contentsOf: url) else { continue }
            let hash = SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
            if maliciousHashes.contains(hash) {
                findings.append(Finding(
                    id: UUID().uuidString,
                    type: "hash_match",
                    severity: "high",
                    path: url.lastPathComponent,
                    description: "This file matches a known-malicious file signature.",
                    remediation: "Delete this file, or remove the app that created it."
                ))
            }
        }

        result = ScanResult(
            scanId: UUID().uuidString,
            timestamp: Date(),
            itemsScanned: urls.count,
            findings: findings
        )
    }
}
