"use client";

import { BookmarksList } from "@/features/bookmarks/components/BookmarksList";
import { CreateBookmarkModal } from "@/features/bookmarks/components/CreateBookmarkModal";
import type { BookmarkWithLabel } from "@/features/bookmarks/types";
import { LabelFilter } from "@/features/labels/components/LabelFilter";
import { useLabels } from "@/features/labels/hooks/useLabels";
import { API_BASE_URL } from "@/lib/api/config";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface BookmarksApiResponse {
	success: boolean;
	bookmarks: BookmarkWithLabel[];
	totalUnread?: number;
	todayReadCount?: number;
}

// ブックマーク一覧を取得する非同期関数 (戻り値の型を修正)
const fetchBookmarks = async (
	labelName?: string,
): Promise<BookmarksApiResponse> => {
	// 戻り値をレスポンス全体に変更
	const url = labelName
		? `${API_BASE_URL}/api/bookmarks?label=${encodeURIComponent(labelName)}`
		: `${API_BASE_URL}/api/bookmarks`;
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error("Failed to fetch bookmarks");
	}
	const data: BookmarksApiResponse = await response.json();
	return data;
};

export default function HomePage() {
	const [isModalOpen, setIsModalOpen] = useState(false);

	// ラベル関連のフック
	const {
		labels,
		selectedLabelName,
		setSelectedLabelName,
		isLoading: isLoadingLabels,
		error: errorLabels,
	} = useLabels();

	// ブックマーク一覧取得 (選択されたラベルに応じて再取得)
	const {
		data: responseData,
		isLoading: isLoadingBookmarks,
		error: errorBookmarks,
	} = useQuery<BookmarksApiResponse, Error>({
		// useQuery の型引数を修正
		queryKey: ["bookmarks", selectedLabelName],
		queryFn: () => fetchBookmarks(selectedLabelName),
		staleTime: 1 * 60 * 1000, // 1分間キャッシュを有効にする
	});

	const totalUnread = responseData?.totalUnread;
	const todayReadCount = responseData?.todayReadCount;

	const bookmarksToDisplay = responseData?.bookmarks ?? [];

	// エラーハンドリング (ラベルまたはブックマーク取得エラー)
	if (errorLabels) {
		return (
			<main className="container mx-auto px-4 py-8 text-red-500">
				ラベルの読み込みに失敗しました: {errorLabels.message}
			</main>
		);
	}
	if (errorBookmarks) {
		return (
			<main className="container mx-auto px-4 py-8 text-red-500">
				ブックマークの読み込みに失敗しました: {errorBookmarks.message}
			</main>
		);
	}

	return (
		<main className="container mx-auto px-4 py-8">
			{/* 未読数と既読数を表示 + 追加ボタン */}
			<div className="flex justify-between items-center mb-4">
				{!isLoadingBookmarks &&
					totalUnread !== undefined &&
					todayReadCount !== undefined && (
						<div className="text-sm text-gray-600">
							<span>未読: {totalUnread}件</span>
							<span className="ml-4">本日既読: {todayReadCount}件</span>
						</div>
					)}
				<button
					type="button"
					onClick={() => setIsModalOpen(true)}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
				>
					記事を追加
				</button>
			</div>

			{/* ラベルフィルター */}
			{isLoadingLabels ? (
				<div className="mb-4 text-gray-500">ラベルを読み込み中...</div>
			) : (
				<LabelFilter
					labels={labels}
					selectedLabelName={selectedLabelName}
					onLabelSelect={setSelectedLabelName}
				/>
			)}

			{/* ブックマークリスト */}
			{isLoadingBookmarks ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{/* スケルトンローディング表示 (簡易版) */}
					{[...Array(6)].map((_, i) => (
						<div
							key={i}
							className="border rounded-lg p-4 h-[150px] bg-gray-100 animate-pulse"
						/>
					))}
				</div>
			) : (
				<BookmarksList
					bookmarks={bookmarksToDisplay} // 正しい変数を渡す
					onLabelClick={setSelectedLabelName} // ラベルクリック時のハンドラを渡す
				/>
			)}

			{/* 記事追加モーダル */}
			<CreateBookmarkModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
			/>
		</main>
	);
}
