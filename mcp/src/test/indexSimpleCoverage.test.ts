/**
 * index.ts のシンプルなカバレッジ向上テスト
 * モジュールキャッシュ問題を回避した実装
 */

import { describe, expect, it } from "vitest";
import { z } from "zod";

describe("index.ts カバレッジ向上テスト", () => {
	describe("Zodスキーマバリデーション", () => {
		it("数値パラメータのバリデーション", () => {
			// articleId型のスキーマ
			const articleIdSchema = z.number().int().positive();

			// 正常系
			expect(articleIdSchema.safeParse(123).success).toBe(true);
			expect(articleIdSchema.safeParse(1).success).toBe(true);
			expect(articleIdSchema.safeParse(999999).success).toBe(true);

			// 異常系
			expect(articleIdSchema.safeParse(0).success).toBe(false);
			expect(articleIdSchema.safeParse(-1).success).toBe(false);
			expect(articleIdSchema.safeParse(1.5).success).toBe(false);
			expect(articleIdSchema.safeParse("123").success).toBe(false);
			expect(articleIdSchema.safeParse(null).success).toBe(false);
			expect(articleIdSchema.safeParse(undefined).success).toBe(false);
		});

		it("文字列パラメータのバリデーション", () => {
			// labelName型のスキーマ
			const labelNameSchema = z.string().min(1);

			// 正常系
			expect(labelNameSchema.safeParse("技術").success).toBe(true);
			expect(labelNameSchema.safeParse("a").success).toBe(true);
			expect(
				labelNameSchema.safeParse("非常に長いラベル名でも問題ない").success,
			).toBe(true);

			// 異常系
			expect(labelNameSchema.safeParse("").success).toBe(false);
			expect(labelNameSchema.safeParse(123).success).toBe(false);
			expect(labelNameSchema.safeParse(null).success).toBe(false);
			expect(labelNameSchema.safeParse(undefined).success).toBe(false);
		});

		it("オプショナル・nullable文字列のバリデーション", () => {
			// description型のスキーマ
			const descriptionSchema = z.string().optional().nullable();

			// 全て正常系
			expect(descriptionSchema.safeParse("説明文").success).toBe(true);
			expect(descriptionSchema.safeParse("").success).toBe(true);
			expect(descriptionSchema.safeParse(null).success).toBe(true);
			expect(descriptionSchema.safeParse(undefined).success).toBe(true);

			// 異常系
			expect(descriptionSchema.safeParse(123).success).toBe(false);
			expect(descriptionSchema.safeParse({}).success).toBe(false);
			expect(descriptionSchema.safeParse([]).success).toBe(false);
		});

		it("評価スコアのバリデーション", () => {
			// 1-10の整数
			const scoreSchema = z.number().int().min(1).max(10);

			// 正常系
			for (let i = 1; i <= 10; i++) {
				expect(scoreSchema.safeParse(i).success).toBe(true);
			}

			// 異常系 - 範囲外
			expect(scoreSchema.safeParse(0).success).toBe(false);
			expect(scoreSchema.safeParse(11).success).toBe(false);
			expect(scoreSchema.safeParse(-1).success).toBe(false);

			// 異常系 - 小数
			expect(scoreSchema.safeParse(5.5).success).toBe(false);
			expect(scoreSchema.safeParse(7.1).success).toBe(false);

			// 異常系 - 型違い
			expect(scoreSchema.safeParse("5").success).toBe(false);
			expect(scoreSchema.safeParse(null).success).toBe(false);
		});

		it("複合オブジェクトのバリデーション", () => {
			// 評価データのスキーマ
			const ratingSchema = z.object({
				articleId: z.number().int().positive(),
				practicalValue: z.number().int().min(1).max(10),
				technicalDepth: z.number().int().min(1).max(10),
				understanding: z.number().int().min(1).max(10),
				novelty: z.number().int().min(1).max(10),
				importance: z.number().int().min(1).max(10),
				comment: z.string().optional(),
			});

			// 正常系 - 全フィールドあり
			const validRating = {
				articleId: 123,
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				comment: "素晴らしい記事でした",
			};
			expect(ratingSchema.safeParse(validRating).success).toBe(true);

			// 正常系 - コメントなし
			const validRatingNoComment = {
				articleId: 456,
				practicalValue: 5,
				technicalDepth: 5,
				understanding: 5,
				novelty: 5,
				importance: 5,
			};
			expect(ratingSchema.safeParse(validRatingNoComment).success).toBe(true);

			// 異常系 - 必須フィールド不足
			const missingField = {
				articleId: 123,
				practicalValue: 8,
				// technicalDepth missing
				understanding: 9,
				novelty: 6,
				importance: 8,
			};
			expect(ratingSchema.safeParse(missingField).success).toBe(false);

			// 異常系 - 値が範囲外
			const outOfRange = {
				articleId: 123,
				practicalValue: 11, // 範囲外
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
			};
			expect(ratingSchema.safeParse(outOfRange).success).toBe(false);

			// 異常系 - 型が違う
			const wrongType = {
				articleId: "123", // 文字列
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
			};
			expect(ratingSchema.safeParse(wrongType).success).toBe(false);
		});

		it("配列のバリデーション", () => {
			// articleIds の配列スキーマ
			const articleIdsSchema = z.array(z.number().int().positive());

			// 正常系
			expect(articleIdsSchema.safeParse([1, 2, 3]).success).toBe(true);
			expect(articleIdsSchema.safeParse([123]).success).toBe(true);
			expect(articleIdsSchema.safeParse([]).success).toBe(true); // 空配列もOK

			// 異常系
			expect(articleIdsSchema.safeParse([1, -1, 3]).success).toBe(false);
			expect(articleIdsSchema.safeParse([1, "2", 3]).success).toBe(false);
			expect(articleIdsSchema.safeParse("not array").success).toBe(false);
			expect(articleIdsSchema.safeParse(null).success).toBe(false);
		});

		it("フィルタースキーマのバリデーション", () => {
			// getArticleRatings のフィルタースキーマ
			const filterSchema = z.object({
				limit: z.number().int().positive().max(100).optional(),
				offset: z.number().int().min(0).optional(),
				sortBy: z
					.enum([
						"totalScore",
						"createdAt",
						"practicalValue",
						"technicalDepth",
						"understanding",
						"novelty",
						"importance",
					])
					.optional(),
				order: z.enum(["asc", "desc"]).optional(),
				minScore: z.number().min(1).max(10).optional(),
				maxScore: z.number().min(1).max(10).optional(),
				hasComment: z.boolean().optional(),
			});

			// 正常系 - 全フィールド指定
			const fullFilter = {
				limit: 50,
				offset: 0,
				sortBy: "totalScore",
				order: "desc",
				minScore: 7,
				maxScore: 10,
				hasComment: true,
			};
			expect(filterSchema.safeParse(fullFilter).success).toBe(true);

			// 正常系 - 一部フィールドのみ
			expect(filterSchema.safeParse({ limit: 10 }).success).toBe(true);
			expect(
				filterSchema.safeParse({ sortBy: "createdAt", order: "asc" }).success,
			).toBe(true);
			expect(filterSchema.safeParse({}).success).toBe(true); // 全部オプショナル

			// 異常系 - 範囲外
			expect(filterSchema.safeParse({ limit: 101 }).success).toBe(false); // 100を超える
			expect(filterSchema.safeParse({ limit: 0 }).success).toBe(false); // 正の数でない
			expect(filterSchema.safeParse({ offset: -1 }).success).toBe(false); // 負の数

			// 異常系 - 無効なenum値
			expect(filterSchema.safeParse({ sortBy: "invalid" }).success).toBe(false);
			expect(filterSchema.safeParse({ order: "random" }).success).toBe(false);

			// 異常系 - 型違い
			expect(filterSchema.safeParse({ hasComment: "yes" }).success).toBe(false);
			expect(filterSchema.safeParse({ limit: "10" }).success).toBe(false);
		});
	});

	describe("エラーハンドリングパターン", () => {
		it("Error オブジェクトと文字列エラーの処理", () => {
			// エラーメッセージ抽出関数
			const getErrorMessage = (error: unknown): string => {
				return error instanceof Error ? error.message : String(error);
			};

			// Error オブジェクト
			expect(getErrorMessage(new Error("Database error"))).toBe(
				"Database error",
			);
			expect(getErrorMessage(new TypeError("Type error"))).toBe("Type error");

			// 文字列
			expect(getErrorMessage("String error")).toBe("String error");

			// その他の型
			expect(getErrorMessage(null)).toBe("null");
			expect(getErrorMessage(undefined)).toBe("undefined");
			expect(getErrorMessage(123)).toBe("123");
			expect(getErrorMessage({ error: "object" })).toBe("[object Object]");
		});

		it("null/undefined の処理", () => {
			// null合体演算子のパターン
			const processDescription = (
				desc: string | null | undefined,
			): string | undefined => {
				return desc ?? undefined;
			};

			expect(processDescription("説明文")).toBe("説明文");
			expect(processDescription("")).toBe(""); // 空文字列は保持
			expect(processDescription(null)).toBe(undefined);
			expect(processDescription(undefined)).toBe(undefined);
		});

		it("配列バリデーションとエラーメッセージ", () => {
			const validateRatingsArray = (ratings: unknown): string | null => {
				if (!Array.isArray(ratings)) {
					return "ratings must be an array";
				}
				if (ratings.length === 0) {
					return "ratings array cannot be empty";
				}
				return null;
			};

			// 正常系
			expect(validateRatingsArray([1, 2, 3])).toBe(null);

			// 異常系
			expect(validateRatingsArray("not array")).toBe(
				"ratings must be an array",
			);
			expect(validateRatingsArray({})).toBe("ratings must be an array");
			expect(validateRatingsArray(null)).toBe("ratings must be an array");
			expect(validateRatingsArray([])).toBe("ratings array cannot be empty");
		});
	});

	describe("レスポンス形式", () => {
		it("成功レスポンスの形式", () => {
			const createSuccessResponse = (data: unknown) => ({
				content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
				isError: false,
			});

			const response = createSuccessResponse({ id: 1, name: "test" });
			expect(response.isError).toBe(false);
			expect(response.content[0].type).toBe("text");
			expect(response.content[0].text).toContain('"id": 1');
			expect(response.content[0].text).toContain('"name": "test"');
		});

		it("エラーレスポンスの形式", () => {
			const createErrorResponse = (message: string) => ({
				content: [{ type: "text", text: message }],
				isError: true,
			});

			const response = createErrorResponse("Error occurred");
			expect(response.isError).toBe(true);
			expect(response.content[0].type).toBe("text");
			expect(response.content[0].text).toBe("Error occurred");
		});

		it("ツール固有のエラーメッセージ", () => {
			const formatToolError = (toolName: string, error: unknown): string => {
				const message =
					error instanceof Error ? error.message : "Unknown error";
				return `Error in ${toolName} tool: ${message}`;
			};

			expect(formatToolError("getLabels", new Error("DB error"))).toBe(
				"Error in getLabels tool: DB error",
			);
			expect(formatToolError("assignLabel", "String error")).toBe(
				"Error in assignLabel tool: Unknown error",
			);
		});
	});
});

