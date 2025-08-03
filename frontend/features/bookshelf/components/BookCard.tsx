/**
 * 本カードコンポーネント
 * 個別の本の情報を表示するカード
 */

"use client";

import Link from "next/link";
import type { Book } from "../types";

interface BookCardProps {
	book: Book;
}

export function BookCard({ book }: BookCardProps) {
	const statusLabels = {
		unread: "未読",
		reading: "読書中",
		completed: "読了",
	};

	const statusColors = {
		unread: "bg-gray-100 text-gray-700",
		reading: "bg-blue-100 text-blue-700",
		completed: "bg-green-100 text-green-700",
	};

	const typeIcons = {
		book: "📚",
		pdf: "📄",
		repository: "🐙",
	};

	return (
		<Link
			href={`/bookshelf/${book.id}`}
			className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 space-y-3"
		>
			{/* 表紙エリア */}
			<div className="aspect-[3/4] bg-gray-100 rounded-md flex items-center justify-center text-4xl">
				{book.coverUrl ? (
					// biome-ignore lint/performance/noImgElement: パフォーマンス最適化はAPI統合後に実施
					<img
						src={book.coverUrl}
						alt={book.title}
						className="w-full h-full object-cover rounded-md"
					/>
				) : (
					<span>{typeIcons[book.type]}</span>
				)}
			</div>

			{/* 本の情報 */}
			<div className="space-y-2">
				<h3 className="font-semibold text-sm line-clamp-2" title={book.title}>
					{book.title}
				</h3>

				{book.author && (
					<p className="text-xs text-gray-600 line-clamp-1">{book.author}</p>
				)}

				{/* ステータスバッジ */}
				<div className="flex items-center justify-between">
					<span
						className={`inline-block px-2 py-1 text-xs rounded-full ${
							statusColors[book.status]
						}`}
					>
						{statusLabels[book.status]}
					</span>

					{book.progress !== undefined && book.status === "reading" && (
						<span className="text-xs text-gray-600">{book.progress}%</span>
					)}
				</div>
			</div>
		</Link>
	);
}

if (import.meta.vitest) {
	const { test, expect, render, screen } = await import("@/test-utils");

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
}
