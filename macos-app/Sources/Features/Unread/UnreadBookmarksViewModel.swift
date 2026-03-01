/**
 * 未読ブックマーク一覧のViewModel
 * API から未読ブックマークを取得し、既読化・お気に入りトグルを管理する
 */
import SwiftUI

@MainActor
final class UnreadBookmarksViewModel: ObservableObject {
    @Published var bookmarks: [BookmarkWithFavorite] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var totalUnread = 0
    @Published var todayReadCount = 0

    private let api = BookmarkAPIClient.shared

    func load() async {
        isLoading = true
        errorMessage = nil
        do {
            let response = try await api.fetchUnreadBookmarks()
            bookmarks = response.bookmarks
            totalUnread = response.totalUnread
            todayReadCount = response.todayReadCount
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func markAsRead(bookmark: BookmarkWithFavorite) async {
        do {
            try await api.markAsRead(id: bookmark.id)
            bookmarks.removeAll { $0.id == bookmark.id }
            totalUnread = max(0, totalUnread - 1)
            todayReadCount += 1
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func markAsUnread(bookmark: BookmarkWithFavorite) async {
        do {
            try await api.markAsUnread(id: bookmark.id)
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func toggleFavorite(bookmark: BookmarkWithFavorite) async {
        do {
            if bookmark.isFavorite {
                try await api.removeFromFavorites(id: bookmark.id)
            } else {
                try await api.addToFavorites(id: bookmark.id)
            }
            if let idx = bookmarks.firstIndex(where: { $0.id == bookmark.id }) {
                let updated = BookmarkWithFavorite(
                    id: bookmark.id,
                    url: bookmark.url,
                    title: bookmark.title,
                    isRead: bookmark.isRead,
                    isFavorite: !bookmark.isFavorite,
                    createdAt: bookmark.createdAt,
                    updatedAt: bookmark.updatedAt
                )
                bookmarks[idx] = updated
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
