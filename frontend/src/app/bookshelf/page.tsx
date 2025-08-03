/**
 * 本棚機能の一覧画面
 * ユーザーが登録した本をステータス別に表示する
 */

import { BookshelfList } from "@/features/bookshelf/components/BookshelfList";

export default function BookshelfPage() {
	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
				<span>📚</span>
				<span>私の本棚</span>
			</h1>
			<BookshelfList />
		</div>
	);
}

if (import.meta.vitest) {
	const { test, expect, render, screen } = await import("@/test-utils");

	test("本棚ページが正しく表示される", () => {
		render(<BookshelfPage />);
		expect(screen.getByText("私の本棚")).toBeInTheDocument();
		expect(screen.getByText("📚")).toBeInTheDocument();
	});
}
