/**
 * 本棚ページコンポーネントのテスト
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Book } from "@/features/bookshelf/types";
import BookshelfPage from "./page";

// モックデータ
const mockBooks: Book[] = [
	{
		id: 1,
		type: "book",
		title: "テスト書籍1",
		url: null,
		imageUrl: "https://example.com/book1.jpg",
		status: "unread",
		completedAt: null,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: 2,
		type: "pdf",
		title: "テストPDF",
		url: "https://example.com/test.pdf",
		imageUrl: null,
		status: "reading",
		completedAt: null,
		createdAt: "2024-01-02T00:00:00Z",
		updatedAt: "2024-01-02T00:00:00Z",
	},
	{
		id: 3,
		type: "github",
		title: "GitHubリポジトリ",
		url: "https://github.com/test/repo",
		imageUrl: null,
		status: "completed",
		completedAt: "2024-01-10T00:00:00Z",
		createdAt: "2024-01-03T00:00:00Z",
		updatedAt: "2024-01-10T00:00:00Z",
	},
];

// クエリフックをモック
vi.mock("@/features/bookshelf/queries/useGetBooks", () => ({
	useGetBooks: vi.fn(() => ({
		data: mockBooks,
		isLoading: false,
		error: null,
	})),
}));

// APIをモック
vi.mock("@/features/bookshelf/queries/api", () => ({
	deleteBook: vi.fn(),
}));

// コンポーネントをモック
vi.mock("@/features/bookshelf/components/AddBookButton", () => ({
	AddBookButton: () => <button type="button">本を追加</button>,
}));

// StatusTabsのプロパティの型定義
type StatusTabsProps = {
	onStatusChange: (
		status: "unread" | "reading" | "completed" | undefined,
	) => void;
	stats: {
		total: number;
		unread: number;
		reading: number;
		completed: number;
	};
};

vi.mock("@/features/bookshelf/components/StatusTabs", () => ({
	StatusTabs: ({ onStatusChange, stats }: StatusTabsProps) => (
		<div>
			<button type="button" onClick={() => onStatusChange(undefined)}>
				すべて ({stats.total})
			</button>
			<button type="button" onClick={() => onStatusChange("unread")}>
				未読 ({stats.unread})
			</button>
			<button type="button" onClick={() => onStatusChange("reading")}>
				読書中 ({stats.reading})
			</button>
			<button type="button" onClick={() => onStatusChange("completed")}>
				読了 ({stats.completed})
			</button>
		</div>
	),
}));

// BooksListのプロパティの型定義
type BooksListProps = {
	books: Book[];
	onDelete?: (id: number) => void;
};

vi.mock("@/features/bookshelf/components/BooksList", () => ({
	BooksList: ({ books, onDelete }: BooksListProps) => (
		<div>
			{books.map((book: Book) => (
				<div key={book.id} data-testid={`book-${book.id}`}>
					<span>{book.title}</span>
					{onDelete && (
						<button type="button" onClick={() => onDelete(book.id)}>
							削除
						</button>
					)}
				</div>
			))}
		</div>
	),
}));

describe("BookshelfPage", () => {
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

	it("ページタイトルが表示される", () => {
		render(<BookshelfPage />, { wrapper: createWrapper() });
		expect(screen.getByText("本棚")).toBeInTheDocument();
		expect(
			screen.getByText("書籍、PDF、GitHub、Zennなどのコンテンツを管理します"),
		).toBeInTheDocument();
	});

	it("統計情報が正しく表示される", () => {
		render(<BookshelfPage />, { wrapper: createWrapper() });

		// 統計カードのテキストを確認
		const allCount = screen.getAllByText("3");
		expect(allCount.length).toBeGreaterThan(0); // 全体

		const unreadCount = screen.getAllByText("1");
		expect(unreadCount.length).toBeGreaterThan(0); // 複数の"1"が存在

		// 読書中と完了の数も確認（StatusTabsモック内で表示）
		expect(screen.getByText(/未読 \(1\)/)).toBeInTheDocument();
		expect(screen.getByText(/読書中 \(1\)/)).toBeInTheDocument();
		expect(screen.getByText(/読了 \(1\)/)).toBeInTheDocument();
	});

	it("本を追加ボタンが表示される", () => {
		render(<BookshelfPage />, { wrapper: createWrapper() });
		expect(screen.getByText("本を追加")).toBeInTheDocument();
	});

	it("ステータスタブが表示される", () => {
		render(<BookshelfPage />, { wrapper: createWrapper() });
		expect(screen.getByText(/すべて \(3\)/)).toBeInTheDocument();
		expect(screen.getByText(/未読 \(1\)/)).toBeInTheDocument();
		expect(screen.getByText(/読書中 \(1\)/)).toBeInTheDocument();
		expect(screen.getByText(/読了 \(1\)/)).toBeInTheDocument();
	});

	it("本のリストが表示される", () => {
		render(<BookshelfPage />, { wrapper: createWrapper() });
		expect(screen.getByTestId("book-1")).toBeInTheDocument();
		expect(screen.getByTestId("book-2")).toBeInTheDocument();
		expect(screen.getByTestId("book-3")).toBeInTheDocument();
		expect(screen.getByText("テスト書籍1")).toBeInTheDocument();
		expect(screen.getByText("テストPDF")).toBeInTheDocument();
		expect(screen.getByText("GitHubリポジトリ")).toBeInTheDocument();
	});

	it("削除確認ダイアログが表示される", async () => {
		const mockConfirm = vi.spyOn(window, "confirm").mockReturnValue(true);

		render(<BookshelfPage />, { wrapper: createWrapper() });

		const deleteButtons = screen.getAllByText("削除");
		fireEvent.click(deleteButtons[0]);

		expect(mockConfirm).toHaveBeenCalledWith(
			"このアイテムを削除してもよろしいですか？",
		);

		mockConfirm.mockRestore();
	});

	it("ステータスフィルターが機能する", async () => {
		const { useGetBooks } = await import(
			"@/features/bookshelf/queries/useGetBooks"
		);
		const mockUseGetBooks = vi.mocked(useGetBooks);

		render(<BookshelfPage />, { wrapper: createWrapper() });

		// 未読タブをクリック
		const unreadTab = screen.getByText(/未読 \(1\)/);
		fireEvent.click(unreadTab);

		await waitFor(() => {
			// useGetBooksが未読フィルターで呼ばれることを確認
			expect(mockUseGetBooks).toHaveBeenCalledWith("unread");
		});
	});

	it("ローディング状態が表示される", async () => {
		const { useGetBooks } = await import(
			"@/features/bookshelf/queries/useGetBooks"
		);
		// @ts-expect-error モックのための一部プロパティのみを設定
		vi.mocked(useGetBooks).mockReturnValue({
			data: [],
			isLoading: true,
			error: null,
		});

		render(<BookshelfPage />, { wrapper: createWrapper() });

		// ローディングスピナーが表示されることを確認
		const spinner = document.querySelector(".animate-spin");
		expect(spinner).toBeInTheDocument();
	});

	it("エラー状態が表示される", async () => {
		const { useGetBooks } = await import(
			"@/features/bookshelf/queries/useGetBooks"
		);
		// @ts-expect-error モックのための一部プロパティのみを設定
		vi.mocked(useGetBooks).mockReturnValue({
			data: [],
			isLoading: false,
			isError: true,
			error: new Error("データの取得に失敗しました"),
		});

		render(<BookshelfPage />, { wrapper: createWrapper() });

		expect(
			screen.getByText(/エラーが発生しました: データの取得に失敗しました/),
		).toBeInTheDocument();
	});
});
