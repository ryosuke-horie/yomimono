/**
 * 本棚ページのテスト
 */

import { render, screen } from "@/test-utils";
import { describe, expect, test, vi } from "vitest";
import BookshelfPage from "./page";

// コンポーネントのモック
vi.mock("@/features/bookshelf/components/BookshelfList", () => ({
	BookshelfList: () => <div>BookshelfList Mock</div>,
}));

describe("BookshelfPage", () => {
	test("本棚ページが正しく表示される", () => {
		render(<BookshelfPage />);
		expect(screen.getByText("私の本棚")).toBeInTheDocument();
		expect(screen.getByText("📚")).toBeInTheDocument();
	});
});