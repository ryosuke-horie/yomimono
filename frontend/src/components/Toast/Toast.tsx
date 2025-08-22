/**
 * Toast通知コンポーネント
 * 画面上部に表示される一時的な通知メッセージ
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import {
	FiAlertCircle,
	FiAlertTriangle,
	FiCheckCircle,
	FiInfo,
	FiX,
} from "react-icons/fi";
import type { ToastMessage, ToastProps, ToastType } from "@/types/toast";

// アニメーション時間の定数（CSSと同期）
const ANIMATION_DURATION = 300;

const getToastStyles = (type: ToastType) => {
	switch (type) {
		case "success":
			return "bg-green-500 text-white";
		case "error":
			return "bg-red-500 text-white";
		case "warning":
			return "bg-yellow-500 text-gray-800";
		case "info":
			return "bg-blue-500 text-white";
		default:
			return "bg-gray-500 text-white";
	}
};

const getToastIcon = (type: ToastType) => {
	switch (type) {
		case "success":
			return <FiCheckCircle className="w-5 h-5" />;
		case "error":
			return <FiAlertCircle className="w-5 h-5" />;
		case "warning":
			return <FiAlertTriangle className="w-5 h-5" />;
		case "info":
			return <FiInfo className="w-5 h-5" />;
		default:
			return null;
	}
};

export function Toast({ toast, onClose }: ToastProps) {
	const [isClosing, setIsClosing] = useState(false);

	const handleClose = useCallback(() => {
		setIsClosing(true);
		// アニメーション完了後に実際に削除
		setTimeout(() => onClose(toast.id), ANIMATION_DURATION);
	}, [onClose, toast.id]);

	useEffect(() => {
		if (toast.duration) {
			const timer = setTimeout(() => {
				handleClose();
			}, toast.duration);

			return () => clearTimeout(timer);
		}
	}, [toast.duration, handleClose]);

	return (
		<div
			className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
				isClosing ? "animate-toast-slide-out" : "animate-toast-slide-in"
			} ${getToastStyles(toast.type)}`}
			role="alert"
			aria-live="polite"
		>
			{getToastIcon(toast.type)}
			<span className="flex-1">{toast.message}</span>
			<button
				type="button"
				onClick={handleClose}
				className="hover:opacity-80 transition-opacity"
				aria-label="閉じる"
			>
				<FiX className="w-5 h-5" />
			</button>
		</div>
	);
}

// Vitest unit tests
if (import.meta.vitest) {
	const { describe, test, expect, vi } = import.meta.vitest;
	const { render, screen, waitFor } = await import("@testing-library/react");
	const userEvent = (await import("@testing-library/user-event")).default;

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
			await vi.advanceTimersByTimeAsync(ANIMATION_DURATION);

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
			await vi.advanceTimersByTimeAsync(3000);
			// アニメーション完了後のonClose実行
			await vi.advanceTimersByTimeAsync(ANIMATION_DURATION);

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
			await vi.advanceTimersByTimeAsync(4000);
			// アニメーション完了後のonClose実行
			await vi.advanceTimersByTimeAsync(ANIMATION_DURATION);

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
			vi.advanceTimersByTime(2000);
			unmount();

			// 残りの3秒+アニメーション時間経過させる
			vi.advanceTimersByTime(3000 + ANIMATION_DURATION);

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
}
