import type {
	Label as OpenApiLabel,
	LabelWithCount as OpenApiLabelWithCount,
} from "@/lib/openapi/browser/schemas";

/**
 * OpenAPI生成型に準拠したラベル型
 */
type LabelArticleCount = Pick<OpenApiLabelWithCount, "articleCount">;

export interface Label
	extends Partial<Omit<OpenApiLabel, "id" | "name">>,
		Partial<LabelArticleCount> {
	id: OpenApiLabel["id"];
	name: OpenApiLabel["name"];
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
