import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Label } from "../../../src/db/schema";
import { LabelRepository } from "../../../src/repositories/label";

const mockDb = {
	select: vi.fn().mockReturnThis(),
	from: vi.fn().mockReturnThis(),
	where: vi.fn().mockReturnThis(),
	leftJoin: vi.fn().mockReturnThis(),
	groupBy: vi.fn().mockReturnThis(),
	orderBy: vi.fn().mockReturnThis(),
	all: vi.fn(),
	get: vi.fn(),
	insert: vi.fn().mockReturnThis(),
	update: vi.fn().mockReturnThis(),
	set: vi.fn().mockReturnThis(),
	values: vi.fn().mockReturnThis(),
	returning: vi.fn().mockReturnThis(),
	delete: vi.fn().mockReturnThis(),
};

vi.mock("drizzle-orm/d1", () => ({
	drizzle: vi.fn(() => mockDb),
}));

describe("LabelRepository", () => {
	let labelRepository: LabelRepository;

	beforeEach(() => {
		vi.clearAllMocks();
		labelRepository = new LabelRepository({} as D1Database);
	});

	describe("findAllWithArticleCount", () => {
		it("全てのラベルとそれに対応する記事数を取得できること", async () => {
			const mockLabels = [
				{
					id: 1,
					name: "go",
					description: "Go言語に関する記事",
					createdAt: new Date(),
					updatedAt: new Date(),
					articleCount: "5",
				},
				{
					id: 2,
					name: "typescript",
					description: "TypeScriptに関する記事",
					createdAt: new Date(),
					updatedAt: new Date(),
					articleCount: "10",
				},
			];
			mockDb.all.mockResolvedValue(mockLabels);

			const result = await labelRepository.findAllWithArticleCount();

			expect(result).toEqual([
				{ ...mockLabels[0], articleCount: 5 },
				{ ...mockLabels[1], articleCount: 10 },
			]);
			expect(mockDb.select).toHaveBeenCalledWith({
				id: expect.anything(),
				name: expect.anything(),
				description: expect.anything(),
				createdAt: expect.anything(),
				updatedAt: expect.anything(),
				articleCount: expect.anything(),
			});
			expect(mockDb.from).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.leftJoin).toHaveBeenCalledTimes(1);
			expect(mockDb.groupBy).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.orderBy).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.all).toHaveBeenCalledOnce();
		});
	});

	describe("findByName", () => {
		it("指定された名前のラベルを取得できること", async () => {
			const mockLabel: Label = {
				id: 1,
				name: "typescript",
				description: "TypeScriptに関する記事",
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			mockDb.get.mockResolvedValue(mockLabel);

			const result = await labelRepository.findByName("typescript");

			expect(result).toEqual(mockLabel);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.where).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.get).toHaveBeenCalledOnce();
		});

		it("指定された名前のラベルが存在しない場合、undefinedを返すこと", async () => {
			mockDb.get.mockResolvedValue(undefined);

			const result = await labelRepository.findByName("nonexistent");

			expect(result).toBeUndefined();
			expect(mockDb.get).toHaveBeenCalledOnce();
		});
	});

	describe("findById", () => {
		it("指定されたIDのラベルを取得できること", async () => {
			const mockLabel: Label = {
				id: 1,
				name: "typescript",
				description: "TypeScriptに関する記事",
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			mockDb.get.mockResolvedValue(mockLabel);

			const result = await labelRepository.findById(1);

			expect(result).toEqual(mockLabel);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.where).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.get).toHaveBeenCalledOnce();
		});

		it("指定されたIDのラベルが存在しない場合、undefinedを返すこと", async () => {
			mockDb.get.mockResolvedValue(undefined);

			const result = await labelRepository.findById(999);

			expect(result).toBeUndefined();
			expect(mockDb.get).toHaveBeenCalledOnce();
		});
	});

	describe("create", () => {
		it("新しいラベルを作成できること", async () => {
			const newLabelData = {
				name: "react",
				description: "Reactに関する記事",
			};
			const createdLabel: Label = {
				id: 3,
				name: newLabelData.name,
				description: newLabelData.description,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			mockDb.get.mockResolvedValue(createdLabel);

			const result = await labelRepository.create(newLabelData);

			expect(result).toEqual(createdLabel);
			expect(mockDb.insert).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.values).toHaveBeenCalledWith(
				expect.objectContaining(newLabelData),
			);
			expect(mockDb.returning).toHaveBeenCalled();
			expect(mockDb.get).toHaveBeenCalledOnce();
		});
	});

	describe("updateDescription", () => {
		it("ラベルの説明文を更新できること", async () => {
			const labelId = 1;
			const newDescription = "更新された説明文";
			const updatedLabel: Label = {
				id: labelId,
				name: "typescript",
				description: newDescription,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			mockDb.get.mockResolvedValue(updatedLabel);

			const result = await labelRepository.updateDescription(
				labelId,
				newDescription,
			);

			expect(result).toEqual(updatedLabel);
			expect(mockDb.update).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.set).toHaveBeenCalledWith(
				expect.objectContaining({
					description: newDescription,
					updatedAt: expect.any(Date),
				}),
			);
			expect(mockDb.where).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.returning).toHaveBeenCalled();
			expect(mockDb.get).toHaveBeenCalledOnce();
		});

		it("nullを指定して説明文を削除できること", async () => {
			const labelId = 1;
			const updatedLabel: Label = {
				id: labelId,
				name: "typescript",
				description: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			mockDb.get.mockResolvedValue(updatedLabel);

			const result = await labelRepository.updateDescription(labelId, null);

			expect(result).toEqual(updatedLabel);
			expect(mockDb.update).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.set).toHaveBeenCalledWith(
				expect.objectContaining({
					description: null,
					updatedAt: expect.any(Date),
				}),
			);
		});

		it("更新対象が存在しない場合、undefinedを返すこと", async () => {
			mockDb.get.mockResolvedValue(undefined);

			const result = await labelRepository.updateDescription(
				999,
				"新しい説明文",
			);

			expect(result).toBeUndefined();
		});
	});

	describe("deleteById", () => {
		it("指定されたIDのラベルを削除できること", async () => {
			// 削除されたレコードをモック
			const deletedLabel: Label = {
				id: 1,
				name: "typescript",
				description: "TypeScriptに関する記事",
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			mockDb.all.mockResolvedValue([deletedLabel]);

			const result = await labelRepository.deleteById(1);

			expect(result).toBe(true);
			expect(mockDb.delete).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.where).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.returning).toHaveBeenCalled();
			expect(mockDb.all).toHaveBeenCalledOnce();
		});

		it("存在しないIDの場合、falseを返すこと", async () => {
			// 削除対象が存在しない場合は空配列を返す
			mockDb.all.mockResolvedValue([]);

			const result = await labelRepository.deleteById(999);

			expect(result).toBe(false);
			expect(mockDb.delete).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.where).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.returning).toHaveBeenCalled();
			expect(mockDb.all).toHaveBeenCalledOnce();
		});
	});
});
