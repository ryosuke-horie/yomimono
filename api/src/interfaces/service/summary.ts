import type { IBookmarkRepository } from "../repository/bookmark";

/**
 * 要約保存リクエスト
 */
export interface SaveSummaryRequest {
	bookmarkId: number;
	summary: string;
}

/**
 * 要約更新リクエスト
 */
export interface UpdateSummaryRequest {
	bookmarkId: number;
	summary: string;
}

/**
 * 要約サービスインターフェース
 */
export interface ISummaryService {
	/**
	 * 要約がないブックマークを取得
	 * @param limit 取得件数の上限
	 * @param orderBy ソート順（createdAt または readAt）
	 * @returns 要約がないブックマークのリスト
	 */
	getBookmarksWithoutSummary(
		limit?: number,
		orderBy?: "createdAt" | "readAt",
	): Promise<
		Array<{
			id: number;
			url: string;
			title: string | null;
			isRead: boolean;
			createdAt: Date;
			updatedAt: Date;
		}>
	>;

	/**
	 * ブックマークのIDで取得
	 * @param bookmarkId ブックマークID
	 * @returns ブックマーク情報
	 */
	getBookmarkById(bookmarkId: number): Promise<{
		id: number;
		url: string;
		title: string | null;
		isRead: boolean;
		summary: string | null;
		summaryCreatedAt: Date | null;
		summaryUpdatedAt: Date | null;
		createdAt: Date;
		updatedAt: Date;
	}>;

	/**
	 * 要約を保存
	 * @param request 保存リクエスト
	 * @returns 保存されたブックマーク情報
	 */
	saveSummary(request: SaveSummaryRequest): Promise<{
		id: number;
		url: string;
		title: string | null;
		isRead: boolean;
		summary: string | null;
		summaryCreatedAt: Date | null;
		summaryUpdatedAt: Date | null;
		createdAt: Date;
		updatedAt: Date;
	}>;

	/**
	 * 要約を更新
	 * @param request 更新リクエスト
	 * @returns 更新されたブックマーク情報
	 */
	updateSummary(request: UpdateSummaryRequest): Promise<{
		id: number;
		url: string;
		title: string | null;
		isRead: boolean;
		summary: string | null;
		summaryCreatedAt: Date | null;
		summaryUpdatedAt: Date | null;
		createdAt: Date;
		updatedAt: Date;
	}>;
}
