import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { BookmarksList } from "./BookmarksList";

// 評価データのモック設定
let mockRatingData: {
	practicalValue: number;
	technicalDepth: number;
	understanding: number;
	novelty: number;
	importance: number;
	totalScore: number;
} | null = null;

vi.mock("@/features/ratings/queries/useArticleRating", () => ({
	useArticleRating: () => ({
		data: mockRatingData,
	}),
}));

const createTestQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
			mutations: {
				retry: false,
			},
		},
	});

const mockBookmark = {
	id: 1,
	url: "https://example.com",
	title: "Test Bookmark",
	isRead: false,
	isFavorite: false,
	summary: null,
	summaryCreatedAt: null,
	summaryUpdatedAt: null,
	createdAt: "2024-01-01T00:00:00Z",
	updatedAt: "2024-01-01T00:00:00Z",
	label: {
		id: 1,
		name: "テスト",
		color: "blue",
	},
};

describe("BookmarksList", () => {
	test("ブックマークがない場合にメッセージを表示する", () => {
		const queryClient = createTestQueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<BookmarksList bookmarks={[]} />
			</QueryClientProvider>,
		);
		expect(
			screen.getByText("表示するブックマークはありません。"),
		).toBeInTheDocument();
	});

	test("ブックマークがある場合にBookmarkCardを表示する", () => {
		const queryClient = createTestQueryClient();
		const bookmarks = [mockBookmark];

		render(
			<QueryClientProvider client={queryClient}>
				<BookmarksList bookmarks={bookmarks} />
			</QueryClientProvider>,
		);

		expect(screen.getByTestId("bookmark-item")).toBeInTheDocument();
		expect(screen.getByText("Test Bookmark")).toBeInTheDocument();
	});

	test("複数のブックマークを表示する", () => {
		const queryClient = createTestQueryClient();
		const bookmarks = [
			{ ...mockBookmark, id: 1, title: "First Bookmark" },
			{ ...mockBookmark, id: 2, title: "Second Bookmark" },
			{ ...mockBookmark, id: 3, title: "Third Bookmark" },
		];

		render(
			<QueryClientProvider client={queryClient}>
				<BookmarksList bookmarks={bookmarks} />
			</QueryClientProvider>,
		);

		expect(screen.getAllByTestId("bookmark-item")).toHaveLength(3);
		expect(screen.getByText("First Bookmark")).toBeInTheDocument();
		expect(screen.getByText("Second Bookmark")).toBeInTheDocument();
		expect(screen.getByText("Third Bookmark")).toBeInTheDocument();
	});

	test("onLabelClickが提供された場合にBookmarkCardに渡される", () => {
		// 評価データを設定（ラベルが表示されるようにする）
		mockRatingData = {
			practicalValue: 8,
			technicalDepth: 7,
			understanding: 9,
			novelty: 6,
			importance: 8,
			totalScore: 7.6,
		};

		const queryClient = createTestQueryClient();
		const onLabelClick = vi.fn();
		const bookmarks = [mockBookmark];

		render(
			<QueryClientProvider client={queryClient}>
				<BookmarksList bookmarks={bookmarks} onLabelClick={onLabelClick} />
			</QueryClientProvider>,
		);

		const labelElement = screen.getByText("テスト");
		fireEvent.click(labelElement);

		expect(onLabelClick).toHaveBeenCalledWith("テスト");
	});

	test("適切なグリッドレイアウトクラスが適用される", () => {
		const queryClient = createTestQueryClient();
		const bookmarks = [mockBookmark];

		render(
			<QueryClientProvider client={queryClient}>
				<BookmarksList bookmarks={bookmarks} />
			</QueryClientProvider>,
		);

		const gridContainer = screen.getByTestId("bookmark-item").parentElement;
		expect(gridContainer).toHaveClass(
			"grid",
			"gap-4",
			"sm:grid-cols-1",
			"md:grid-cols-2",
			"lg:grid-cols-3",
			"xl:grid-cols-4",
		);
	});

	test("各ブックマークアイテムが適切なクラスを持つ", () => {
		const queryClient = createTestQueryClient();
		const bookmarks = [mockBookmark];

		render(
			<QueryClientProvider client={queryClient}>
				<BookmarksList bookmarks={bookmarks} />
			</QueryClientProvider>,
		);

		const bookmarkItem = screen.getByTestId("bookmark-item");
		expect(bookmarkItem).toHaveClass("mx-auto", "w-full", "max-w-sm");
	});
});
