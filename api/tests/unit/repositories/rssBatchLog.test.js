import { beforeEach, describe, expect, it, vi } from "vitest";
import { RssBatchLogRepository } from "../../../src/repositories/rssBatchLog";
const mockDb = {
	select: vi.fn().mockReturnThis(),
	from: vi.fn().mockReturnThis(),
	where: vi.fn().mockReturnThis(),
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
describe("RssBatchLogRepository", () => {
	let rssBatchLogRepository;
	beforeEach(() => {
		vi.clearAllMocks();
		const mockD1Database = {};
		rssBatchLogRepository = new RssBatchLogRepository(mockD1Database);
	});
	describe("create", () => {
		it("新しいバッチログを作成できる", async () => {
			const newLog = {
				feedId: 1,
				status: "success",
				itemsFetched: 10,
				itemsCreated: 5,
				startedAt: new Date(),
			};
			const expectedLog = {
				id: 1,
				feedId: 1,
				status: "success",
				itemsFetched: 10,
				itemsCreated: 5,
				errorMessage: null,
				startedAt: newLog.startedAt,
				finishedAt: null,
				createdAt: new Date(),
			};
			mockDb.all.mockResolvedValueOnce([expectedLog]);
			const result = await rssBatchLogRepository.create(newLog);
			expect(mockDb.insert).toHaveBeenCalledWith(
				rssBatchLogRepository.rssBatchLogsTable,
			);
			expect(mockDb.values).toHaveBeenCalledWith(newLog);
			expect(mockDb.returning).toHaveBeenCalled();
			expect(result).toEqual(expectedLog);
		});
	});
	describe("update", () => {
		it("バッチログを更新できる", async () => {
			const id = 1;
			const updateData = {
				status: "error",
				errorMessage: "フィードの取得に失敗しました",
				finishedAt: new Date(),
			};
			const updatedLog = {
				id: 1,
				feedId: 1,
				status: "error",
				itemsFetched: 0,
				itemsCreated: 0,
				errorMessage: "フィードの取得に失敗しました",
				startedAt: new Date(),
				finishedAt: updateData.finishedAt,
				createdAt: new Date(),
			};
			mockDb.all.mockResolvedValueOnce([updatedLog]);
			const result = await rssBatchLogRepository.update(id, updateData);
			expect(mockDb.update).toHaveBeenCalledWith(
				rssBatchLogRepository.rssBatchLogsTable,
			);
			expect(mockDb.set).toHaveBeenCalledWith(updateData);
			expect(mockDb.where).toHaveBeenCalled();
			expect(mockDb.returning).toHaveBeenCalled();
			expect(result).toEqual(updatedLog);
		});
	});
	describe("findByFeedId", () => {
		it("フィードIDでバッチログを取得できる", async () => {
			const feedId = 1;
			const expectedLogs = [
				{
					id: 1,
					feedId: 1,
					status: "success",
					itemsFetched: 10,
					itemsCreated: 5,
					errorMessage: null,
					startedAt: new Date(),
					finishedAt: new Date(),
					createdAt: new Date(),
				},
				{
					id: 2,
					feedId: 1,
					status: "error",
					itemsFetched: 0,
					itemsCreated: 0,
					errorMessage: "ネットワークエラー",
					startedAt: new Date(),
					finishedAt: new Date(),
					createdAt: new Date(),
				},
			];
			mockDb.all.mockResolvedValueOnce(expectedLogs);
			const result = await rssBatchLogRepository.findByFeedId(feedId);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalledWith(
				rssBatchLogRepository.rssBatchLogsTable,
			);
			expect(mockDb.where).toHaveBeenCalled();
			expect(mockDb.orderBy).toHaveBeenCalled();
			expect(result).toEqual(expectedLogs);
		});
	});
	describe("findLatestByFeedId", () => {
		it("フィードIDで最新のバッチログを取得できる", async () => {
			const feedId = 1;
			const expectedLog = {
				id: 3,
				feedId: 1,
				status: "success",
				itemsFetched: 15,
				itemsCreated: 8,
				errorMessage: null,
				startedAt: new Date(),
				finishedAt: new Date(),
				createdAt: new Date(),
			};
			mockDb.get.mockResolvedValueOnce(expectedLog);
			const result = await rssBatchLogRepository.findLatestByFeedId(feedId);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalledWith(
				rssBatchLogRepository.rssBatchLogsTable,
			);
			expect(mockDb.where).toHaveBeenCalled();
			expect(mockDb.orderBy).toHaveBeenCalled();
			expect(result).toEqual(expectedLog);
		});
	});
});
