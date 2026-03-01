/**
 * FavoritesViewModel のユニットテスト
 * load / markAsRead / markAsUnread / removeFromFavorites / toggleFavorite のビジネスロジックを検証する
 */
import Foundation
import Testing
@testable import yomimono

@MainActor
struct FavoritesViewModelTests {

    // MARK: - load

    @Test("load: API成功時にお気に入り一覧とtotalを更新する")
    func loadSuccess() async {
        let mock = MockBookmarkAPIClient()
        let bookmark1 = MockBookmarkAPIClient.makeBookmark(id: 1, isFavorite: true)
        let bookmark2 = MockBookmarkAPIClient.makeBookmark(id: 2, isFavorite: true)
        mock.fetchFavoriteResult = .success(
            FavoriteBookmarksResponse(success: true, bookmarks: [bookmark1, bookmark2])
        )
        let vm = FavoritesViewModel(api: mock)

        await vm.load()

        #expect(vm.bookmarks.count == 2)
        #expect(vm.total == 2)
        #expect(vm.loadError == nil)
        #expect(!vm.isLoading)
    }

    @Test("load: API失敗時にloadErrorを設定する")
    func loadFailure() async {
        let mock = MockBookmarkAPIClient()
        mock.fetchFavoriteResult = .failure(BookmarkAPIError.networkError(URLError(.notConnectedToInternet)))
        let vm = FavoritesViewModel(api: mock)

        await vm.load()

        #expect(vm.bookmarks.isEmpty)
        #expect(vm.loadError != nil)
        #expect(!vm.isLoading)
    }

    // MARK: - markAsRead

    @Test("markAsRead: 既読化後にローカルの isRead フラグを更新する")
    func markAsReadSuccess() async {
        let mock = MockBookmarkAPIClient()
        let bookmark = MockBookmarkAPIClient.makeBookmark(id: 1, isRead: false, isFavorite: true)
        mock.fetchFavoriteResult = .success(
            FavoriteBookmarksResponse(success: true, bookmarks: [bookmark])
        )
        let vm = FavoritesViewModel(api: mock)
        await vm.load()

        await vm.markAsRead(bookmark: bookmark)

        #expect(mock.markAsReadCalledIds == [1])
        #expect(vm.bookmarks[0].isRead == true)
        #expect(vm.mutationError == nil)
    }

    @Test("markAsRead: API失敗時にmutationErrorを設定しisReadは変化しない")
    func markAsReadFailure() async {
        let mock = MockBookmarkAPIClient()
        let bookmark = MockBookmarkAPIClient.makeBookmark(id: 1, isRead: false, isFavorite: true)
        mock.fetchFavoriteResult = .success(
            FavoriteBookmarksResponse(success: true, bookmarks: [bookmark])
        )
        mock.markAsReadResult = .failure(BookmarkAPIError.networkError(URLError(.notConnectedToInternet)))
        let vm = FavoritesViewModel(api: mock)
        await vm.load()

        await vm.markAsRead(bookmark: bookmark)

        #expect(vm.bookmarks[0].isRead == false)
        #expect(vm.mutationError != nil)
    }

    // MARK: - markAsUnread

    @Test("markAsUnread: 未読化後にローカルの isRead フラグを更新する")
    func markAsUnreadSuccess() async {
        let mock = MockBookmarkAPIClient()
        let bookmark = MockBookmarkAPIClient.makeBookmark(id: 1, isRead: true, isFavorite: true)
        mock.fetchFavoriteResult = .success(
            FavoriteBookmarksResponse(success: true, bookmarks: [bookmark])
        )
        let vm = FavoritesViewModel(api: mock)
        await vm.load()

        await vm.markAsUnread(bookmark: bookmark)

        #expect(mock.markAsUnreadCalledIds == [1])
        #expect(vm.bookmarks[0].isRead == false)
        #expect(vm.mutationError == nil)
    }

    @Test("markAsUnread: API失敗時にmutationErrorを設定しisReadは変化しない")
    func markAsUnreadFailure() async {
        let mock = MockBookmarkAPIClient()
        let bookmark = MockBookmarkAPIClient.makeBookmark(id: 1, isRead: true, isFavorite: true)
        mock.fetchFavoriteResult = .success(
            FavoriteBookmarksResponse(success: true, bookmarks: [bookmark])
        )
        mock.markAsUnreadResult = .failure(BookmarkAPIError.networkError(URLError(.notConnectedToInternet)))
        let vm = FavoritesViewModel(api: mock)
        await vm.load()

        await vm.markAsUnread(bookmark: bookmark)

        #expect(vm.bookmarks[0].isRead == true)
        #expect(vm.mutationError != nil)
    }

    // MARK: - removeFromFavorites

    @Test("removeFromFavorites: お気に入り解除後に一覧から削除しtotalを減らす")
    func removeFromFavoritesSuccess() async {
        let mock = MockBookmarkAPIClient()
        let bookmark = MockBookmarkAPIClient.makeBookmark(id: 1, isFavorite: true)
        mock.fetchFavoriteResult = .success(
            FavoriteBookmarksResponse(success: true, bookmarks: [bookmark])
        )
        let vm = FavoritesViewModel(api: mock)
        await vm.load()

        await vm.removeFromFavorites(bookmark: bookmark)

        #expect(mock.removeFromFavoritesCalledIds == [1])
        #expect(vm.bookmarks.isEmpty)
        #expect(vm.total == 0)
        #expect(vm.mutationError == nil)
    }

    @Test("removeFromFavorites: API失敗時にmutationErrorを設定しブックマークは削除しない")
    func removeFromFavoritesFailure() async {
        let mock = MockBookmarkAPIClient()
        let bookmark = MockBookmarkAPIClient.makeBookmark(id: 1, isFavorite: true)
        mock.fetchFavoriteResult = .success(
            FavoriteBookmarksResponse(success: true, bookmarks: [bookmark])
        )
        mock.removeFromFavoritesResult = .failure(BookmarkAPIError.networkError(URLError(.notConnectedToInternet)))
        let vm = FavoritesViewModel(api: mock)
        await vm.load()

        await vm.removeFromFavorites(bookmark: bookmark)

        #expect(vm.bookmarks.count == 1)
        #expect(vm.mutationError != nil)
    }

    // MARK: - toggleFavorite

    @Test("toggleFavorite: お気に入りブックマークを解除する（removeFromFavorites を呼ぶ）")
    func toggleFavoriteRemove() async {
        let mock = MockBookmarkAPIClient()
        let bookmark = MockBookmarkAPIClient.makeBookmark(id: 1, isFavorite: true)
        mock.fetchFavoriteResult = .success(
            FavoriteBookmarksResponse(success: true, bookmarks: [bookmark])
        )
        let vm = FavoritesViewModel(api: mock)
        await vm.load()

        await vm.toggleFavorite(bookmark: bookmark)

        #expect(mock.removeFromFavoritesCalledIds == [1])
        #expect(vm.bookmarks.isEmpty)
    }

    @Test("toggleFavorite: 非お気に入りブックマークをお気に入りに追加して再読み込みする")
    func toggleFavoriteAdd() async {
        let mock = MockBookmarkAPIClient()
        let bookmark = MockBookmarkAPIClient.makeBookmark(id: 1, isFavorite: false)
        mock.fetchFavoriteResult = .success(
            FavoriteBookmarksResponse(success: true, bookmarks: [bookmark])
        )
        let vm = FavoritesViewModel(api: mock)

        await vm.toggleFavorite(bookmark: bookmark)

        #expect(mock.addToFavoritesCalledIds == [1])
        #expect(vm.mutationError == nil)
    }
}
