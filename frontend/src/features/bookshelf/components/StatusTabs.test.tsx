/**
 * StatusTabsコンポーネントのテスト
 */

import { vi } from "vitest";
import { expect, render, screen, test, user } from "@/test-utils";
import { StatusTabs } from "./StatusTabs";

test("全てのタブが表示される", () => {
	const mockOnTabChange = vi.fn();
	render(<StatusTabs activeTab="unread" onTabChange={mockOnTabChange} />);

	expect(screen.getByRole("tab", { name: "未読" })).toBeInTheDocument();
	expect(screen.getByRole("tab", { name: "読書中" })).toBeInTheDocument();
	expect(screen.getByRole("tab", { name: "読了" })).toBeInTheDocument();
});

test("アクティブタブが正しくハイライトされる", () => {
	const mockOnTabChange = vi.fn();
	render(<StatusTabs activeTab="reading" onTabChange={mockOnTabChange} />);

	const readingTab = screen.getByRole("tab", { name: "読書中" });
	expect(readingTab).toHaveAttribute("aria-selected", "true");
	expect(readingTab).toHaveClass("bg-white", "text-blue-600");
});

test("タブクリックでコールバックが呼ばれる", async () => {
	const mockOnTabChange = vi.fn();
	render(<StatusTabs activeTab="unread" onTabChange={mockOnTabChange} />);

	await user.click(screen.getByRole("tab", { name: "読了" }));
	expect(mockOnTabChange).toHaveBeenCalledWith("completed");
});
