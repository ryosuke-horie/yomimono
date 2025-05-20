import { useRSSFeeds } from "../queries/useRSSFeeds";

interface FeedFilterProps {
	selectedFeedId: number | null;
	onChange: (feedId: number | null) => void;
}

export function FeedFilter({ selectedFeedId, onChange }: FeedFilterProps) {
	const { data: feedsData, isLoading } = useRSSFeeds();
	const feeds = feedsData?.feeds || [];

	if (isLoading) {
		return (
			<div className="w-full max-w-xs animate-pulse">
				<div className="h-10 bg-gray-200 rounded"></div>
			</div>
		);
	}

	return (
		<div className="mb-4">
			<select
				value={selectedFeedId?.toString() || ""}
				onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
				className="w-full max-w-xs p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			>
				<option value="">全てのフィード</option>
				{feeds.map((feed) => (
					<option key={feed.id} value={feed.id}>
						{feed.name}
					</option>
				))}
			</select>
		</div>
	);
}