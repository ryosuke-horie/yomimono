/**
 * 本棚一覧コンポーネント
 * ステータス別タブと本のグリッド表示を管理
 */

"use client";

import { useState } from "react";
import type { BookStatus } from "../types";
import { AddBookButton } from "./AddBookButton";
import { BookGrid } from "./BookGrid";
import { StatusTabs } from "./StatusTabs";

export function BookshelfList() {
	const [activeTab, setActiveTab] = useState<BookStatus>("unread");

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<StatusTabs activeTab={activeTab} onTabChange={setActiveTab} />
				<AddBookButton />
			</div>
			<BookGrid status={activeTab} />
		</div>
	);
}

if (import.meta.vitest) {
	const { test, expect, render, screen } = await import("@/test-utils");

	test("本棚一覧コンポーネントが正しく表示される", () => {
		render(<BookshelfList />);

		// タブが表示される
		expect(screen.getByRole("tab", { name: "未読" })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "読書中" })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "読了" })).toBeInTheDocument();

		// 追加ボタンが表示される
		expect(
			screen.getByRole("button", { name: /本を追加/ }),
		).toBeInTheDocument();
	});

	test("タブ切り替えが正しく動作する", async () => {
		const { user } = await import("@/test-utils");
		render(<BookshelfList />);

		const readingTab = screen.getByRole("tab", { name: "読書中" });
		await user.click(readingTab);

		expect(readingTab).toHaveAttribute("aria-selected", "true");
	});
}
