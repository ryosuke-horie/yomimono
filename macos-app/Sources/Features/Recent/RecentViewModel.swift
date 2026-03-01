/**
 * 最近読んだブックマーク一覧のViewModel
 * API から日付グループ別に取得し、既読化・お気に入りトグルを管理する
 */
import SwiftUI

@MainActor
final class RecentViewModel: ObservableObject {
    @Published var groupedBookmarks: [(date: String, bookmarks: [BookmarkWithFavorite])] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let api = BookmarkAPIClient.shared

    func load() async {
        isLoading = true
        errorMessage = nil
        do {
            let response = try await api.fetchRecentBookmarks()
            // 日付降順でソート
            groupedBookmarks = response.bookmarks
                .sorted { $0.key > $1.key }
                .map { (date: $0.key, bookmarks: $0.value) }
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func markAsUnread(bookmark: BookmarkWithFavorite) async {
        do {
            try await api.markAsUnread(id: bookmark.id)
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func markAsRead(bookmark: BookmarkWithFavorite) async {
        do {
            try await api.markAsRead(id: bookmark.id)
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
            // ローカル状態を更新
            for i in groupedBookmarks.indices {
                if let j = groupedBookmarks[i].bookmarks.firstIndex(where: { $0.id == bookmark.id }) {
                    let b = groupedBookmarks[i].bookmarks[j]
                    groupedBookmarks[i].bookmarks[j] = BookmarkWithFavorite(
                        id: b.id,
                        url: b.url,
                        title: b.title,
                        isRead: b.isRead,
                        isFavorite: !b.isFavorite,
                        createdAt: b.createdAt,
                        updatedAt: b.updatedAt
                    )
                }
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
