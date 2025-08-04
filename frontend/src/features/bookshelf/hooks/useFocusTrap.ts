/**
 * フォーカストラップフック
 * モーダル内でのフォーカスを制限し、Tab/Shift+Tabキーでのナビゲーションを循環させる
 */

import { useEffect, useRef } from "react";

export function useFocusTrap(isActive: boolean) {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isActive || !containerRef.current) return;

		const container = containerRef.current;

		// フォーカス可能な要素を取得
		const getFocusableElements = () => {
			const focusableSelectors = [
				"a[href]",
				"button:not([disabled])",
				"textarea:not([disabled])",
				"input:not([disabled])",
				"select:not([disabled])",
				"[tabindex]:not([tabindex='-1'])",
			];
			return container.querySelectorAll<HTMLElement>(
				focusableSelectors.join(","),
			);
		};

		// Tab/Shift+Tabキーのハンドリング
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Tab") return;

			const focusableElements = getFocusableElements();
			if (focusableElements.length === 0) return;

			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];
			const activeElement = document.activeElement;

			// Shift+Tabで最初の要素にいる場合、最後の要素にフォーカスを移動
			if (event.shiftKey && activeElement === firstElement) {
				event.preventDefault();
				lastElement.focus();
			}
			// Tabで最後の要素にいる場合、最初の要素にフォーカスを移動
			else if (!event.shiftKey && activeElement === lastElement) {
				event.preventDefault();
				firstElement.focus();
			}
		};

		// 最初のフォーカス可能な要素にフォーカスを設定
		const focusableElements = getFocusableElements();
		if (focusableElements.length > 0) {
			focusableElements[0].focus();
		}

		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isActive]);

	return containerRef;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { renderHook } = await import("@testing-library/react");

	describe("useFocusTrap", () => {
		it("refを返す", () => {
			const { result } = renderHook(() => useFocusTrap(true));
			expect(result.current).toHaveProperty("current");
			expect(result.current.current).toBe(null);
		});

		it("非アクティブ時はrefを返す", () => {
			const { result } = renderHook(() => useFocusTrap(false));
			expect(result.current).toHaveProperty("current");
			expect(result.current.current).toBe(null);
		});

		it("アクティブ・非アクティブを切り替えてもrefは同じインスタンス", () => {
			const { result, rerender } = renderHook(
				({ isActive }) => useFocusTrap(isActive),
				{ initialProps: { isActive: false } },
			);

			const initialRef = result.current;

			rerender({ isActive: true });
			expect(result.current).toBe(initialRef);

			rerender({ isActive: false });
			expect(result.current).toBe(initialRef);
		});
	});
}
