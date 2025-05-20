import { useState } from "react";
import { Button } from "@/components/Button";
import { FeedFilter } from "../components/FeedFilter";
import { FeedItemCard } from "../components/FeedItemCard";
import { useRSSItems } from "../queries/useRSSItems";

export function FeedItemsPage() {
	const [selectedFeedId, setSelectedFeedId] = useState<number | null>(null);
	
	const {
		items,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isFetchingNextPage,
		isLoading,
		isError,
		total,
	} = useRSSItems({ feedId: selectedFeedId });

	// エラー状態
	if (isError) {
		return (
			<div className="container mx-auto p-4">
				<h1 className="text-2xl font-bold mb-6">RSS記事一覧</h1>
				<FeedFilter
					selectedFeedId={selectedFeedId}
					onChange={setSelectedFeedId}
				/>
				<div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
					<p className="text-red-700">エラーが発生しました。再読み込みしてください。</p>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-4">
			<div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
				<h1 className="text-2xl font-bold mb-2 md:mb-0">RSS記事一覧</h1>
				<div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
					<FeedFilter
						selectedFeedId={selectedFeedId}
						onChange={setSelectedFeedId}
					/>
					{total > 0 && (
						<span className="text-sm text-gray-600 ml-2">
							合計: {total}件
						</span>
					)}
				</div>
			</div>

			{isLoading ? (
				<div className="grid gap-4">
					{[...Array(5)].map((_, i) => (
						<div key={i} className="border rounded-lg p-4 animate-pulse">
							<div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
							<div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
							<div className="h-4 bg-gray-200 rounded w-1/4"></div>
						</div>
					))}
				</div>
			) : items.length === 0 ? (
				<div className="text-center p-6 bg-gray-50 rounded-lg">
					<p className="text-gray-500">記事が見つかりませんでした。</p>
				</div>
			) : (
				<>
					<div className="grid gap-4">
						{items.map((item) => (
							<FeedItemCard key={item.id} item={item} />
						))}
					</div>

					{hasNextPage && (
						<div className="mt-6 text-center">
							<Button
								onClick={() => fetchNextPage()}
								disabled={isFetchingNextPage}
								variant="secondary"
								className="w-full max-w-md"
							>
								{isFetchingNextPage
									? "読み込み中..."
									: "もっと読み込む"}
							</Button>
						</div>
					)}
				</>
			)}

			{isFetching && !isFetchingNextPage && (
				<div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
					データを更新中...
				</div>
			)}
		</div>
	);
}