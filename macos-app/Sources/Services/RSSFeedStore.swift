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
        if let data = try? JSONEncoder().encode(feeds) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: key),
              let decoded = try? JSONDecoder().decode([RSSFeedConfig].self, from: data) else {
            feeds = []
            return
        }
        feeds = decoded
    }
}
