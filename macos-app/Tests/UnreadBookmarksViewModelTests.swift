/**
 * UnreadBookmarksViewModel のユニットテスト
 * load / markAsRead / markAsUnread / toggleFavorite のビジネスロジックを検証する
 */
import Foundation
import Testing
@testable import yomimono

@MainActor
struct UnreadBookmarksViewModelTests {

    // MARK: - load

    @Test("load: API成功時にブックマーク一覧・統計を更新する")
    func loadSuccess() async {
        let mock = MockBookmarkAPIClient()
        let bookmark = MockBookmarkAPIClient.makeBookmark(id: 1)
        mock.fetchUnreadResult = .success(
            BookmarkListResponse(success: true, bookmarks: [bookmark], totalUnread: 5, todayReadCount: 2)
        )
        let vm = UnreadBookmarksViewModel(api: mock)

        await vm.load()

        #expect(vm.bookmarks.count == 1)
        #expect(vm.bookmarks[0].id == 1)
        #expect(vm.totalUnread == 5)
        #expect(vm.todayReadCount == 2)
        #expect(vm.loadError == nil)
        #expect(!vm.isLoading)
    }

    @Test("load: API失敗時にloadErrorを設定しブックマークは空のまま")
    func loadFailure() async {
        let mock = MockBookmarkAPIClient()
        mock.fetchUnreadResult = .failure(BookmarkAPIError.networkError(URLError(.notConnectedToInternet)))
        let vm = UnreadBookmarksViewModel(api: mock)

        await vm.load()

        #expect(vm.bookmarks.isEmpty)
        #expect(vm.loadError != nil)
        #expect(!vm.isLoading)  // defer で isLoading が false に戻ることを確認
    }

    // MARK: - markAsRead

    @Test("markAsRead: 既読化後にブックマークを一覧から削除しカウンタを更新する")
    func markAsReadSuccess() async {
        let mock = MockBookmarkAPIClient()
        let bookmark = MockBookmarkAPIClient.makeBookmark(id: 1)
        mock.fetchUnreadResult = .success(
            BookmarkListResponse(success: true, bookmarks: [bookmark], totalUnread: 1, todayReadCount: 0)
        )
        let vm = UnreadBookmarksViewModel(api: mock)
        await vm.load()

        await vm.markAsRead(bookmark: bookmark)

        #expect(vm.bookmarks.isEmpty)
        #expect(vm.totalUnread == 0)
        #expect(vm.todayReadCount == 1)
        #expect(mock.markAsReadCalledIds == [1])
        #expect(vm.mutationError == nil)
    }

    @Test("markAsRead: API失敗時にmutationErrorを設定しブックマークは削除しない")
    func markAsReadFailure() async {
        let mock = MockBookmarkAPIClient()
        let bookmark = MockBookmarkAPIClient.makeBookmark(id: 1)
        mock.fetchUnreadResult = .success(
            BookmarkListResponse(success: true, bookmarks: [bookmark], totalUnread: 1, todayReadCount: 0)
        )
        mock.markAsReadResult = .failure(BookmarkAPIError.networkError(URLError(.notConnectedToInternet)))
        let vm = UnreadBookmarksViewModel(api: mock)
        await vm.load()

        await vm.markAsRead(bookmark: bookmark)

        #expect(vm.bookmarks.count == 1)
        #expect(vm.mutationError != nil)
    }

    @Test("markAsRead: totalUnreadが0の状態でも負数にならない")
    func markAsReadDoesNotUnderflowTotalUnread() async {
        let mock = MockBookmarkAPIClient()
        let bookmark = MockBookmarkAPIClient.makeBookmark(id: 1)
        mock.fetchUnreadResult = .success(
            BookmarkListResponse(success: true, bookmarks: [bookmark], totalUnread: 0, todayReadCount: 0)
        )
        let vm = UnreadBookmarksViewModel(api: mock)
        await vm.load()

        await vm.markAsRead(bookmark: bookmark)

        #expect(vm.totalUnread == 0)
    }

    // MARK: - markAsUnread

