"use client";

import { useState } from "react";

interface Props {
	summary: string | null;
	summaryUpdatedAt: string | null;
}

export function BookmarkSummary({ summary, summaryUpdatedAt }: Props) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [copySuccess, setCopySuccess] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(summary || "");
			setCopySuccess(true);
			setTimeout(() => setCopySuccess(false), 2000);
		} catch (error) {
			console.error("Failed to copy summary:", error);
		}
	};

	// 要約がない場合
	if (!summary) {
		return (
			<div className="mt-3 p-3 border border-dashed border-gray-300 rounded-lg">
				<p className="text-sm text-gray-500">要約がありません</p>
			</div>
		);
	}

	// 要約がある場合
	return (
		<div className="mt-3">
			<div className="p-3 bg-gray-50 rounded-lg">
				<div className="flex justify-between items-start mb-2">
					<h3 className="text-sm font-semibold text-gray-700">要約</h3>
					<div className="flex gap-2 items-center">
						{summaryUpdatedAt && (
							<span className="text-xs text-gray-500">
								{new Date(summaryUpdatedAt).toLocaleDateString("ja-JP")}
							</span>
						)}
						<button
							type="button"
							onClick={handleCopy}
							className={`text-xs ${
								copySuccess
									? "text-green-600"
									: "text-gray-600 hover:text-gray-800"
							}`}
						>
							{copySuccess ? "コピー済み" : "コピー"}
						</button>
						<button
							type="button"
							onClick={() => setIsExpanded(!isExpanded)}
							className="text-xs text-gray-600 hover:text-gray-800"
						>
							{isExpanded ? "折りたたむ" : "展開"}
						</button>
					</div>
				</div>
				<div
					className={`text-sm text-gray-700 ${
						isExpanded ? "" : "line-clamp-3"
					}`}
				>
					{summary.split("\n").map((line, index) => (
						<p key={index} className={line.startsWith("•") ? "ml-4" : ""}>
							{line}
						</p>
					))}
				</div>
			</div>
		</div>
	);
}
