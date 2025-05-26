import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RecentPage from "./page";

// BookmarkCardコンポーネントをモック
vi.mock("@/features/bookmarks/components/BookmarkCard", () => ({
	BookmarkCard: ({ bookmark }: any) => (
		<div data-testid={`bookmark-card-${bookmark.id}`}>
			<h3>{bookmark.title}</h3>
			<p>{bookmark.url}</p>
		</div>
	),
}));

// useGetRecentBookmarksフックをモック
const mockUseGetRecentBookmarks = vi.fn();
vi.mock("@/features/bookmarks/queries/useGetRecentBookmarks", () => ({
	useGetRecentBookmarks: () => mockUseGetRecentBookmarks(),
}));

const createTestQueryClient = () => {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				staleTime: 0,
				gcTime: 0,
			},
		},
	});
};

const renderWithQueryClient = (component: React.ReactElement) => {
	const queryClient = createTestQueryClient();
	return render(
		<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
	);
};

describe("RecentPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("ローディング状態を正しく表示する", () => {
		mockUseGetRecentBookmarks.mockReturnValue({
			data: {},
			isLoading: true,
			isError: false,
			error: null,
		});

		renderWithQueryClient(<RecentPage />);

		// ローディングスピナーを確認
		const spinner = document.querySelector(".animate-spin");
		expect(spinner).toBeInTheDocument();
	});

	it("エラー状態を正しく表示する", () => {
		mockUseGetRecentBookmarks.mockReturnValue({
			data: {},
			isLoading: false,
			isError: true,
			error: new Error("テストエラー"),
		});

		renderWithQueryClient(<RecentPage />);

		expect(screen.getByText("テストエラー")).toBeInTheDocument();
	});

	it("空の結果を正しく表示する", () => {
		mockUseGetRecentBookmarks.mockReturnValue({
			data: {},
			isLoading: false,
			isError: false,
			error: null,
		});

		renderWithQueryClient(<RecentPage />);

		expect(screen.getByText("最近読んだ記事はありません")).toBeInTheDocument();
	});

	it("グループ化されたブックマークを正しく表示する", () => {
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		const mockData = {
			[today.toISOString().split("T")[0]]: [
				{
					id: 1,
					title: "今日の記事",
					url: "https://today.com",
					created_at: today.toISOString(),
					is_read: true,
					is_favorite: false,
				},
			],
			[yesterday.toISOString().split("T")[0]]: [
				{
					id: 2,
					title: "昨日の記事",
					url: "https://yesterday.com",
					created_at: yesterday.toISOString(),
					is_read: true,
					is_favorite: false,
				},
			],
		};

		mockUseGetRecentBookmarks.mockReturnValue({
			data: mockData,
			isLoading: false,
			isError: false,
			error: null,
		});

		renderWithQueryClient(<RecentPage />);

		expect(screen.getByText("今日")).toBeInTheDocument();
		expect(screen.getByText("昨日")).toBeInTheDocument();
		expect(screen.getByText("今日の記事")).toBeInTheDocument();
		expect(screen.getByText("昨日の記事")).toBeInTheDocument();
	});

	it("日付フォーマット関数が正しく動作する", () => {
		const olderDate = new Date("2024-01-15");
		const mockData = {
			"2024-01-15": [
				{
					id: 3,
					title: "古い記事",
					url: "https://old.com",
					created_at: olderDate.toISOString(),
					is_read: true,
					is_favorite: false,
				},
			],
		};

		mockUseGetRecentBookmarks.mockReturnValue({
			data: mockData,
			isLoading: false,
			isError: false,
			error: null,
		});

		renderWithQueryClient(<RecentPage />);

		expect(screen.getByText("1月15日")).toBeInTheDocument();
		expect(screen.getByText("古い記事")).toBeInTheDocument();
	});

	it("日付順にソートされて表示される", () => {
		const date1 = "2024-01-15";
		const date2 = "2024-01-16";
		const date3 = "2024-01-14";

		const mockData = {
			[date1]: [{ id: 1, title: "記事1", url: "https://1.com", created_at: date1, is_read: true, is_favorite: false }],
			[date2]: [{ id: 2, title: "記事2", url: "https://2.com", created_at: date2, is_read: true, is_favorite: false }],
			[date3]: [{ id: 3, title: "記事3", url: "https://3.com", created_at: date3, is_read: true, is_favorite: false }],
		};

		mockUseGetRecentBookmarks.mockReturnValue({
			data: mockData,
			isLoading: false,
			isError: false,
			error: null,
		});

		renderWithQueryClient(<RecentPage />);

		const headings = screen.getAllByRole("heading", { level: 2 });
		// 最新日付から順に表示されることを確認
		expect(headings[0]).toHaveTextContent("1月16日");
		expect(headings[1]).toHaveTextContent("1月15日");
		expect(headings[2]).toHaveTextContent("1月14日");
	});
});