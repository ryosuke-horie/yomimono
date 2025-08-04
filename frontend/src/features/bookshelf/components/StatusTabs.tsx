/**
 * ステータスタブコンポーネント
 * 本棚のアイテムをステータスでフィルタリングするためのタブUI
 */

"use client";

import { BookStatus, type BookStatusValue } from "../types";

interface StatusTabsProps {
	currentStatus: BookStatusValue | undefined;
	onStatusChange: (status: BookStatusValue | undefined) => void;
	stats: {
		total: number;
		unread: number;
		reading: number;
		completed: number;
	};
}

export function StatusTabs({
	currentStatus,
	onStatusChange,
	stats,
}: StatusTabsProps) {
	const tabs = [
		{ label: "すべて", value: undefined, count: stats.total },
		{ label: "未読", value: BookStatus.UNREAD, count: stats.unread },
		{ label: "読書中", value: BookStatus.READING, count: stats.reading },
		{ label: "読了", value: BookStatus.COMPLETED, count: stats.completed },
	] as const;

	return (
		<div className="border-b border-gray-200 mb-8">
			<div className="-mb-px flex space-x-8" role="tablist">
				{tabs.map((tab) => (
					<button
						key={tab.label}
						type="button"
						role="tab"
						aria-selected={currentStatus === tab.value}
						onClick={() => onStatusChange(tab.value)}
						className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
							currentStatus === tab.value
								? "border-blue-500 text-blue-600"
								: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
						}`}
					>
						{tab.label}
						<span className="ml-2 text-gray-400">({tab.count})</span>
					</button>
				))}
			</div>
		</div>
	);
}

if (import.meta.vitest) {
	const { describe, it, expect, vi } = import.meta.vitest;
	const { render, screen, fireEvent } = await import("@testing-library/react");
	const React = await import("react");

	describe("StatusTabs", () => {
		const mockStats = {
			total: 10,
			unread: 5,
			reading: 3,
			completed: 2,
		};

		it("すべてのタブが表示される", () => {
			const mockOnStatusChange = vi.fn();
			render(
				React.createElement(StatusTabs, {
					currentStatus: undefined,
					onStatusChange: mockOnStatusChange,
					stats: mockStats,
				}),
			);

			expect(screen.getByText("すべて")).toBeInTheDocument();
			expect(screen.getByText("未読")).toBeInTheDocument();
			expect(screen.getByText("読書中")).toBeInTheDocument();
			expect(screen.getByText("読了")).toBeInTheDocument();
		});

		it("各タブに件数が表示される", () => {
			const mockOnStatusChange = vi.fn();
			render(
				React.createElement(StatusTabs, {
					currentStatus: undefined,
					onStatusChange: mockOnStatusChange,
					stats: mockStats,
				}),
			);

			expect(screen.getByText("(10)")).toBeInTheDocument();
			expect(screen.getByText("(5)")).toBeInTheDocument();
			expect(screen.getByText("(3)")).toBeInTheDocument();
			expect(screen.getByText("(2)")).toBeInTheDocument();
		});

		it("タブクリック時にonStatusChangeが呼ばれる", () => {
			const mockOnStatusChange = vi.fn();
			render(
				React.createElement(StatusTabs, {
					currentStatus: undefined,
					onStatusChange: mockOnStatusChange,
					stats: mockStats,
				}),
			);

			const unreadTab = screen.getByText("未読");
			fireEvent.click(unreadTab);

			expect(mockOnStatusChange).toHaveBeenCalledWith(BookStatus.UNREAD);
		});

		it("現在選択されているタブがハイライトされる", () => {
			const mockOnStatusChange = vi.fn();
			render(
				React.createElement(StatusTabs, {
					currentStatus: BookStatus.READING,
					onStatusChange: mockOnStatusChange,
					stats: mockStats,
				}),
			);

			const readingTab = screen.getByRole("tab", { name: /読書中/ });
			expect(readingTab).toHaveAttribute("aria-selected", "true");
			expect(readingTab.className).toContain("border-blue-500");
			expect(readingTab.className).toContain("text-blue-600");
		});

		it("すべてタブがundefinedで呼ばれる", () => {
			const mockOnStatusChange = vi.fn();
			render(
				React.createElement(StatusTabs, {
					currentStatus: BookStatus.UNREAD,
					onStatusChange: mockOnStatusChange,
					stats: mockStats,
				}),
			);

			const allTab = screen.getByText("すべて");
			fireEvent.click(allTab);

			expect(mockOnStatusChange).toHaveBeenCalledWith(undefined);
		});
	});
}
