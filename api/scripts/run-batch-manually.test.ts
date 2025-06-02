/**
 * 手動バッチ実行スクリプトのテストコード
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// rssBatchワーカーをモック
const mockRssBatch = {
	scheduled: vi.fn(),
};

vi.mock("../src/workers/rssBatch", () => ({
	default: mockRssBatch,
}));

// console.logとconsole.errorをモック
const consoleSpy = {
	log: vi.spyOn(console, "log").mockImplementation(() => {}),
	error: vi.spyOn(console, "error").mockImplementation(() => {}),
};

describe("run-batch-manually script", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// 動的インポートをリセット
		vi.resetModules();
	});

	it("バッチ処理を正常に実行できること", async () => {
		mockRssBatch.scheduled.mockResolvedValueOnce(undefined);

		// スクリプトを動的インポートして実行
		await import("./run-batch-manually");

		// 少し待ってPromiseが解決されるのを待つ
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(mockRssBatch.scheduled).toHaveBeenCalledWith(
			expect.any(Object),
			expect.any(Object),
			expect.any(Object),
		);

		expect(consoleSpy.log).toHaveBeenCalledWith("RSSバッチ処理を開始します...");
		expect(consoleSpy.log).toHaveBeenCalledWith("RSSバッチ処理が完了しました");
	});

	it("バッチ処理でエラーが発生した場合エラーログを出力すること", async () => {
		const error = new Error("Batch processing failed");
		mockRssBatch.scheduled.mockRejectedValueOnce(error);

		// スクリプトを動的インポートして実行
		await import("./run-batch-manually");

		// 少し待ってPromiseが解決されるのを待つ
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(consoleSpy.log).toHaveBeenCalledWith("RSSバッチ処理を開始します...");
		expect(consoleSpy.error).toHaveBeenCalledWith(
			"エラーが発生しました:",
			error,
		);
	});
});
