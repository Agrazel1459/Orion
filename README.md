# Orion

On-device malware, phishing, and clipboard-hijack detector for iOS and Android.
No root/jailbreak required. See `AntiMalware.md` for full spec.

## Download

### Android
Tagged releases (`vX.Y.Z`) auto-build a debug APK via GitHub Actions:
→ [Releases](../../releases) — download `app-debug.apk`, enable "Install
unknown apps" for your browser/file manager, then install.

No release has been tagged yet. To trigger one:
```
git tag v1.0.0 && git push origin v1.0.0
```

### iOS
Real devices need a signed build from an Apple Developer account, which this
repo can't produce. What you *can* download:
→ [Releases](../../releases) — `Orion-Simulator.zip`, an unsigned build for
the **iOS Simulator only** (Xcode required to run it, no real iPhone/iPad).
Unzip, then drag `Orion.app` onto a running Simulator window, or:
```
xcrun simctl install booted Orion.app
xcrun simctl launch booted com.orion.app
```

Both this and the Android APK build from the same tag push:
```
git tag v1.0.0 && git push origin v1.0.0
```

To run on your own iPhone instead, open `ios/Orion.xcodeproj` in Xcode, set
your team under Signing & Capabilities, and Run.

## Structure
- `android/` — Kotlin/Jetpack Compose app
- `ios/` — Swift/SwiftUI app
- `shared/` — common scan-result/settings JSON schema
- `backend/` — signature bundle signing script
- `AntiMalware.md` — full product/security spec
