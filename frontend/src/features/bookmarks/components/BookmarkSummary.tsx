"use client";

import { useState } from "react";

interface Props {
	summary: string | null;
	onCopy?: (success: boolean) => void;
}

export function BookmarkSummary({ summary, onCopy }: Props) {
	const [showSummary, setShowSummary] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const [copySuccess, setCopySuccess] = useState(false);

	if (!summary) return null;

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(summary);
			setCopySuccess(true);
			onCopy?.(true);
			setTimeout(() => setCopySuccess(false), 2000);
		} catch (error) {
			console.error("Failed to copy summary:", error);
			onCopy?.(false);
		}
	};

	const toggleSummary = () => {
		setShowSummary(!showSummary);
		if (!showSummary) {
			setIsExpanded(false);
		}
	};

	const summaryPreview = summary.length > 100 ? `${summary.slice(0, 100)}...` : summary;

	return (
		<div className="mt-3">
			<button
				type="button"
				onClick={toggleSummary}
				className="flex items-center text-sm text-blue-600 hover:text-blue-800"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth={1.5}
					stroke="currentColor"
					className={`w-4 h-4 mr-1 transition-transform ${showSummary ? "rotate-90" : ""}`}
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M8.25 4.5l7.5 7.5-7.5 7.5"
					/>
				</svg>
				要約を{showSummary ? "隠す" : "表示"}
			</button>

			{showSummary && (
				<div className="mt-2 p-3 bg-gray-50 border rounded-lg">
					<div className="flex justify-between items-start mb-2">
						<h3 className="font-semibold text-sm">記事の要約</h3>
						<button
							type="button"
							onClick={handleCopy}
							className={`ml-2 px-2 py-1 text-xs rounded transition-colors ${
								copySuccess
									? "bg-green-100 text-green-700"
									: "bg-gray-100 text-gray-600 hover:bg-gray-200"
							}`}
						>
							{copySuccess ? "コピー済み！" : "コピー"}
						</button>
					</div>

					<div className="prose prose-sm max-w-none">
						<p className="text-sm text-gray-700 whitespace-pre-wrap">
							{isExpanded ? summary : summaryPreview}
						</p>
					</div>

					{summary.length > 100 && (
						<button
							type="button"
							onClick={() => setIsExpanded(!isExpanded)}
							className="mt-2 text-xs text-blue-600 hover:text-blue-800"
						>
							{isExpanded ? "折りたたむ" : "全文を表示"}
						</button>
					)}
				</div>
			)}
		</div>
	);
}