/**
 * RecentViewModel のユニットテスト
 * load / markAsRead / markAsUnread / toggleFavorite のビジネスロジックを検証する
 */
import Foundation
import Testing
@testable import yomimono

@MainActor
struct RecentViewModelTests {

    // MARK: - load

    @Test("load: API成功時に日付グループ別に降順でブックマークを設定する")
    func loadSuccess() async {
        let mock = MockBookmarkAPIClient()
        let bookmark1 = MockBookmarkAPIClient.makeBookmark(id: 1)
        let bookmark2 = MockBookmarkAPIClient.makeBookmark(id: 2)
        mock.fetchRecentResult = .success(
            RecentBookmarksResponse(
                success: true,
                bookmarks: [
                    "2024-01-01": [bookmark1],
                    "2024-01-02": [bookmark2]
                ]
            )
        )
        let vm = RecentViewModel(api: mock)

        await vm.load()

        #expect(vm.groupedBookmarks.count == 2)
        // 日付の降順（新しい順）であることを確認
        #expect(vm.groupedBookmarks[0].date == "2024-01-02")
        #expect(vm.groupedBookmarks[1].date == "2024-01-01")
        #expect(vm.loadError == nil)
        #expect(!vm.isLoading)
    }

    @Test("load: API失敗時にloadErrorを設定しグループは空のまま")
    func loadFailure() async {
        let mock = MockBookmarkAPIClient()
        mock.fetchRecentResult = .failure(BookmarkAPIError.networkError(URLError(.notConnectedToInternet)))
        let vm = RecentViewModel(api: mock)

        await vm.load()

        #expect(vm.groupedBookmarks.isEmpty)
        #expect(vm.loadError != nil)
        #expect(!vm.isLoading)
    }

    // MARK: - markAsRead

    @Test("markAsRead: API呼び出し後に一覧を再読み込みする")
    func markAsReadSuccess() async {
        let mock = MockBookmarkAPIClient()
        let bookmark = MockBookmarkAPIClient.makeBookmark(id: 1)
        mock.fetchRecentResult = .success(
            RecentBookmarksResponse(success: true, bookmarks: ["2024-01-01": [bookmark]])
        )
        let vm = RecentViewModel(api: mock)

        await vm.markAsRead(bookmark: bookmark)

        #expect(mock.markAsReadCalledIds == [1])
        #expect(vm.groupedBookmarks.count == 1)
        #expect(vm.mutationError == nil)
    }

    @Test("markAsRead: API失敗時にmutationErrorを設定する")
    func markAsReadFailure() async {
        let mock = MockBookmarkAPIClient()
        mock.markAsReadResult = .failure(BookmarkAPIError.networkError(URLError(.notConnectedToInternet)))
        let vm = RecentViewModel(api: mock)

        await vm.markAsRead(bookmark: MockBookmarkAPIClient.makeBookmark())

        #expect(vm.mutationError != nil)
    }

    // MARK: - markAsUnread

    @Test("markAsUnread: API呼び出し後に一覧を再読み込みする")
    func markAsUnreadSuccess() async {
        let mock = MockBookmarkAPIClient()
        let bookmark = MockBookmarkAPIClient.makeBookmark(id: 1)
        mock.fetchRecentResult = .success(
            RecentBookmarksResponse(success: true, bookmarks: ["2024-01-01": [bookmark]])
        )
        let vm = RecentViewModel(api: mock)

        await vm.markAsUnread(bookmark: bookmark)

        #expect(mock.markAsUnreadCalledIds == [1])
        #expect(vm.groupedBookmarks.count == 1)  // リロード後の件数を確認
        #expect(vm.mutationError == nil)
    }

    @Test("markAsUnread: API失敗時にmutationErrorを設定する")
    func markAsUnreadFailure() async {
        let mock = MockBookmarkAPIClient()
        mock.markAsUnreadResult = .failure(BookmarkAPIError.networkError(URLError(.notConnectedToInternet)))
        let vm = RecentViewModel(api: mock)

        await vm.markAsUnread(bookmark: MockBookmarkAPIClient.makeBookmark())

        #expect(vm.mutationError != nil)
    }

    // MARK: - toggleFavorite

    @Test("toggleFavorite: 非お気に入りをお気に入りに追加してローカル状態を更新する")
    func toggleFavoriteAdd() async {
        let mock = MockBookmarkAPIClient()
        let bookmark = MockBookmarkAPIClient.makeBookmark(id: 1, isFavorite: false)
        mock.fetchRecentResult = .success(
            RecentBookmarksResponse(success: true, bookmarks: ["2024-01-01": [bookmark]])
        )
        let vm = RecentViewModel(api: mock)
        await vm.load()

        await vm.toggleFavorite(bookmark: bookmark)

        #expect(mock.addToFavoritesCalledIds == [1])
        #expect(vm.groupedBookmarks[0].bookmarks[0].isFavorite == true)
        #expect(vm.mutationError == nil)
    }

    @Test("toggleFavorite: お気に入りを解除してローカル状態を更新する")
    func toggleFavoriteRemove() async {
        let mock = MockBookmarkAPIClient()
        let bookmark = MockBookmarkAPIClient.makeBookmark(id: 1, isFavorite: true)
        mock.fetchRecentResult = .success(
            RecentBookmarksResponse(success: true, bookmarks: ["2024-01-01": [bookmark]])
        )
        let vm = RecentViewModel(api: mock)
        await vm.load()

        await vm.toggleFavorite(bookmark: bookmark)

        #expect(mock.removeFromFavoritesCalledIds == [1])
        #expect(vm.groupedBookmarks[0].bookmarks[0].isFavorite == false)
        #expect(vm.mutationError == nil)
    }

    @Test("toggleFavorite: addToFavorites失敗時にmutationErrorを設定しisFavoriteは変化しない")
    func toggleFavoriteAddFailure() async {
        let mock = MockBookmarkAPIClient()
        let bookmark = MockBookmarkAPIClient.makeBookmark(id: 1, isFavorite: false)
        mock.fetchRecentResult = .success(
            RecentBookmarksResponse(success: true, bookmarks: ["2024-01-01": [bookmark]])
        )
        mock.addToFavoritesResult = .failure(BookmarkAPIError.networkError(URLError(.notConnectedToInternet)))
        let vm = RecentViewModel(api: mock)
        await vm.load()

        await vm.toggleFavorite(bookmark: bookmark)

        #expect(vm.groupedBookmarks[0].bookmarks[0].isFavorite == false)
        #expect(vm.mutationError != nil)
    }

    @Test("toggleFavorite: removeFromFavorites失敗時にmutationErrorを設定しisFavoriteは変化しない")
    func toggleFavoriteRemoveFailure() async {
        let mock = MockBookmarkAPIClient()
        let bookmark = MockBookmarkAPIClient.makeBookmark(id: 1, isFavorite: true)
        mock.fetchRecentResult = .success(
            RecentBookmarksResponse(success: true, bookmarks: ["2024-01-01": [bookmark]])
        )
        mock.removeFromFavoritesResult = .failure(BookmarkAPIError.networkError(URLError(.notConnectedToInternet)))
        let vm = RecentViewModel(api: mock)
        await vm.load()

        await vm.toggleFavorite(bookmark: bookmark)

        #expect(vm.groupedBookmarks[0].bookmarks[0].isFavorite == true)
        #expect(vm.mutationError != nil)
    }
}
