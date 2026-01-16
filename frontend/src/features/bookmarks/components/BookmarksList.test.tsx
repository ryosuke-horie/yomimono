import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ToastProvider } from "@/providers/ToastProvider";
import type { BookmarkWithLabel } from "../types";
import { BookmarksList } from "./BookmarksList";

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

const mockBookmark: BookmarkWithLabel = {
	id: 1,
	url: "https://example.com",
	title: "Test Bookmark",
	isRead: false,
	isFavorite: false,
	createdAt: "2024-01-01T00:00:00Z",
	updatedAt: "2024-01-01T00:00:00Z",
};

describe("BookmarksList", () => {
	test("ブックマークがない場合にメッセージを表示する", () => {
		const queryClient = createTestQueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<ToastProvider>
					<BookmarksList bookmarks={[]} />
				</ToastProvider>
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
				<ToastProvider>
					<BookmarksList bookmarks={bookmarks} />
				</ToastProvider>
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
				<ToastProvider>
					<BookmarksList bookmarks={bookmarks} />
				</ToastProvider>
			</QueryClientProvider>,
		);

		expect(screen.getAllByTestId("bookmark-item")).toHaveLength(3);
		expect(screen.getByText("First Bookmark")).toBeInTheDocument();
		expect(screen.getByText("Second Bookmark")).toBeInTheDocument();
		expect(screen.getByText("Third Bookmark")).toBeInTheDocument();
	});
});
