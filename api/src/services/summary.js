export class SummaryService {
	bookmarkRepository;
	constructor(bookmarkRepository) {
		this.bookmarkRepository = bookmarkRepository;
	}
	/**
	 * 要約がないブックマークを取得
	 */
	async getBookmarksWithoutSummary(limit = 10, orderBy = "createdAt") {
		const bookmarks = await this.bookmarkRepository.findWithoutSummary(
			limit,
			orderBy,
		);
		return bookmarks.map((bookmark) => ({
			id: bookmark.id,
			url: bookmark.url,
			title: bookmark.title,
			isRead: bookmark.isRead,
			createdAt: bookmark.createdAt,
			updatedAt: bookmark.updatedAt,
		}));
	}
	/**
	 * ブックマークのIDで取得
	 */
	async getBookmarkById(bookmarkId) {
		const bookmark = await this.bookmarkRepository.findById(bookmarkId);
		if (!bookmark) {
			throw new Error(`Bookmark not found: ${bookmarkId}`);
		}
		return {
			id: bookmark.id,
			url: bookmark.url,
			title: bookmark.title,
			isRead: bookmark.isRead,
			summary: bookmark.summary,
			summaryCreatedAt: bookmark.summaryCreatedAt,
			summaryUpdatedAt: bookmark.summaryUpdatedAt,
			createdAt: bookmark.createdAt,
			updatedAt: bookmark.updatedAt,
		};
	}
	/**
	 * 要約を保存
	 */
	async saveSummary(request) {
		const bookmark = await this.bookmarkRepository.updateSummary(
			request.bookmarkId,
			request.summary,
		);
		if (!bookmark) {
			throw new Error(`Bookmark not found: ${request.bookmarkId}`);
		}
		return {
			id: bookmark.id,
			url: bookmark.url,
			title: bookmark.title,
			isRead: bookmark.isRead,
			summary: bookmark.summary,
			summaryCreatedAt: bookmark.summaryCreatedAt,
			summaryUpdatedAt: bookmark.summaryUpdatedAt,
			createdAt: bookmark.createdAt,
			updatedAt: bookmark.updatedAt,
		};
	}
	/**
	 * 要約を更新
	 */
	async updateSummary(request) {
		const bookmark = await this.bookmarkRepository.updateSummary(
			request.bookmarkId,
			request.summary,
		);
		if (!bookmark) {
			throw new Error(`Bookmark not found: ${request.bookmarkId}`);
		}
		return {
			id: bookmark.id,
			url: bookmark.url,
			title: bookmark.title,
			isRead: bookmark.isRead,
			summary: bookmark.summary,
			summaryCreatedAt: bookmark.summaryCreatedAt,
			summaryUpdatedAt: bookmark.summaryUpdatedAt,
			createdAt: bookmark.createdAt,
			updatedAt: bookmark.updatedAt,
		};
	}
}
