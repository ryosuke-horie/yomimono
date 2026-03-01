/**
 * yomimono REST API クライアント
 * URLSession + async/await で各エンドポイントを呼び出す
 */
import Foundation

// MARK: - プロトコル（テスト時のモック差し替えに使用）

protocol BookmarkAPIClientProtocol: Sendable {
    func fetchUnreadBookmarks() async throws -> BookmarkListResponse
    func fetchFavoriteBookmarks() async throws -> FavoriteBookmarksResponse
    func fetchRecentBookmarks() async throws -> RecentBookmarksResponse
    func markAsRead(id: Int) async throws
    func markAsUnread(id: Int) async throws
    func addToFavorites(id: Int) async throws
    func removeFromFavorites(id: Int) async throws
    func bulkRegister(bookmarks: [(url: String, title: String)]) async throws
}

// MARK: - エラー型

enum BookmarkAPIError: Error, LocalizedError {
    case invalidURL
    case httpError(statusCode: Int, message: String)
    case decodingError(Error)
    case networkError(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "無効なURLです"
        case .httpError(let code, let message):
            return "APIエラー (\(code)): \(message)"
        case .decodingError(let error):
            return "レスポンスの解析に失敗しました: \(error.localizedDescription)"
        case .networkError(let error):
            return "ネットワークエラー: \(error.localizedDescription)"
        }
    }
}

final class BookmarkAPIClient: BookmarkAPIClientProtocol, Sendable {
    static let shared = BookmarkAPIClient()

    private let baseURL = "https://effective-yomimono-api.ryosuke-horie37.workers.dev"
    private let session: URLSession

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        self.session = URLSession(configuration: config)
    }

    // MARK: - 取得系

    func fetchUnreadBookmarks() async throws -> BookmarkListResponse {
        try await get("/api/bookmarks")
    }

    func fetchFavoriteBookmarks() async throws -> FavoriteBookmarksResponse {
        try await get("/api/bookmarks/favorites")
    }

    func fetchRecentBookmarks() async throws -> RecentBookmarksResponse {
        try await get("/api/bookmarks/recent")
    }

    // MARK: - 既読/未読

    func markAsRead(id: Int) async throws {
        let _: SuccessResponse = try await patch("/api/bookmarks/\(id)/read")
    }

    func markAsUnread(id: Int) async throws {
        let _: SuccessResponse = try await patch("/api/bookmarks/\(id)/unread")
    }

    // MARK: - お気に入り

    func addToFavorites(id: Int) async throws {
        let _: SuccessResponse = try await post("/api/bookmarks/\(id)/favorite")
    }

    func removeFromFavorites(id: Int) async throws {
        let _: SuccessResponse = try await delete("/api/bookmarks/\(id)/favorite")
    }

    // MARK: - ブックマーク登録

    func bulkRegister(bookmarks: [(url: String, title: String)]) async throws {
        let body = ["bookmarks": bookmarks.map { ["url": $0.url, "title": $0.title] }]
        let _: SuccessResponse = try await postWithBody("/api/bookmarks/bulk", body: body)
    }

    // MARK: - プライベートヘルパー

    private func get<T: Codable>(_ path: String) async throws -> T {
        guard let url = URL(string: baseURL + path) else { throw BookmarkAPIError.invalidURL }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        return try await perform(request)
    }

    private func patch<T: Codable>(_ path: String) async throws -> T {
        guard let url = URL(string: baseURL + path) else { throw BookmarkAPIError.invalidURL }
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        return try await perform(request)
    }

    private func post<T: Codable>(_ path: String) async throws -> T {
        guard let url = URL(string: baseURL + path) else { throw BookmarkAPIError.invalidURL }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        return try await perform(request)
    }

    private func postWithBody<T: Codable>(_ path: String, body: [String: Any]) async throws -> T {
        guard let url = URL(string: baseURL + path) else { throw BookmarkAPIError.invalidURL }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        return try await perform(request)
    }

    private func delete<T: Codable>(_ path: String) async throws -> T {
        guard let url = URL(string: baseURL + path) else { throw BookmarkAPIError.invalidURL }
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        return try await perform(request)
    }

    private func perform<T: Codable>(_ request: URLRequest) async throws -> T {
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw BookmarkAPIError.networkError(error)
        }

        if let http = response as? HTTPURLResponse, http.statusCode >= 400 {
            let message = (try? JSONDecoder().decode(APIErrorResponse.self, from: data))?.message ?? "不明なエラー"
            throw BookmarkAPIError.httpError(statusCode: http.statusCode, message: message)
        }

        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw BookmarkAPIError.decodingError(error)
        }
    }
}
