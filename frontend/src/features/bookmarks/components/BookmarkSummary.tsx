"use client";

import { useState } from "react";

interface Props {
	summary: string | null;
	summaryUpdatedAt: string | null;
	isGenerating?: boolean;
	onGenerateSummary?: () => void;
}

export function BookmarkSummary({
	summary,
	summaryUpdatedAt,
	isGenerating = false,
	onGenerateSummary,
}: Props) {
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
				<p className="text-sm text-gray-500 mb-2">要約がありません</p>
				{onGenerateSummary && (
					<button
						type="button"
						onClick={onGenerateSummary}
						disabled={isGenerating}
						className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
					>
						{isGenerating ? (
							<span className="flex items-center">
								<svg
									className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									/>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									/>
								</svg>
								生成中...
							</span>
						) : (
							"要約を生成"
						)}
					</button>
				)}
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
