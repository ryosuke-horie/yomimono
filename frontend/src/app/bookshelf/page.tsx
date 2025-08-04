/**
 * 本棚ページ
 * 書籍、PDF、GitHub、Zennなどのコンテンツを管理・表示
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AddBookButton } from "@/features/bookshelf/components/AddBookButton";
import { BooksList } from "@/features/bookshelf/components/BooksList";
import { StatusTabs } from "@/features/bookshelf/components/StatusTabs";
import { deleteBook } from "@/features/bookshelf/queries/api";
import { bookshelfKeys } from "@/features/bookshelf/queries/queryKeys";
import { useGetBooks } from "@/features/bookshelf/queries/useGetBooks";
import { BookStatus, type BookStatusValue } from "@/features/bookshelf/types";

export default function BookshelfPage() {
	const [statusFilter, setStatusFilter] = useState<BookStatusValue | undefined>(
		undefined,
	);
	const queryClient = useQueryClient();

	// 本棚アイテム一覧を取得
	const { data: books = [], isLoading, error } = useGetBooks(statusFilter);

	// 削除処理
	const deleteMutation = useMutation({
		mutationFn: deleteBook,
		onSuccess: () => {
			// キャッシュを無効化してリストを更新
			queryClient.invalidateQueries({ queryKey: bookshelfKeys.lists() });
		},
	});

	const handleDelete = (id: number) => {
		if (confirm("このアイテムを削除してもよろしいですか？")) {
			deleteMutation.mutate(id);
		}
	};

	// 統計情報
	const stats = {
		total: books.length,
		unread: books.filter((b) => b.status === BookStatus.UNREAD).length,
		reading: books.filter((b) => b.status === BookStatus.READING).length,
		completed: books.filter((b) => b.status === BookStatus.COMPLETED).length,
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				{/* ヘッダー */}
				<div className="mb-8 flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">本棚</h1>
						<p className="text-gray-600">
							書籍、PDF、GitHub、Zennなどのコンテンツを管理します
						</p>
					</div>
					<AddBookButton />
				</div>

				{/* 統計情報 */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
					<div className="bg-white rounded-lg shadow p-4">
						<p className="text-sm text-gray-600">すべて</p>
						<p className="text-2xl font-bold text-gray-900">{stats.total}</p>
					</div>
					<div className="bg-white rounded-lg shadow p-4">
						<p className="text-sm text-gray-600">未読</p>
						<p className="text-2xl font-bold text-gray-900">{stats.unread}</p>
					</div>
					<div className="bg-white rounded-lg shadow p-4">
						<p className="text-sm text-gray-600">読書中</p>
						<p className="text-2xl font-bold text-blue-600">{stats.reading}</p>
					</div>
					<div className="bg-white rounded-lg shadow p-4">
						<p className="text-sm text-gray-600">完了</p>
						<p className="text-2xl font-bold text-green-600">
							{stats.completed}
						</p>
					</div>
				</div>

				{/* フィルタータブ */}
				<StatusTabs
					currentStatus={statusFilter}
					onStatusChange={setStatusFilter}
					stats={stats}
				/>

				{/* コンテンツエリア */}
				{isLoading ? (
					<div className="flex justify-center py-12">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
					</div>
				) : error ? (
					<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
						エラーが発生しました: {(error as Error).message}
					</div>
				) : (
					<BooksList books={books} onDelete={handleDelete} />
				)}
			</div>
		</div>
	);
}
