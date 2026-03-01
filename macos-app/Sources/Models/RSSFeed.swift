/**
 * RSSフィード関連のデータモデル
 * UserDefaults に保存するフィード設定と取得済みアイテムを定義する
 */
import Foundation

struct RSSFeedConfig: Codable, Identifiable, Equatable {
    let id: UUID
    var url: String
    var title: String
    var isEnabled: Bool
    var lastFetchedAt: Date?

    init(id: UUID = UUID(), url: String, title: String, isEnabled: Bool = true) {
        self.id = id
        self.url = url
        self.title = title
        self.isEnabled = isEnabled
    }
}

struct RSSFeedItem: Identifiable {
    let id: String
    let title: String
    let url: String
    let publishedAt: Date?
    let feedTitle: String
    var isRegistered: Bool
}
