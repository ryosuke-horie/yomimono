/**
 * 本追加ボタンコンポーネント
 * 新しい本を本棚に追加するためのボタン
 */

"use client";

import { useState } from "react";
import { AddBookModal } from "./AddBookModal";

export function AddBookButton() {
	const [isModalOpen, setIsModalOpen] = useState(false);

	return (
		<>
			<button
				type="button"
				onClick={() => setIsModalOpen(true)}
				className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-5 w-5"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fillRule="evenodd"
						d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
						clipRule="evenodd"
					/>
				</svg>
				<span>本を追加</span>
			</button>

			{isModalOpen && (
				<AddBookModal
					isOpen={isModalOpen}
					onClose={() => setIsModalOpen(false)}
				/>
			)}
		</>
	);
}

if (import.meta.vitest) {
	const { test, expect, render, screen } = await import("@/test-utils");

	test("追加ボタンが表示される", () => {
		render(<AddBookButton />);
		expect(
			screen.getByRole("button", { name: /本を追加/ }),
		).toBeInTheDocument();
	});

	test("ボタンクリックでモーダルが開く", async () => {
		const { user } = await import("@/test-utils");
		render(<AddBookButton />);

		const button = screen.getByRole("button", { name: /本を追加/ });
		await user.click(button);

		// モーダルが表示されることを確認（モーダルの実装後にテストを更新）
		expect(screen.getByRole("dialog")).toBeInTheDocument();
	});
}
