/**
 * 開発環境用のモックデータ
 * 本番環境では使用しない
 */

import type { Book } from "../types";

export const mockBooks: Book[] = [
	{
		id: 1,
		title: "Clean Code",
		status: "reading",
		type: "book",
		url: null,
		imageUrl: null,
		progress: 30,
		completedAt: null,
		createdAt: "2024-01-01",
		updatedAt: "2024-01-15",
	},
	{
		id: 2,
		title: "TypeScript Deep Dive",
		status: "unread",
		type: "pdf",
		url: null,
		imageUrl: null,
		progress: 0,
		completedAt: null,
		createdAt: "2024-01-05",
		updatedAt: "2024-01-05",
	},
	{
		id: 3,
		title: "React Patterns",
		status: "completed",
		type: "github",
		url: null,
		imageUrl: null,
		progress: 100,
		completedAt: "2024-01-20",
		createdAt: "2024-01-10",
		updatedAt: "2024-01-20",
	},
];

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test("モックデータが正しい形式である", () => {
		expect(mockBooks).toHaveLength(3);
		expect(mockBooks[0]).toHaveProperty("id");
		expect(mockBooks[0]).toHaveProperty("title");
		expect(mockBooks[0]).toHaveProperty("status");
	});
}
