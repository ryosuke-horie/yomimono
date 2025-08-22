/**
 * ErrorPageコンポーネントのテスト
 * エラー表示とリセット機能をテスト
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/providers/ToastProvider";
import ErrorPage from "./error";

// コンソールエラーをモック化
const mockConsoleError = vi
	.spyOn(console, "error")
	.mockImplementation(() => {});

describe("ErrorPage", () => {
	const mockError = new Error("テストエラー");
	const mockReset = vi.fn();

	// 開発環境としてテストを実行するため、環境変数を設定
	const originalEnv = process.env.NODE_ENV;

	beforeAll(() => {
		process.env.NODE_ENV = "development";
	});

	afterAll(() => {
		process.env.NODE_ENV = originalEnv;
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ErrorPageをToastProviderでラップするヘルパー関数
	const renderWithToastProvider = (component: React.ReactElement) => {
		return render(<ToastProvider>{component}</ToastProvider>);
	};

	it("エラーページが正しくレンダリングされる", () => {
		renderWithToastProvider(<ErrorPage error={mockError} reset={mockReset} />);

		expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
		expect(
			screen.getByText("申し訳ありません。予期せぬエラーが発生しました。"),
		).toBeInTheDocument();
		expect(screen.getByText("再試行")).toBeInTheDocument();
	});

	it("mainコンテナが正しいクラスを持つ", () => {
		const { container } = renderWithToastProvider(
			<ErrorPage error={mockError} reset={mockReset} />,
		);
		const mainElement = container.querySelector("main");

		expect(mainElement).toHaveClass("container", "mx-auto", "px-4", "py-8");
	});

	it("エラーアラートが正しいスタイルクラスを持つ", () => {
		const { container } = renderWithToastProvider(
			<ErrorPage error={mockError} reset={mockReset} />,
		);
		const alertContainer = container.querySelector(".bg-red-50");

		expect(alertContainer).toHaveClass(
			"bg-red-50",
			"border-l-4",
			"border-red-400",
			"p-4",
			"rounded-sm",
		);
	});

	it("エラーアイコンが正しく表示される", () => {
		const { container } = renderWithToastProvider(
			<ErrorPage error={mockError} reset={mockReset} />,
		);
		const errorIcon = container.querySelector("svg");

		expect(errorIcon).toBeInTheDocument();
		expect(errorIcon).toHaveClass("h-5", "w-5", "text-red-400");
		expect(errorIcon).toHaveAttribute("viewBox", "0 0 20 20");
		expect(errorIcon).toHaveAttribute("fill", "currentColor");
	});

	it("エラータイトルが正しいスタイルを持つ", () => {
		renderWithToastProvider(<ErrorPage error={mockError} reset={mockReset} />);
		const title = screen.getByText("エラーが発生しました");

		expect(title).toHaveClass("text-sm", "font-medium", "text-red-800");
		expect(title.tagName).toBe("H3");
	});

	it("エラーメッセージが正しいスタイルを持つ", () => {
		const { container } = renderWithToastProvider(
			<ErrorPage error={mockError} reset={mockReset} />,
		);
		const messageContainer = container.querySelector(
			".mt-2.text-sm.text-red-700",
		);
		const message = screen.getByText(
			"申し訳ありません。予期せぬエラーが発生しました。",
		);

		expect(messageContainer).toBeInTheDocument();
		expect(messageContainer).toHaveClass("mt-2", "text-sm", "text-red-700");
		expect(messageContainer).toContainElement(message);
	});

	it("再試行ボタンが正しいスタイルを持つ", () => {
		renderWithToastProvider(<ErrorPage error={mockError} reset={mockReset} />);
		const retryButton = screen.getByText("再試行");

		expect(retryButton).toHaveClass(
			"inline-flex",
			"items-center",
			"px-4",
			"py-2",
			"border",
			"border-transparent",
			"text-sm",
			"font-medium",
			"rounded-md",
			"text-red-700",
			"bg-red-100",
			"hover:bg-red-200",
			"focus:outline-hidden",
			"focus:ring-2",
			"focus:ring-offset-2",
			"focus:ring-red-500",
		);
		expect(retryButton).toHaveAttribute("type", "button");
	});

	it("再試行ボタンクリックでreset関数が呼ばれる", () => {
		renderWithToastProvider(<ErrorPage error={mockError} reset={mockReset} />);
		const retryButton = screen.getByText("再試行");

		fireEvent.click(retryButton);

		expect(mockReset).toHaveBeenCalledTimes(1);
	});

	it("useEffectでコンソールエラーが呼ばれる", () => {
		renderWithToastProvider(<ErrorPage error={mockError} reset={mockReset} />);

		expect(mockConsoleError).toHaveBeenCalledWith(
			"エラーが発生しました:",
			mockError,
		);
	});

	it("digestプロパティ付きエラーオブジェクトも正しく処理される", () => {
		const errorWithDigest = new Error("テストエラー") as Error & {
			digest?: string;
		};
		errorWithDigest.digest = "test-digest-123";

		renderWithToastProvider(
			<ErrorPage error={errorWithDigest} reset={mockReset} />,
		);

		expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
		expect(mockConsoleError).toHaveBeenCalledWith(
			"エラーが発生しました:",
			errorWithDigest,
		);
	});

	it("エラーオブジェクトが変更されると useEffect が再実行される", () => {
		const { rerender } = renderWithToastProvider(
			<ErrorPage error={mockError} reset={mockReset} />,
		);

		expect(mockConsoleError).toHaveBeenCalledTimes(1);

		const newError = new Error("新しいエラー");
		rerender(
			<ToastProvider>
				<ErrorPage error={newError} reset={mockReset} />
			</ToastProvider>,
		);

		expect(mockConsoleError).toHaveBeenCalledTimes(2);
		expect(mockConsoleError).toHaveBeenLastCalledWith(
			"エラーが発生しました:",
			newError,
		);
	});
});
