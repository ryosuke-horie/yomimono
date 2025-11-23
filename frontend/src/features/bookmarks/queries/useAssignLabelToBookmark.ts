import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Label } from "@/features/labels/types";
import type { QueryToastOptions } from "@/types/toast";
import type { BookmarkWithLabel } from "../types";
import type { BookmarksData } from "./api";
import { assignLabelToBookmark } from "./api";
import { bookmarkKeys } from "./queryKeys";

interface Variables {
	bookmarkId: number;
	labelName: string;
	optimisticLabel?: Label;
}

const isBookmarkWithLabel = (item: unknown): item is BookmarkWithLabel => {
	return (
		typeof item === "object" && item !== null && "id" in item && "label" in item
	);
};

const isBookmarksResponse = (
	data: unknown,
): data is { bookmarks: BookmarkWithLabel[] } => {
	return (
		typeof data === "object" &&
		data !== null &&
		"bookmarks" in data &&
		Array.isArray((data as { bookmarks: unknown }).bookmarks) &&
		(data as { bookmarks: unknown[] }).bookmarks.every(isBookmarkWithLabel)
	);
};

const isGroupedBookmarks = (
	data: unknown,
): data is Record<string, BookmarkWithLabel[]> => {
	if (typeof data !== "object" || data === null) {
		return false;
	}

	return Object.values(data).every(
		(value) => Array.isArray(value) && value.every(isBookmarkWithLabel),
	);
};

const updateBookmarkLabel = (
	bookmark: BookmarkWithLabel,
	bookmarkId: number,
	label: Label,
) => {
	if (bookmark.id !== bookmarkId) return bookmark;
	return { ...bookmark, label };
};

const updateCacheData = (
	data: unknown,
	bookmarkId: number,
	label: Label,
): unknown => {
	if (!data) return data;

	if (isBookmarksResponse(data)) {
		return {
			...data,
			bookmarks: data.bookmarks.map((item) =>
				updateBookmarkLabel(item, bookmarkId, label),
			),
		};
	}

	if (isGroupedBookmarks(data)) {
		const updatedEntries = Object.fromEntries(
			Object.entries(data).map(([date, bookmarks]) => [
				date,
				bookmarks.map((item) => updateBookmarkLabel(item, bookmarkId, label)),
			]),
		);
		return updatedEntries;
	}

	if (Array.isArray(data) && data.every(isBookmarkWithLabel)) {
		return data.map((item) => updateBookmarkLabel(item, bookmarkId, label));
	}

	if (
		typeof data === "object" &&
		data !== null &&
		"bookmarks" in data &&
		Array.isArray((data as BookmarksData).bookmarks)
	) {
		return {
			...(data as BookmarksData),
			bookmarks: (data as BookmarksData).bookmarks.map((item) =>
				isBookmarkWithLabel(item)
					? updateBookmarkLabel(item, bookmarkId, label)
					: item,
			),
		};
	}

	return data;
};

export const useAssignLabelToBookmark = (options?: QueryToastOptions) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ bookmarkId, labelName }: Variables) =>
			assignLabelToBookmark(bookmarkId, labelName),
		onMutate: async ({ bookmarkId, optimisticLabel, labelName }) => {
			await queryClient.cancelQueries({ queryKey: bookmarkKeys.all });

			const previousEntries = queryClient.getQueriesData({
				queryKey: bookmarkKeys.all,
			});

			if (optimisticLabel) {
				previousEntries.forEach(([queryKey, data]) => {
					const nextData = updateCacheData(
						data,
						bookmarkId,
						optimisticLabel,
					);
					if (nextData !== data) {
						queryClient.setQueryData(queryKey, nextData);
					}
				});
			} else {
				const fallbackLabel: Label = {
					id: -1,
					name: labelName,
				};
				previousEntries.forEach(([queryKey, data]) => {
					const nextData = updateCacheData(
						data,
						bookmarkId,
						fallbackLabel,
					);
					if (nextData !== data) {
						queryClient.setQueryData(queryKey, nextData);
					}
				});
			}

			return { previousEntries };
		},
		onError: (_error, _variables, context) => {
			if (!context?.previousEntries) return;
			context.previousEntries.forEach(([queryKey, data]) => {
				queryClient.setQueryData(queryKey, data);
			});
			if (options?.showToast) {
				options.showToast({
					type: "error",
					message: "ラベルの更新に失敗しました",
					duration: 3000,
				});
			}
		},
		onSuccess: (updatedLabel, variables) => {
			const cacheEntries = queryClient.getQueriesData({
				queryKey: bookmarkKeys.all,
			});

			cacheEntries.forEach(([queryKey, data]) => {
				const nextData = updateCacheData(
					data,
					variables.bookmarkId,
					updatedLabel,
				);
				if (nextData !== data) {
					queryClient.setQueryData(queryKey, nextData);
				}
			});

			if (options?.showToast) {
				options.showToast({
					type: "success",
					message: "ラベルを更新しました",
					duration: 2000,
				});
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
		},
	});
};