    @Test("markAsUnread: 未読化後に一覧を再読み込みする")
    func markAsUnreadSuccess() async {
        let mock = MockBookmarkAPIClient()
        let bookmark = MockBookmarkAPIClient.makeBookmark(id: 1)
        mock.fetchUnreadResult = .success(
            BookmarkListResponse(success: true, bookmarks: [bookmark], totalUnread: 1, todayReadCount: 0)
        )
        let vm = UnreadBookmarksViewModel(api: mock)

        await vm.markAsUnread(bookmark: bookmark)

        #expect(mock.markAsUnreadCalledIds == [1])
        #expect(vm.bookmarks.count == 1)
        #expect(vm.mutationError == nil)
    }

    @Test("markAsUnread: API失敗時にmutationErrorを設定する")
    func markAsUnreadFailure() async {
        let mock = MockBookmarkAPIClient()
        mock.markAsUnreadResult = .failure(BookmarkAPIError.networkError(URLError(.notConnectedToInternet)))
        let vm = UnreadBookmarksViewModel(api: mock)

        await vm.markAsUnread(bookmark: MockBookmarkAPIClient.makeBookmark())

        #expect(vm.mutationError != nil)
    }

    // MARK: - toggleFavorite

    @Test("toggleFavorite: 非お気に入りブックマークをお気に入りに追加する")
    func toggleFavoriteAdd() async {
        let mock = MockBookmarkAPIClient()
        let bookmark = MockBookmarkAPIClient.makeBookmark(id: 1, isFavorite: false)
        mock.fetchUnreadResult = .success(
            BookmarkListResponse(success: true, bookmarks: [bookmark], totalUnread: 1, todayReadCount: 0)
        )
        let vm = UnreadBookmarksViewModel(api: mock)
        await vm.load()

        await vm.toggleFavorite(bookmark: bookmark)

        #expect(mock.addToFavoritesCalledIds == [1])
        #expect(vm.bookmarks[0].isFavorite == true)
        #expect(vm.mutationError == nil)
    }

    @Test("toggleFavorite: お気に入りブックマークをお気に入りから解除する")
    func toggleFavoriteRemove() async {
        let mock = MockBookmarkAPIClient()
        let bookmark = MockBookmarkAPIClient.makeBookmark(id: 1, isFavorite: true)
        mock.fetchUnreadResult = .success(
            BookmarkListResponse(success: true, bookmarks: [bookmark], totalUnread: 1, todayReadCount: 0)
        )
        let vm = UnreadBookmarksViewModel(api: mock)
        await vm.load()

        await vm.toggleFavorite(bookmark: bookmark)

        #expect(mock.removeFromFavoritesCalledIds == [1])
        #expect(vm.bookmarks[0].isFavorite == false)
        #expect(vm.mutationError == nil)
    }

    @Test("toggleFavorite: addToFavorites失敗時にmutationErrorを設定しisFavoriteは変化しない")
    func toggleFavoriteAddFailure() async {
        let mock = MockBookmarkAPIClient()
        let bookmark = MockBookmarkAPIClient.makeBookmark(id: 1, isFavorite: false)
        mock.fetchUnreadResult = .success(
            BookmarkListResponse(success: true, bookmarks: [bookmark], totalUnread: 1, todayReadCount: 0)
        )
        mock.addToFavoritesResult = .failure(BookmarkAPIError.networkError(URLError(.notConnectedToInternet)))
        let vm = UnreadBookmarksViewModel(api: mock)
        await vm.load()

        await vm.toggleFavorite(bookmark: bookmark)

        #expect(vm.bookmarks[0].isFavorite == false)
        #expect(vm.mutationError != nil)
    }

    @Test("toggleFavorite: removeFromFavorites失敗時にmutationErrorを設定しisFavoriteは変化しない")
    func toggleFavoriteRemoveFailure() async {
        let mock = MockBookmarkAPIClient()
        let bookmark = MockBookmarkAPIClient.makeBookmark(id: 1, isFavorite: true)
        mock.fetchUnreadResult = .success(
            BookmarkListResponse(success: true, bookmarks: [bookmark], totalUnread: 1, todayReadCount: 0)
        )
        mock.removeFromFavoritesResult = .failure(BookmarkAPIError.networkError(URLError(.notConnectedToInternet)))
        let vm = UnreadBookmarksViewModel(api: mock)
        await vm.load()

        await vm.toggleFavorite(bookmark: bookmark)

        #expect(vm.bookmarks[0].isFavorite == true)
        #expect(vm.mutationError != nil)
    }
}
