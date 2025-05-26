import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RSSFeed } from "../types";
import { FeedCard } from "./FeedCard";

// モック
vi.mock("@/components/Button", () => ({
	Button: ({
		children,
		onClick,
		variant,
		size,
	}: {
		children: React.ReactNode;
		onClick?: () => void;
		variant?: string;
		size?: string;
	}) => (
		<button
			type="button"
			onClick={onClick}
			data-variant={variant}
			data-size={size}
		>
			{children}
		</button>
	),
}));

vi.mock("@/components/ConfirmDialog", () => ({
	ConfirmDialog: ({
		isOpen,
		onClose,
		onConfirm,
		title,
		message,
		isLoading,
	}: {
		isOpen: boolean;
		onClose: () => void;
		onConfirm: () => void;
		title: string;
		message: string;
		isLoading?: boolean;
	}) =>
		isOpen ? (
			<div data-testid="confirm-dialog">
				<h3>{title}</h3>
				<p>{message}</p>
				<button type="button" onClick={onConfirm} disabled={isLoading}>
					{isLoading ? "削除中..." : "確認"}
				</button>
				<button type="button" onClick={onClose}>
					キャンセル
				</button>
			</div>
		) : null,
}));

vi.mock("./EditFeedModal", () => ({
	EditFeedModal: ({
		feed,
		isOpen,
		onClose,
	}: { feed: { name: string }; isOpen: boolean; onClose: () => void }) =>
		isOpen ? (
			<div data-testid="edit-modal">
				<p>編集モーダル: {feed.name}</p>
				<button type="button" onClick={onClose}>
					閉じる
				</button>
			</div>
		) : null,
}));

