import { eq, inArray, isNull } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	articleLabels,
	bookmarks,
	favorites,
	labels,
} from "../../../src/db/schema";
import { DrizzleBookmarkRepository } from "../../../src/repositories/bookmark";
const mockDbClient = {
	select: vi.fn().mockReturnThis(),
	from: vi.fn().mockReturnThis(),
	where: vi.fn().mockReturnThis(),
	set: vi.fn().mockReturnThis(),
	values: vi.fn().mockReturnThis(),
	run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
	get: vi.fn(),
	all: vi.fn(),
	delete: vi.fn().mockReturnThis(),
	innerJoin: vi.fn().mockReturnThis(),
	leftJoin: vi.fn().mockReturnThis(),
	limit: vi.fn().mockReturnThis(),
	offset: vi.fn().mockReturnThis(),
	orderBy: vi.fn().mockReturnThis(),
	update: vi.fn().mockReturnThis(),
	insert: vi.fn().mockReturnThis(),
	returning: vi.fn().mockReturnThis(),
	groupBy: vi.fn().mockReturnThis(),
};
vi.mock("drizzle-orm/d1", () => ({
	drizzle: vi.fn(() => mockDbClient),
}));
describe("ブックマークリポジトリ", () => {
	let repository;
	const mockBookmark1 = {
		id: 1,
		url: "https://example.com/1",
		title: "Example 1",
		isRead: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	const mockBookmark2 = {
		id: 2,
		url: "https://example.com/2",
		title: "Example 2",
		isRead: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	const mockBookmark3 = {
		id: 3,
		url: "https://example.com/3",
		title: "Example 3",
		isRead: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	const mockLabel1 = {
		id: 10,
		name: "typescript",
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	const mockLabel2 = {
		id: 11,
		name: "react",
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	const mockQueryResult1 = {
		bookmark: mockBookmark1,
		favorite: { id: 1, bookmarkId: 1, createdAt: new Date() },
		label: mockLabel1,
	};
	const mockQueryResult2 = {
		bookmark: mockBookmark2,
		favorite: null,
		label: mockLabel2,
	};
	const mockQueryResult3 = {
		bookmark: mockBookmark3,
		favorite: null,
		label: null,
	};
	const expectedResult1 = {
		...mockBookmark1,
		isFavorite: true,
		label: mockLabel1,
	};
	const expectedResult2 = {
		...mockBookmark2,
		isFavorite: false,
		label: mockLabel2,
	};
	const expectedResult3 = {
		...mockBookmark3,
		isFavorite: false,
		label: null,
	};
	beforeEach(() => {
		vi.clearAllMocks();
		repository = new DrizzleBookmarkRepository({});
	});
	describe("未読ブックマークの取得 (findUnread)", () => {
		it("未読ブックマークをラベル・お気に入り情報付きで全て取得できること", async () => {
			mockDbClient.all.mockResolvedValue([mockQueryResult1, mockQueryResult2]);
			const result = await repository.findUnread();
			expect(result).toEqual([expectedResult1, expectedResult2]);
			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.where).toHaveBeenCalledWith(
				eq(bookmarks.isRead, false),
			);
			expect(mockDbClient.leftJoin).toHaveBeenCalledTimes(3);
			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});
		it("DBクエリ失敗時にエラーをスローすること", async () => {
			const mockError = new Error("Database error");
			mockDbClient.all.mockRejectedValue(mockError);
			await expect(repository.findUnread()).rejects.toThrow(mockError);
		});
	});
	describe("URLリストによるブックマーク取得 (findByUrls)", () => {
		it("複数URLを指定して該当するブックマークをラベル・お気に入り情報付きで取得できること", async () => {
			const urls = [mockBookmark1.url, mockBookmark2.url];
			mockDbClient.all.mockResolvedValue([mockQueryResult1, mockQueryResult2]);
			const result = await repository.findByUrls(urls);
			expect(result).toEqual([expectedResult1, expectedResult2]);
			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.where).toHaveBeenCalledWith(
				inArray(bookmarks.url, urls),
			);
			expect(mockDbClient.leftJoin).toHaveBeenCalledTimes(3);
			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});
		it("空配列を渡した場合に空配列を返すこと", async () => {
			const result = await repository.findByUrls([]);
			expect(result).toEqual([]);
			expect(mockDbClient.select).not.toHaveBeenCalled();
		});
		it("DBクエリ失敗時にエラーをスローすること", async () => {
			const urls = [mockBookmark1.url];
			const mockError = new Error("Database error");
			mockDbClient.all.mockRejectedValue(mockError);
			await expect(repository.findByUrls(urls)).rejects.toThrow(mockError);
		});
	});
	describe("お気に入りブックマーク取得 (getFavoriteBookmarks)", () => {
		it("お気に入りブックマークをラベル情報付きで取得できること", async () => {
			mockDbClient.get.mockResolvedValue({ count: 1 });
			mockDbClient.all.mockResolvedValue([mockQueryResult1]);
			const result = await repository.getFavoriteBookmarks(0, 10);
			expect(result).toEqual({ bookmarks: [expectedResult1], total: 1 });
			expect(mockDbClient.select).toHaveBeenCalledTimes(3);
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.leftJoin).toHaveBeenCalledTimes(3);
			expect(mockDbClient.all).toHaveBeenCalledOnce();
			expect(mockDbClient.get).toHaveBeenCalledOnce();
		});
		it("お気に入りが無い場合は空配列とtotal 0を返すこと", async () => {
			mockDbClient.get.mockResolvedValue({ count: 0 });
			mockDbClient.all.mockResolvedValue([]);
			const result = await repository.getFavoriteBookmarks(0, 10);
			expect(result).toEqual({ bookmarks: [], total: 0 });
		});
		it("DBクエリ失敗時にエラーをスローすること (count)", async () => {
			const mockError = new Error("Count error");
			mockDbClient.get.mockRejectedValue(mockError);
			await expect(repository.getFavoriteBookmarks(0, 10)).rejects.toThrow(
				mockError,
			);
		});
		it("DBクエリ失敗時にエラーをスローすること (main query)", async () => {
			const mockError = new Error("Main query error");
			mockDbClient.get.mockResolvedValue({ count: 1 });
			mockDbClient.all.mockRejectedValue(mockError);
			await expect(repository.getFavoriteBookmarks(0, 10)).rejects.toThrow(
				mockError,
			);
		});
	});
	describe("最近読んだブックマーク取得 (findRecentlyRead)", () => {
		it("最近読んだブックマークをラベル・お気に入り情報付きで取得できること", async () => {
			mockDbClient.all.mockResolvedValue([mockQueryResult3]);
			const result = await repository.findRecentlyRead();
			expect(result).toEqual([expectedResult3]);
			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.where).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.orderBy).toHaveBeenCalledWith(bookmarks.updatedAt);
			expect(mockDbClient.leftJoin).toHaveBeenCalledTimes(3);
			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});
		it("DBクエリ失敗時にエラーをスローすること", async () => {
			const mockError = new Error("Database error");
			mockDbClient.all.mockRejectedValue(mockError);
			await expect(repository.findRecentlyRead()).rejects.toThrow(mockError);
		});
	});
	describe("未ラベルブックマーク取得 (findUnlabeled)", () => {
		it("ラベルが付与されていないブックマークのみ取得できること", async () => {
			mockDbClient.all.mockResolvedValue([{ bookmarks: mockBookmark2 }]);
			const result = await repository.findUnlabeled();
			expect(result).toEqual([mockBookmark2]);
			expect(mockDbClient.select).toHaveBeenCalledWith({
				bookmarks: bookmarks,
			});
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.leftJoin).toHaveBeenCalledWith(
				articleLabels,
				expect.anything(),
			);
			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});
		it("未ラベルのブックマークが存在しない場合、空配列を返すこと", async () => {
			mockDbClient.all.mockResolvedValue([]);
			const result = await repository.findUnlabeled();
			expect(result).toEqual([]);
			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});
		it("DBクエリ失敗時にエラーをスローすること", async () => {
			const mockError = new Error("Database error");
			mockDbClient.all.mockRejectedValue(mockError);
			await expect(repository.findUnlabeled()).rejects.toThrow(mockError);
		});
	});
	describe("ラベル名によるブックマーク取得 (findByLabelName)", () => {
		it("指定されたラベル名を持つブックマークをラベル・お気に入り情報付きで取得できること", async () => {
			const labelName = "typescript";
			mockDbClient.all.mockResolvedValue([
				{
					bookmark: mockBookmark1,
					favorite: { id: 1, bookmarkId: 1, createdAt: new Date() },
					label: mockLabel1,
				},
			]);
			const result = await repository.findByLabelName(labelName);
			expect(result).toEqual([expectedResult1]);
			expect(mockDbClient.select).toHaveBeenCalledWith({
				bookmark: bookmarks,
				favorite: favorites,
				label: labels,
			});
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.innerJoin).toHaveBeenCalledWith(
				articleLabels,
				expect.anything(),
			);
			expect(mockDbClient.innerJoin).toHaveBeenCalledWith(
				labels,
				expect.anything(),
			);
			expect(mockDbClient.leftJoin).toHaveBeenCalledWith(
				favorites,
				expect.anything(),
			); // Only one leftJoin here
			expect(mockDbClient.where).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});
		it("指定されたラベル名のブックマークが存在しない場合、空配列を返すこと", async () => {
			const labelName = "nonexistent";
			mockDbClient.all.mockResolvedValue([]);
			const result = await repository.findByLabelName(labelName);
			expect(result).toEqual([]);
			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});
		it("DBクエリ失敗時にエラーをスローすること", async () => {
			const labelName = "typescript";
			const mockError = new Error("Database error");
			mockDbClient.all.mockRejectedValue(mockError);
			await expect(repository.findByLabelName(labelName)).rejects.toThrow(
				mockError,
			);
		});
	});
	describe("IDによるブックマーク取得 (findById)", () => {
		it("指定されたIDのブックマークをラベル・お気に入り情報付きで取得できること", async () => {
			const bookmarkId = 2;
			mockDbClient.all.mockResolvedValue([mockQueryResult2]);
			const result = await repository.findById(bookmarkId);
			expect(result).toEqual(expectedResult2);
			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.where).toHaveBeenCalledWith(
				eq(bookmarks.id, bookmarkId),
			);
			expect(mockDbClient.leftJoin).toHaveBeenCalledTimes(3);
			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});
		it("指定されたIDのブックマークが存在しない場合、undefinedを返すこと", async () => {
			const bookmarkId = 999;
			mockDbClient.all.mockResolvedValue([]);
			const result = await repository.findById(bookmarkId);
			expect(result).toBeUndefined();
			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});
		it("DBクエリ失敗時にエラーをスローすること", async () => {
			const bookmarkId = 1;
			const mockError = new Error("Database error");
			mockDbClient.all.mockRejectedValue(mockError);
			await expect(repository.findById(bookmarkId)).rejects.toThrow(mockError);
		});
	});
	describe("未読ブックマーク数取得 (countUnread)", () => {
		it("未読ブックマーク数を取得できること", async () => {
			mockDbClient.get.mockResolvedValue({ count: 5 });
			const result = await repository.countUnread();
			expect(result).toBe(5);
			expect(mockDbClient.select).toHaveBeenCalledWith({
				count: expect.anything(),
			});
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.where).toHaveBeenCalledWith(
				eq(bookmarks.isRead, false),
			);
			expect(mockDbClient.get).toHaveBeenCalledOnce();
		});
	});
	describe("要約なしブックマーク取得 (findWithoutSummary)", () => {
		it("要約なしブックマークを取得できること", async () => {
			mockDbClient.all.mockResolvedValue([mockQueryResult1, mockQueryResult2]);
			const result = await repository.findWithoutSummary();
			expect(result).toEqual([expectedResult1, expectedResult2]);
			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.where).toHaveBeenCalledWith(
				isNull(bookmarks.summary),
			);
			expect(mockDbClient.orderBy).toHaveBeenCalledWith(bookmarks.createdAt);
			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});
		it("limitオプションが適用されること", async () => {
			mockDbClient.all.mockResolvedValue([mockQueryResult1]);
			await repository.findWithoutSummary(5);
			expect(mockDbClient.limit).toHaveBeenCalledWith(5);
		});
		it("orderByオプションが適用されること", async () => {
			mockDbClient.all.mockResolvedValue([mockQueryResult1]);
			await repository.findWithoutSummary(10, "readAt");
			expect(mockDbClient.orderBy).toHaveBeenCalledWith(bookmarks.updatedAt);
		});
		it("DBクエリ失敗時にエラーをスローすること", async () => {
			const mockError = new Error("Database error");
			mockDbClient.all.mockRejectedValue(mockError);
			await expect(repository.findWithoutSummary()).rejects.toThrow(mockError);
		});
	});
	describe("要約更新 (updateSummary)", () => {
		it("要約を正常に更新できること", async () => {
			const bookmarkId = 123;
			const summary = "これはテスト要約です";
			const mockExistingBookmark = {
				...mockBookmark1,
				id: bookmarkId,
				summary: null,
			};
			const expectedUpdatedBookmark = {
				...mockBookmark1,
				id: bookmarkId,
				summary,
				isFavorite: false,
				label: null,
			};
			mockDbClient.get.mockResolvedValue(mockExistingBookmark);
			mockDbClient.all.mockResolvedValue([
				{
					bookmark: { ...mockExistingBookmark, summary },
					favorite: null,
					label: null,
				},
			]);
			const result = await repository.updateSummary(bookmarkId, summary);
			expect(result).toEqual(expectedUpdatedBookmark);
			expect(mockDbClient.update).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.set).toHaveBeenCalledWith({
				summary,
				summaryCreatedAt: expect.any(Date),
				summaryUpdatedAt: expect.any(Date),
				updatedAt: expect.any(Date),
			});
			expect(mockDbClient.where).toHaveBeenCalledWith(
				eq(bookmarks.id, bookmarkId),
			);
		});
		it("更新対象がない場合はundefinedを返すこと", async () => {
			mockDbClient.get.mockResolvedValue(null);
			const result = await repository.updateSummary(789, "要約");
			expect(result).toBe(undefined);
		});
		it("既存の要約がある場合はsummaryCreatedAtが更新されないこと", async () => {
			const bookmarkId = 456;
			const existingCreatedAt = new Date("2023-12-01");
			const mockExistingBookmark = {
				...mockBookmark1,
				id: bookmarkId,
				summary: "既存の要約",
				summaryCreatedAt: existingCreatedAt,
			};
			mockDbClient.get.mockResolvedValue(mockExistingBookmark);
			mockDbClient.all.mockResolvedValue([
				{
					bookmark: mockExistingBookmark,
					favorite: null,
					label: null,
				},
			]);
			await repository.updateSummary(bookmarkId, "更新されたテスト要約");
			// setに渡されたオブジェクトを検証
			expect(mockDbClient.set).toHaveBeenCalledWith({
				summary: "更新されたテスト要約",
				summaryCreatedAt: existingCreatedAt,
				summaryUpdatedAt: expect.any(Date),
				updatedAt: expect.any(Date),
			});
		});
		it("DBクエリ失敗時にエラーをスローすること", async () => {
			const mockError = new Error("Database error");
			mockDbClient.get.mockRejectedValue(mockError);
			await expect(
				repository.updateSummary(999, "失敗する要約"),
			).rejects.toThrow("Database error");
		});
	});
});
