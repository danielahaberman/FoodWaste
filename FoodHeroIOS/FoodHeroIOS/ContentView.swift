import SwiftUI

struct ContentView: View {
    @State private var isLoading = true
    @State private var loadFailed = false
    @State private var reloadToken = UUID()

    var body: some View {
        ZStack {
            FoodHeroWebView(
                url: AppConfiguration.webAppURL,
                isLoading: $isLoading,
                loadFailed: $loadFailed,
                reloadToken: reloadToken
            )
            .ignoresSafeArea()

            if isLoading && !loadFailed {
                ProgressView()
                    .controlSize(.large)
            }

            if loadFailed {
                VStack(spacing: 16) {
                    Text(AppConfiguration.loadErrorMessage)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)

                    Button("Retry") {
                        loadFailed = false
                        isLoading = true
                        reloadToken = UUID()
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding(24)
            }
        }
    }
}

#Preview {
    ContentView()
}
