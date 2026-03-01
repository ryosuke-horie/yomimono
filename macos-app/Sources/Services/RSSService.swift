/**
 * RSSフィード取得サービス
 * FeedKit を使用して RSS/Atom フィードをパースし、未登録アイテムを返す
 */
import Foundation
import FeedKit

actor RSSService {
    static let shared = RSSService()

    private init() {}

    // フィードURLからアイテムを取得してパース
    func fetchItems(from feedConfig: RSSFeedConfig) async throws -> [RSSFeedItem] {
        guard let url = URL(string: feedConfig.url) else {
            throw RSSError.invalidURL(feedConfig.url)
        }

        let feedTitle = feedConfig.title
        let parser = FeedParser(URL: url)

        return try await withCheckedThrowingContinuation { continuation in
            parser.parseAsync { result in
                switch result {
                case .success(let feed):
                    let items = Self.extractItems(from: feed, feedTitle: feedTitle)
                    continuation.resume(returning: items)
                case .failure(let error):
                    continuation.resume(throwing: RSSError.parseFailed(error.localizedDescription))
                }
            }
        }
    }

    // フィード種別に応じてアイテムを抽出（staticメソッドでactor境界を回避）
    private static func extractItems(from feed: Feed, feedTitle: String) -> [RSSFeedItem] {
        switch feed {
        case .rss(let rssFeed):
            return (rssFeed.items ?? []).compactMap { item in
                guard let title = item.title, let link = item.link else { return nil }
                return RSSFeedItem(
                    id: item.guid?.value ?? link,
                    title: title,
                    url: link,
                    publishedAt: item.pubDate,
                    feedTitle: feedTitle,
                    isRegistered: false
                )
            }
        case .atom(let atomFeed):
            return (atomFeed.entries ?? []).compactMap { entry in
                guard let title = entry.title,
                      let link = entry.links?.first?.attributes?.href else { return nil }
                return RSSFeedItem(
                    id: entry.id ?? link,
                    title: title,
                    url: link,
                    publishedAt: entry.published,
                    feedTitle: feedTitle,
                    isRegistered: false
                )
            }
        case .json(let jsonFeed):
            return (jsonFeed.items ?? []).compactMap { item in
                guard let title = item.title, let url = item.url else { return nil }
                return RSSFeedItem(
                    id: item.id ?? url,
                    title: title,
                    url: url,
                    publishedAt: item.datePublished,
                    feedTitle: feedTitle,
                    isRegistered: false
                )
            }
        }
    }
}

enum RSSError: LocalizedError {
    case invalidURL(String)
    case parseFailed(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL(let url):
            return "無効なURL: \(url)"
        case .parseFailed(let msg):
            return "フィードの解析に失敗しました: \(msg)"
        }
    }
}
