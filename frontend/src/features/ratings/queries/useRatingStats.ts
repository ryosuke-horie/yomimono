/**
 * 評価統計情報を取得するカスタムフック
 */

import { useQuery } from "@tanstack/react-query";

export interface RatingStats {
	totalCount: number;
	averageScore: number;
	averagePracticalValue: number;
	averageTechnicalDepth: number;
	averageUnderstanding: number;
	averageNovelty: number;
	averageImportance: number;
	ratingsWithComments: number;
}

async function fetchRatingStats(): Promise<RatingStats | null> {
	const response = await fetch("/api/ratings/stats");
	if (!response.ok) {
		throw new Error("統計情報の取得に失敗しました");
	}
	const data = await response.json();
	return data.stats || null;
}

export function useRatingStats() {
	return useQuery({
		queryKey: ["ratings", "stats"],
		queryFn: fetchRatingStats,
	});
}

if (import.meta.vitest) {
	const { test, expect, vi } = import.meta.vitest;

	test("useRatingStats フックが正しくデータを取得する", async () => {
		const mockStats: RatingStats = {
			totalCount: 10,
			averageScore: 7.5,
			averagePracticalValue: 7.8,
			averageTechnicalDepth: 7.2,
			averageUnderstanding: 7.9,
			averageNovelty: 6.5,
			averageImportance: 7.6,
			ratingsWithComments: 8,
		};

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ stats: mockStats }),
		});

		const result = await fetchRatingStats();
		expect(result).toEqual(mockStats);
	});

	test("useRatingStats フックが空のデータを処理する", async () => {
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ stats: null }),
		});

		const result = await fetchRatingStats();
		expect(result).toBeNull();
	});

	test("useRatingStats フックがエラーを処理する", async () => {
		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			json: async () => ({}),
		});

		await expect(fetchRatingStats()).rejects.toThrow(
			"統計情報の取得に失敗しました",
		);
	});
}
