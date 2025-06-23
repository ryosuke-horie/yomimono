/**
 * FeedListPageコンポーネントのテスト
 * RSSフィード一覧ページの表示とモーダル操作をテスト
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeedListPage } from "./FeedListPage";

// フックのモック
const mockUseRSSFeeds = vi.fn();
vi.mock("../queries/useRSSFeeds", () => ({
	useRSSFeeds: () => mockUseRSSFeeds(),
}));

// コンポーネントのモック
vi.mock("../components/CreateFeedModal", () => ({
	CreateFeedModal: ({
		isOpen,
		onClose,
	}: {
		isOpen: boolean;
		onClose: () => void;
	}) =>
		isOpen ? (
			<div data-testid="create-feed-modal">
				<button type="button" onClick={onClose}>
					Close Modal
				</button>
			</div>
		) : null,
}));

vi.mock("../components/FeedCard", () => ({
	FeedCard: ({ feed }: { feed: { id: number; name: string } }) => (
		<div data-testid={`feed-card-${feed.id}`}>{feed.name}</div>
	),
}));

// テスト用QueryClientプロバイダー
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

describe("FeedListPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("ローディング状態を正しく表示する", () => {
		mockUseRSSFeeds.mockReturnValue({
			data: undefined,
			isLoading: true,
			error: null,
		});

		renderWithQueryClient(<FeedListPage />);

		expect(screen.getByText("読み込み中...")).toBeInTheDocument();
		const spinner = screen.getByText("読み込み中...").previousElementSibling;
		expect(spinner).toHaveClass("animate-spin");
	});

	it("エラー状態を正しく表示する", () => {
		const errorMessage = "ネットワークエラー";
		mockUseRSSFeeds.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: new Error(errorMessage),
		});

		renderWithQueryClient(<FeedListPage />);

		expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
		expect(screen.getByText(errorMessage)).toBeInTheDocument();
	});

	it("非Errorオブジェクトのエラーを正しく処理する", () => {
		mockUseRSSFeeds.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: "文字列エラー",
		});

		renderWithQueryClient(<FeedListPage />);

		expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
		expect(screen.getByText("データの取得に失敗しました")).toBeInTheDocument();
	});

	it("フィードが空の場合の表示を確認する", () => {
		mockUseRSSFeeds.mockReturnValue({
			data: { feeds: [] },
			isLoading: false,
			error: null,
		});

		renderWithQueryClient(<FeedListPage />);

		expect(screen.getByText("RSS管理")).toBeInTheDocument();
		expect(
			screen.getByText("RSSフィードがまだ登録されていません"),
		).toBeInTheDocument();
		expect(screen.getByText("最初のフィードを登録")).toBeInTheDocument();
	});

	it("フィード一覧を正しく表示する", () => {
		const mockFeeds = [
			{
				id: 1,
				name: "テストフィード1",
				url: "https://example.com/feed1",
				isActive: true,
				createdAt: "2023-01-01T00:00:00Z",
				updatedAt: "2023-01-01T00:00:00Z",
				updateInterval: 60,
				nextFetchAt: "2023-01-01T01:00:00Z",
			},
			{
				id: 2,
				name: "テストフィード2",
				url: "https://example.com/feed2",
				isActive: false,
				createdAt: "2023-01-01T00:00:00Z",
				updatedAt: "2023-01-01T00:00:00Z",
				updateInterval: 120,
				nextFetchAt: "2023-01-01T02:00:00Z",
			},
		];

		mockUseRSSFeeds.mockReturnValue({
			data: { feeds: mockFeeds },
			isLoading: false,
			error: null,
		});

		renderWithQueryClient(<FeedListPage />);

		expect(screen.getByText("RSS管理")).toBeInTheDocument();
		expect(screen.getByTestId("feed-card-1")).toBeInTheDocument();
		expect(screen.getByTestId("feed-card-2")).toBeInTheDocument();
		expect(screen.getByText("テストフィード1")).toBeInTheDocument();
		expect(screen.getByText("テストフィード2")).toBeInTheDocument();
	});

	it("新規登録ボタンをクリックするとモーダルが開く", async () => {
		mockUseRSSFeeds.mockReturnValue({
			data: { feeds: [] },
			isLoading: false,
			error: null,
		});

		renderWithQueryClient(<FeedListPage />);

		const newButton = screen.getByText("新規登録");
		fireEvent.click(newButton);

		await waitFor(() => {
			expect(screen.getByTestId("create-feed-modal")).toBeInTheDocument();
		});
	});

	it("最初のフィードを登録ボタンをクリックするとモーダルが開く", async () => {
		mockUseRSSFeeds.mockReturnValue({
			data: { feeds: [] },
			isLoading: false,
			error: null,
		});

		renderWithQueryClient(<FeedListPage />);

		const firstFeedButton = screen.getByText("最初のフィードを登録");
		fireEvent.click(firstFeedButton);

		await waitFor(() => {
			expect(screen.getByTestId("create-feed-modal")).toBeInTheDocument();
		});
	});

	it("モーダルを閉じることができる", async () => {
		mockUseRSSFeeds.mockReturnValue({
			data: { feeds: [] },
			isLoading: false,
			error: null,
		});

		renderWithQueryClient(<FeedListPage />);

		// モーダルを開く
		const newButton = screen.getByText("新規登録");
		fireEvent.click(newButton);

		await waitFor(() => {
			expect(screen.getByTestId("create-feed-modal")).toBeInTheDocument();
		});

		// モーダルを閉じる
		const closeButton = screen.getByText("Close Modal");
		fireEvent.click(closeButton);

		await waitFor(() => {
			expect(screen.queryByTestId("create-feed-modal")).not.toBeInTheDocument();
		});
	});

	it("データがundefinedの場合も正しく動作する", () => {
		mockUseRSSFeeds.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: null,
		});

		renderWithQueryClient(<FeedListPage />);

		expect(screen.getByText("RSS管理")).toBeInTheDocument();
		expect(
			screen.getByText("RSSフィードがまだ登録されていません"),
		).toBeInTheDocument();
	});

	it("正しいCSSクラスが適用されている", () => {
		mockUseRSSFeeds.mockReturnValue({
			data: { feeds: [] },
			isLoading: false,
			error: null,
		});

		const { container } = renderWithQueryClient(<FeedListPage />);

		const mainContainer = container.querySelector(
			".container.mx-auto.px-4.py-8",
		);
		expect(mainContainer).toBeInTheDocument();

		const header = container.querySelector(
			".flex.justify-between.items-center.mb-6",
		);
		expect(header).toBeInTheDocument();

		const title = container.querySelector(".text-2xl.font-bold");
		expect(title).toBeInTheDocument();
	});
});
