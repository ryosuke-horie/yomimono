/**
 * 本棚一覧コンポーネント
 * ステータス別タブと本のグリッド表示を管理
 */

"use client";

import { useState } from "react";
import type { BookStatus } from "../types";
import { AddBookButton } from "./AddBookButton";
import { BookGrid } from "./BookGrid";
import { StatusTabs } from "./StatusTabs";

export function BookshelfList() {
	const [activeTab, setActiveTab] = useState<BookStatus>("unread");

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<StatusTabs activeTab={activeTab} onTabChange={setActiveTab} />
				<AddBookButton />
			</div>
			<BookGrid status={activeTab} />
		</div>
	);
}
