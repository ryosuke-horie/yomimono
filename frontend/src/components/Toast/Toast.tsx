/**
 * Toast通知コンポーネント
 * 画面上部に表示される一時的な通知メッセージ
 */
"use client";

import { useEffect } from "react";
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
	id: string;
	type: ToastType;
	message: string;
	duration?: number;
}

interface ToastProps {
	toast: ToastMessage;
	onClose: (id: string) => void;
}

const getToastStyles = (type: ToastType) => {
	switch (type) {
		case "success":
			return "bg-green-500 text-white";
		case "error":
			return "bg-red-500 text-white";
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
		case "info":
			return <FiInfo className="w-5 h-5" />;
		default:
			return null;
	}
};

export function Toast({ toast, onClose }: ToastProps) {
	useEffect(() => {
		if (toast.duration) {
			const timer = setTimeout(() => {
				onClose(toast.id);
			}, toast.duration);

			return () => clearTimeout(timer);
		}
	}, [toast, onClose]);

	return (
		<div
			className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${getToastStyles(
				toast.type,
			)}`}
			role="alert"
			aria-live="polite"
		>
			{getToastIcon(toast.type)}
			<span className="flex-1">{toast.message}</span>
			<button
				type="button"
				onClick={() => onClose(toast.id)}
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

		test("閉じるボタンをクリックするとonCloseが呼ばれる", async () => {
			const mockOnClose = vi.fn();
			const toast: ToastMessage = {
				id: "4",
				type: "success",
				message: "テスト",
			};

			render(<Toast toast={toast} onClose={mockOnClose} />);

			const closeButton = screen.getByLabelText("閉じる");
			await userEvent.click(closeButton);

			expect(mockOnClose).toHaveBeenCalledWith("4");
		});

		test("durationが設定されている場合、自動的にonCloseが呼ばれる", async () => {
			vi.useFakeTimers({ shouldAdvanceTime: true });
			const mockOnClose = vi.fn();
			const toast: ToastMessage = {
				id: "5",
				type: "info",
				message: "自動で閉じる",
				duration: 3000,
			};

			render(<Toast toast={toast} onClose={mockOnClose} />);

			// 3000ms経過させる
			await vi.advanceTimersByTimeAsync(3000);

			await waitFor(() => {
				expect(mockOnClose).toHaveBeenCalledWith("5");
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

			// 残りの3秒経過させる
			vi.advanceTimersByTime(3000);

			// onCloseが呼ばれていないことを確認
			expect(mockOnClose).not.toHaveBeenCalled();

			vi.useRealTimers();
		});
	});
}
