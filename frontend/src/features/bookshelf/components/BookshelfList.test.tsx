/**
 * BookshelfListコンポーネントのテスト
 */

import { vi } from "vitest";
import { expect, render, screen, test, user } from "@/test-utils";
import { BookshelfList } from "./BookshelfList";

// 子コンポーネントをモック
vi.mock("./StatusTabs", () => ({
	StatusTabs: vi.fn(({ activeTab, onTabChange }) => (
		<div role="tablist">
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === "unread"}
				onClick={() => onTabChange("unread")}
			>
				未読
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === "reading"}
				onClick={() => onTabChange("reading")}
			>
				読書中
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === "completed"}
				onClick={() => onTabChange("completed")}
			>
				読了
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

	// タブが表示される
	expect(screen.getByRole("tab", { name: "未読" })).toBeInTheDocument();
	expect(screen.getByRole("tab", { name: "読書中" })).toBeInTheDocument();
	expect(screen.getByRole("tab", { name: "読了" })).toBeInTheDocument();

	// 追加ボタンが表示される
	expect(screen.getByRole("button", { name: /本を追加/ })).toBeInTheDocument();
});

test("タブ切り替えが正しく動作する", async () => {
	render(<BookshelfList />);

	const readingTab = screen.getByRole("tab", { name: "読書中" });
	await user.click(readingTab);

	expect(readingTab).toHaveAttribute("aria-selected", "true");
});
