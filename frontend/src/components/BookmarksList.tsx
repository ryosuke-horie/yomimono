'use client';

import { useState } from 'react';
import { getUnreadBookmarks } from '@/lib/api/bookmarks';
import { BookmarkCard } from '@/components/BookmarkCard';
import type { Bookmark } from '@/types/bookmark';

interface BookmarksListProps {
  initialBookmarks: Bookmark[];
}

export function BookmarksList({ initialBookmarks }: BookmarksListProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getUnreadBookmarks();
      setBookmarks(data);
    } catch (e) {
      setError('ブックマークの取得に失敗しました');
      console.error('Error fetching bookmarks:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchBookmarks}
          className="mt-2 text-red-700 hover:text-red-800 font-medium"
        >
          再試行
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">未読ブックマーク</h1>
        <button
          onClick={fetchBookmarks}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          更新
        </button>
      </div>

      {bookmarks.length === 0 ? (
        <p className="text-gray-600">未読のブックマークはありません。</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((bookmark) => (
            <BookmarkCard key={bookmark.id} bookmark={bookmark} />
          ))}
        </div>
      )}
    </div>
  );
}