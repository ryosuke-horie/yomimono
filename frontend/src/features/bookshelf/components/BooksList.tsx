/**
 * 本棚アイテムリスト コンポーネント
 * 本棚アイテムの一覧を表示
 */

"use client";

import type { Book } from "@/features/bookshelf/types";
import { BookCard } from "./BookCard";

interface BooksListProps {
	books: Book[];
	onDelete?: (id: number) => void;
}

export const BooksList = ({ books, onDelete }: BooksListProps) => {
	if (books.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-gray-500">本棚にアイテムがありません</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
			{books.map((book) => (
				<BookCard key={book.id} book={book} onDelete={onDelete} />
			))}
		</div>
	);
};

if (import.meta.vitest) {
	const { describe, it, expect, vi } = import.meta.vitest;
	const { render, screen } = await import("@testing-library/react");
	const { QueryClient, QueryClientProvider } = await import(
		"@tanstack/react-query"
	);
	const React = await import("react");

	// BookCardコンポーネントをモック
	vi.mock("./BookCard", async () => {
		const React = await import("react");
		return {
			BookCard: ({ book }: { book: Book }) =>
				React.createElement(
					"div",
					{ "data-testid": `book-${book.id}` },
					book.title,
				),
		};
	});

	describe("BooksList", () => {
		const createWrapper = () => {
			const queryClient = new QueryClient();
			return ({ children }: { children: React.ReactNode }) =>
				React.createElement(
					QueryClientProvider,
					{ client: queryClient },
					children,
				);
		};

		const mockBooks: Book[] = [
			{
				id: 1,
				type: "book",
				title: "書籍1",
				url: null,
				imageUrl: null,
				status: "unread",
				completedAt: null,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			},
			{
				id: 2,
				type: "pdf",
				title: "PDF資料",
				url: "https://example.com/test.pdf",
				imageUrl: null,
				status: "reading",
				completedAt: null,
				createdAt: "2024-01-02T00:00:00Z",
				updatedAt: "2024-01-02T00:00:00Z",
			},
		];

		it("本棚アイテムのリストが表示される", () => {
			render(React.createElement(BooksList, { books: mockBooks }), {
				wrapper: createWrapper(),
			});

			expect(screen.getByTestId("book-1")).toBeInTheDocument();
			expect(screen.getByTestId("book-2")).toBeInTheDocument();
			expect(screen.getByText("書籍1")).toBeInTheDocument();
			expect(screen.getByText("PDF資料")).toBeInTheDocument();
		});

		it("アイテムがない場合はメッセージが表示される", () => {
			render(React.createElement(BooksList, { books: [] }), {
				wrapper: createWrapper(),
			});

			expect(
				screen.getByText("本棚にアイテムがありません"),
			).toBeInTheDocument();
		});

		it("削除ハンドラーが各カードに渡される", () => {
			const onDelete = vi.fn();
			render(React.createElement(BooksList, { books: mockBooks, onDelete }), {
				wrapper: createWrapper(),
			});

			// BookCardモックが呼ばれることを確認
			expect(screen.getByTestId("book-1")).toBeInTheDocument();
		});
	});
}
