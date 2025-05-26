import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RSSFeed } from "../types";
import { EditFeedModal } from "./EditFeedModal";

// モック
vi.mock("@/components/Modal", () => ({
	Modal: ({
		isOpen,
		onClose,
		title,
		children,
	}: {
		isOpen: boolean;
		onClose: () => void;
		title: string;
		children: React.ReactNode;
	}) =>
		isOpen ? (
			<div data-testid="modal">
				<h1>{title}</h1>
				<button type="button" onClick={onClose}>
					Close
				</button>
				{children}
			</div>
		) : null,
}));

vi.mock("@/components/Button", () => ({
	Button: ({
		children,
		onClick,
		type,
		variant,
		disabled,
	}: {
		children: React.ReactNode;
		onClick?: () => void;
		type?: "submit" | "reset" | "button";
		variant?: string;
		disabled?: boolean;
	}) => (
		<button
			onClick={onClick}
			type={type}
			disabled={disabled}
			data-variant={variant}
		>
			{children}
		</button>
	),
}));

const mockUseUpdateRSSFeed = vi.fn();
vi.mock("../queries/useRSSFeeds", () => ({
	useUpdateRSSFeed: () => mockUseUpdateRSSFeed(),
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

describe("EditFeedModal", () => {
	const mockMutate = vi.fn();
	const mockFeed: RSSFeed = {
		id: 1,
		name: "テストフィード",
		url: "https://example.com/rss",
		isActive: true,
		updateInterval: 3600,
		lastFetchedAt: "2024-01-01T00:00:00Z",
		nextFetchAt: "2024-01-01T01:00:00Z",
		itemCount: 10,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	};

	const defaultProps = {
		feed: mockFeed,
		isOpen: true,
		onClose: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockUseUpdateRSSFeed.mockReturnValue({
			mutate: mockMutate,
			isPending: false,
		});
	});

	it("モーダルが開いているときに正しくレンダリングされる", () => {
		renderWithQueryClient(<EditFeedModal {...defaultProps} />);

		expect(screen.getByTestId("modal")).toBeInTheDocument();
		expect(screen.getByText("フィードを編集")).toBeInTheDocument();
		expect(screen.getByDisplayValue("テストフィード")).toBeInTheDocument();
		expect(
			screen.getByDisplayValue("https://example.com/rss"),
		).toBeInTheDocument();
		expect(screen.getByRole("checkbox")).toBeChecked();
	});

	it("モーダルが閉じているときにレンダリングされない", () => {
		renderWithQueryClient(<EditFeedModal {...defaultProps} isOpen={false} />);

		expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
	});

	it("フォーム入力が正しく動作する", () => {
		renderWithQueryClient(<EditFeedModal {...defaultProps} />);

		const nameInput = screen.getByLabelText("フィード名");
		const urlInput = screen.getByLabelText("RSS URL");
		const activeCheckbox = screen.getByLabelText("有効");

		fireEvent.change(nameInput, { target: { value: "更新されたフィード" } });
		fireEvent.change(urlInput, {
			target: { value: "https://updated.com/rss" },
		});
		fireEvent.click(activeCheckbox);

		expect(nameInput).toHaveValue("更新されたフィード");
		expect(urlInput).toHaveValue("https://updated.com/rss");
		expect(activeCheckbox).not.toBeChecked();
	});

	it("フォーム送信が正しく動作する", () => {
		renderWithQueryClient(<EditFeedModal {...defaultProps} />);

		const nameInput = screen.getByLabelText("フィード名");
		fireEvent.change(nameInput, { target: { value: "更新フィード" } });

		const form =
			screen.getByRole("form") ||
			screen.getByTestId("modal").querySelector("form");
		if (form) fireEvent.submit(form);

		expect(mockMutate).toHaveBeenCalledWith(
			{
				id: 1,
				data: {
					name: "更新フィード",
					url: "https://example.com/rss",
					isActive: true,
				},
			},
			expect.objectContaining({
				onSuccess: expect.any(Function),
			}),
		);
	});

	it("更新成功時にモーダルが閉じる", () => {
		const onCloseMock = vi.fn();
		let successCallback: (() => void) | undefined;

		mockMutate.mockImplementation((data, options) => {
			successCallback = options.onSuccess;
		});

		renderWithQueryClient(
			<EditFeedModal {...defaultProps} onClose={onCloseMock} />,
		);

		const form = screen.getByTestId("modal").querySelector("form");
		if (form) fireEvent.submit(form);

		// 成功コールバックを実行
		successCallback?.();

		expect(onCloseMock).toHaveBeenCalled();
	});

	it("送信中は適切なローディング状態を表示する", () => {
		mockUseUpdateRSSFeed.mockReturnValue({
			mutate: mockMutate,
			isPending: true,
		});

		renderWithQueryClient(<EditFeedModal {...defaultProps} />);

		expect(screen.getByText("更新中...")).toBeInTheDocument();

		const buttons = screen.getAllByRole("button");
		const cancelButton = buttons.find(
			(btn) => btn.textContent === "キャンセル",
		);
		const updateButton = buttons.find((btn) => btn.textContent === "更新中...");

		expect(cancelButton).toBeDisabled();
		expect(updateButton).toBeDisabled();
	});

	it("キャンセルボタンでモーダルが閉じる", () => {
		const onCloseMock = vi.fn();
		renderWithQueryClient(
			<EditFeedModal {...defaultProps} onClose={onCloseMock} />,
		);

		const cancelButton = screen.getByText("キャンセル");
		fireEvent.click(cancelButton);

		expect(onCloseMock).toHaveBeenCalled();
	});

	it("非アクティブなフィードでも正しく表示される", () => {
		const inactiveFeed = { ...mockFeed, isActive: false };
		renderWithQueryClient(
			<EditFeedModal {...defaultProps} feed={inactiveFeed} />,
		);

		const activeCheckbox = screen.getByLabelText("有効");
		expect(activeCheckbox).not.toBeChecked();
	});

	it("フィードデータが正しくフォームに初期値として設定される", () => {
		const customFeed: RSSFeed = {
			id: 2,
			name: "カスタムフィード",
			url: "https://custom.com/feed.xml",
			isActive: false,
			updateInterval: 7200,
			lastFetchedAt: "2024-01-01T00:00:00Z",
			nextFetchAt: "2024-01-01T02:00:00Z",
			itemCount: 5,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		renderWithQueryClient(
			<EditFeedModal {...defaultProps} feed={customFeed} />,
		);

		expect(screen.getByDisplayValue("カスタムフィード")).toBeInTheDocument();
		expect(
			screen.getByDisplayValue("https://custom.com/feed.xml"),
		).toBeInTheDocument();
		expect(screen.getByLabelText("有効")).not.toBeChecked();
	});
});
