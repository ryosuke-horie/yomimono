/**
 * 未読ブックマーク一覧のViewModel
 * API から未読ブックマークを取得し、既読化・お気に入りトグルを管理する
 */
import Foundation

@MainActor
final class UnreadBookmarksViewModel: ObservableObject {
    @Published var bookmarks: [BookmarkWithFavorite] = []
    @Published var isLoading = false
    // 一覧取得失敗（全画面エラー表示）
    @Published var loadError: String?
    // 操作失敗（インライン通知）
    @Published var mutationError: String?
    @Published var totalUnread = 0
    @Published var todayReadCount = 0

    private let api: BookmarkAPIClientProtocol

    init(api: BookmarkAPIClientProtocol = BookmarkAPIClient.shared) {
        self.api = api
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        loadError = nil
        do {
            let response = try await api.fetchUnreadBookmarks()
            bookmarks = response.bookmarks
            totalUnread = response.totalUnread
            todayReadCount = response.todayReadCount
        } catch {
            loadError = error.localizedDescription
        }
    }

    func markAsRead(bookmark: BookmarkWithFavorite) async {
        mutationError = nil
        do {
            try await api.markAsRead(id: bookmark.id)
            bookmarks.removeAll { $0.id == bookmark.id }
            totalUnread = max(0, totalUnread - 1)
            todayReadCount += 1
        } catch {
            mutationError = error.localizedDescription
        }
    }

    func markAsUnread(bookmark: BookmarkWithFavorite) async {
        mutationError = nil
        do {
            try await api.markAsUnread(id: bookmark.id)
            await load()
        } catch {
            mutationError = error.localizedDescription
        }
    }

    func toggleFavorite(bookmark: BookmarkWithFavorite) async {
        mutationError = nil
        do {
            if bookmark.isFavorite {
                try await api.removeFromFavorites(id: bookmark.id)
            } else {
                try await api.addToFavorites(id: bookmark.id)
            }
            if let idx = bookmarks.firstIndex(where: { $0.id == bookmark.id }) {
                bookmarks[idx] = bookmark.copying(isFavorite: !bookmark.isFavorite)
            }
        } catch {
            mutationError = error.localizedDescription
        }
    }
}
