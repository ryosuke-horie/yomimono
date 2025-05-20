import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { RSSFeedItem, RSSFeedItemsParams } from "../types";
import { feedItemsApi } from "./api";
import { queryKeys } from "./queryKeys";

interface UseRSSItemsParams {
	feedId?: number | null;
	limit?: number;
}

export function useRSSItems({ feedId, limit = 20 }: UseRSSItemsParams = {}) {
	// 結合したアイテムリストをメモリに保持
	const [allItems, setAllItems] = useState<RSSFeedItem[]>([]);

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isFetchingNextPage,
		isLoading,
		isError,
		error,
		refetch,
	} = useInfiniteQuery({
		queryKey: queryKeys.items.list({ feedId, page: 0 }),
		queryFn: ({ pageParam = 0 }) => {
			const params: RSSFeedItemsParams = {
				feedId,
				limit,
				offset: pageParam * limit,
			};
			return feedItemsApi.getItems(params);
		},
		getNextPageParam: (lastPage, pages) => {
			// 次のページがある場合は、次のページ番号を返す
			return lastPage.hasMore ? pages.length : undefined;
		},
		onSuccess: (data) => {
			// 全ページのアイテムを結合
			const items = data.pages.flatMap((page) => page.items);
			setAllItems(items);
		},
	});

	return {
		items: allItems,
		fetchNextPage,
		hasNextPage: hasNextPage || false,
		isFetching,
		isFetchingNextPage,
		isLoading,
		isError,
		error,
		refetch,
		total: data?.pages[0]?.total || 0,
	};
}