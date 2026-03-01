/**
 * 設定画面
 * アプリのバージョン情報と CLI 設定を表示する
 * API エンドポイントはハードコード（将来の拡張時に追加予定）
 */
import SwiftUI

struct SettingsView: View {
    var body: some View {
        Form {
            Section("アプリ情報") {
                LabeledContent("バージョン", value: "1.0.0")
                LabeledContent("APIエンドポイント") {
                    Text("effective-yomimono-api.ryosuke-horie37.workers.dev")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            Section("CLI連携") {
                Text("記事概要生成には claude または gemini CLI のインストールが必要です。")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .formStyle(.grouped)
        .navigationTitle("設定")
        .frame(width: 480, height: 200)
    }
}
