/**
 * yomimono API のブックマーク関連データモデル
 * API レスポンスを Codable で定義する
 */
import Foundation

struct BookmarkWithFavorite: Codable, Identifiable {
    let id: Int
    let url: String
    let title: String?
    let isRead: Bool
    let isFavorite: Bool
    let createdAt: String
    let updatedAt: String
}

struct BookmarkListResponse: Codable {
    let success: Bool
    let bookmarks: [BookmarkWithFavorite]
    let totalUnread: Int
    let todayReadCount: Int
}

struct FavoriteBookmarksResponse: Codable {
    let success: Bool
    let bookmarks: [BookmarkWithFavorite]
    let total: Int
}

struct RecentBookmarksResponse: Codable {
    let success: Bool
    // "YYYY-MM-DD" をキーとした日付ごとのグループ
    let bookmarks: [String: [BookmarkWithFavorite]]
}

struct SuccessResponse: Codable {
    let success: Bool
}

struct APIErrorResponse: Codable {
    let success: Bool
    let message: String
}
