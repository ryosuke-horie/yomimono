/**
 * BookGridコンポーネントのテスト
 */

import { vi } from "vitest";
import { expect, render, screen, test, waitFor } from "@/test-utils";
import { BookGrid } from "./BookGrid";

// モックフック
vi.mock("../hooks/useBookshelf", () => ({
	useBookshelf: vi.fn(() => ({
		books: [
			{
				id: "1",
				title: "テスト本1",
				status: "unread",
				type: "book",
				createdAt: "2024-01-01",
				updatedAt: "2024-01-01",
			},
			{
				id: "2",
				title: "テスト本2",
				status: "reading",
				type: "pdf",
				createdAt: "2024-01-01",
				updatedAt: "2024-01-01",
			},
		],
		loading: false,
		error: null,
		fetchBooks: vi.fn(),
	})),
}));

test("ローディング状態が表示される", async () => {
	const { useBookshelf } = await import("../hooks/useBookshelf");
	// @ts-expect-error - モック用の型アサーション
	(useBookshelf as jest.Mock).mockReturnValue({
		books: [],
		loading: true,
		error: null,
		fetchBooks: vi.fn(),
	});

	render(<BookGrid status="unread" />);
	expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
});

test("エラー状態が表示される", async () => {
	const { useBookshelf } = await import("../hooks/useBookshelf");
	// @ts-expect-error - モック用の型アサーション
	(useBookshelf as jest.Mock).mockReturnValue({
		books: [],
		loading: false,
		error: "エラー",
		fetchBooks: vi.fn(),
	});

	render(<BookGrid status="unread" />);
	expect(screen.getByText("本の取得に失敗しました")).toBeInTheDocument();
	expect(screen.getByRole("button", { name: "再試行" })).toBeInTheDocument();
});

test("ステータスに応じた本が表示される", async () => {
	const { useBookshelf } = await import("../hooks/useBookshelf");
	// @ts-expect-error - モック用の型アサーション
	(useBookshelf as jest.Mock).mockReturnValue({
		books: [
			{
				id: "1",
				title: "テスト本1",
				status: "unread",
				type: "book",
				createdAt: "2024-01-01",
				updatedAt: "2024-01-01",
			},
			{
				id: "2",
				title: "テスト本2",
				status: "reading",
				type: "pdf",
				createdAt: "2024-01-01",
				updatedAt: "2024-01-01",
			},
		],
		loading: false,
		error: null,
		fetchBooks: vi.fn(),
	});

	render(<BookGrid status="unread" />);

	await waitFor(() => {
		expect(screen.getByText("テスト本1")).toBeInTheDocument();
		expect(screen.queryByText("テスト本2")).not.toBeInTheDocument();
	});
});

test("本がない場合のメッセージが表示される", async () => {
	const { useBookshelf } = await import("../hooks/useBookshelf");
	// @ts-expect-error - モック用の型アサーション
	(useBookshelf as jest.Mock).mockReturnValue({
		books: [],
		loading: false,
		error: null,
		fetchBooks: vi.fn(),
	});

	render(<BookGrid status="completed" />);
	expect(screen.getByText("読了の本はありません")).toBeInTheDocument();
});
