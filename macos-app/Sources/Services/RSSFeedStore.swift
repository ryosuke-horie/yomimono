/**
 * RSSフィード設定の永続化ストア
 * UserDefaults にフィード設定リストを保存・読み込みする
 */
import Foundation

@MainActor
final class RSSFeedStore: ObservableObject {
    static let shared = RSSFeedStore()

    private let key = "rss_feed_configs"
    @Published private(set) var feeds: [RSSFeedConfig] = []
    // 永続化エラーは UI 側で警告表示に使う
    @Published private(set) var persistenceError: String?

    private init() {
        load()
    }

    func add(url: String, title: String) {
        let feed = RSSFeedConfig(url: url, title: title)
        feeds.append(feed)
        save()
    }

    func remove(at offsets: IndexSet) {
        feeds.remove(atOffsets: offsets)
        save()
    }

    func remove(id: UUID) {
        feeds.removeAll { $0.id == id }
        save()
    }

    func update(_ feed: RSSFeedConfig) {
        if let idx = feeds.firstIndex(where: { $0.id == feed.id }) {
            feeds[idx] = feed
            save()
        }
    }

    func updateLastFetched(id: UUID, date: Date) {
        if let idx = feeds.firstIndex(where: { $0.id == id }) {
            feeds[idx].lastFetchedAt = date
            save()
        }
    }

    private func save() {
        do {
            let data = try JSONEncoder().encode(feeds)
            UserDefaults.standard.set(data, forKey: key)
            persistenceError = nil
        } catch {
            persistenceError = "フィード設定の保存に失敗しました: \(error.localizedDescription)"
        }
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: key) else {
            feeds = []
            return
        }
        do {
            feeds = try JSONDecoder().decode([RSSFeedConfig].self, from: data)
            persistenceError = nil
        } catch {
            // デコード失敗時は既存データを保護して空配列にフォールバック
            feeds = []
            persistenceError = "フィード設定の読み込みに失敗しました。設定がリセットされました。"
        }
    }
}
