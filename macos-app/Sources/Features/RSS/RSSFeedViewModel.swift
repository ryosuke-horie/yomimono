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
        defer { isLoading = false }
        errorMessage = nil
        feedItems = []

        let enabledFeeds = store.feeds.filter { $0.isEnabled }
        guard !enabledFeeds.isEmpty else { return }

        // 各フィードを並列取得し、失敗を収集して報告する
        var fetchedItems: [RSSFeedItem] = []
        var failedFeedTitles: [String] = []

        await withTaskGroup(of: (feed: RSSFeedConfig, result: Result<[RSSFeedItem], Error>).self) { group in
            for feed in enabledFeeds {
                group.addTask {
                    do {
                        let items = try await self.rssService.fetchItems(from: feed)
                        return (feed: feed, result: .success(items))
                    } catch {
                        return (feed: feed, result: .failure(error))
                    }
                }
            }
            for await (feed, result) in group {
                switch result {
                case .success(let items):
                    fetchedItems.append(contentsOf: items)
                    // store.updateLastFetched は @MainActor なので TaskGroup 外から呼ぶ
                    store.updateLastFetched(id: feed.id, date: Date())
                case .failure:
                    failedFeedTitles.append(feed.title)
                }
            }
        }

        feedItems = fetchedItems.sorted { ($0.publishedAt ?? .distantPast) > ($1.publishedAt ?? .distantPast) }

        if !failedFeedTitles.isEmpty {
            errorMessage = "以下のフィードの取得に失敗しました:\n" + failedFeedTitles.joined(separator: "\n")
        }
    }

    // 選択したアイテムを yomimono API に一括登録
    func register(items: [RSSFeedItem]) async {
        isLoading = true
        defer { isLoading = false }
        errorMessage = nil
        successMessage = nil
        let bookmarks = items.map { (url: $0.url, title: $0.title) }
        do {
            try await api.bulkRegister(bookmarks: bookmarks)
            successMessage = "\(items.count)件の記事を登録しました"
            for item in items {
                if let idx = feedItems.firstIndex(where: { $0.id == item.id }) {
                    feedItems[idx].isRegistered = true
                }
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func addFeed(url: String, title: String) {
        store.add(url: url, title: title)
    }

    func removeFeed(at offsets: IndexSet) {
        store.remove(at: offsets)
    }
}