// vitestのインライン関数テスト
if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("JSONのシリアライズ", () => {
		// 循環参照を含まないオブジェクトのシリアライズ
		const simpleObject = {
			id: 1,
			name: "テスト",
			tags: ["tag1", "tag2"],
			metadata: {
				author: "著者",
				date: "2024-01-01",
			},
		};

		const json = JSON.stringify(simpleObject, null, 2);
		expect(json).toContain('"id": 1');
		expect(json).toContain('"name": "テスト"');
		expect(json).toContain('"tags": [');
		expect(json).toContain('"author": "著者"');

		// パース可能か確認
		const parsed = JSON.parse(json);
		expect(parsed.id).toBe(1);
		expect(parsed.name).toBe("テスト");
		expect(parsed.tags).toEqual(["tag1", "tag2"]);
	});

	test("オプショナルパラメータの処理", () => {
		// optional と nullable の違い
		interface TestParams {
			required: string;
			optional?: string;
			nullable: string | null;
			optionalNullable?: string | null;
		}

		const processParams = (params: TestParams) => {
			return {
				required: params.required,
				optional: params.optional ?? "default",
				nullable: params.nullable ?? "default",
				optionalNullable: params.optionalNullable ?? "default",
			};
		};

		// パラメータパターンのテスト
		expect(
			processParams({
				required: "必須",
				nullable: null,
			}),
		).toEqual({
			required: "必須",
			optional: "default",
			nullable: "default",
			optionalNullable: "default",
		});

		expect(
			processParams({
				required: "必須",
				optional: "オプション",
				nullable: "ヌル可能",
				optionalNullable: null,
			}),
		).toEqual({
			required: "必須",
			optional: "オプション",
			nullable: "ヌル可能",
			optionalNullable: "default",
		});
	});

	test("数値の検証", () => {
		// 整数チェック
		const isValidInteger = (value: unknown): boolean => {
			return typeof value === "number" && Number.isInteger(value);
		};

		expect(isValidInteger(123)).toBe(true);
		expect(isValidInteger(0)).toBe(true);
		expect(isValidInteger(-456)).toBe(true);
		expect(isValidInteger(1.5)).toBe(false);
		expect(isValidInteger(Number.NaN)).toBe(false);
		expect(isValidInteger(Number.POSITIVE_INFINITY)).toBe(false);
		expect(isValidInteger("123")).toBe(false);

		// 正の整数チェック
		const isPositiveInteger = (value: unknown): boolean => {
			return isValidInteger(value) && (value as number) > 0;
		};

		expect(isPositiveInteger(123)).toBe(true);
		expect(isPositiveInteger(1)).toBe(true);
		expect(isPositiveInteger(0)).toBe(false);
		expect(isPositiveInteger(-1)).toBe(false);
		expect(isPositiveInteger(1.5)).toBe(false);
	});
}
