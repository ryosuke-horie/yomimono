/**
 * StatusTabsコンポーネントのテスト
 */

import { vi } from "vitest";
import { expect, render, screen, test, user } from "@/test-utils";
import { StatusTabs } from "./StatusTabs";

// モックのstatsデータ
const mockStats = {
	total: 10,
	unread: 5,
	reading: 3,
	completed: 2,
};

test("全てのタブが表示される", () => {
	const mockOnStatusChange = vi.fn();
	render(
		<StatusTabs
			currentStatus="unread"
			onStatusChange={mockOnStatusChange}
			stats={mockStats}
		/>,
	);

	expect(screen.getByRole("tab", { name: /未読/ })).toBeInTheDocument();
	expect(screen.getByRole("tab", { name: /読書中/ })).toBeInTheDocument();
	expect(screen.getByRole("tab", { name: /読了/ })).toBeInTheDocument();
});

test("アクティブタブが正しくハイライトされる", () => {
	const mockOnStatusChange = vi.fn();
	render(
		<StatusTabs
			currentStatus="reading"
			onStatusChange={mockOnStatusChange}
			stats={mockStats}
		/>,
	);

	const readingTab = screen.getByRole("tab", { name: /読書中/ });
	expect(readingTab).toHaveAttribute("aria-selected", "true");
	expect(readingTab.className).toContain("border-blue-500");
	expect(readingTab.className).toContain("text-blue-600");
});

test("タブクリックでコールバックが呼ばれる", async () => {
	const mockOnStatusChange = vi.fn();
	render(
		<StatusTabs
			currentStatus="unread"
			onStatusChange={mockOnStatusChange}
			stats={mockStats}
		/>,
	);

	await user.click(screen.getByRole("tab", { name: /読了/ }));
	expect(mockOnStatusChange).toHaveBeenCalledWith("completed");
});
