/**
 * yomimono API のブックマーク関連データモデル
 * API レスポンスを Codable で定義する
 * JSON キーは camelCase のままであるため keyDecodingStrategy は設定しない
 */
import Foundation

struct BookmarkWithFavorite: Codable, Identifiable, Sendable {
    let id: Int
    let url: String
    let title: String?
    let isRead: Bool
    let isFavorite: Bool
    let createdAt: String
    let updatedAt: String

    // 指定フィールドのみ変更したコピーを返す
    func copying(isRead: Bool? = nil, isFavorite: Bool? = nil) -> BookmarkWithFavorite {
        BookmarkWithFavorite(
            id: id, url: url, title: title,
            isRead: isRead ?? self.isRead,
            isFavorite: isFavorite ?? self.isFavorite,
            createdAt: createdAt, updatedAt: updatedAt
        )
    }
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
