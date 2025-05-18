"use client";

import { useState } from "react";
import { BatchStatus } from "../components/BatchStatus";
import { CreateFeedModal } from "../components/CreateFeedModal";
import { FeedCard } from "../components/FeedCard";
import { ManualExecuteButton } from "../components/ManualExecuteButton";
import { useRSSFeeds } from "../queries/useRSSFeeds";

export function FeedListPage() {
	const { data, isLoading, error } = useRSSFeeds();
	const [isModalOpen, setIsModalOpen] = useState(false);

	// ローディング状態
	if (isLoading) {
		return (
			<div className="flex justify-center items-center min-h-[400px]">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
					<p className="mt-2 text-gray-600">読み込み中...</p>
				</div>
			</div>
		);
	}

	// エラー状態
	if (error) {
		return (
			<div className="text-center py-8">
				<p className="text-red-600">エラーが発生しました</p>
				<p className="text-gray-600 mt-2">
					{error instanceof Error
						? error.message
						: "データの取得に失敗しました"}
				</p>
			</div>
		);
	}

	const feeds = data?.feeds || [];

	return (
		<div className="container mx-auto px-4 py-8">
			{/* ヘッダー */}
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">RSS管理</h1>
				<div className="flex items-center gap-3">
					<ManualExecuteButton />
					<button
						type="button"
						onClick={() => setIsModalOpen(true)}
						className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
					>
						新規登録
					</button>
				</div>
			</div>

			{/* バッチ実行状態 */}
			<div className="mb-6">
				<BatchStatus />
			</div>

			{/* フィード一覧 */}
			{feeds.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-gray-600 mb-4">
						RSSフィードがまだ登録されていません
					</p>
					<button
						type="button"
						onClick={() => setIsModalOpen(true)}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
					>
						最初のフィードを登録
					</button>
				</div>
			) : (
				<div className="grid gap-4">
					{feeds.map((feed) => (
						<FeedCard key={feed.id} feed={feed} />
					))}
				</div>
			)}

			{/* 新規登録モーダル */}
			<CreateFeedModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
			/>
		</div>
	);
}
