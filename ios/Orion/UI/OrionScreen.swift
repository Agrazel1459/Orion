import SwiftUI

// Palette from Orion logo — matches Android OrionScreen.kt
extension Color {
    static let orionNavy = Color(red: 0x08/255, green: 0x1A/255, blue: 0x32/255)
    static let orionNavyLight = Color(red: 0x0F/255, green: 0x2A/255, blue: 0x4D/255)
    static let orionBlue = Color(red: 0x3E/255, green: 0x72/255, blue: 0xAE/255)
    static let orionBlueLight = Color(red: 0x6F/255, green: 0xA0/255, blue: 0xD6/255)
    static let orionWhite = Color(red: 0xF2/255, green: 0xF5/255, blue: 0xFA/255)
    static let orionHigh = Color(red: 0xE0/255, green: 0x64/255, blue: 0x5A/255)
    static let orionMed = Color(red: 0xE0/255, green: 0xB0/255, blue: 0x4A/255)
}

struct Finding: Identifiable {
    let id = UUID()
    let severity: String // "high" | "medium" | "low"
    let description: String
    let remediation: String

    var color: Color {
        switch severity {
        case "high": return .orionHigh
        case "medium": return .orionMed
        default: return .orionBlueLight
        }
    }
}

@MainActor
final class ScanState: ObservableObject {
    @Published var lastScan = Date()
    @Published var itemsScanned = 0
    @Published var scanning = false
    @Published var findings: [Finding] = []
    @Published var hourlyScan = true
    @Published var networkProtection = true
    @Published var clipboardWatch = true

    func scanNow() {
        scanning = true
        // ScanOperation wiring point — replace stub below with real result
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
            self.scanning = false
            self.lastScan = Date()
            self.itemsScanned += 128
        }
    }
}

struct OrionRootView: View {
    @StateObject private var state = ScanState()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Header()
                StatusCard(state: state)
                Text("Findings").font(.headline).foregroundColor(.orionWhite)
                if state.findings.isEmpty {
                    EmptyFindings()
                } else {
                    ForEach(state.findings) { FindingRow(f: $0) }
                }
                Text("Protection").font(.headline).foregroundColor(.orionWhite)
                SettingsCard(state: state)
            }
            .padding(20)
        }
        .background(Color.orionNavy.ignoresSafeArea())
        .preferredColorScheme(.dark)
    }
}

private struct Header: View {
    var body: some View {
        HStack {
            Circle().fill(Color.orionBlue).frame(width: 40, height: 40)
                .overlay(Text("O").foregroundColor(.orionWhite).fontWeight(.bold))
            VStack(alignment: .leading) {
                Text("Orion").foregroundColor(.orionWhite).font(.title2).fontWeight(.bold)
                Text("Protection active").foregroundColor(.orionBlueLight).font(.caption)
            }
            Spacer()
        }
    }
}

private struct StatusCard: View {
    @ObservedObject var state: ScanState

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(state.findings.isEmpty ? "No threats found" : "\(state.findings.count) item(s) need your attention")
                .foregroundColor(.orionWhite).font(.headline)
            Text("Scanned \(state.itemsScanned) items · last scan just now")
                .foregroundColor(.orionBlueLight).font(.caption)
            Button(action: state.scanNow) {
                Text(state.scanning ? "Scanning…" : "Scan now")
                    .foregroundColor(.orionWhite)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color.orionBlue)
                    .cornerRadius(12)
            }
            .disabled(state.scanning)
            .padding(.top, 8)
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.orionNavyLight)
        .cornerRadius(16)
    }
}

private struct EmptyFindings: View {
    var body: some View {
        Text("Nothing to review. Orion will notify you if that changes.")
            .foregroundColor(.orionBlueLight).font(.subheadline)
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.orionNavyLight)
            .cornerRadius(16)
    }
}

private struct FindingRow: View {
    let f: Finding
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Circle().fill(f.color).frame(width: 10, height: 10).padding(.top, 4)
            VStack(alignment: .leading, spacing: 2) {
                Text(f.description).foregroundColor(.orionWhite).font(.subheadline)
                Text(f.remediation).foregroundColor(.orionBlueLight).font(.caption)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.orionNavyLight)
        .cornerRadius(14)
    }
}

private struct SettingsCard: View {
    @ObservedObject var state: ScanState
    var body: some View {
        VStack(spacing: 4) {
            SettingRow(label: "Hourly scan", isOn: $state.hourlyScan)
            SettingRow(label: "Network protection", isOn: $state.networkProtection)
            SettingRow(label: "Clipboard hijack watch", isOn: $state.clipboardWatch)
        }
        .padding(8)
        .background(Color.orionNavyLight)
        .cornerRadius(16)
    }
}

private struct SettingRow: View {
    let label: String
    @Binding var isOn: Bool
    var body: some View {
        Toggle(isOn: $isOn) {
            Text(label).foregroundColor(.orionWhite).font(.subheadline)
        }
        .tint(.orionBlue)
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
    }
}

#Preview {
    OrionRootView()
}
