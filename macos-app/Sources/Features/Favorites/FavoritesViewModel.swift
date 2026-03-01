/**
 * お気に入りブックマーク一覧のViewModel
 * API からお気に入りを取得し、お気に入り解除・既読化を管理する
 */
import SwiftUI

@MainActor
final class FavoritesViewModel: ObservableObject {
    @Published var bookmarks: [BookmarkWithFavorite] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var total = 0

    private let api = BookmarkAPIClient.shared

    func load() async {
        isLoading = true
        errorMessage = nil
        do {
            let response = try await api.fetchFavoriteBookmarks()
            bookmarks = response.bookmarks
            total = response.total
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func markAsRead(bookmark: BookmarkWithFavorite) async {
        do {
            try await api.markAsRead(id: bookmark.id)
            if let idx = bookmarks.firstIndex(where: { $0.id == bookmark.id }) {
                let updated = BookmarkWithFavorite(
                    id: bookmark.id,
                    url: bookmark.url,
                    title: bookmark.title,
                    isRead: true,
                    isFavorite: bookmark.isFavorite,
                    createdAt: bookmark.createdAt,
                    updatedAt: bookmark.updatedAt
                )
                bookmarks[idx] = updated
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func markAsUnread(bookmark: BookmarkWithFavorite) async {
        do {
            try await api.markAsUnread(id: bookmark.id)
            if let idx = bookmarks.firstIndex(where: { $0.id == bookmark.id }) {
                let updated = BookmarkWithFavorite(
                    id: bookmark.id,
                    url: bookmark.url,
                    title: bookmark.title,
                    isRead: false,
                    isFavorite: bookmark.isFavorite,
                    createdAt: bookmark.createdAt,
                    updatedAt: bookmark.updatedAt
                )
                bookmarks[idx] = updated
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func removeFromFavorites(bookmark: BookmarkWithFavorite) async {
        do {
            try await api.removeFromFavorites(id: bookmark.id)
            bookmarks.removeAll { $0.id == bookmark.id }
            total = max(0, total - 1)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func toggleFavorite(bookmark: BookmarkWithFavorite) async {
        if bookmark.isFavorite {
            await removeFromFavorites(bookmark: bookmark)
        } else {
            do {
                try await api.addToFavorites(id: bookmark.id)
                await load()
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}
