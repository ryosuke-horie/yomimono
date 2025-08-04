/**
 * BookshelfListコンポーネントのテスト
 */

import { vi } from "vitest";
import { expect, render, screen, test, user } from "@/test-utils";
import { BookshelfList } from "./BookshelfList";

// useGetBooksフックをモック
vi.mock("../queries/useGetBooks", () => ({
	useGetBooks: vi.fn(() => ({
		data: [
			{
				id: 1,
				title: "Clean Code",
				status: "reading",
				type: "book",
				url: null,
				imageUrl: null,
				progress: 30,
				completedAt: null,
				createdAt: "2024-01-01",
				updatedAt: "2024-01-15",
			},
			{
				id: 2,
				title: "TypeScript Deep Dive",
				status: "unread",
				type: "pdf",
				url: null,
				imageUrl: null,
				progress: 0,
				completedAt: null,
				createdAt: "2024-01-05",
				updatedAt: "2024-01-05",
			},
			{
				id: 3,
				title: "React Patterns",
				status: "completed",
				type: "github",
				url: null,
				imageUrl: null,
				progress: 100,
				completedAt: "2024-01-20",
				createdAt: "2024-01-10",
				updatedAt: "2024-01-20",
			},
		],
		isLoading: false,
		error: null,
	})),
}));

// 子コンポーネントをモック
vi.mock("./StatusTabs", () => ({
	StatusTabs: vi.fn(({ currentStatus, onStatusChange, stats }) => (
		<div role="tablist">
			<button
				type="button"
				role="tab"
				aria-selected={currentStatus === "unread"}
				onClick={() => onStatusChange("unread")}
			>
				未読 ({stats?.unread || 0})
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={currentStatus === "reading"}
				onClick={() => onStatusChange("reading")}
			>
				読書中 ({stats?.reading || 0})
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={currentStatus === "completed"}
				onClick={() => onStatusChange("completed")}
			>
				読了 ({stats?.completed || 0})
			</button>
		</div>
	)),
}));

vi.mock("./AddBookButton", () => ({
	AddBookButton: vi.fn(() => <button type="button">本を追加</button>),
}));

vi.mock("./BookGrid", () => ({
	BookGrid: vi.fn(() => <div>BookGrid</div>),
}));

test("本棚一覧コンポーネントが正しく表示される", () => {
	render(<BookshelfList />);

	// タブが表示される（統計情報付き）
	expect(screen.getByRole("tab", { name: /未読/ })).toBeInTheDocument();
	expect(screen.getByRole("tab", { name: /読書中/ })).toBeInTheDocument();
	expect(screen.getByRole("tab", { name: /読了/ })).toBeInTheDocument();

	// 追加ボタンが表示される
	expect(screen.getByRole("button", { name: /本を追加/ })).toBeInTheDocument();
});

test("タブ切り替えが正しく動作する", async () => {
	render(<BookshelfList />);

	const readingTab = screen.getByRole("tab", { name: /読書中/ });
	await user.click(readingTab);

	expect(readingTab).toHaveAttribute("aria-selected", "true");
});
