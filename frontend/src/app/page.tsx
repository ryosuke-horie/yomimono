"use client"; // フックを使用するためクライアントコンポーネントにする

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookmarksList } from "@/features/bookmarks/components/BookmarksList";
import { LabelFilter } from "@/features/labels/components/LabelFilter";
import { useLabels } from "@/features/labels/hooks/useLabels";
import type { BookmarkWithLabel } from "@/features/bookmarks/types";
import { API_BASE_URL } from "@/lib/api/config";


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
): Promise<BookmarksApiResponse> => { // 戻り値をレスポンス全体に変更
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
  } = useQuery<BookmarksApiResponse, Error>({ // useQuery の型引数を修正
    queryKey: ["bookmarks", selectedLabelName], // 選択ラベル名をクエリキーに含める
    queryFn: () => fetchBookmarks(selectedLabelName), // 選択ラベル名を渡す
    staleTime: 1 * 60 * 1000, // 1分間キャッシュを有効にする
  });

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
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
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
