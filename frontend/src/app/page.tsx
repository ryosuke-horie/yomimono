"use client"; // フックを使用するためクライアントコンポーネントにする

import { BookmarksList } from "@/features/bookmarks/components/BookmarksList";
import type { BookmarkWithLabel } from "@/features/bookmarks/types";
import { LabelFilter } from "@/features/labels/components/LabelFilter";
import { useLabels } from "@/features/labels/hooks/useLabels";
import { API_BASE_URL } from "@/lib/api/config";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

// APIレスポンスの型定義 (APIのレスポンス構造に合わせる)
interface BookmarksApiResponse {
	success: boolean;
	bookmarks: BookmarkWithLabel[];
	totalUnread?: number; // ラベル指定なしの場合のみ存在
	todayReadCount?: number; // ラベル指定なしの場合のみ存在
}

// ブックマーク一覧を取得する非同期関数 (戻り値の型を修正)
const fetchBookmarks = async (
	labelName?: string,
): Promise<BookmarksApiResponse> => {
	// 戻り値をレスポンス全体に変更
	const url = labelName
		? `${API_BASE_URL}/api/bookmarks?label=${encodeURIComponent(labelName)}` // /api プレフィックスを追加
		: `${API_BASE_URL}/api/bookmarks`; // /api プレフィックスを追加
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error("Failed to fetch bookmarks");
	}
	const data: BookmarksApiResponse = await response.json();
	return data; // レスポンス全体を返す
};

export default function HomePage() {
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
		data: responseData, // data を responseData として受け取る
		isLoading: isLoadingBookmarks,
		error: errorBookmarks,
	} = useQuery<BookmarksApiResponse, Error>({
		// useQuery の型引数を修正
		queryKey: ["bookmarks", selectedLabelName], // 選択ラベル名をクエリキーに含める
		queryFn: () => fetchBookmarks(selectedLabelName), // 選択ラベル名を渡す
		staleTime: 1 * 60 * 1000, // 1分間キャッシュを有効にする
	});

	// responseData から totalUnread と todayReadCount を取得
	const totalUnread = responseData?.totalUnread;
	const todayReadCount = responseData?.todayReadCount;

	// 取得したデータからブックマークリストを抽出 (変数名を修正)
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
			{/* 未読数と既読数を表示 */}
			{!isLoadingBookmarks &&
				totalUnread !== undefined &&
				todayReadCount !== undefined && (
					<div className="mb-4 text-sm text-gray-600">
						<span>未読: {totalUnread}件</span>
						<span className="ml-4">本日既読: {todayReadCount}件</span>
					</div>
				)}

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
		</main>
	);
}
