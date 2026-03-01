/**
 * アプリケーションエントリーポイント
 * NavigationSplitView によるサイドバー構成を定義する
 */
import SwiftUI

@main
struct YomimonoApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .windowStyle(.titleBar)
        .windowToolbarStyle(.unified)

        Settings {
            SettingsView()
        }
    }
}
