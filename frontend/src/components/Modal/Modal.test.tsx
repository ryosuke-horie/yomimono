import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { Modal } from "./Modal";

describe("Modal", () => {
	test("モーダルが開いている時に表示される", () => {
		const mockOnClose = vi.fn();

		render(
			<Modal isOpen={true} onClose={mockOnClose} title="テストモーダル">
				<p>モーダルコンテンツ</p>
			</Modal>,
		);

		expect(screen.getByText("テストモーダル")).toBeInTheDocument();
		expect(screen.getByText("モーダルコンテンツ")).toBeInTheDocument();
	});

	test("モーダルが閉じている時は表示されない", () => {
		const mockOnClose = vi.fn();

		render(
			<Modal isOpen={false} onClose={mockOnClose} title="テストモーダル">
				<p>モーダルコンテンツ</p>
			</Modal>,
		);

		expect(screen.queryByText("テストモーダル")).not.toBeInTheDocument();
		expect(screen.queryByText("モーダルコンテンツ")).not.toBeInTheDocument();
	});

	test("オーバーレイクリックでonCloseが呼ばれる", () => {
		const mockOnClose = vi.fn();

		render(
			<Modal isOpen={true} onClose={mockOnClose} title="テストモーダル">
				<p>モーダルコンテンツ</p>
			</Modal>,
		);

		const overlay = screen.getByLabelText("モーダルを閉じる");
		fireEvent.click(overlay);

		expect(mockOnClose).toHaveBeenCalled();
	});

	test("モーダルコンテンツ内クリックではonCloseが呼ばれない", () => {
		const mockOnClose = vi.fn();

		render(
			<Modal isOpen={true} onClose={mockOnClose} title="テストモーダル">
				<p>モーダルコンテンツ</p>
			</Modal>,
		);

		const content = screen.getByText("モーダルコンテンツ");
		fireEvent.click(content);

		expect(mockOnClose).not.toHaveBeenCalled();
	});

	test("Escapeキー押下でonCloseが呼ばれる", () => {
		const mockOnClose = vi.fn();

		render(
			<Modal isOpen={true} onClose={mockOnClose} title="テストモーダル">
				<p>モーダルコンテンツ</p>
			</Modal>,
		);

		fireEvent.keyDown(document, { key: "Escape" });

		expect(mockOnClose).toHaveBeenCalled();
	});

	test("Escape以外のキー押下ではonCloseが呼ばれない", () => {
		const mockOnClose = vi.fn();

		render(
			<Modal isOpen={true} onClose={mockOnClose} title="テストモーダル">
				<p>モーダルコンテンツ</p>
			</Modal>,
		);

		fireEvent.keyDown(document, { key: "Enter" });

		expect(mockOnClose).not.toHaveBeenCalled();
	});

	test("適切なアクセシビリティ属性が設定される", () => {
		const mockOnClose = vi.fn();

		render(
			<Modal isOpen={true} onClose={mockOnClose} title="テストモーダル">
				<p>モーダルコンテンツ</p>
			</Modal>,
		);

		const overlayButton = screen.getByLabelText("モーダルを閉じる");
		expect(overlayButton).toBeInTheDocument();
	});
});
