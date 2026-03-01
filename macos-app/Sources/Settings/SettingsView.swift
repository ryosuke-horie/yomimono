/**
 * 設定画面
 * API エンドポイントなどアプリ設定を管理する
 */
import SwiftUI

struct SettingsView: View {
    @AppStorage("apiBaseURL") private var apiBaseURL = "https://effective-yomimono-api.ryosuke-horie37.workers.dev"

    var body: some View {
        Form {
            Section("API設定") {
                LabeledContent("APIエンドポイント") {
                    TextField("API URL", text: $apiBaseURL)
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 400)
                }
            }
        }
        .formStyle(.grouped)
        .navigationTitle("設定")
        .frame(width: 560, height: 200)
    }
}
