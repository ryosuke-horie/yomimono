import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import type { ToastMessage } from "@/types/toast";
import { ToastContainer } from "./ToastContainer";

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

	test("複数のToastにスタガーアニメーション遅延が適用される", () => {
		const mockOnClose = vi.fn();
		const toasts: ToastMessage[] = [
			{ id: "1", type: "success", message: "1つ目" },
			{ id: "2", type: "info", message: "2つ目" },
			{ id: "3", type: "error", message: "3つ目" },
		];

		const { container } = render(
			<ToastContainer toasts={toasts} onClose={mockOnClose} />,
		);

		const wrapperDivs = container.querySelectorAll(
			".fixed > div",
		) as NodeListOf<HTMLElement>;

		// 各Toastラッパーに異なる遅延が設定されていることを確認
		expect(wrapperDivs[0].style.animationDelay).toBe("0ms");
		expect(wrapperDivs[1].style.animationDelay).toBe("50ms");
		expect(wrapperDivs[2].style.animationDelay).toBe("100ms");
	});
});
