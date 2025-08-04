/**
 * BookCardコンポーネントのテスト
 */

import { expect, render, screen, test } from "@/test-utils";
import type { Book } from "../types";
import { BookCard } from "./BookCard";

const mockBook: Book = {
	id: "1",
	title: "TypeScript実践ガイド",
	author: "山田太郎",
	status: "reading",
	type: "book",
	progress: 45,
	createdAt: "2024-01-01",
	updatedAt: "2024-01-01",
};

test("本カードが正しく表示される", () => {
	render(<BookCard book={mockBook} />);

	expect(screen.getByText("TypeScript実践ガイド")).toBeInTheDocument();
	expect(screen.getByText("山田太郎")).toBeInTheDocument();
	expect(screen.getByText("読書中")).toBeInTheDocument();
	expect(screen.getByText("45%")).toBeInTheDocument();
});

test("カバー画像がない場合はアイコンが表示される", () => {
	const bookWithoutCover = { ...mockBook, coverUrl: undefined };
	render(<BookCard book={bookWithoutCover} />);

	expect(screen.getByText("📚")).toBeInTheDocument();
});

test("PDFタイプの場合は正しいアイコンが表示される", () => {
	const pdfBook = { ...mockBook, type: "pdf" as const, coverUrl: undefined };
	render(<BookCard book={pdfBook} />);

	expect(screen.getByText("📄")).toBeInTheDocument();
});

test("リポジトリタイプの場合は正しいアイコンが表示される", () => {
	const repoBook = {
		...mockBook,
		type: "repository" as const,
		coverUrl: undefined,
	};
	render(<BookCard book={repoBook} />);

	expect(screen.getByText("🐙")).toBeInTheDocument();
});

test("詳細ページへのリンクが正しく設定される", () => {
	render(<BookCard book={mockBook} />);

	const link = screen.getByRole("link");
	expect(link).toHaveAttribute("href", "/bookshelf/1");
});

test("進捗率は読書中の場合のみ表示される", () => {
	const completedBook = {
		...mockBook,
		status: "completed" as const,
		progress: 100,
	};
	const { rerender } = render(<BookCard book={completedBook} />);

	expect(screen.queryByText("100%")).not.toBeInTheDocument();

	const readingBook = {
		...mockBook,
		status: "reading" as const,
		progress: 50,
	};
	rerender(<BookCard book={readingBook} />);

	expect(screen.getByText("50%")).toBeInTheDocument();
});
