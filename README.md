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
Apple requires a signed build from a Developer account, so there's no
downloadable IPA here. To run it:
```
cd ios && open Orion.xcodeproj   # or the .xcworkspace if present
```
Select your device/simulator in Xcode, set your team under Signing &
Capabilities, and Run. TestFlight distribution needs an App Store Connect
account (not something this repo can automate).

## Structure
- `android/` — Kotlin/Jetpack Compose app
- `ios/` — Swift/SwiftUI app
- `shared/` — common scan-result/settings JSON schema
- `backend/` — signature bundle signing script
- `AntiMalware.md` — full product/security spec
