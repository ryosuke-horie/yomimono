import type { RSSFeed } from "../types";

interface FeedCardProps {
	feed: RSSFeed;
	onEdit?: (feed: RSSFeed) => void;
	onDelete?: (id: number) => void;
}

export function FeedCard({ feed, onEdit, onDelete }: FeedCardProps) {
	// 最終更新時刻をフォーマット
	const formatLastFetch = (date: string | null) => {
		if (!date) return "まだ取得されていません";

		const fetchDate = new Date(date);
		const now = new Date();
		const diffMinutes = Math.floor(
			(now.getTime() - fetchDate.getTime()) / (1000 * 60),
		);

		if (diffMinutes < 60) {
			return `${diffMinutes}分前`;
		}
		if (diffMinutes < 1440) {
			return `${Math.floor(diffMinutes / 60)}時間前`;
		}
		return `${Math.floor(diffMinutes / 1440)}日前`;
	};

	// ステータスインジケーター
	const statusColor = feed.isActive ? "bg-green-500" : "bg-gray-400";

	return (
		<div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
			<div className="flex justify-between items-start mb-2">
				<h3 className="font-bold text-lg">{feed.name}</h3>
				<div className="flex gap-2">
					{onEdit && (
						<button
							type="button"
							onClick={() => onEdit(feed)}
							className="text-blue-500 hover:text-blue-700 px-2 py-1 text-sm"
						>
							編集
						</button>
					)}
					{onDelete && (
						<button
							type="button"
							onClick={() => onDelete(feed.id)}
							className="text-red-500 hover:text-red-700 px-2 py-1 text-sm"
						>
							削除
						</button>
					)}
				</div>
			</div>

			<p className="text-sm text-gray-600 mb-3 truncate" title={feed.url}>
				URL: {feed.url}
			</p>

			<div className="flex items-center gap-4 text-sm">
				<span className="text-gray-600">
					最終更新: {formatLastFetch(feed.lastFetchedAt)}
				</span>
				<span className="text-gray-600">記事数: {feed.itemCount || 0}</span>
				<div className="flex items-center gap-1">
					<span className="text-gray-600">ステータス:</span>
					<div className={`w-3 h-3 rounded-full ${statusColor}`} />
				</div>
			</div>
		</div>
	);
}
