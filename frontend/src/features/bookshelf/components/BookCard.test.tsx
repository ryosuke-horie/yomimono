/**
 * 本棚カードコンポーネントのテスト
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Book } from "../types";
import { BookStatus } from "../types";
import { BookCard } from "./BookCard";

// モックフック
const mockUpdateStatus = vi.fn();
vi.mock("../queries/useUpdateBookStatus", () => ({
	useUpdateBookStatus: () => ({
		mutate: mockUpdateStatus,
		isPending: false,
	}),
}));

describe("BookCard", () => {
	const createWrapper = () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		return ({ children }: { children: React.ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	};

	const mockBook: Book = {
		id: 1,
		type: "book",
		title: "テスト書籍",
		url: "https://example.com/book",
		imageUrl: "https://example.com/book.jpg",
		status: "unread",
		completedAt: null,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	};

	it("書籍の情報が正しく表示される", () => {
		render(<BookCard book={mockBook} />, { wrapper: createWrapper() });

		expect(screen.getByText("テスト書籍")).toBeInTheDocument();
		expect(screen.getByText("書籍")).toBeInTheDocument();
		expect(screen.getByText("未読")).toBeInTheDocument();
		expect(screen.getByText("リンクを開く →")).toBeInTheDocument();
		expect(screen.getByRole("img")).toHaveAttribute("src", mockBook.imageUrl);
	});

	it("PDFタイプのアイコンが表示される", () => {
		const pdfBook: Book = {
			...mockBook,
			type: "pdf",
			title: "PDFドキュメント",
		};

		render(<BookCard book={pdfBook} />, { wrapper: createWrapper() });

		expect(screen.getByText("PDF")).toBeInTheDocument();
		expect(screen.getByText("PDFドキュメント")).toBeInTheDocument();
	});

	it("GitHubタイプのアイコンが表示される", () => {
		const githubBook: Book = {
			...mockBook,
			type: "github",
			title: "GitHubリポジトリ",
		};

		render(<BookCard book={githubBook} />, { wrapper: createWrapper() });

		expect(screen.getByText("GitHub")).toBeInTheDocument();
	});

	it("Zennタイプのアイコンが表示される", () => {
		const zennBook: Book = {
			...mockBook,
			type: "zenn",
			title: "Zenn記事",
		};

		render(<BookCard book={zennBook} />, { wrapper: createWrapper() });

		expect(screen.getByText("Zenn")).toBeInTheDocument();
	});

	it("画像がない場合はデフォルトアイコンが表示される", () => {
		const bookWithoutImage: Book = {
			...mockBook,
			imageUrl: null,
		};

		render(<BookCard book={bookWithoutImage} />, { wrapper: createWrapper() });

		// 画像がないときはSVGアイコンが表示される
		const svgElements = document.querySelectorAll("svg");
		expect(svgElements.length).toBeGreaterThan(0);
	});

	it("ステータスボタンが正しく表示される", () => {
		render(<BookCard book={mockBook} />, { wrapper: createWrapper() });

		// 未読の場合、読書中と完了ボタンが表示される
		expect(screen.getByText("読書中にする")).toBeInTheDocument();
		expect(screen.getByText("完了にする")).toBeInTheDocument();
		expect(screen.queryByText("未読に戻す")).not.toBeInTheDocument();
	});

	it("読書中ステータスの場合、適切なボタンが表示される", () => {
		const readingBook: Book = {
			...mockBook,
			status: "reading",
		};

		render(<BookCard book={readingBook} />, { wrapper: createWrapper() });

		expect(screen.getByText("未読に戻す")).toBeInTheDocument();
		expect(screen.getByText("完了にする")).toBeInTheDocument();
		expect(screen.queryByText("読書中にする")).not.toBeInTheDocument();
	});

	it("完了ステータスの場合、適切なボタンと完了日が表示される", () => {
		const completedBook: Book = {
			...mockBook,
			status: "completed",
			completedAt: "2024-01-10T00:00:00Z",
		};

		render(<BookCard book={completedBook} />, { wrapper: createWrapper() });

		expect(screen.getByText("未読に戻す")).toBeInTheDocument();
		expect(screen.getByText("読書中にする")).toBeInTheDocument();
		expect(screen.queryByText("完了にする")).not.toBeInTheDocument();
		expect(screen.getByText(/完了日: 2024\/1\/10/)).toBeInTheDocument();
	});

	it("ステータス変更ボタンクリックでmutateが呼ばれる", () => {
		render(<BookCard book={mockBook} />, { wrapper: createWrapper() });

		const readingButton = screen.getByText("読書中にする");
		fireEvent.click(readingButton);

		expect(mockUpdateStatus).toHaveBeenCalledWith({
			id: mockBook.id,
			status: BookStatus.READING,
		});
	});

	it("削除ボタンクリックでonDeleteが呼ばれる", () => {
		const mockOnDelete = vi.fn();
		render(<BookCard book={mockBook} onDelete={mockOnDelete} />, {
			wrapper: createWrapper(),
		});

		const deleteButton = screen.getByText("削除");
		fireEvent.click(deleteButton);

		expect(mockOnDelete).toHaveBeenCalledWith(mockBook.id);
	});

	it("削除ハンドラーがない場合、削除ボタンが表示されない", () => {
		render(<BookCard book={mockBook} />, { wrapper: createWrapper() });

		expect(screen.queryByText("削除")).not.toBeInTheDocument();
	});

	it("URLがない場合、リンクが表示されない", () => {
		const bookWithoutUrl: Book = {
			...mockBook,
			url: null,
		};

		render(<BookCard book={bookWithoutUrl} />, { wrapper: createWrapper() });

		expect(screen.queryByText("リンクを開く →")).not.toBeInTheDocument();
	});

	it("ステータスバッジの色が正しく適用される", () => {
		const { rerender } = render(<BookCard book={mockBook} />, {
			wrapper: createWrapper(),
		});

		let badge = screen.getByText("未読");
		expect(badge.className).toContain("bg-gray-100");
		expect(badge.className).toContain("text-gray-800");

		const readingBook: Book = { ...mockBook, status: "reading" };
		rerender(<BookCard book={readingBook} />);

		badge = screen.getByText("読書中");
		expect(badge.className).toContain("bg-blue-100");
		expect(badge.className).toContain("text-blue-800");

		const completedBook: Book = { ...mockBook, status: "completed" };
		rerender(<BookCard book={completedBook} />);

		badge = screen.getByText("完了");
		expect(badge.className).toContain("bg-green-100");
		expect(badge.className).toContain("text-green-800");
	});
});