const mockUseDeleteRSSFeed = vi.fn();
vi.mock("../queries/useRSSFeeds", () => ({
	useDeleteRSSFeed: () => mockUseDeleteRSSFeed(),
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

describe("FeedCard", () => {
	const mockMutate = vi.fn();
	const mockFeed: RSSFeed = {
		id: 1,
		name: "テストフィード",
		url: "https://example.com/rss",
		isActive: true,
		updateInterval: 3600,
		lastFetchedAt: "2024-01-01T10:00:00Z",
		nextFetchAt: "2024-01-01T11:00:00Z",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockUseDeleteRSSFeed.mockReturnValue({
			mutate: mockMutate,
			isPending: false,
		});

		// 固定の現在時刻を設定（テスト用）
		vi.setSystemTime(new Date("2024-01-01T11:00:00Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("フィード情報を正しく表示する", () => {
		renderWithQueryClient(<FeedCard feed={mockFeed} />);

		expect(screen.getByText("テストフィード")).toBeInTheDocument();
		expect(
			screen.getByText("URL: https://example.com/rss"),
		).toBeInTheDocument();
		expect(screen.getByText("編集")).toBeInTheDocument();
		expect(screen.getByText("削除")).toBeInTheDocument();
	});

	it("アクティブなフィードのステータスを正しく表示する", () => {
		renderWithQueryClient(<FeedCard feed={mockFeed} />);

		const statusIndicator = document.querySelector(".bg-green-500");
		expect(statusIndicator).toBeInTheDocument();
	});

	it("非アクティブなフィードのステータスを正しく表示する", () => {
		const inactiveFeed = { ...mockFeed, isActive: false };
		renderWithQueryClient(<FeedCard feed={inactiveFeed} />);

		const statusIndicator = document.querySelector(".bg-gray-400");
		expect(statusIndicator).toBeInTheDocument();
	});

	it("最終更新時刻を正しくフォーマットする", () => {
		renderWithQueryClient(<FeedCard feed={mockFeed} />);

		// 10:00 -> 11:00 なので1時間前
		expect(screen.getByText("最終更新: 1時間前")).toBeInTheDocument();
	});

	it("最終更新時刻がnullの場合の表示", () => {
		const feedWithoutLastFetch = { ...mockFeed, lastFetchedAt: null };
		renderWithQueryClient(<FeedCard feed={feedWithoutLastFetch} />);

		expect(
			screen.getByText("最終更新: まだ取得されていません"),
		).toBeInTheDocument();
	});

	it("時間経過による異なるフォーマット表示", () => {
		// 30分前
		vi.setSystemTime(new Date("2024-01-01T10:30:00Z"));
		const { rerender } = renderWithQueryClient(<FeedCard feed={mockFeed} />);
		expect(screen.getByText("最終更新: 30分前")).toBeInTheDocument();

		// 2時間前
		const feed2HoursAgo = {
			...mockFeed,
			lastFetchedAt: "2024-01-01T08:30:00Z",
		};
		vi.setSystemTime(new Date("2024-01-01T10:30:00Z"));
		rerender(<FeedCard feed={feed2HoursAgo} />);
		expect(screen.getByText("最終更新: 2時間前")).toBeInTheDocument();

		// 2日前
		const feed2DaysAgo = { ...mockFeed, lastFetchedAt: "2023-12-30T10:30:00Z" };
		vi.setSystemTime(new Date("2024-01-01T10:30:00Z"));
		rerender(<FeedCard feed={feed2DaysAgo} />);
		expect(screen.getByText("最終更新: 2日前")).toBeInTheDocument();
	});

	it("編集ボタンクリックで編集モーダルが開く", () => {
		renderWithQueryClient(<FeedCard feed={mockFeed} />);

		const editButton = screen.getByText("編集");
		fireEvent.click(editButton);

		expect(screen.getByTestId("edit-modal")).toBeInTheDocument();
		expect(
			screen.getByText("編集モーダル: テストフィード"),
		).toBeInTheDocument();
	});

	it("削除ボタンクリックで確認ダイアログが開く", () => {
		renderWithQueryClient(<FeedCard feed={mockFeed} />);

		const deleteButton = screen.getByText("削除");
		fireEvent.click(deleteButton);

		expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
		expect(screen.getByText("フィードの削除")).toBeInTheDocument();
		expect(
			screen.getByText("このフィードを削除してもよろしいですか？"),
		).toBeInTheDocument();
	});

	it("削除確認で削除処理が実行される", () => {
		renderWithQueryClient(<FeedCard feed={mockFeed} />);

		const deleteButton = screen.getByText("削除");
		fireEvent.click(deleteButton);

		const confirmButton = screen.getByText("確認");
		fireEvent.click(confirmButton);

		expect(mockMutate).toHaveBeenCalledWith(
			1,
			expect.objectContaining({
				onSuccess: expect.any(Function),
			}),
		);
	});

	it("削除成功時に確認ダイアログが閉じる", () => {
		let successCallback: (() => void) | undefined;

		mockMutate.mockImplementation((id, options) => {
			successCallback = options.onSuccess;
		});

		renderWithQueryClient(<FeedCard feed={mockFeed} />);

		const deleteButton = screen.getByText("削除");
		fireEvent.click(deleteButton);

		const confirmButton = screen.getByText("確認");
		fireEvent.click(confirmButton);

		// 成功コールバックを実行
		act(() => {
			successCallback?.();
		});

		expect(screen.queryByTestId("confirm-dialog")).not.toBeInTheDocument();
	});

	it("削除中のローディング状態を表示する", () => {
		mockUseDeleteRSSFeed.mockReturnValue({
			mutate: mockMutate,
			isPending: true,
		});

		renderWithQueryClient(<FeedCard feed={mockFeed} />);

		const deleteButton = screen.getByText("削除");
		fireEvent.click(deleteButton);

		expect(screen.getByText("削除中...")).toBeInTheDocument();
		expect(screen.getByText("削除中...")).toBeDisabled();
	});

	it("長いURLが省略表示される", () => {
		const feedWithLongURL = {
			...mockFeed,
			url: "https://verylongdomainname.example.com/very/long/path/to/rss/feed.xml",
		};
		renderWithQueryClient(<FeedCard feed={feedWithLongURL} />);

		const urlElement = screen.getByText(
			/URL: https:\/\/verylongdomainname.example.com/,
		);
		expect(urlElement).toHaveClass("truncate");
		expect(urlElement).toHaveAttribute("title", feedWithLongURL.url);
	});
});
