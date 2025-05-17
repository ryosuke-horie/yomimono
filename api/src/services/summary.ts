import type { BookmarkWithLabel } from "../interfaces/repository/bookmark";
import type {
	ISummaryService,
	SaveSummaryRequest,
	UpdateSummaryRequest,
} from "../interfaces/service/summary";
import type { DrizzleBookmarkRepository } from "../repositories/bookmark";

export class SummaryService implements ISummaryService {
	constructor(private readonly bookmarkRepository: DrizzleBookmarkRepository) {}

	/**
	 * 要約がないブックマークを取得
	 */
	async getBookmarksWithoutSummary(
		limit = 10,
		orderBy: "createdAt" | "readAt" = "createdAt",
	): Promise<
		Array<{
			id: number;
			url: string;
			title: string | null;
			isRead: boolean;
			createdAt: Date;
			updatedAt: Date;
		}>
	> {
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
	async getBookmarkById(bookmarkId: number): Promise<{
		id: number;
		url: string;
		title: string | null;
		isRead: boolean;
		summary: string | null;
		summaryCreatedAt: Date | null;
		summaryUpdatedAt: Date | null;
		createdAt: Date;
		updatedAt: Date;
	}> {
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
	async saveSummary(request: SaveSummaryRequest): Promise<{
		id: number;
		url: string;
		title: string | null;
		isRead: boolean;
		summary: string | null;
		summaryCreatedAt: Date | null;
		summaryUpdatedAt: Date | null;
		createdAt: Date;
		updatedAt: Date;
	}> {
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
	async updateSummary(request: UpdateSummaryRequest): Promise<{
		id: number;
		url: string;
		title: string | null;
		isRead: boolean;
		summary: string | null;
		summaryCreatedAt: Date | null;
		summaryUpdatedAt: Date | null;
		createdAt: Date;
		updatedAt: Date;
	}> {
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
