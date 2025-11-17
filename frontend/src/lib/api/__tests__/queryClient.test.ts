import { describe, expect, test, vi } from "vitest";

const importModules = async () => {
	vi.resetModules();
	const errorsModule = await import("../errors");
	const queryClientModule = await import("../queryClient");
	return { ...errorsModule, ...queryClientModule };
};

describe("queryClient", () => {
	test("setGlobalShowToast経由でエラー時にToastが呼ばれる", async () => {
		const { setGlobalShowToast, createQueryClient } = await importModules();
		const mockShowToast = vi.fn();
		setGlobalShowToast(mockShowToast);

		const client = createQueryClient();
		const onError = client.getDefaultOptions().mutations?.onError;
		onError?.(
			new Error("Test error"),
			undefined as never,
			undefined as never,
			undefined as never,
		);

		expect(mockShowToast).toHaveBeenCalledWith({
			type: "error",
			message: "Test error",
			duration: 5000,
		});
	});

	test("Toast関数未設定の場合はconsole.errorにフォールバックする", async () => {
		const { createQueryClient } = await importModules();
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const client = createQueryClient();
		const onError = client.getDefaultOptions().mutations?.onError;
		onError?.(
			new Error("Test error"),
			undefined as never,
			undefined as never,
			undefined as never,
		);

		expect(consoleSpy).toHaveBeenCalledWith(
			"Global error handler not initialized:",
			expect.any(Error),
		);

		consoleSpy.mockRestore();
	});

	test("ApiErrorのネットワーク・サーバーエラーは長めの表示時間にする", async () => {
		const { setGlobalShowToast, createQueryClient, ApiError, API_ERROR_CODES } =
			await importModules();
		const mockShowToast = vi.fn();
		setGlobalShowToast(mockShowToast);

		const client = createQueryClient();
		const onError = client.getDefaultOptions().mutations?.onError;

		onError?.(
			new ApiError("Network error", API_ERROR_CODES.NETWORK_ERROR),
			undefined as never,
			undefined as never,
			undefined as never,
		);
		onError?.(
			new ApiError("Server error", API_ERROR_CODES.SERVER_ERROR),
			undefined as never,
			undefined as never,
			undefined as never,
		);

		expect(mockShowToast).toHaveBeenCalledWith({
			type: "error",
			message: "接続エラーが発生しました。ネットワークを確認してください。",
			duration: 7000,
		});
		expect(mockShowToast).toHaveBeenCalledWith({
			type: "error",
			message:
				"サーバーエラーが発生しました。しばらく待ってから再試行してください。",
			duration: 7000,
		});
	});

	test("通常のエラーはデフォルト表示時間にする", async () => {
		const { setGlobalShowToast, createQueryClient } = await importModules();
		const mockShowToast = vi.fn();
		setGlobalShowToast(mockShowToast);

		const client = createQueryClient();
		const onError = client.getDefaultOptions().mutations?.onError;
		onError?.(
			new Error("Normal error"),
			undefined as never,
			undefined as never,
			undefined as never,
		);

		expect(mockShowToast).toHaveBeenCalledWith({
			type: "error",
			message: "Normal error",
			duration: 5000,
		});
	});
});
