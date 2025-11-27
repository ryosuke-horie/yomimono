import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Label } from "../db/schema";
import { createDrizzleMock, resetDrizzleMock } from "../tests/drizzle.mock";
import { LabelRepository } from "./label";

const { client: mockDbClient, drizzleMock } = createDrizzleMock();

vi.mock("drizzle-orm/d1", () => ({
	drizzle: drizzleMock,
}));

describe("LabelRepository", () => {
	let labelRepository: LabelRepository;

	beforeEach(() => {
		vi.clearAllMocks();
		resetDrizzleMock(mockDbClient);
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
			mockDbClient.all.mockResolvedValue(mockLabels);

			const result = await labelRepository.findAllWithArticleCount();

			expect(result).toEqual([
				{ ...mockLabels[0], articleCount: 5 },
				{ ...mockLabels[1], articleCount: 10 },
			]);
			expect(mockDbClient.select).toHaveBeenCalledWith({
				id: expect.anything(),
				name: expect.anything(),
				description: expect.anything(),
				createdAt: expect.anything(),
				updatedAt: expect.anything(),
				articleCount: expect.anything(),
			});
			expect(mockDbClient.from).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.leftJoin).toHaveBeenCalledTimes(1);
			expect(mockDbClient.groupBy).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.orderBy).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.all).toHaveBeenCalledOnce();
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
			mockDbClient.get.mockResolvedValue(mockLabel);

			const result = await labelRepository.findByName("typescript");

			expect(result).toEqual(mockLabel);
			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.from).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.where).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.get).toHaveBeenCalledOnce();
		});

		it("指定された名前のラベルが存在しない場合、undefinedを返すこと", async () => {
			mockDbClient.get.mockResolvedValue(undefined);

			const result = await labelRepository.findByName("nonexistent");

			expect(result).toBeUndefined();
			expect(mockDbClient.get).toHaveBeenCalledOnce();
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
			mockDbClient.get.mockResolvedValue(mockLabel);

			const result = await labelRepository.findById(1);

			expect(result).toEqual(mockLabel);
			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.from).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.where).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.get).toHaveBeenCalledOnce();
		});

		it("指定されたIDのラベルが存在しない場合、undefinedを返すこと", async () => {
			mockDbClient.get.mockResolvedValue(undefined);

			const result = await labelRepository.findById(999);

			expect(result).toBeUndefined();
			expect(mockDbClient.get).toHaveBeenCalledOnce();
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
			mockDbClient.get.mockResolvedValue(createdLabel);

			const result = await labelRepository.create(newLabelData);

			expect(result).toEqual(createdLabel);
			expect(mockDbClient.insert).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.values).toHaveBeenCalledWith(
				expect.objectContaining(newLabelData),
			);
			expect(mockDbClient.returning).toHaveBeenCalled();
			expect(mockDbClient.get).toHaveBeenCalledOnce();
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
			mockDbClient.get.mockResolvedValue(updatedLabel);

			const result = await labelRepository.updateDescription(
				labelId,
				newDescription,
			);

			expect(result).toEqual(updatedLabel);
			expect(mockDbClient.update).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.set).toHaveBeenCalledWith(
				expect.objectContaining({
					description: newDescription,
					updatedAt: expect.any(Date),
				}),
			);
			expect(mockDbClient.where).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.returning).toHaveBeenCalled();
			expect(mockDbClient.get).toHaveBeenCalledOnce();
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
			mockDbClient.get.mockResolvedValue(updatedLabel);

			const result = await labelRepository.updateDescription(labelId, null);

			expect(result).toEqual(updatedLabel);
			expect(mockDbClient.update).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.set).toHaveBeenCalledWith(
				expect.objectContaining({
					description: null,
					updatedAt: expect.any(Date),
				}),
			);
		});

		it("更新対象が存在しない場合、undefinedを返すこと", async () => {
			mockDbClient.get.mockResolvedValue(undefined);

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
			mockDbClient.all.mockResolvedValue([deletedLabel]);

			const result = await labelRepository.deleteById(1);

			expect(result).toBe(true);
			expect(mockDbClient.delete).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.where).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.returning).toHaveBeenCalled();
			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});

		it("存在しないIDの場合、falseを返すこと", async () => {
			// 削除対象が存在しない場合は空配列を返す
			mockDbClient.all.mockResolvedValue([]);

			const result = await labelRepository.deleteById(999);

			expect(result).toBe(false);
			expect(mockDbClient.delete).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.where).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.returning).toHaveBeenCalled();
			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});
	});

	describe("deleteMany", () => {
		it("指定されたIDsのラベルを一括削除できること", async () => {
			const labelsToDelete = [
				{
					id: 1,
					name: "typescript",
					description: "TypeScriptに関する記事",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					name: "react",
					description: "Reactに関する記事",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];
			mockDbClient.all.mockResolvedValue(labelsToDelete);

			const result = await labelRepository.deleteMany([1, 2]);

			expect(result).toEqual(labelsToDelete);
			expect(mockDbClient.delete).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.where).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.returning).toHaveBeenCalled();
			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});

		it("空の配列を渡した場合、空の配列を返すこと", async () => {
			const result = await labelRepository.deleteMany([]);

			expect(result).toEqual([]);
			expect(mockDbClient.delete).not.toHaveBeenCalled();
			expect(mockDbClient.where).not.toHaveBeenCalled();
			expect(mockDbClient.returning).not.toHaveBeenCalled();
			expect(mockDbClient.all).not.toHaveBeenCalled();
		});

		it("存在しないIDsを指定した場合、空の配列を返すこと", async () => {
			mockDbClient.all.mockResolvedValue([]);

			const result = await labelRepository.deleteMany([999, 998]);

			expect(result).toEqual([]);
			expect(mockDbClient.delete).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.where).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.returning).toHaveBeenCalled();
			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});

		it("一部のIDsが存在しない場合、存在するラベルのみ削除すること", async () => {
			const deletedLabel = {
				id: 1,
				name: "typescript",
				description: "TypeScriptに関する記事",
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			mockDbClient.all.mockResolvedValue([deletedLabel]);

			const result = await labelRepository.deleteMany([1, 999]);

			expect(result).toEqual([deletedLabel]);
			expect(mockDbClient.delete).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.where).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.returning).toHaveBeenCalled();
			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});
	});
});
