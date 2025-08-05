/**
 * 本棚アイテムの詳細ページ
 * 個別の書籍・PDF・GitHub・Zennなどのコンテンツの詳細を表示し、
 * ステータスの変更、編集、削除が可能
 */

"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { EditBookModal } from "@/features/bookshelf/components/EditBookModal";
import { useDeleteBook } from "@/features/bookshelf/queries/useDeleteBook";
import { useGetBook } from "@/features/bookshelf/queries/useGetBook";
import { useUpdateBookStatus } from "@/features/bookshelf/queries/useUpdateBookStatus";
import type { BookStatusValue } from "@/features/bookshelf/types";
import { BookStatus, BookType } from "@/features/bookshelf/types";

// ヘルパー関数をオブジェクトにまとめて再作成を防止
const BookHelpers = {
	getBookIcon: (type: string) => {
		switch (type) {
			case BookType.BOOK:
				return "📚";
			case BookType.PDF:
				return "📄";
			case BookType.GITHUB:
				return "🐙";
			case BookType.ZENN:
				return "📝";
			default:
				return "📖";
		}
	},
	getStatusLabel: (status: BookStatusValue) => {
		switch (status) {
			case BookStatus.UNREAD:
				return "未読";
			case BookStatus.READING:
				return "読書中";
			case BookStatus.COMPLETED:
				return "読了";
			default:
				return status;
		}
	},
	getTypeLabel: (type: string) => {
		switch (type) {
			case BookType.BOOK:
				return "書籍";
			case BookType.PDF:
				return "PDF";
			case BookType.GITHUB:
				return "GitHub";
			case BookType.ZENN:
				return "Zenn";
			default:
				return type;
		}
	},
} as const;

