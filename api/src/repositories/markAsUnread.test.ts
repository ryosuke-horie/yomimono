import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	resetDrizzleClientMock,
	setupDrizzleClientMock,
} from "../../tests/drizzle.mock";
import { bookmarks } from "../db/schema";
import { DrizzleBookmarkRepository } from "./bookmark";

const { mockDb: mockDbClient } = setupDrizzleClientMock();

describe("markAsUnread メソッド", () => {
	let repository: DrizzleBookmarkRepository;

	beforeEach(() => {
		vi.clearAllMocks();
		resetDrizzleClientMock(mockDbClient);
		repository = new DrizzleBookmarkRepository({} as D1Database);
	});

	it("ブックマークを未読に戻せること", async () => {
		mockDbClient.get.mockResolvedValue({
			id: 1,
			url: "https://example.com",
			title: "Example",
			isRead: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const result = await repository.markAsUnread(1);

		expect(result).toBe(true);
		expect(mockDbClient.select).toHaveBeenCalled();
		expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
		expect(mockDbClient.where).toHaveBeenCalledWith(eq(bookmarks.id, 1));
		expect(mockDbClient.get).toHaveBeenCalled();
		expect(mockDbClient.update).toHaveBeenCalledWith(bookmarks);
		expect(mockDbClient.set).toHaveBeenCalledWith({
			isRead: false,
			updatedAt: expect.any(Date),
		});
		expect(mockDbClient.run).toHaveBeenCalled();
	});

	it("存在しないブックマークのIDが指定された場合にfalseを返すこと", async () => {
		mockDbClient.get.mockResolvedValue(null);

		const result = await repository.markAsUnread(999);

		expect(result).toBe(false);
		expect(mockDbClient.select).toHaveBeenCalled();
		expect(mockDbClient.get).toHaveBeenCalled();
		expect(mockDbClient.update).not.toHaveBeenCalled();
	});

	it("DBエラー時にエラーをスローすること", async () => {
		const mockError = new Error("Database error");
		mockDbClient.get.mockRejectedValue(mockError);

		await expect(repository.markAsUnread(1)).rejects.toThrow(mockError);
	});

	it("更新中にDBエラーが発生した場合にエラーをスローすること", async () => {
		mockDbClient.get.mockResolvedValue({
			id: 1,
			url: "https://example.com",
			title: "Example",
			isRead: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		const mockError = new Error("Update error");
		mockDbClient.run.mockRejectedValue(mockError);

		await expect(repository.markAsUnread(1)).rejects.toThrow(mockError);
	});
});
