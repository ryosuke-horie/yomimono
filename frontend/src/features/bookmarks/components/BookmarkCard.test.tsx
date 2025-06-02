/**
 * BookmarkCardコンポーネントのテスト
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BookmarkWithLabel } from "../types";
import { BookmarkCard } from "./BookmarkCard";

// クエリフックをモック
vi.mock("../queries/useToggleFavoriteBookmark", () => ({
	useToggleFavoriteBookmark: () => ({
		mutate: vi.fn(),
		isPending: false,
	}),
}));

vi.mock("../queries/useMarkBookmarkAsRead", () => ({
	useMarkBookmarkAsRead: () => ({
		mutate: vi.fn(),
		isPending: false,
	}),
}));

vi.mock("../queries/useMarkBookmarkAsUnread", () => ({
	useMarkBookmarkAsUnread: () => ({
		mutate: vi.fn(),
		isPending: false,
	}),
}));

// navigator.clipboardをモック
Object.assign(navigator, {
	clipboard: {
		writeText: vi.fn().mockResolvedValue(undefined),
	},
});

// window.openをモック
window.open = vi.fn();

const mockBookmark: BookmarkWithLabel = {
	id: 1,
	title: "テスト記事",
	url: "https://example.com",
	createdAt: "2024-01-01T00:00:00.000Z",
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
		<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
	);
};

describe("BookmarkCard", () => {
	beforeEach(() => {
		vi.clearAllMocks();
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

	it("未読の場合、既読にするボタンを表示する", () => {
		renderWithQueryClient(<BookmarkCard bookmark={mockBookmark} />);

		expect(screen.getByTitle("既読にする")).toBeInTheDocument();
	});

	it("既読の場合、未読に戻すボタンを表示する", () => {
		const readBookmark = { ...mockBookmark, isRead: true };
		renderWithQueryClient(<BookmarkCard bookmark={readBookmark} />);

		expect(screen.getByTitle("未読に戻す")).toBeInTheDocument();
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

	it("シェアボタンをクリックするとTwitterの投稿画面が開く", () => {
		renderWithQueryClient(<BookmarkCard bookmark={mockBookmark} />);

		const shareButton = screen.getByTitle("Xでシェア");
		fireEvent.click(shareButton);

		expect(window.open).toHaveBeenCalledWith(
			expect.stringContaining("https://twitter.com/intent/tweet"),
			"_blank",
		);
	});

	it("IDコピーボタンをクリックするとIDがクリップボードにコピーされる", async () => {
		renderWithQueryClient(<BookmarkCard bookmark={mockBookmark} />);

		const copyIdButton = screen.getByTitle("ID: 1をコピー");
		fireEvent.click(copyIdButton);

		expect(navigator.clipboard.writeText).toHaveBeenCalledWith("1");
	});

	it("URLコピーボタンをクリックするとURLがクリップボードにコピーされる", async () => {
		renderWithQueryClient(<BookmarkCard bookmark={mockBookmark} />);

		const copyUrlButton = screen.getByTitle("URLをコピー");
		fireEvent.click(copyUrlButton);

		expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
			"https://example.com",
		);
	});

	it("ラベルがある場合、ラベルを表示する", () => {
		const bookmarkWithLabel = {
			...mockBookmark,
			label: { id: 1, name: "テストラベル", color: "#ff0000" },
		};
		renderWithQueryClient(<BookmarkCard bookmark={bookmarkWithLabel} />);

		expect(screen.getByText("テストラベル")).toBeInTheDocument();
	});

	it("onLabelClickが提供された場合、ラベルクリックが処理される", () => {
		const onLabelClick = vi.fn();
		const bookmarkWithLabel = {
			...mockBookmark,
			label: { id: 1, name: "テストラベル", color: "#ff0000" },
		};
		renderWithQueryClient(
			<BookmarkCard bookmark={bookmarkWithLabel} onLabelClick={onLabelClick} />,
		);

		const labelElement = screen.getByText("テストラベル");
		fireEvent.click(labelElement);

		expect(onLabelClick).toHaveBeenCalledWith("テストラベル");
	});
});
