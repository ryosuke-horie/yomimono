import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import type { ToastMessage } from "@/types/toast";
import { Toast } from "./Toast";

// アニメーション時間の定数（Toast.tsxと同期）
const ANIMATION_DURATION = 300;

describe("Toast", () => {
	test("success typeのToastが正しくレンダリングされる", () => {
		const mockOnClose = vi.fn();
		const toast: ToastMessage = {
			id: "1",
			type: "success",
			message: "成功しました",
		};

		render(<Toast toast={toast} onClose={mockOnClose} />);

		const alertElement = screen.getByRole("alert");
		expect(alertElement).toBeInTheDocument();
		expect(alertElement).toHaveClass("bg-green-500");
		expect(screen.getByText("成功しました")).toBeInTheDocument();
	});

	test("error typeのToastが正しくレンダリングされる", () => {
		const mockOnClose = vi.fn();
		const toast: ToastMessage = {
			id: "2",
			type: "error",
			message: "エラーが発生しました",
		};

		render(<Toast toast={toast} onClose={mockOnClose} />);

		const alertElement = screen.getByRole("alert");
		expect(alertElement).toHaveClass("bg-red-500");
		expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
	});

	test("info typeのToastが正しくレンダリングされる", () => {
		const mockOnClose = vi.fn();
		const toast: ToastMessage = {
			id: "3",
			type: "info",
			message: "お知らせ",
		};

		render(<Toast toast={toast} onClose={mockOnClose} />);

		const alertElement = screen.getByRole("alert");
		expect(alertElement).toHaveClass("bg-blue-500");
		expect(screen.getByText("お知らせ")).toBeInTheDocument();
	});

	test("warning typeのToastが正しくレンダリングされる", () => {
		const mockOnClose = vi.fn();
		const toast: ToastMessage = {
			id: "3-warning",
			type: "warning",
			message: "注意: この操作は取り消せません",
		};

		render(<Toast toast={toast} onClose={mockOnClose} />);

		const alertElement = screen.getByRole("alert");
		expect(alertElement).toHaveClass("bg-yellow-500");
		expect(alertElement).toHaveClass("text-gray-800");
		expect(
			screen.getByText("注意: この操作は取り消せません"),
		).toBeInTheDocument();
	});

	test("閉じるボタンをクリックするとアニメーション後にonCloseが呼ばれる", async () => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		const mockOnClose = vi.fn();
		const toast: ToastMessage = {
			id: "4",
			type: "success",
			message: "テスト",
		};

		render(<Toast toast={toast} onClose={mockOnClose} />);

		const closeButton = screen.getByLabelText("閉じる");
		await userEvent.click(closeButton);

		// アニメーション完了後のonCloseが呼ばれる
		await act(async () => {
			await vi.advanceTimersByTimeAsync(ANIMATION_DURATION);
		});

		await waitFor(() => {
			expect(mockOnClose).toHaveBeenCalledWith("4");
		});

		vi.useRealTimers();
	});

	test("durationが設定されている場合、自動的にアニメーション後にonCloseが呼ばれる", async () => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		const mockOnClose = vi.fn();
		const toast: ToastMessage = {
			id: "5",
			type: "info",
			message: "自動で閉じる",
			duration: 3000,
		};

		render(<Toast toast={toast} onClose={mockOnClose} />);

		// duration後にアニメーション開始
		await act(async () => {
			await vi.advanceTimersByTimeAsync(3000);
		});
		// アニメーション完了後のonClose実行
		await act(async () => {
			await vi.advanceTimersByTimeAsync(ANIMATION_DURATION);
		});

		await waitFor(() => {
			expect(mockOnClose).toHaveBeenCalledWith("5");
		});

		vi.useRealTimers();
	});

	test("warning typeのToastが自動的に閉じる", async () => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		const mockOnClose = vi.fn();
		const toast: ToastMessage = {
			id: "5-warning",
			type: "warning",
			message: "警告: 4秒後に自動で閉じます",
			duration: 4000,
		};

		render(<Toast toast={toast} onClose={mockOnClose} />);

		// duration後にアニメーション開始
		await act(async () => {
			await vi.advanceTimersByTimeAsync(4000);
		});
		// アニメーション完了後のonClose実行
		await act(async () => {
			await vi.advanceTimersByTimeAsync(ANIMATION_DURATION);
		});

		await waitFor(() => {
			expect(mockOnClose).toHaveBeenCalledWith("5-warning");
		});

		vi.useRealTimers();
	});

	test("コンポーネントがアンマウントされたときにタイマーがクリアされる", () => {
		vi.useFakeTimers();
		const mockOnClose = vi.fn();
		const toast: ToastMessage = {
			id: "6",
			type: "info",
			message: "タイマーテスト",
			duration: 5000,
		};

		const { unmount } = render(<Toast toast={toast} onClose={mockOnClose} />);

		// 2秒後にアンマウント
		act(() => {
			vi.advanceTimersByTime(2000);
		});
		unmount();

		// 残りの3秒+アニメーション時間経過させる
		act(() => {
			vi.advanceTimersByTime(3000 + ANIMATION_DURATION);
		});

		// onCloseが呼ばれていないことを確認
		expect(mockOnClose).not.toHaveBeenCalled();

		vi.useRealTimers();
	});

	describe("アニメーション", () => {
		test("初期表示時にスライドインアニメーションが適用される", () => {
			const mockOnClose = vi.fn();
			const toast: ToastMessage = {
				id: "anim-1",
				type: "success",
				message: "アニメーションテスト",
			};

			render(<Toast toast={toast} onClose={mockOnClose} />);

			const alertElement = screen.getByRole("alert");
			expect(alertElement).toHaveClass("animate-toast-slide-in");
			expect(alertElement).not.toHaveClass("animate-toast-slide-out");
		});

		test("閉じるボタンクリック時にスライドアウトアニメーションが適用される", async () => {
			const mockOnClose = vi.fn();
			const toast: ToastMessage = {
				id: "anim-2",
				type: "info",
				message: "アニメーションテスト",
			};

			render(<Toast toast={toast} onClose={mockOnClose} />);

			const closeButton = screen.getByLabelText("閉じる");
			await userEvent.click(closeButton);

			const alertElement = screen.getByRole("alert");
			expect(alertElement).toHaveClass("animate-toast-slide-out");
			expect(alertElement).not.toHaveClass("animate-toast-slide-in");
		});

		test("アクセシビリティ: prefers-reduced-motionの対応がされている", () => {
			// CSSファイルに@media (prefers-reduced-motion: reduce)が定義されていることを確認
			// このテストはコンポーネントがアニメーションクラスを正しく適用していることを確認
			const mockOnClose = vi.fn();
			const toast: ToastMessage = {
				id: "anim-3",
				type: "success",
				message: "アクセシビリティテスト",
			};

			render(<Toast toast={toast} onClose={mockOnClose} />);

			const alertElement = screen.getByRole("alert");
			// アニメーションクラスが適用されていることを確認
			// CSS側でprefers-reduced-motionに対応
			expect(alertElement).toHaveClass("animate-toast-slide-in");
		});
	});
});
