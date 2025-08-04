/**
 * 本棚一覧コンポーネント
 * ステータス別タブと本のグリッド表示を管理
 */

"use client";

import { useState } from "react";
import { useGetBooks } from "../queries/useGetBooks";
import { BookStatus, type BookStatusValue } from "../types";
import { AddBookButton } from "./AddBookButton";
import { BookGrid } from "./BookGrid";
import { StatusTabs } from "./StatusTabs";

export function BookshelfList() {
	const [currentStatus, setCurrentStatus] = useState<
		BookStatusValue | undefined
	>(undefined);
	const { data: books = [] } = useGetBooks(currentStatus);

	// 統計情報を計算
	const stats = {
		total: books.length,
		unread: books.filter((b) => b.status === BookStatus.UNREAD).length,
		reading: books.filter((b) => b.status === BookStatus.READING).length,
		completed: books.filter((b) => b.status === BookStatus.COMPLETED).length,
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<StatusTabs
					currentStatus={currentStatus}
					onStatusChange={setCurrentStatus}
					stats={stats}
				/>
				<AddBookButton />
			</div>
			{currentStatus && <BookGrid status={currentStatus} />}
		</div>
	);
}
