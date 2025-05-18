import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { useBatchLogs } from "../queries/useBatch";

export function BatchStatus() {
	const { data: logs } = useBatchLogs();

	const latestLog = logs?.[0];

	if (!latestLog) return null;

	const statusColor =
		{
			completed: "text-green-600",
			partial_failure: "text-yellow-600",
			error: "text-red-600",
			in_progress: "text-blue-600",
		}[latestLog.status] || "text-gray-600";

	const statusIcon = {
		completed: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				strokeWidth={2}
				stroke="currentColor"
				className="w-5 h-5"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		),
		partial_failure: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				strokeWidth={2}
				stroke="currentColor"
				className="w-5 h-5"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
				/>
			</svg>
		),
		error: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				strokeWidth={2}
				stroke="currentColor"
				className="w-5 h-5"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		),
		in_progress: (
			<div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
		),
	}[latestLog.status];

	return (
		<div className="bg-white border rounded-lg p-3">
			<div className={`flex items-center gap-2 ${statusColor}`}>
				{statusIcon}
				<div className="flex-1">
					<p className="text-sm font-medium">
						最終実行:{" "}
						{formatDistanceToNow(new Date(latestLog.startedAt), {
							addSuffix: true,
							locale: ja,
						})}
					</p>
					<p className="text-xs text-gray-600">
						取得: {latestLog.itemsFetched}件 / 新規: {latestLog.itemsCreated}件
					</p>
				</div>
			</div>
		</div>
	);
}
