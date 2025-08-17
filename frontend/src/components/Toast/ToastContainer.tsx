/**
 * Toast通知のコンテナコンポーネント
 * 複数のToast通知を管理し、画面右上に表示する
 */
"use client";

import { Toast, type ToastMessage } from "./Toast";

interface ToastContainerProps {
	toasts: ToastMessage[];
	onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
	if (toasts.length === 0) return null;

	return (
		<div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full sm:max-w-md">
			{toasts.map((toast) => (
				<Toast key={toast.id} toast={toast} onClose={onClose} />
			))}
		</div>
	);
}

// Vitest unit tests
if (import.meta.vitest) {
	const { describe, test, expect, vi } = import.meta.vitest;
	const { render, screen } = await import("@testing-library/react");

	describe("ToastContainer", () => {
		test("toastsが空の場合、何もレンダリングされない", () => {
			const mockOnClose = vi.fn();
			const { container } = render(
				<ToastContainer toasts={[]} onClose={mockOnClose} />,
			);

			expect(container.firstChild).toBeNull();
		});

		test("複数のToastが正しくレンダリングされる", () => {
			const mockOnClose = vi.fn();
			const toasts: ToastMessage[] = [
				{ id: "1", type: "success", message: "成功メッセージ" },
				{ id: "2", type: "error", message: "エラーメッセージ" },
				{ id: "3", type: "info", message: "情報メッセージ" },
			];

			render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

			expect(screen.getByText("成功メッセージ")).toBeInTheDocument();
			expect(screen.getByText("エラーメッセージ")).toBeInTheDocument();
			expect(screen.getByText("情報メッセージ")).toBeInTheDocument();

			// 3つのalert要素が存在することを確認
			const alerts = screen.getAllByRole("alert");
			expect(alerts).toHaveLength(3);
		});

		test("コンテナが固定位置のスタイルを持つ", () => {
			const mockOnClose = vi.fn();
			const toasts: ToastMessage[] = [
				{ id: "1", type: "success", message: "テスト" },
			];

			const { container } = render(
				<ToastContainer toasts={toasts} onClose={mockOnClose} />,
			);

			const containerDiv = container.firstChild as HTMLElement;
			expect(containerDiv).toHaveClass("fixed", "top-4", "right-4", "z-50");
		});
	});
}
