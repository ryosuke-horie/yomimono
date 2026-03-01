/**
 * RSSフィード一覧のViewModel
 * フィード設定の管理・アイテム取得・yomimono APIへの一括登録を担当する
 */
import SwiftUI

@MainActor
final class RSSFeedViewModel: ObservableObject {
    @Published var feedItems: [RSSFeedItem] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var successMessage: String?

    private let store = RSSFeedStore.shared
    private let rssService = RSSService.shared
    private let api = BookmarkAPIClient.shared

    var feeds: [RSSFeedConfig] { store.feeds }

    // 全有効フィードからアイテムを取得
    func fetchAll() async {
        isLoading = true
        errorMessage = nil
        feedItems = []

        let enabledFeeds = store.feeds.filter { $0.isEnabled }
        guard !enabledFeeds.isEmpty else {
            isLoading = false
            return
        }

        await withTaskGroup(of: [RSSFeedItem].self) { group in
            for feed in enabledFeeds {
                group.addTask {
                    do {
                        let items = try await self.rssService.fetchItems(from: feed)
                        await self.store.updateLastFetched(id: feed.id, date: Date())
                        return items
                    } catch {
                        return []
                    }
                }
            }
            for await items in group {
                feedItems.append(contentsOf: items)
            }
        }

        // 登録日時降順でソート
        feedItems.sort { ($0.publishedAt ?? .distantPast) > ($1.publishedAt ?? .distantPast) }
        isLoading = false
    }

    // 選択したアイテムを yomimono API に一括登録
    func register(items: [RSSFeedItem]) async {
        isLoading = true
        errorMessage = nil
        successMessage = nil
        let bookmarks = items.map { (url: $0.url, title: $0.title) }
        do {
            try await api.bulkRegister(bookmarks: bookmarks)
            successMessage = "\(items.count)件の記事を登録しました"
            // 登録済みにマーク
            for item in items {
                if let idx = feedItems.firstIndex(where: { $0.id == item.id }) {
                    feedItems[idx].isRegistered = true
                }
            }
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    // フィードを追加
    func addFeed(url: String, title: String) {
        store.add(url: url, title: title)
    }

    // フィードを削除
    func removeFeed(at offsets: IndexSet) {
        store.remove(at: offsets)
    }
}
