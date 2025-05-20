"use client";

import { BookmarkCard } from "@/features/bookmarks/components/BookmarkCard";
import { useGetReadBookmarks } from "@/features/bookmarks/queries/useGetReadBookmarks";

export default function ReadPage() {
  const {
    data: bookmarks = [],
    isLoading,
    isError,
    error,
  } = useGetReadBookmarks();

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-10">
          <div className="animate-spin h-8 w-8 mx-auto border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-sm">
          <p className="text-red-700">
            {error instanceof Error
              ? error.message
              : "既読ブックマークの取得に失敗しました"}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">既読ブックマーク一覧</h1>

      {bookmarks.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p>既読ブックマークはありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookmarks.map((bookmark) => (
            <div key={bookmark.id} className="mx-auto w-full max-w-sm">
              <BookmarkCard 
                bookmark={bookmark} 
                showUnreadButton={true} // 未読に戻すボタンを表示
              />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}