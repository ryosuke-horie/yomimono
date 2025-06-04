/**
 * ラベル関連の型定義
 */
export interface Label {
	id: number;
	name: string;
	description?: string | null;
	articleCount?: number;
	createdAt?: string;
	updatedAt?: string;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe("Label型", () => {
		it("Label型のプロパティが正しく定義されている", () => {
			const label: Label = {
				id: 1,
				name: "テストラベル",
				description: "説明文",
				articleCount: 5,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};
			expect(label.id).toBe(1);
			expect(label.name).toBe("テストラベル");
			expect(label.description).toBe("説明文");
		});

		it("Label型のオプションプロパティが正しく動作する", () => {
			const minimalLabel: Label = {
				id: 2,
				name: "最小ラベル",
			};
			expect(minimalLabel.id).toBe(2);
			expect(minimalLabel.description).toBeUndefined();
		});
	});
}
