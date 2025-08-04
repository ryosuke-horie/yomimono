/**
 * 本棚アイテムカード コンポーネント
 * 書籍、PDF、GitHub、Zennなどのコンテンツを表示
 */

"use client";

import Image from "next/image";
import { useUpdateBookStatus } from "@/features/bookshelf/queries/useUpdateBookStatus";
import type { Book, BookStatusValue } from "@/features/bookshelf/types";
import { BookStatus } from "@/features/bookshelf/types";

interface BookCardProps {
	book: Book;
	onDelete?: (id: number) => void;
}

export const BookCard = ({ book, onDelete }: BookCardProps) => {
	const updateStatus = useUpdateBookStatus();

	const handleStatusChange = (status: BookStatusValue) => {
		updateStatus.mutate({ id: book.id, status });
	};

	const getTypeIcon = () => {
		switch (book.type) {
			case "book":
				return (
					<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
					</svg>
				);
			case "pdf":
				return (
					<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fillRule="evenodd"
							d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z"
							clipRule="evenodd"
						/>
					</svg>
				);
			case "github":
				return (
					<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fillRule="evenodd"
							d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
							clipRule="evenodd"
						/>
					</svg>
				);
			case "zenn":
				return (
					<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fillRule="evenodd"
							d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z"
							clipRule="evenodd"
						/>
						<path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
					</svg>
				);
			default:
				return null;
		}
	};

	const getTypeLabel = () => {
		switch (book.type) {
			case "book":
				return "書籍";
			case "pdf":
				return "PDF";
			case "github":
				return "GitHub";
			case "zenn":
				return "Zenn";
			default:
				return book.type;
		}
	};

	const getStatusBadgeColor = () => {
		switch (book.status) {
			case BookStatus.UNREAD:
				return "bg-gray-100 text-gray-800";
			case BookStatus.READING:
				return "bg-blue-100 text-blue-800";
			case BookStatus.COMPLETED:
				return "bg-green-100 text-green-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getStatusLabel = () => {
		switch (book.status) {
			case BookStatus.UNREAD:
				return "未読";
			case BookStatus.READING:
				return "読書中";
			case BookStatus.COMPLETED:
				return "完了";
			default:
				return book.status;
		}
	};

	return (
		<div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
			{/* カバー画像エリア */}
			{book.imageUrl ? (
				<div className="relative h-48 bg-gray-100">
					<Image
						src={book.imageUrl}
						alt={book.title}
						fill
						className="object-cover"
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
					/>
				</div>
			) : (
				<div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
					<div className="text-gray-400">{getTypeIcon()}</div>
				</div>
			)}

			{/* コンテンツエリア */}
			<div className="p-6">
				<div className="flex items-start justify-between mb-4">
					<div className="flex items-center gap-2 text-sm text-gray-600">
						{getTypeIcon()}
						<span>{getTypeLabel()}</span>
					</div>
					<span
						className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor()}`}
					>
						{getStatusLabel()}
					</span>
				</div>

				<h3 className="text-lg font-semibold mb-2 line-clamp-2">
					{book.title}
				</h3>

				{book.url && (
					<a
						href={book.url}
						target="_blank"
						rel="noopener noreferrer"
						className="text-blue-600 hover:underline text-sm mb-4 block"
					>
						リンクを開く →
					</a>
				)}

				<div className="flex flex-wrap gap-2 mt-4">
					{book.status !== BookStatus.UNREAD && (
						<button
							type="button"
							onClick={() => handleStatusChange(BookStatus.UNREAD)}
							className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
							disabled={updateStatus.isPending}
						>
							未読に戻す
						</button>
					)}
					{book.status !== BookStatus.READING && (
						<button
							type="button"
							onClick={() => handleStatusChange(BookStatus.READING)}
							className="px-3 py-1 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded transition-colors"
							disabled={updateStatus.isPending}
						>
							読書中にする
						</button>
					)}
					{book.status !== BookStatus.COMPLETED && (
						<button
							type="button"
							onClick={() => handleStatusChange(BookStatus.COMPLETED)}
							className="px-3 py-1 text-sm bg-green-500 text-white hover:bg-green-600 rounded transition-colors"
							disabled={updateStatus.isPending}
						>
							完了にする
						</button>
					)}
					{onDelete && (
						<button
							type="button"
							onClick={() => onDelete(book.id)}
							className="px-3 py-1 text-sm bg-red-500 text-white hover:bg-red-600 rounded transition-colors ml-auto"
						>
							削除
						</button>
					)}
				</div>

				{book.completedAt && (
					<p className="text-xs text-gray-500 mt-2">
						完了日: {new Date(book.completedAt).toLocaleDateString("ja-JP")}
					</p>
				)}
			</div>
		</div>
	);
};

if (import.meta.vitest) {
	const { describe, it, expect, vi } = import.meta.vitest;
	const { render, screen, fireEvent } = await import("@testing-library/react");
	const React = await import("react");

	// useUpdateBookStatusのモック
	vi.mock("@/features/bookshelf/queries/useUpdateBookStatus", () => ({
		useUpdateBookStatus: vi.fn(() => ({
			mutate: vi.fn(),
			isPending: false,
		})),
	}));

	// next/imageのモック
	vi.mock("next/image", () => ({
		default: (props: any) => {
			const React = require("react");
			return React.createElement("img", props);
		},
	}));

	describe("BookCard", () => {
		const mockBook: Book = {
			id: 1,
			type: "book",
			title: "テスト書籍",
			url: "https://example.com",
			imageUrl: "https://example.com/image.jpg",
			status: "unread",
			completedAt: null,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		it("書籍情報が正しく表示される", () => {
			render(React.createElement(BookCard, { book: mockBook }));

			expect(screen.getByText("テスト書籍")).toBeInTheDocument();
			expect(screen.getByText("書籍")).toBeInTheDocument();
			expect(screen.getByText("未読")).toBeInTheDocument();
			expect(screen.getByText("リンクを開く →")).toBeInTheDocument();
		});

		it("PDFタイプの表示が正しい", () => {
			const pdfBook: Book = {
				...mockBook,
				type: "pdf",
			};

			render(React.createElement(BookCard, { book: pdfBook }));
			expect(screen.getByText("PDF")).toBeInTheDocument();
		});

		it("GitHubタイプの表示が正しい", () => {
			const githubBook: Book = {
				...mockBook,
				type: "github",
			};

			render(React.createElement(BookCard, { book: githubBook }));
			expect(screen.getByText("GitHub")).toBeInTheDocument();
		});

		it("Zennタイプの表示が正しい", () => {
			const zennBook: Book = {
				...mockBook,
				type: "zenn",
			};

			render(React.createElement(BookCard, { book: zennBook }));
			expect(screen.getByText("Zenn")).toBeInTheDocument();
		});

		it("画像がある場合は表示される", () => {
			render(React.createElement(BookCard, { book: mockBook }));
			const img = screen.getByAltText("テスト書籍");
			expect(img).toHaveAttribute("src", "https://example.com/image.jpg");
		});

		it("画像がない場合はアイコンが表示される", () => {
			const bookWithoutImage: Book = {
				...mockBook,
				imageUrl: null,
			};

			render(React.createElement(BookCard, { book: bookWithoutImage }));
			const iconContainer = screen.getByText((content, element) => {
				return element?.tagName === "DIV" && element.className.includes("bg-gradient-to-br");
			});
			expect(iconContainer).toBeInTheDocument();
		});

		it("未読の書籍に対して正しいボタンが表示される", () => {
			render(React.createElement(BookCard, { book: mockBook }));

			expect(screen.queryByText("未読に戻す")).not.toBeInTheDocument();
			expect(screen.getByText("読書中にする")).toBeInTheDocument();
			expect(screen.getByText("完了にする")).toBeInTheDocument();
		});

		it("読書中の書籍に対して正しいボタンが表示される", () => {
			const readingBook: Book = {
				...mockBook,
				status: "reading",
			};

			render(React.createElement(BookCard, { book: readingBook }));

			expect(screen.getByText("未読に戻す")).toBeInTheDocument();
			expect(screen.queryByText("読書中にする")).not.toBeInTheDocument();
			expect(screen.getByText("完了にする")).toBeInTheDocument();
		});

		it("完了済みの書籍に対して正しいボタンと完了日が表示される", () => {
			const completedBook: Book = {
				...mockBook,
				status: "completed",
				completedAt: "2024-01-15T00:00:00Z",
			};

			render(React.createElement(BookCard, { book: completedBook }));

			expect(screen.getByText("未読に戻す")).toBeInTheDocument();
			expect(screen.getByText("読書中にする")).toBeInTheDocument();
			expect(screen.queryByText("完了にする")).not.toBeInTheDocument();
			expect(screen.getByText(/完了日:/)).toBeInTheDocument();
		});

		it("ステータス変更ボタンクリック時にmutateが呼ばれる", async () => {
			const mockMutate = vi.fn();
			const { useUpdateBookStatus } = await import(
				"@/features/bookshelf/queries/useUpdateBookStatus"
			);
			(useUpdateBookStatus as ReturnType<typeof vi.fn>).mockReturnValue({
				mutate: mockMutate,
				isPending: false,
			});

			render(React.createElement(BookCard, { book: mockBook }));

			const readingButton = screen.getByText("読書中にする");
			fireEvent.click(readingButton);

			expect(mockMutate).toHaveBeenCalledWith({
				id: 1,
				status: "reading",
			});
		});

		it("削除ボタンがonDelete propsがある場合のみ表示される", () => {
			const mockDelete = vi.fn();

			const { rerender } = render(
				React.createElement(BookCard, { book: mockBook })
			);
			expect(screen.queryByText("削除")).not.toBeInTheDocument();

			rerender(
				React.createElement(BookCard, { book: mockBook, onDelete: mockDelete })
			);
			expect(screen.getByText("削除")).toBeInTheDocument();
		});

		it("削除ボタンクリック時にonDeleteが呼ばれる", () => {
			const mockDelete = vi.fn();

			render(
				React.createElement(BookCard, { book: mockBook, onDelete: mockDelete })
			);

			const deleteButton = screen.getByText("削除");
			fireEvent.click(deleteButton);

			expect(mockDelete).toHaveBeenCalledWith(1);
		});

		it("URLがない場合はリンクが表示されない", () => {
			const bookWithoutUrl: Book = {
				...mockBook,
				url: null,
			};

			render(React.createElement(BookCard, { book: bookWithoutUrl }));
			expect(screen.queryByText("リンクを開く →")).not.toBeInTheDocument();
		});
	});
}
