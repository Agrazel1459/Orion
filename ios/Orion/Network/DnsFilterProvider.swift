import NetworkExtension

/// NEDNSProxyProvider: DNS-level filtering only against the signed malicious-domain
/// blocklist. Full packet inspection is not permitted by Apple for this app class —
/// do not attempt to bypass that restriction.
final class DnsFilterProvider: NEDNSProxyProvider {

    override func startProxy(options: [String: Any]?, completionHandler: @escaping (Error?) -> Void) {
        completionHandler(nil)
    }

    override func stopProxy(with reason: NEProviderStopReason, completionHandler: @escaping () -> Void) {
        completionHandler()
    }

    override func handleNewFlow(_ flow: NEAppProxyFlow) -> Bool {
        guard let dnsFlow = flow as? NEAppProxyUDPFlow else { return false }
        // Real implementation: intercept DNS queries, resolve via upstream over TLS,
        // return NXDOMAIN for any name matching SignatureStore.shared.maliciousDomains.
        _ = dnsFlow
        return true
    }
}
