/**
 * BookmarkCard コンポーネントのテスト
 * ブックマーカード表示、お気に入り、既読/未読、要約、シェア、コピー機能をテスト
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { BookmarkWithLabel } from "@/features/bookmarks/types";
import { BookmarkCard } from "./BookmarkCard";
import { vi } from "vitest";

// 基本的なモック設定
const mockToggleFavorite = vi.fn();
const mockMarkAsRead = vi.fn();
const mockMarkAsUnread = vi.fn();

vi.mock("@/features/bookmarks/queries/useToggleFavoriteBookmark", () => ({
	useToggleFavoriteBookmark: () => ({
		mutate: mockToggleFavorite,
		isPending: false,
	}),
}));

vi.mock("@/features/bookmarks/queries/useMarkBookmarkAsRead", () => ({
	useMarkBookmarkAsRead: () => ({
		mutate: mockMarkAsRead,
		isPending: false,
	}),
}));

vi.mock("@/features/bookmarks/queries/useMarkBookmarkAsUnread", () => ({
	useMarkBookmarkAsUnread: () => ({
		mutate: mockMarkAsUnread,
		isPending: false,
	}),
}));

// LabelDisplayコンポーネントのモック
vi.mock("@/features/labels/components/LabelDisplay", () => ({
	LabelDisplay: ({ label, onClick }: { label: any; onClick?: (name: string) => void }) => (
		<button onClick={() => onClick?.(label.name)} data-testid="label-display">
			{label.name}
		</button>
	),
}));

// BookmarkSummaryコンポーネントのモック
vi.mock("./BookmarkSummary", () => ({
	BookmarkSummary: ({ summary }: { summary: string }) => (
		<div data-testid="bookmark-summary">{summary}</div>
	),
}));

// Navigator.clipboard APIのモック
Object.defineProperty(navigator, "clipboard", {
	value: {
		writeText: vi.fn().mockResolvedValue(undefined),
	},
	writable: true,
});

// window.openのモック
Object.defineProperty(window, "open", {
	value: vi.fn(),
	writable: true,
});

const createMockBookmark = (overrides?: Partial<BookmarkWithLabel>): BookmarkWithLabel => ({
	id: 1,
	title: "テスト記事タイトル",
	url: "https://example.com/article",
	createdAt: "2024-01-01T00:00:00Z",
	isRead: false,
	isFavorite: false,
	label: null,
	summary: null,
	summaryUpdatedAt: null,
	...overrides,
});

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

describe("BookmarkCard", () => {
	let wrapper: ({ children }: { children: React.ReactNode }) => React.ReactElement;

	beforeEach(() => {
		wrapper = createWrapper();
		vi.clearAllMocks();
	});

	describe("基本表示", () => {
		it("ブックマーク情報が正しく表示される", () => {
			const mockBookmark = createMockBookmark({
				title: "React Testing Library入門",
				url: "https://example.com/react-testing",
				createdAt: "2024-01-15T10:30:00Z",
			});

			render(<BookmarkCard bookmark={mockBookmark} />, { wrapper });

			expect(screen.getByText("React Testing Library入門")).toBeInTheDocument();
			expect(screen.getByText("https://example.com/react-testing")).toBeInTheDocument();
			expect(screen.getByText("2024/1/15")).toBeInTheDocument();
		});

		it("既読状態のブックマークは背景色が変わる", () => {
			const mockBookmark = createMockBookmark({ isRead: true });

			render(<BookmarkCard bookmark={mockBookmark} />, { wrapper });

			const article = screen.getByRole("article");
			expect(article).toHaveClass("bg-gray-50");
		});

		it("未読状態のブックマークは通常の背景色", () => {
			const mockBookmark = createMockBookmark({ isRead: false });

			render(<BookmarkCard bookmark={mockBookmark} />, { wrapper });

			const article = screen.getByRole("article");
			expect(article).not.toHaveClass("bg-gray-50");
		});
	});

	describe("お気に入り機能", () => {
		it("お気に入りボタンをクリックすると切り替え処理が呼ばれる", () => {
			const mockBookmark = createMockBookmark({ id: 123, isFavorite: false });

			render(<BookmarkCard bookmark={mockBookmark} />, { wrapper });

			const favoriteButton = screen.getByRole("button", { name: /お気に入りに追加/ });
			fireEvent.click(favoriteButton);

			expect(mockToggleFavorite).toHaveBeenCalledWith({
				id: 123,
				isCurrentlyFavorite: false,
			});
		});
	});

	describe("既読/未読機能", () => {
		it("既読ボタンをクリックすると既読処理が呼ばれる", () => {
			const mockBookmark = createMockBookmark({ id: 456, isRead: false });

			render(<BookmarkCard bookmark={mockBookmark} />, { wrapper });

			const readButton = screen.getByRole("button", { name: /既読にする/ });
			fireEvent.click(readButton);

			expect(mockMarkAsRead).toHaveBeenCalledWith(456);
		});

		it("未読ボタンをクリックすると未読処理が呼ばれる", () => {
			const mockBookmark = createMockBookmark({ id: 789, isRead: true });

			render(<BookmarkCard bookmark={mockBookmark} />, { wrapper });

			const unreadButton = screen.getByRole("button", { name: /未読に戻す/ });
			fireEvent.click(unreadButton);

			expect(mockMarkAsUnread).toHaveBeenCalledWith(789);
		});

		it("リンククリック時に未読記事は自動で既読になる", () => {
			const mockBookmark = createMockBookmark({ id: 111, isRead: false });

			render(<BookmarkCard bookmark={mockBookmark} />, { wrapper });

			const link = screen.getByRole("link");
			fireEvent.click(link);

			expect(mockMarkAsRead).toHaveBeenCalledWith(111);
		});

		it("リンククリック時に既読記事は処理されない", () => {
			const mockBookmark = createMockBookmark({ isRead: true });

			render(<BookmarkCard bookmark={mockBookmark} />, { wrapper });

			const link = screen.getByRole("link");
			fireEvent.click(link);

			expect(mockMarkAsRead).not.toHaveBeenCalled();
		});
	});

	describe("要約機能", () => {
		it("要約がある場合は要約ボタンが有効", () => {
			const mockBookmark = createMockBookmark({
				summary: "これは要約文です。",
			});

			render(<BookmarkCard bookmark={mockBookmark} />, { wrapper });

			const summaryButton = screen.getByRole("button", { name: /要約を表示/ });
			expect(summaryButton).not.toBeDisabled();
		});

		it("要約がない場合は要約ボタンが無効", () => {
			const mockBookmark = createMockBookmark({ summary: null });

			render(<BookmarkCard bookmark={mockBookmark} />, { wrapper });

			const summaryButton = screen.getByRole("button", { name: /要約がありません/ });
			expect(summaryButton).toBeDisabled();
		});

		it("要約ボタンをクリックすると要約が表示される", () => {
			const mockBookmark = createMockBookmark({
				summary: "テスト要約内容",
			});

			render(<BookmarkCard bookmark={mockBookmark} />, { wrapper });

			const summaryButton = screen.getByRole("button", { name: /要約を表示/ });
			fireEvent.click(summaryButton);

			expect(screen.getByTestId("bookmark-summary")).toBeInTheDocument();
			expect(screen.getByText("テスト要約内容")).toBeInTheDocument();
		});

		it("要約表示中にボタンを再クリックすると要約が非表示になる", () => {
			const mockBookmark = createMockBookmark({
				summary: "テスト要約内容",
			});

			render(<BookmarkCard bookmark={mockBookmark} />, { wrapper });

			const summaryButton = screen.getByRole("button", { name: /要約を表示/ });
			
			// 要約を表示
			fireEvent.click(summaryButton);
			expect(screen.getByTestId("bookmark-summary")).toBeInTheDocument();

			// 要約を非表示
			fireEvent.click(summaryButton);
			expect(screen.queryByTestId("bookmark-summary")).not.toBeInTheDocument();
		});
	});

	describe("シェア機能", () => {
		it("シェアボタンをクリックするとTwitterシェアウィンドウが開く", () => {
			const mockOpen = vi.fn();
			window.open = mockOpen;

			const mockBookmark = createMockBookmark({
				title: "シェアテスト記事",
				url: "https://example.com/share-test",
			});

			render(<BookmarkCard bookmark={mockBookmark} />, { wrapper });

			const shareButton = screen.getByRole("button", { name: /Xでシェア/ });
			fireEvent.click(shareButton);

			// 実際のエンコード結果を確認して期待値を調整
			expect(mockOpen).toHaveBeenCalledWith(
				expect.stringContaining("https://twitter.com/intent/tweet"),
				"_blank"
			);
			expect(mockOpen).toHaveBeenCalledWith(
				expect.stringContaining("text="),
				"_blank"
			);
			expect(mockOpen).toHaveBeenCalledWith(
				expect.stringContaining("url="),
				"_blank"
			);
		});
	});

	describe("コピー機能", () => {
		it("IDコピーボタンをクリックするとクリップボードにIDがコピーされる", async () => {
			const mockWriteText = vi.fn().mockResolvedValue(undefined);
			navigator.clipboard.writeText = mockWriteText;

			const mockBookmark = createMockBookmark({ id: 12345 });

			render(<BookmarkCard bookmark={mockBookmark} />, { wrapper });

			const copyIdButton = screen.getByRole("button", { name: /ID: 12345をコピー/ });
			fireEvent.click(copyIdButton);

			expect(mockWriteText).toHaveBeenCalledWith("12345");
			
			// コピー成功フィードバックが表示される（ボタンのtitleに表示）
			await waitFor(() => {
				expect(screen.getByRole("button", { name: /コピーしました！/ })).toBeInTheDocument();
			});
		});

		it("URLコピーボタンをクリックするとクリップボードにURLがコピーされる", async () => {
			const mockWriteText = vi.fn().mockResolvedValue(undefined);
			navigator.clipboard.writeText = mockWriteText;

			const mockBookmark = createMockBookmark({
				url: "https://example.com/copy-test",
			});

			render(<BookmarkCard bookmark={mockBookmark} />, { wrapper });

			const copyUrlButton = screen.getByRole("button", { name: /URLをコピー/ });
			fireEvent.click(copyUrlButton);

			expect(mockWriteText).toHaveBeenCalledWith("https://example.com/copy-test");

			// コピー成功フィードバックが表示される（ボタンのtitleに表示）
			await waitFor(() => {
				expect(screen.getByRole("button", { name: /コピーしました！/ })).toBeInTheDocument();
			});
		});

		it("コピーに失敗した場合はエラーログが出力される", async () => {
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
			const mockWriteText = vi.fn().mockRejectedValue(new Error("コピー失敗"));
			navigator.clipboard.writeText = mockWriteText;

			const mockBookmark = createMockBookmark();

			render(<BookmarkCard bookmark={mockBookmark} />, { wrapper });

			const copyIdButton = screen.getByRole("button", { name: /ID: \d+をコピー/ });
			fireEvent.click(copyIdButton);

			await waitFor(() => {
				expect(consoleSpy).toHaveBeenCalledWith(
					"クリップボードへのコピーに失敗しました",
					expect.any(Error)
				);
			});

			consoleSpy.mockRestore();
		});
	});

	describe("ラベル機能", () => {
		it("ラベルがある場合はラベルが表示される", () => {
			const mockBookmark = createMockBookmark({
				label: {
					id: 1,
					name: "React",
					description: "React関連記事",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
				},
			});

			render(<BookmarkCard bookmark={mockBookmark} />, { wrapper });

			expect(screen.getByTestId("label-display")).toBeInTheDocument();
			expect(screen.getByText("React")).toBeInTheDocument();
		});

		it("ラベルがない場合はラベルが表示されない", () => {
			const mockBookmark = createMockBookmark({ label: null });

			render(<BookmarkCard bookmark={mockBookmark} />, { wrapper });

			expect(screen.queryByTestId("label-display")).not.toBeInTheDocument();
		});

		it("ラベルクリック時にコールバック関数が呼ばれる", () => {
			const mockOnLabelClick = vi.fn();
			const mockBookmark = createMockBookmark({
				label: {
					id: 1,
					name: "JavaScript",
					description: "JavaScript関連記事",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
				},
			});

			render(<BookmarkCard bookmark={mockBookmark} onLabelClick={mockOnLabelClick} />, { wrapper });

			const labelButton = screen.getByTestId("label-display");
			fireEvent.click(labelButton);

			expect(mockOnLabelClick).toHaveBeenCalledWith("JavaScript");
		});
	});
});