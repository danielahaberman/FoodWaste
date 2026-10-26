import Foundation

enum AppConfiguration {
    /// Live FoodWaste web app (same as FoodHero Android `web_app_url`).
    static let webAppURL = URL(string: "https://foodwaste-production-746a.up.railway.app")!

    static let userAgentToken = "FoodHeroApp/1.0"

    static let injectNativeFlagJS =
        "(function(){window.__FOOD_HERO_NATIVE_APP__=true;})();"

    static let loadErrorMessage =
        "Unable to load Food Hero. Check your connection and try again."
}
