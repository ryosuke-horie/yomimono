import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BookmarkRepository } from "../../../src/repositories/bookmark";
import { DefaultBookmarkService } from "../../../src/services/bookmark";

describe("DefaultBookmarkService", () => {
	let service: DefaultBookmarkService;
	let mockRepository: BookmarkRepository;

	beforeEach(() => {
		mockRepository = {
			findUnread: vi.fn(),
			createMany: vi.fn(),
			markAsRead: vi.fn(),
			countUnread: vi.fn(),
		};

		service = new DefaultBookmarkService(mockRepository);
	});

	describe("getUnreadBookmarksCount", () => {
		it("should return the count of unread bookmarks from repository", async () => {
			mockRepository.countUnread = vi.fn().mockResolvedValue(5);

			const result = await service.getUnreadBookmarksCount();

			expect(mockRepository.countUnread).toHaveBeenCalled();
			expect(result).toBe(5);
		});

		it("should handle zero count", async () => {
			mockRepository.countUnread = vi.fn().mockResolvedValue(0);

			const result = await service.getUnreadBookmarksCount();

			expect(mockRepository.countUnread).toHaveBeenCalled();
			expect(result).toBe(0);
		});

		it("should propagate errors from repository", async () => {
			const error = new Error("Repository error");
			mockRepository.countUnread = vi.fn().mockRejectedValue(error);

			await expect(service.getUnreadBookmarksCount()).rejects.toThrow(error);
		});
	});
});
