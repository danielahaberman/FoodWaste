# Food Hero — iOS app shell

This folder is the native iOS wrapper for the Food Hero web app (same idea as `FoodHero/` on Android). The app is a full-screen **WKWebView** that loads the live site; the shell adds camera access for barcode scanning, hides PWA install prompts, and identifies itself to the web app as the native app.

**Who this is for:** Daniella (or anyone on a Mac) building and testing on a real iPhone or the iOS Simulator.

---

## What you need

| Requirement | Notes |
|-------------|--------|
| **Mac** | Xcode only runs on macOS. |
| **Xcode 15+** | Install from the Mac App Store. After install, open Xcode once and accept the license; let it install extra components if prompted. |
| **Apple Developer access** | To run on a **physical iPhone**, the Apple ID used in Xcode must be on the team that owns the app (Nick set up developer accounts for this). Simulator-only testing does not require a paid team, but signing for a real device does. |
| **Repo** | Clone or pull [FoodWaste on GitHub](https://github.com/danielahaberman/FoodWaste) (same repo as the web app and Android shell). |

---

## One-time setup

1. **Get the code** (if you do not already have it):

   ```bash
   git clone https://github.com/danielahaberman/FoodWaste.git
   cd FoodWaste/FoodHeroIOS
   ```

   Or, if the repo is already on the Mac: `git pull` in the project root, then open the iOS folder below.

2. **Open the project in Xcode**

   - Double-click **`FoodHeroIOS.xcodeproj`**, or in Xcode: **File → Open** and choose that file.
   - In the left sidebar, select the blue **FoodHeroIOS** project, then the **FoodHeroIOS** target under **TARGETS**.

3. **Signing (required for a real device)**

   - Open **Signing & Capabilities**.
   - Check **Automatically manage signing**.
   - **Team:** choose the Food Hero / organization team Nick added you to (not “Personal Team” unless that is the only option and the bundle ID is free for personal use).
   - **Bundle Identifier** must stay **`com.foodsuperhero.app`** — it must match App Store Connect and the Android app package name.

   If Xcode shows a signing error, the usual fixes are: wrong team selected, your Apple ID not invited in [App Store Connect](https://appstoreconnect.apple.com) / Developer portal, or the bundle ID registered under a different team.

4. **App icon**

   Already in the repo: **Assets.xcassets → AppIcon** (`AppIcon-1024.png`, upscaled from `public/pwa-512.png`, same artwork as the PWA/Android app). Replace there only if marketing gives you a new master file.

---

## Run the app

1. At the top of Xcode, pick a destination:
   - **iPhone simulator** (e.g. iPhone 15) — fastest for a first smoke test; no cable needed.
   - **Your iPhone** — connect USB (or use wireless debugging after pairing), unlock the phone, select it in the device menu.

2. Press **Run** (▶) or **Product → Run**.

3. **First install on a physical iPhone**

   On the phone: **Settings → General → VPN & Device Management** (or **Profiles & Device Management**) → trust the developer certificate for your team if iOS asks.

4. **What you should see**

   - The app opens to the live site: `https://foodwaste-production-746a.up.railway.app`
   - You should **not** get the “install to home screen” PWA banner (native shell is detected).
   - Try **login** and any flow that uses the **camera** (barcode); iOS should prompt for camera permission once.

---

## Point at a different server (optional)

By default the app loads production (same as Android). To hit a local dev server on your Wi‑Fi (only while Nick’s machine is serving the web app):

1. Open **`FoodHeroIOS/AppConfiguration.swift`**.
2. Change `webAppURL` to the dev URL (example: `http://192.168.1.50:5173` — use Nick’s LAN IP and Vite port).
3. Run again from Xcode.

Production URL for reference:

```swift
static let webAppURL = URL(string: "https://foodwaste-production-746a.up.railway.app")!
```

---

## TestFlight / App Store (later)

When you are ready to ship:

1. **Product → Archive** (destination must be **Any iOS Device**, not a simulator).
2. In the Organizer window: **Distribute App** → App Store Connect / TestFlight and follow the wizard.
3. Version in Xcode today: **1.0.1** (build **2**), aligned with Android.

Nick or whoever manages App Store Connect creates the app record and TestFlight testers if that is not done yet.

---

## Troubleshooting

| Problem | What to try |
|---------|-------------|
| **“Unable to load Food Hero”** | Check Wi‑Fi/cellular; open the same URL in Safari on the phone. |
| **Signing / provisioning failed** | Correct **Team**; confirm Apple ID is on the developer team; bundle ID `com.foodsuperhero.app`. |
| **Camera does not work** | **Settings → Food Hero → Camera** enabled; deny/re-allow if needed. |
| **Old web UI after a deploy** | Force-quit the app and reopen; the web app may cache like a browser (rare on WKWebView). |
| **Build errors after `git pull`** | **Product → Clean Build Folder**, then Run again. |

---

## Project layout (quick reference)

| Path | Purpose |
|------|---------|
| `FoodHeroIOS/AppConfiguration.swift` | Production URL, user-agent token, error copy |
| `FoodHeroIOS/FoodHeroWebView.swift` | WKWebView, loading, camera, native flag injection |
| `FoodHeroIOS/ContentView.swift` | Spinner and retry UI |
| `FoodHeroIOS.xcodeproj` | Open this in Xcode |

Android equivalent lives in **`../FoodHero/`** at the repo root.

If anything in signing or App Store Connect does not match what Nick configured, ping him with a screenshot of the Xcode **Signing & Capabilities** panel.
