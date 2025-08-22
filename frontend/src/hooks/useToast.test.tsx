import { renderHook } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { useToast } from "./useToast";

describe("useToast", () => {
	test("ToastProviderなしでuseToastを使用するとエラーが発生する", () => {
		// エラーをキャッチしてテスト
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(() => {
			renderHook(() => useToast());
		}).toThrow("useToast must be used within a ToastProvider");

		consoleSpy.mockRestore();
	});
});
