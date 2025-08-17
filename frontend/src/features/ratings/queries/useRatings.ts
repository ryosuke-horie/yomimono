/**
 * 評価済み記事一覧を取得するカスタムフック
 */

import { useQuery } from "@tanstack/react-query";

export interface Rating {
	id: number;
	articleId: number;
	practicalValue: number;
	technicalDepth: number;
	understanding: number;
	novelty: number;
	importance: number;
	totalScore: number;
	comment?: string;
	createdAt: string;
	updatedAt: string;
}

export interface Article {
	id: number;
	url: string;
	title: string;
	isRead: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface RatingWithArticle {
	rating: Rating;
	article: Article;
}

async function fetchRatings(): Promise<RatingWithArticle[]> {
	const response = await fetch("/api/ratings");
	if (!response.ok) {
		throw new Error("データの取得に失敗しました");
	}
	return response.json();
}

export function useRatings() {
	return useQuery({
		queryKey: ["ratings"],
		queryFn: fetchRatings,
	});
}

if (import.meta.vitest) {
	const { test, expect, vi } = import.meta.vitest;

	test("useRatings フックが正しくデータを取得する", async () => {
		const mockData: RatingWithArticle[] = [
			{
				rating: {
					id: 1,
					articleId: 123,
					practicalValue: 8,
					technicalDepth: 7,
					understanding: 9,
					novelty: 6,
					importance: 8,
					totalScore: 76,
					comment: "テストコメント",
					createdAt: "2023-01-01T00:00:00Z",
					updatedAt: "2023-01-01T00:00:00Z",
				},
				article: {
					id: 123,
					url: "https://example.com",
					title: "テスト記事",
					isRead: false,
					createdAt: "2023-01-01T00:00:00Z",
					updatedAt: "2023-01-01T00:00:00Z",
				},
			},
		];

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => mockData,
		});

		const result = await fetchRatings();
		expect(result).toEqual(mockData);
	});

	test("useRatings フックがエラーを処理する", async () => {
		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			json: async () => ({}),
		});

		await expect(fetchRatings()).rejects.toThrow("データの取得に失敗しました");
	});
}
