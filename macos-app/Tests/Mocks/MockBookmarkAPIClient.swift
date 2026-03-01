/**
 * テスト用モック API クライアント
 * BookmarkAPIClientProtocol を実装し、API レスポンスを設定可能にする
 * @MainActor で実行されるため、可変プロパティへのアクセスは安全
 */
import Foundation
@testable import yomimono

@MainActor
final class MockBookmarkAPIClient: BookmarkAPIClientProtocol, @unchecked Sendable {

    // MARK: - 設定可能なレスポンス

    var fetchUnreadResult: Result<BookmarkListResponse, Error> = .success(
        BookmarkListResponse(success: true, bookmarks: [], totalUnread: 0, todayReadCount: 0)
    )
    var fetchFavoriteResult: Result<FavoriteBookmarksResponse, Error> = .success(
        FavoriteBookmarksResponse(success: true, bookmarks: [])
    )
    var fetchRecentResult: Result<RecentBookmarksResponse, Error> = .success(
        RecentBookmarksResponse(success: true, bookmarks: [:])
    )
    var markAsReadResult: Result<Void, Error> = .success(())
    var markAsUnreadResult: Result<Void, Error> = .success(())
    var addToFavoritesResult: Result<Void, Error> = .success(())
    var removeFromFavoritesResult: Result<Void, Error> = .success(())
    var bulkRegisterResult: Result<Void, Error> = .success(())

    // MARK: - 呼び出し追跡

    var markAsReadCalledIds: [Int] = []
    var markAsUnreadCalledIds: [Int] = []
    var addToFavoritesCalledIds: [Int] = []
    var removeFromFavoritesCalledIds: [Int] = []

    // MARK: - BookmarkAPIClientProtocol 実装

    func fetchUnreadBookmarks() async throws -> BookmarkListResponse {
        try fetchUnreadResult.get()
    }

    func fetchFavoriteBookmarks() async throws -> FavoriteBookmarksResponse {
        try fetchFavoriteResult.get()
    }

    func fetchRecentBookmarks() async throws -> RecentBookmarksResponse {
        try fetchRecentResult.get()
    }

    func markAsRead(id: Int) async throws {
        markAsReadCalledIds.append(id)
        try markAsReadResult.get()
    }

    func markAsUnread(id: Int) async throws {
        markAsUnreadCalledIds.append(id)
        try markAsUnreadResult.get()
    }

    func addToFavorites(id: Int) async throws {
        addToFavoritesCalledIds.append(id)
        try addToFavoritesResult.get()
    }

    func removeFromFavorites(id: Int) async throws {
        removeFromFavoritesCalledIds.append(id)
        try removeFromFavoritesResult.get()
    }

    func bulkRegister(bookmarks: [(url: String, title: String)]) async throws {
        try bulkRegisterResult.get()
    }
}

// MARK: - テスト用ヘルパー

extension MockBookmarkAPIClient {
    /// テスト用ブックマークを生成するファクトリメソッド
    static func makeBookmark(
        id: Int = 1,
        url: String = "https://example.com",
        title: String? = "テスト記事",
        isRead: Bool = false,
        isFavorite: Bool = false
    ) -> BookmarkWithFavorite {
        BookmarkWithFavorite(
            id: id,
            url: url,
            title: title,
            isRead: isRead,
            isFavorite: isFavorite,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z"
        )
    }
}
