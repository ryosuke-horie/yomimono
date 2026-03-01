/**
 * 最近読んだブックマーク一覧のViewModel
 * API から日付グループ別に取得し、既読化・お気に入りトグルを管理する
 */
import Foundation

@MainActor
final class RecentViewModel: ObservableObject {
    @Published var groupedBookmarks: [(date: String, bookmarks: [BookmarkWithFavorite])] = []
    @Published var isLoading = false
    @Published var loadError: String?
    @Published var mutationError: String?

    private let api = BookmarkAPIClient.shared

    func load() async {
        isLoading = true
        defer { isLoading = false }
        loadError = nil
        do {
            let response = try await api.fetchRecentBookmarks()
            groupedBookmarks = response.bookmarks
                .sorted { $0.key > $1.key }
                .map { (date: $0.key, bookmarks: $0.value) }
        } catch {
            loadError = error.localizedDescription
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

    func markAsRead(bookmark: BookmarkWithFavorite) async {
        mutationError = nil
        do {
            try await api.markAsRead(id: bookmark.id)
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
            for i in groupedBookmarks.indices {
                if let j = groupedBookmarks[i].bookmarks.firstIndex(where: { $0.id == bookmark.id }) {
                    groupedBookmarks[i].bookmarks[j] = bookmark.copying(isFavorite: !bookmark.isFavorite)
                }
            }
        } catch {
            mutationError = error.localizedDescription
        }
    }
}
