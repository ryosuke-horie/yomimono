import { API_BASE_URL } from "@/lib/api/config";
import type { ApiBookmarkResponse, ApiFavoriteResponse } from "@/types/api";
import type { Bookmark } from "@/types/bookmark";
import { useCallback, useEffect, useState } from "react";

interface BookmarksData {
	bookmarks: Bookmark[];
	totalUnread: number;
	todayReadCount: number;
}

export function useBookmarks() {
	const [favorites, setFavorites] = useState<Bookmark[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const getUnreadBookmarks = useCallback(async (): Promise<BookmarksData> => {
		const url = `${API_BASE_URL}/api/bookmarks/unread`;

		try {
			const response = await fetch(url, {
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
			});

			const responseText = await response.text();

			if (!response.ok) {
				throw new Error(`Failed to fetch bookmarks: ${response.status}`);
			}

			try {
				const data = JSON.parse(responseText) as ApiBookmarkResponse;
				if (!data.success) {
					throw new Error(data.message);
				}
				return {
					bookmarks: data.bookmarks || [],
					totalUnread: data.totalUnread || 0,
					todayReadCount: data.todayReadCount || 0,
				};
			} catch (e) {
				if (e instanceof Error) {
					throw e;
				}
				console.error("Failed to parse response:", e);
				throw new Error("Invalid response format");
			}
		} catch (error) {
			console.error("API error:", {
				error,
				url,
			});
			throw error;
		}
	}, []);

	const markAsRead = useCallback(async (id: number): Promise<void> => {
		const url = `${API_BASE_URL}/api/bookmarks/${id}/read`;

		try {
			const response = await fetch(url, {
				method: "PATCH",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
			});

			const responseText = await response.text();

			if (!response.ok) {
				throw new Error(`Failed to mark as read: ${response.status}`);
			}

			try {
				const data = JSON.parse(responseText) as ApiBookmarkResponse;
				if (!data.success) {
					throw new Error(data.message);
				}
			} catch (e) {
				if (e instanceof Error) {
					throw e;
				}
				console.error("Failed to parse response:", e);
				throw new Error("Invalid response format");
			}
		} catch (error) {
			console.error("API error:", {
				error,
				url,
			});
			throw error;
		}
	}, []);

	const fetchFavorites = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await fetch(`${API_BASE_URL}/api/bookmarks/favorites`, {
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
			});
			if (!response.ok)
				throw new Error(`Failed to fetch favorites: ${response.status}`);
			const data = (await response.json()) as ApiFavoriteResponse;
			if (!data.success) throw new Error(data.message);
			setFavorites(data.bookmarks || []);
		} catch (error) {
			console.error("Failed to fetch favorites:", error);
			setFavorites([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const addToFavorites = useCallback(
		async (id: number): Promise<void> => {
			const url = `${API_BASE_URL}/api/bookmarks/${id}/favorite`;
			try {
				const response = await fetch(url, {
					method: "POST",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
				});

				if (!response.ok) {
					throw new Error(`Failed to add to favorites: ${response.status}`);
				}

				const data = (await response.json()) as ApiBookmarkResponse;
				if (!data.success) {
					throw new Error(data.message);
				}
				await fetchFavorites();
			} catch (error) {
				console.error("API error:", { error, url });
				throw error;
			}
		},
		[fetchFavorites],
	);

	const removeFromFavorites = useCallback(
		async (id: number): Promise<void> => {
			const url = `${API_BASE_URL}/api/bookmarks/${id}/favorite`;
			try {
				const response = await fetch(url, {
					method: "DELETE",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
				});

				if (!response.ok) {
					throw new Error(
						`Failed to remove from favorites: ${response.status}`,
					);
				}

				const data = (await response.json()) as ApiBookmarkResponse;
				if (!data.success) {
					throw new Error(data.message);
				}
				await fetchFavorites();
			} catch (error) {
				console.error("API error:", { error, url });
				throw error;
			}
		},
		[fetchFavorites],
	);

	// お気に入り一覧の初期データを取得
	useEffect(() => {
		fetchFavorites();
	}, [fetchFavorites]);

	const getRecentlyReadBookmarks = useCallback(async (): Promise<{
		[date: string]: Bookmark[];
	}> => {
		const url = `${API_BASE_URL}/api/bookmarks/recent`;

		try {
			const response = await fetch(url, {
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
			});

			const responseText = await response.text();

			if (!response.ok) {
				throw new Error(
					`Failed to fetch recently read bookmarks: ${response.status}`,
				);
			}

			try {
				const data = JSON.parse(responseText);
				if (!data.success) {
					throw new Error(data.message);
				}
				return data.bookmarks || {};
			} catch (e) {
				if (e instanceof Error) {
					throw e;
				}
				console.error("Failed to parse response:", e);
				throw new Error("Invalid response format");
			}
		} catch (error) {
			console.error("API error:", {
				error,
				url,
			});
			throw error;
		}
	}, []);

	return {
		getUnreadBookmarks,
		markAsRead,
		addToFavorites,
		removeFromFavorites,
		favorites,
		isLoading,
		fetchFavorites,
		getRecentlyReadBookmarks,
	};
}
