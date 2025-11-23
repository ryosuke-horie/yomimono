/**
 * BookmarkCardコンポーネントのテスト
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/providers/ToastProvider";
import type { BookmarkWithLabel } from "../types";
import { BookmarkCard } from "./BookmarkCard";

// クエリフックをモック
vi.mock("../queries/useToggleFavoriteBookmark", () => ({
	useToggleFavoriteBookmark: () => ({
		mutate: vi.fn(),
		isPending: false,
	}),
}));

const markAsReadMock = vi.fn();

vi.mock("../queries/useMarkBookmarkAsRead", () => ({
	useMarkBookmarkAsRead: () => ({
		mutate: markAsReadMock,
		isPending: false,
	}),
}));

vi.mock("../queries/useMarkBookmarkAsUnread", () => ({
	useMarkBookmarkAsUnread: () => ({
		mutate: vi.fn(),
		isPending: false,
	}),
}));

const assignLabelMock = vi.fn();

vi.mock("../queries/useAssignLabelToBookmark", () => ({
	useAssignLabelToBookmark: () => ({
		mutate: assignLabelMock,
		isPending: false,
	}),
}));

const mockBookmark: BookmarkWithLabel = {
	id: 1,
	title: "テスト記事",
	url: "https://example.com",
	createdAt: "2024-01-01T00:00:00.000Z",
	updatedAt: "2024-01-01T00:00:00.000Z",
	isRead: false,
	isFavorite: false,
	label: null,
};

const renderWithQueryClient = (component: React.ReactElement) => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return render(
		<QueryClientProvider client={queryClient}>
			<ToastProvider>{component}</ToastProvider>
		</QueryClientProvider>,
	);
};

describe("BookmarkCard", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		markAsReadMock.mockClear();
		assignLabelMock.mockClear();
	});

	it("基本的なブックマーク情報を表示する", () => {
		renderWithQueryClient(<BookmarkCard bookmark={mockBookmark} />);

		expect(screen.getByText("テスト記事")).toBeInTheDocument();
		expect(screen.getByText("https://example.com")).toBeInTheDocument();
		expect(screen.getByText("2024/1/1")).toBeInTheDocument();
	});

	it("タイトルなしのブックマークを適切に表示する", () => {
		const bookmarkWithoutTitle = { ...mockBookmark, title: null };
		renderWithQueryClient(<BookmarkCard bookmark={bookmarkWithoutTitle} />);

		expect(screen.getByText("タイトルなし")).toBeInTheDocument();
	});

	it("未読の場合、既読ボタンを表示しない", () => {
		renderWithQueryClient(<BookmarkCard bookmark={mockBookmark} />);

		expect(screen.queryByTitle("既読にする")).not.toBeInTheDocument();
	});

	it("既読の場合、未読に戻すボタンを表示する", () => {
		const readBookmark = { ...mockBookmark, isRead: true };
		renderWithQueryClient(<BookmarkCard bookmark={readBookmark} />);

		expect(screen.getByTitle("未読に戻す")).toBeInTheDocument();
	});

	it("リンクをクリックすると未読のブックマークを既読にする", () => {
		renderWithQueryClient(<BookmarkCard bookmark={mockBookmark} />);

		const link = screen.getByRole("link", { name: "テスト記事" });
		fireEvent.click(link);

		expect(markAsReadMock).toHaveBeenCalledWith(1);
	});

	it("お気に入りでない場合、お気に入りに追加ボタンを表示する", () => {
		renderWithQueryClient(<BookmarkCard bookmark={mockBookmark} />);

		expect(screen.getByTitle("お気に入りに追加")).toBeInTheDocument();
	});

	it("お気に入りの場合、お気に入りから削除ボタンを表示する", () => {
		const favoriteBookmark = { ...mockBookmark, isFavorite: true };
		renderWithQueryClient(<BookmarkCard bookmark={favoriteBookmark} />);

		expect(screen.getByTitle("お気に入りから削除")).toBeInTheDocument();
	});

	it("ラベルがある場合、ラベルを表示する", () => {
		const bookmarkWithLabel = {
			...mockBookmark,
			label: { id: 1, name: "テストラベル" },
		};
		renderWithQueryClient(<BookmarkCard bookmark={bookmarkWithLabel} />);

		expect(screen.getByText("テストラベル")).toBeInTheDocument();
	});

	it("ラベルクリックで登録済みラベルの選択肢を表示し、別ラベルを選べる", () => {
		const bookmarkWithLabel = {
			...mockBookmark,
			label: { id: 1, name: "テストラベル" },
		};
		const labels = [
			{ id: 1, name: "テストラベル" },
			{ id: 2, name: "別ラベル" },
		];
		renderWithQueryClient(
			<BookmarkCard bookmark={bookmarkWithLabel} availableLabels={labels} />,
		);

		const labelElement = screen.getByText("テストラベル");
		fireEvent.click(labelElement);

		const otherLabelButton = screen.getByRole("button", { name: "別ラベル" });
		fireEvent.click(otherLabelButton);

		expect(assignLabelMock).toHaveBeenCalledWith({
			bookmarkId: 1,
			labelName: "別ラベル",
			optimisticLabel: { id: 2, name: "別ラベル" },
		});
	});
});
