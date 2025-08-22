/**
 * Toast通知を管理するカスタムフック
 * Toast通知の表示・非表示を制御するためのフック
 */
"use client";

import { useContext } from "react";
import { ToastContext } from "@/providers/ToastProvider";

export function useToast() {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
}

// Vitest unit tests
if (import.meta.vitest) {
	const { describe, test, expect, vi } = import.meta.vitest;
	const { renderHook } = await import("@testing-library/react");

	describe("useToast", () => {
		test("ToastProviderなしでuseToastを使用するとエラーが発生する", () => {
			// エラーをキャッチしてテスト
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			expect(() => {
				renderHook(() => useToast());
			}).toThrow("useToast must be used within a ToastProvider");

			consoleSpy.mockRestore();
		});
	});
}
