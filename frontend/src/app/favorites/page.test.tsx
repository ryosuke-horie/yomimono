import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/hooks/useToast";
import FavoritesPage from "./page";

// API呼び出しをモック
global.fetch = vi.fn();

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
		<QueryClientProvider client={queryClient}>
			<ToastProvider>{component}</ToastProvider>
		</QueryClientProvider>,
	);
};

describe("FavoritesPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("ローディング状態を正しく表示する", async () => {
		vi.mocked(fetch).mockImplementation(
			() =>
				new Promise(() => {
					// Promise を resolve しない (ローディング状態を維持)
				}),
		);

		renderWithQueryClient(<FavoritesPage />);

		expect(screen.getByText("お気に入り")).toBeInTheDocument();
		// スケルトンローディングを確認
		const skeletonElements = screen.getAllByRole("generic");
		expect(skeletonElements.length).toBeGreaterThan(0);
	});

	it("エラー状態を正しく表示する", async () => {
		vi.mocked(fetch).mockRejectedValue(new Error("API Error"));

		renderWithQueryClient(<FavoritesPage />);

		await waitFor(() => {
			expect(
				screen.getByText(/お気に入りブックマークの読み込みに失敗しました/),
			).toBeInTheDocument();
		});
	});

	it("お気に入りブックマークデータを正しく表示する", async () => {
		const mockBookmarks = [
			{
				id: 1,
				title: "テストブックマーク1",
				url: "https://example1.com",
				created_at: "2024-01-01T00:00:00Z",
				is_read: false,
				is_favorite: true,
				labels: [],
			},
		];

		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: async () => ({
				success: true,
				bookmarks: mockBookmarks,
			}),
		} as Response);

		renderWithQueryClient(<FavoritesPage />);

		await waitFor(() => {
			expect(screen.getByText("テストブックマーク1")).toBeInTheDocument();
		});
	});

	it("空のお気に入りリストを処理する", async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: async () => ({
				success: true,
				bookmarks: [],
			}),
		} as Response);

		renderWithQueryClient(<FavoritesPage />);

		await waitFor(() => {
			expect(screen.getByText("お気に入り")).toBeInTheDocument();
		});
	});
});
