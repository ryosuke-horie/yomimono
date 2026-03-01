/**
 * お気に入りブックマーク一覧のViewModel
 * API からお気に入りを取得し、お気に入り解除・既読化を管理する
 */
import Foundation

@MainActor
final class FavoritesViewModel: ObservableObject {
    @Published var bookmarks: [BookmarkWithFavorite] = []
    @Published var isLoading = false
    @Published var loadError: String?
    @Published var mutationError: String?
    @Published var total = 0

    private let api = BookmarkAPIClient.shared

    func load() async {
        isLoading = true
        defer { isLoading = false }
        loadError = nil
        do {
            let response = try await api.fetchFavoriteBookmarks()
            bookmarks = response.bookmarks
            total = response.bookmarks.count
        } catch {
            loadError = error.localizedDescription
        }
    }

    func markAsRead(bookmark: BookmarkWithFavorite) async {
        mutationError = nil
        do {
            try await api.markAsRead(id: bookmark.id)
            if let idx = bookmarks.firstIndex(where: { $0.id == bookmark.id }) {
                bookmarks[idx] = bookmark.copying(isRead: true)
            }
        } catch {
            mutationError = error.localizedDescription
        }
    }

    func markAsUnread(bookmark: BookmarkWithFavorite) async {
        mutationError = nil
        do {
            try await api.markAsUnread(id: bookmark.id)
            if let idx = bookmarks.firstIndex(where: { $0.id == bookmark.id }) {
                bookmarks[idx] = bookmark.copying(isRead: false)
            }
        } catch {
            mutationError = error.localizedDescription
        }
    }

    func removeFromFavorites(bookmark: BookmarkWithFavorite) async {
        mutationError = nil
        do {
            try await api.removeFromFavorites(id: bookmark.id)
            bookmarks.removeAll { $0.id == bookmark.id }
            total = max(0, total - 1)
        } catch {
            mutationError = error.localizedDescription
        }
    }

    func toggleFavorite(bookmark: BookmarkWithFavorite) async {
        if bookmark.isFavorite {
            await removeFromFavorites(bookmark: bookmark)
        } else {
            mutationError = nil
            do {
                try await api.addToFavorites(id: bookmark.id)
                await load()
            } catch {
                mutationError = error.localizedDescription
            }
        }
    }
}
