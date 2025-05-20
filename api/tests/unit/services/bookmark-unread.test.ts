import { describe, it, expect, beforeEach, vi } from "vitest";
import { DefaultBookmarkService } from "../../../src/services/bookmark";
import type { IBookmarkRepository } from "../../../src/interfaces/repository/bookmark";

describe("DefaultBookmarkService", () => {
  let mockRepository: IBookmarkRepository;
  let service: DefaultBookmarkService;

  beforeEach(() => {
    mockRepository = {
      markAsUnread: vi.fn(),
      findUnread: vi.fn(),
      findByUrls: vi.fn(),
      markAsRead: vi.fn(),
      countUnread: vi.fn(),
      countTodayRead: vi.fn(),
      createMany: vi.fn(),
      addToFavorites: vi.fn(),
      removeFromFavorites: vi.fn(),
      getFavoriteBookmarks: vi.fn(),
      isFavorite: vi.fn(),
      findRecentlyRead: vi.fn(),
      findRead: vi.fn(),
      findUnlabeled: vi.fn(),
      findByLabelName: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findWithoutSummary: vi.fn(),
      updateSummary: vi.fn(),
    };
    service = new DefaultBookmarkService(mockRepository);
  });

  describe("markBookmarkAsUnread", () => {
    it("ブックマークが存在する場合、未読に戻す", async () => {
      // モックの設定
      mockRepository.markAsUnread = vi.fn().mockResolvedValue(true);

      // 実行
      await service.markBookmarkAsUnread(1);

      // 検証
      expect(mockRepository.markAsUnread).toHaveBeenCalledWith(1);
    });

    it("ブックマークが存在しない場合、エラーを投げる", async () => {
      // モックの設定
      mockRepository.markAsUnread = vi.fn().mockResolvedValue(false);

      // 実行と検証
      await expect(service.markBookmarkAsUnread(999)).rejects.toThrow("Bookmark not found");
      expect(mockRepository.markAsUnread).toHaveBeenCalledWith(999);
    });

    it("エラーが発生した場合、エラーを再投げする", async () => {
      // モックの設定
      const mockError = new Error("Repository error");
      mockRepository.markAsUnread = vi.fn().mockRejectedValue(mockError);

      // 実行と検証
      await expect(service.markBookmarkAsUnread(1)).rejects.toThrow("Repository error");
      expect(mockRepository.markAsUnread).toHaveBeenCalledWith(1);
    });
  });
});