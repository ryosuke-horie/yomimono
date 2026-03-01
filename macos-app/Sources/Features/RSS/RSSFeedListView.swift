/**
 * RSSフィード一覧画面（Phase 3 実装予定のスタブ）
 * 登録済みRSSフィードを表示し、新規記事取得・ブックマーク登録を行う
 */
import SwiftUI

struct RSSFeedListView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "dot.radiowaves.left.and.right")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("RSSフィード")
                .font(.headline)
            Text("この機能は Phase 3 で実装予定です")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .navigationTitle("RSSフィード")
    }
}