export default function BookshelfDetailPage() {
	const params = useParams();
	const router = useRouter();
	const id = Number(params?.id);

	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

	const { data: book, isLoading, error } = useGetBook(id);
	const updateStatus = useUpdateBookStatus();
	const deleteBook = useDeleteBook();

	// ステータス変更ハンドラー
	const handleStatusChange = (newStatus: BookStatusValue) => {
		if (!book) return;

		updateStatus.mutate({
			id: book.id,
			status: newStatus,
		});
	};

	// 削除ハンドラー
	const handleDelete = () => {
		if (!book) return;

		deleteBook.mutate(book.id, {
			onSuccess: () => {
				router.push("/bookshelf");
			},
		});
	};

	// ローディング状態
	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-2xl mx-auto">
					<div className="animate-pulse">
						<div className="h-32 bg-gray-200 rounded mb-4" />
						<div className="h-8 bg-gray-200 rounded mb-4" />
						<div className="h-4 bg-gray-200 rounded w-1/2" />
					</div>
				</div>
			</div>
		);
	}

	// エラー状態
	if (error || !book) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-2xl mx-auto">
					<div className="bg-red-50 border border-red-200 rounded-lg p-6">
						<h2 className="text-lg font-semibold text-red-800 mb-2">
							エラーが発生しました
						</h2>
						<p className="text-red-600">
							{error?.message || "本が見つかりませんでした"}
						</p>
						<button
							type="button"
							onClick={() => router.push("/bookshelf")}
							className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
						>
							一覧に戻る
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-2xl mx-auto">
				{/* ヘッダー部分 */}
				<div className="bg-white rounded-lg shadow-md p-6 mb-6">
					<div className="flex items-start gap-6">
						{/* 表紙画像/アイコン */}
						<div className="flex-shrink-0">
							{book.imageUrl ? (
								<div className="relative w-32 h-32">
									<Image
										src={book.imageUrl}
										alt={book.title}
										fill
										className="object-cover rounded"
										sizes="128px"
									/>
								</div>
							) : (
								<div className="w-32 h-32 bg-gray-100 rounded flex items-center justify-center">
									<span className="text-5xl">
										{BookHelpers.getBookIcon(book.type)}
									</span>
								</div>
							)}
						</div>

						{/* タイトルとアクションボタン */}
						<div className="flex-1">
							<h1 className="text-2xl font-bold mb-4">{book.title}</h1>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => setIsEditModalOpen(true)}
									className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
								>
									編集
								</button>
								<button
									type="button"
									onClick={() => setShowDeleteConfirmation(true)}
									className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
								>
									削除
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* 詳細情報 */}
				<div className="bg-white rounded-lg shadow-md p-6">
					<dl className="space-y-4">
						{/* タイプ */}
						<div>
							<dt className="text-sm font-medium text-gray-500">タイプ</dt>
							<dd className="mt-1 text-lg">
								{BookHelpers.getTypeLabel(book.type)}
							</dd>
						</div>

						{/* URL (PDF/GitHub/Zennの場合) */}
						{book.url &&
							(book.type === BookType.PDF ||
								book.type === BookType.GITHUB ||
								book.type === BookType.ZENN) && (
								<div>
									<dt className="text-sm font-medium text-gray-500">URL</dt>
									<dd className="mt-1">
										<a
											href={book.url}
											target="_blank"
											rel="noopener noreferrer nofollow"
											className="text-blue-600 hover:underline"
											onClick={(e) => {
												// URLの基本的な検証
												if (book.url) {
													try {
														new URL(book.url);
													} catch {
														e.preventDefault();
														alert("無効なURLです");
													}
												}
											}}
										>
											{book.url}
										</a>
									</dd>
								</div>
							)}

						{/* ステータス */}
						<div>
							<dt className="text-sm font-medium text-gray-500 mb-2">
								ステータス
							</dt>
							<dd>
								<div className="flex gap-2">
									{Object.values(BookStatus).map((status) => (
										<button
											type="button"
											key={status}
											onClick={() => handleStatusChange(status)}
											disabled={updateStatus.isPending}
											className={`px-4 py-2 rounded transition-colors ${
												book.status === status
													? "bg-blue-600 text-white"
													: "bg-gray-200 text-gray-700 hover:bg-gray-300"
											} ${updateStatus.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
										>
											{BookHelpers.getStatusLabel(status)}
										</button>
									))}
								</div>
							</dd>
						</div>

						{/* 読了日 */}
						{book.completedAt && (
							<div>
								<dt className="text-sm font-medium text-gray-500">読了日</dt>
								<dd className="mt-1">
									{new Date(book.completedAt).toLocaleDateString("ja-JP")}
								</dd>
							</div>
						)}

						{/* 作成日 */}
						<div>
							<dt className="text-sm font-medium text-gray-500">登録日</dt>
							<dd className="mt-1">
								{new Date(book.createdAt).toLocaleDateString("ja-JP")}
							</dd>
						</div>
					</dl>
				</div>

				{/* 戻るボタン */}
				<div className="mt-6">
					<button
						type="button"
						onClick={() => router.push("/bookshelf")}
						className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
					>
						一覧に戻る
					</button>
				</div>
			</div>

			{/* 編集モーダル */}
			<EditBookModal
				book={book}
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
			/>

			{/* 削除確認ダイアログ */}
			{showDeleteConfirmation && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
					<div className="bg-white rounded-lg p-6 max-w-sm w-full">
						<h3 className="text-lg font-semibold mb-4">削除の確認</h3>
						<p className="mb-6">
							「{book.title}」を削除してもよろしいですか？
							この操作は取り消せません。
						</p>
						<div className="flex gap-2 justify-end">
							<button
								type="button"
								onClick={() => setShowDeleteConfirmation(false)}
								className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
							>
								キャンセル
							</button>
							<button
								type="button"
								onClick={handleDelete}
								disabled={deleteBook.isPending}
								className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
							>
								{deleteBook.isPending ? "削除中..." : "削除"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

if (import.meta.vitest) {
	const { describe, it, expect, vi } = import.meta.vitest;
	const { render, screen, fireEvent, waitFor } = await import(
		"@testing-library/react"
	);
	const React = await import("react");

	// useParamsのモック
	vi.mock("next/navigation", () => ({
		useParams: vi.fn(),
		useRouter: vi.fn(() => ({
			push: vi.fn(),
		})),
	}));

	// クエリフックのモック
	vi.mock("@/features/bookshelf/queries/useGetBook", () => ({
		useGetBook: vi.fn(),
	}));

	vi.mock("@/features/bookshelf/queries/useUpdateBookStatus", () => ({
		useUpdateBookStatus: vi.fn(() => ({
			mutate: vi.fn(),
			isPending: false,
		})),
	}));

	vi.mock("@/features/bookshelf/queries/useDeleteBook", () => ({
		useDeleteBook: vi.fn(() => ({
			mutate: vi.fn(),
			isPending: false,
		})),
	}));

	// EditBookModalのモック
	vi.mock("@/features/bookshelf/components/EditBookModal", () => ({
		EditBookModal: vi.fn(() => null),
	}));

	describe("BookshelfDetailPage", () => {
		const mockBook = {
			id: 1,
			type: "book" as const,
			title: "テスト書籍",
			url: null,
			imageUrl: "https://example.com/image.jpg",
			status: "unread" as const,
			completedAt: null,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		beforeEach(async () => {
			const { useParams } = await import("next/navigation");
			(useParams as ReturnType<typeof vi.fn>).mockReturnValue({ id: "1" });
		});

		it("ローディング中は読み込み表示を表示する", async () => {
			const { useGetBook } = await import(
				"@/features/bookshelf/queries/useGetBook"
			);
			(useGetBook as ReturnType<typeof vi.fn>).mockReturnValue({
				data: undefined,
				isLoading: true,
				error: null,
			});

			const { container } = render(React.createElement(BookshelfDetailPage));
			expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
		});

		it("エラー時はエラーメッセージを表示する", async () => {
			const { useGetBook } = await import(
				"@/features/bookshelf/queries/useGetBook"
			);
			(useGetBook as ReturnType<typeof vi.fn>).mockReturnValue({
				data: undefined,
				isLoading: false,
				error: { message: "Book not found" },
			});

			render(React.createElement(BookshelfDetailPage));
			expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
			expect(screen.getByText("Book not found")).toBeInTheDocument();
		});

		it("本の詳細情報を正しく表示する", async () => {
			const { useGetBook } = await import(
				"@/features/bookshelf/queries/useGetBook"
			);
			(useGetBook as ReturnType<typeof vi.fn>).mockReturnValue({
				data: mockBook,
				isLoading: false,
				error: null,
			});

			render(React.createElement(BookshelfDetailPage));

			expect(screen.getByText("テスト書籍")).toBeInTheDocument();
			expect(screen.getByText("書籍")).toBeInTheDocument();
			expect(screen.getByText("未読")).toHaveClass("bg-blue-600");
		});

		it("ステータスボタンをクリックすると更新処理が呼ばれる", async () => {
			const mockMutate = vi.fn();
			const { useGetBook } = await import(
				"@/features/bookshelf/queries/useGetBook"
			);
			const { useUpdateBookStatus } = await import(
				"@/features/bookshelf/queries/useUpdateBookStatus"
			);

			(useGetBook as ReturnType<typeof vi.fn>).mockReturnValue({
				data: mockBook,
				isLoading: false,
				error: null,
			});

			(useUpdateBookStatus as ReturnType<typeof vi.fn>).mockReturnValue({
				mutate: mockMutate,
				isPending: false,
			});

			render(React.createElement(BookshelfDetailPage));

			const readingButton = screen.getByText("読書中");
			fireEvent.click(readingButton);

			expect(mockMutate).toHaveBeenCalledWith({
				id: 1,
				status: "reading",
			});
		});

		it("削除ボタンをクリックすると確認ダイアログが表示される", async () => {
			const { useGetBook } = await import(
				"@/features/bookshelf/queries/useGetBook"
			);
			(useGetBook as ReturnType<typeof vi.fn>).mockReturnValue({
				data: mockBook,
				isLoading: false,
				error: null,
			});

			render(React.createElement(BookshelfDetailPage));

			const deleteButton = screen.getByText("削除");
			fireEvent.click(deleteButton);

			expect(screen.getByText("削除の確認")).toBeInTheDocument();
			expect(
				screen.getByText(/「テスト書籍」を削除してもよろしいですか/),
			).toBeInTheDocument();
		});

		it("削除確認後に削除処理が実行される", async () => {
			const mockMutate = vi.fn((_id, options) => {
				options.onSuccess();
			});
			const mockPush = vi.fn();

			const { useGetBook } = await import(
				"@/features/bookshelf/queries/useGetBook"
			);
			const { useDeleteBook } = await import(
				"@/features/bookshelf/queries/useDeleteBook"
			);
			const { useRouter } = await import("next/navigation");

			(useGetBook as ReturnType<typeof vi.fn>).mockReturnValue({
				data: mockBook,
				isLoading: false,
				error: null,
			});

			(useDeleteBook as ReturnType<typeof vi.fn>).mockReturnValue({
				mutate: mockMutate,
				isPending: false,
			});

			(useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
				push: mockPush,
			});

			render(React.createElement(BookshelfDetailPage));

			// 削除ボタンをクリック
			fireEvent.click(screen.getByText("削除"));

			// 確認ダイアログで削除を実行
			const confirmButton = screen.getAllByText("削除")[1];
			fireEvent.click(confirmButton);

			await waitFor(() => {
				expect(mockMutate).toHaveBeenCalledWith(1, expect.any(Object));
				expect(mockPush).toHaveBeenCalledWith("/bookshelf");
			});
		});

		it("PDF/GitHub/Zennタイプの場合はURLを表示する", async () => {
			const pdfBook = {
				...mockBook,
				type: "pdf" as const,
				url: "https://example.com/test.pdf",
			};

			const { useGetBook } = await import(
				"@/features/bookshelf/queries/useGetBook"
			);
			(useGetBook as ReturnType<typeof vi.fn>).mockReturnValue({
				data: pdfBook,
				isLoading: false,
				error: null,
			});

			render(React.createElement(BookshelfDetailPage));

			expect(screen.getByText("PDF")).toBeInTheDocument();
			const link = screen.getByRole("link", {
				name: "https://example.com/test.pdf",
			});
			expect(link).toHaveAttribute("href", "https://example.com/test.pdf");
			expect(link).toHaveAttribute("target", "_blank");
		});

		it("編集ボタンをクリックすると編集モーダルが開く", async () => {
			const { useGetBook } = await import(
				"@/features/bookshelf/queries/useGetBook"
			);
			const { EditBookModal } = await import(
				"@/features/bookshelf/components/EditBookModal"
			);

			(useGetBook as ReturnType<typeof vi.fn>).mockReturnValue({
				data: mockBook,
				isLoading: false,
				error: null,
			});

			render(React.createElement(BookshelfDetailPage));

			const editButton = screen.getByText("編集");
			fireEvent.click(editButton);

			expect(EditBookModal).toHaveBeenCalledWith(
				expect.objectContaining({
					book: mockBook,
					isOpen: true,
				}),
				undefined,
			);
		});
	});
}
