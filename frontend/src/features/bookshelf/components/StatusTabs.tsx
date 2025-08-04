/**
 * ステータスタブコンポーネント
 * 未読・読書中・読了の切り替えタブ
 */

"use client";

import type { BookStatus } from "../types";

interface StatusTabsProps {
	activeTab: BookStatus;
	onTabChange: (status: BookStatus) => void;
}

const tabs: { value: BookStatus; label: string }[] = [
	{ value: "unread", label: "未読" },
	{ value: "reading", label: "読書中" },
	{ value: "completed", label: "読了" },
];

export function StatusTabs({ activeTab, onTabChange }: StatusTabsProps) {
	return (
		<div className="flex space-x-1 rounded-lg bg-gray-100 p-1" role="tablist">
			{tabs.map((tab) => (
				<button
					key={tab.value}
					type="button"
					role="tab"
					aria-selected={activeTab === tab.value}
					onClick={() => onTabChange(tab.value)}
					className={`
						px-4 py-2 rounded-md font-medium text-sm transition-colors
						${
							activeTab === tab.value
								? "bg-white text-blue-600 shadow-sm"
								: "text-gray-600 hover:text-gray-900"
						}
					`}
				>
					{tab.label}
				</button>
			))}
		</div>
	);
}
