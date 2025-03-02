"use client";

import { BookmarkCard } from "@/components/BookmarkCard";
import { API_BASE_URL } from "@/lib/api/config";
import type { ApiBookmarkResponse } from "@/types/api";
import type { Bookmark } from "@/types/bookmark";
import { useCallback, useEffect, useState } from "react";

interface BookmarksListProps {
        initialBookmarks: Bookmark[];
}

interface FetchError extends Error {
        status?: number;
}

export function BookmarksList({ initialBookmarks }: BookmarksListProps) {
        const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
        const [isLoading, setIsLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);

        const fetchBookmarks = useCallback(async () => {
                try {
                        setIsLoading(true);
                        setError(null);
                        const response = await fetch(`${API_BASE_URL}/api/bookmarks/unread`);
                        if (!response.ok) {
                                throw new Error(`サーバーエラーが発生しました。ステータスコード: ${response.status}`);
                        }
                        const data: ApiBookmarkResponse = await response.json();
                        if (!data.success) {
                                const error = new Error(
                                        data.message || "ブックマークの取得に失敗しました。",
                                ) as FetchError;
                                error.status = response.status;
                                throw error;
                        }
                        setBookmarks(data.bookmarks || []);
                } catch (e) {
                        const error = e as FetchError;
                        setError(
                                `ブックマークの取得に失敗しました。${error.message || ""}${error.status ? ` (ステータスコード: ${error.status})` : ""}`,
                        );
                        console.error("Error fetching bookmarks:", error);
                } finally {
                        setIsLoading(false);
                }
        }, []);

        useEffect(() => {
                fetchBookmarks();
        }, [fetchBookmarks]);

        return (
                <div>
                        <div className="flex justify-between items-center mb-6">
                                <h1 className="text-2xl font-bold">未読ブックマーク</h1>
                                <button
                                        type="button"
                                        onClick={fetchBookmarks}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        disabled={isLoading}
                                >
                                        {isLoading ? (
                                                <div className="flex items-center">
                                                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                                                        更新中...
                                                </div>
                                        ) : (
                                                <>
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
                                                </>
                                        )}
                                </button>
                        </div>

                        {error && (
                                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-sm mb-6">
                                        <p className="text-red-700">{error}</p>
                                </div>
                        )}

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
