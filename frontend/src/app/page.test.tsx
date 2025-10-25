/**
 * メインページのテスト
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/providers/ToastProvider";
import Page from "./page";

// Next.js router のモック
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
	}),
}));

// グローバルfetchのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>
			<ToastProvider>{children}</ToastProvider>
		</QueryClientProvider>
	);
};

const mockBookmarksResponse = {
	success: true,
	bookmarks: [
		{
			id: 1,
			title: "テスト記事",
			url: "https://example.com",
			createdAt: "2024-01-01T00:00:00.000Z",
			isRead: false,
			isFavorite: false,
			label: null,
		},
	],
	totalUnread: 5,
	todayReadCount: 3,
};

const mockLabelsResponse = {
	success: true,
	labels: [
		{ id: 1, name: "テストラベル", color: "#ff0000" },
		{ id: 2, name: "開発", color: "#00ff00" },
	],
};

describe("メインページ", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// デフォルトのモックレスポンス
		mockFetch.mockImplementation((url: string) => {
			if (url.includes("/api/labels")) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockLabelsResponse),
				});
			}
			if (url.includes("/api/bookmarks")) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockBookmarksResponse),
				});
			}
			return Promise.reject(new Error("未知のURL"));
		});
	});

	it("ページが正しくレンダリングされる", async () => {
		const wrapper = createWrapper();
		render(<Page />, { wrapper });

		// ローディング状態の確認
		expect(screen.getByText("ラベルを読み込み中...")).toBeInTheDocument();

		// データが読み込まれるまで待機
		await waitFor(() => {
			expect(screen.getByText("未読: 5件")).toBeInTheDocument();
		});

		expect(screen.getByText("本日既読: 3件")).toBeInTheDocument();
		expect(screen.queryByText("記事を追加")).not.toBeInTheDocument();
	});

	it("ラベルエラー時に適切なエラーメッセージを表示する", async () => {
		// ラベル取得でエラーが発生するようにモック
		mockFetch.mockImplementation((url: string) => {
			if (url.includes("/api/labels")) {
				return Promise.reject(new Error("ラベル取得エラー"));
			}
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve(mockBookmarksResponse),
			});
		});

		const wrapper = createWrapper();
		render(<Page />, { wrapper });

		await waitFor(() => {
			expect(
				screen.getByText(/ラベルの読み込みに失敗しました/),
			).toBeInTheDocument();
		});
	});

	it("ブックマークエラー時に適切なエラーメッセージを表示する", async () => {
		// ブックマーク取得でエラーが発生するようにモック
		mockFetch.mockImplementation((url: string) => {
			if (url.includes("/api/labels")) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockLabelsResponse),
				});
			}
			if (url.includes("/api/bookmarks")) {
				return Promise.reject(new Error("ブックマーク取得エラー"));
			}
			return Promise.reject(new Error("未知のURL"));
		});

		const wrapper = createWrapper();
		render(<Page />, { wrapper });

		await waitFor(() => {
			expect(
				screen.getByText(/ブックマークの読み込みに失敗しました/),
			).toBeInTheDocument();
		});
	});

	it("ローディング中にスケルトンを表示する", () => {
		// フェッチを永続的に保留状態にする
		mockFetch.mockImplementation(() => new Promise(() => {}));

		const wrapper = createWrapper();
		render(<Page />, { wrapper });

		// スケルトンローディングの確認
		expect(screen.getByText("ラベルを読み込み中...")).toBeInTheDocument();

		// アニメーションクラスが付いた要素の確認
		const skeletonElements = screen
			.getAllByRole("generic")
			.filter((el) => el.className.includes("animate-pulse"));
		expect(skeletonElements.length).toBeGreaterThan(0);
	});

	it("未読数と既読数が未定義の場合は表示しない", async () => {
		// 統計情報なしのレスポンス
		const responseWithoutStats = {
			success: true,
			bookmarks: [],
		};

		mockFetch.mockImplementation((url: string) => {
			if (url.includes("/api/labels")) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockLabelsResponse),
				});
			}
			if (url.includes("/api/bookmarks")) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(responseWithoutStats),
				});
			}
			return Promise.reject(new Error("未知のURL"));
		});

		const wrapper = createWrapper();
		render(<Page />, { wrapper });

		await waitFor(() => {
			expect(screen.getByText("テストラベル")).toBeInTheDocument();
		});

		// 統計情報が表示されないことを確認
		expect(screen.queryByText(/未読:/)).not.toBeInTheDocument();
		expect(screen.queryByText(/本日既読:/)).not.toBeInTheDocument();
	});
});
