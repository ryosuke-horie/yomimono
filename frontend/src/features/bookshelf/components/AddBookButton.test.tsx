/**
 * AddBookButtonコンポーネントのテスト
 */

import { vi } from "vitest";
import { expect, render, screen, test, user } from "@/test-utils";
import { AddBookButton } from "./AddBookButton";

// AddBookModalコンポーネントをモック
vi.mock("./AddBookModal", () => ({
	AddBookModal: vi.fn(() => <div role="dialog">モックモーダル</div>),
}));

test("追加ボタンが表示される", () => {
	render(<AddBookButton />);
	expect(screen.getByRole("button", { name: /本を追加/ })).toBeInTheDocument();
});

test("ボタンクリックでモーダルが開く", async () => {
	render(<AddBookButton />);

	const button = screen.getByRole("button", { name: /本を追加/ });
	await user.click(button);

	// モーダルが表示されることを確認
	expect(screen.getByRole("dialog")).toBeInTheDocument();
});
