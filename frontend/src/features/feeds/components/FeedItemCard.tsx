import type { RSSFeedItem } from "../types";

interface FeedItemCardProps {
	item: RSSFeedItem;
}

export function FeedItemCard({ item }: FeedItemCardProps) {
	// 日付のフォーマット
	const formatDate = (dateString: string | null) => {
		if (!dateString) return "不明な日付";
		const date = new Date(dateString);
		return new Intl.DateTimeFormat("ja-JP", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(date);
	};

	// 説明文の短縮
	const truncateDescription = (text: string | null, maxLength = 150) => {
		if (!text) return "";
		return text.length > maxLength
			? `${text.substring(0, maxLength)}...`
			: text;
	};

	const formattedDate = formatDate(item.publishedAt);
	const truncatedDescription = truncateDescription(item.description);

	return (
		<div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
			<div className="flex justify-between items-start">
				<div className="flex-1">
					<h3 className="font-bold text-lg mb-2">
						<a
							href={item.url}
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-blue-600"
						>
							{item.title}
						</a>
					</h3>
					{truncatedDescription && (
						<p className="text-gray-600 text-sm mb-2">{truncatedDescription}</p>
					)}
					<div className="flex items-center gap-4 text-sm text-gray-500">
						<span>{item.feedName}</span>
						<span>{formattedDate}</span>
					</div>
				</div>
				<div className="ml-4">
					{item.isBookmarked ? (
						<span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
							登録済み
						</span>
					) : (
						<span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
							未登録
						</span>
					)}
				</div>
			</div>
		</div>
	);
}
