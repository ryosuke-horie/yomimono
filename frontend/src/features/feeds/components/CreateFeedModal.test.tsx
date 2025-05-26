import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateFeedModal } from "./CreateFeedModal";

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

const mockUseCreateRSSFeed = vi.fn();
vi.mock("../queries/useCreateRSSFeed", () => ({
	useCreateRSSFeed: () => mockUseCreateRSSFeed(),
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

describe("CreateFeedModal", () => {
	const mockMutate = vi.fn();
	const defaultProps = {
		isOpen: true,
		onClose: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockUseCreateRSSFeed.mockReturnValue({
			mutate: mockMutate,
			isPending: false,
		});
	});

	it("モーダルが開いているときに正しくレンダリングされる", () => {
		renderWithQueryClient(<CreateFeedModal {...defaultProps} />);

		expect(screen.getByTestId("modal")).toBeInTheDocument();
		expect(screen.getByText("RSSフィード登録")).toBeInTheDocument();
		expect(screen.getByLabelText("フィード名")).toBeInTheDocument();
		expect(screen.getByLabelText("RSS URL")).toBeInTheDocument();
		expect(screen.getByLabelText("有効にする")).toBeInTheDocument();
	});

	it("モーダルが閉じているときにレンダリングされない", () => {
		renderWithQueryClient(<CreateFeedModal {...defaultProps} isOpen={false} />);

		expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
	});

	it("フォーム入力が正しく動作する", () => {
		renderWithQueryClient(<CreateFeedModal {...defaultProps} />);

		const nameInput = screen.getByLabelText("フィード名");
		const urlInput = screen.getByLabelText("RSS URL");
		const activeCheckbox = screen.getByLabelText("有効にする");

		fireEvent.change(nameInput, { target: { value: "テストフィード" } });
		fireEvent.change(urlInput, {
			target: { value: "https://example.com/rss" },
		});
		fireEvent.click(activeCheckbox);

		expect(nameInput).toHaveValue("テストフィード");
		expect(urlInput).toHaveValue("https://example.com/rss");
		expect(activeCheckbox).not.toBeChecked();
	});

	it("バリデーションエラーを正しく表示する", async () => {
		renderWithQueryClient(<CreateFeedModal {...defaultProps} />);

		const form = screen.getByTestId("modal").querySelector("form");
		if (form) fireEvent.submit(form);

		await waitFor(() => {
			expect(
				screen.getByText("フィード名を入力してください"),
			).toBeInTheDocument();
			expect(screen.getByText("URLを入力してください")).toBeInTheDocument();
		});
	});

	it("無効なURLでバリデーションエラーを表示する", async () => {
		renderWithQueryClient(<CreateFeedModal {...defaultProps} />);

		const nameInput = screen.getByLabelText("フィード名");
		const urlInput = screen.getByLabelText("RSS URL");

		fireEvent.change(nameInput, { target: { value: "テスト" } });
		fireEvent.change(urlInput, { target: { value: "invalid-url" } });

		const form = screen.getByTestId("modal").querySelector("form");
		if (form) fireEvent.submit(form);

		await waitFor(() => {
			expect(
				screen.getByText("有効なURLを入力してください"),
			).toBeInTheDocument();
		});
	});

	it("フォーム送信が正しく動作する", async () => {
		const onCloseMock = vi.fn();
		renderWithQueryClient(
			<CreateFeedModal {...defaultProps} onClose={onCloseMock} />,
		);

		const nameInput = screen.getByLabelText("フィード名");
		const urlInput = screen.getByLabelText("RSS URL");

		fireEvent.change(nameInput, { target: { value: "テストフィード" } });
		fireEvent.change(urlInput, {
			target: { value: "https://example.com/rss" },
		});

		const form = screen.getByTestId("modal").querySelector("form");
		if (form) fireEvent.submit(form);

		await waitFor(() => {
			expect(mockMutate).toHaveBeenCalledWith(
				{
					name: "テストフィード",
					url: "https://example.com/rss",
					isActive: true,
				},
				expect.objectContaining({
					onSuccess: expect.any(Function),
					onError: expect.any(Function),
				}),
			);
		});
	});

	it("送信成功時にフォームがリセットされモーダルが閉じる", async () => {
		const onCloseMock = vi.fn();
		let successCallback: (() => void) | undefined;

		mockMutate.mockImplementation((data, options) => {
			successCallback = options.onSuccess;
		});

		renderWithQueryClient(
			<CreateFeedModal {...defaultProps} onClose={onCloseMock} />,
		);

		const nameInput = screen.getByLabelText("フィード名");
		const urlInput = screen.getByLabelText("RSS URL");
		fireEvent.change(nameInput, { target: { value: "テスト" } });
		fireEvent.change(urlInput, {
			target: { value: "https://example.com/test" },
		});

		const form = screen.getByTestId("modal").querySelector("form");
		if (form) fireEvent.submit(form);

		// 成功コールバックを実行
		act(() => {
			successCallback?.();
		});

		expect(onCloseMock).toHaveBeenCalled();
	});

	it("送信中は適切なローディング状態を表示する", () => {
		mockUseCreateRSSFeed.mockReturnValue({
			mutate: mockMutate,
			isPending: true,
		});

		renderWithQueryClient(<CreateFeedModal {...defaultProps} />);

		expect(screen.getByText("登録中...")).toBeInTheDocument();
		expect(screen.getByText("キャンセル")).toBeDisabled();
		expect(screen.getByText("登録中...")).toBeDisabled();
	});

	it("送信エラー時にエラーメッセージを表示する", async () => {
		let errorCallback: ((error: Error) => void) | undefined;

		mockMutate.mockImplementation((data, options) => {
			errorCallback = options.onError;
		});

		renderWithQueryClient(<CreateFeedModal {...defaultProps} />);

		// 有効なデータを入力してバリデーションを通す
		const nameInput = screen.getByLabelText("フィード名");
		const urlInput = screen.getByLabelText("RSS URL");
		fireEvent.change(nameInput, { target: { value: "テスト" } });
		fireEvent.change(urlInput, {
			target: { value: "https://example.com/test" },
		});

		const form = screen.getByTestId("modal").querySelector("form");
		if (form) fireEvent.submit(form);

		// エラーコールバックを実行
		act(() => {
			errorCallback?.(new Error("テストエラー"));
		});

		await waitFor(() => {
			expect(screen.getByText("テストエラー")).toBeInTheDocument();
		});
	});

	it("キャンセルボタンでモーダルが閉じる", () => {
		const onCloseMock = vi.fn();
		renderWithQueryClient(
			<CreateFeedModal {...defaultProps} onClose={onCloseMock} />,
		);

		const cancelButton = screen.getByText("キャンセル");
		fireEvent.click(cancelButton);

		expect(onCloseMock).toHaveBeenCalled();
	});
});
