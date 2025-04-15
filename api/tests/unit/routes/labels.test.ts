import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Label } from "../../../src/db/schema";
import type { Env } from "../../../src/index";
import type { ILabelService } from "../../../src/interfaces/service/label";
import labelsRouter from "../../../src/routes/labels";

const mockGetLabels = vi
	.fn()
	.mockImplementation(
		(): ReturnType<ILabelService["getLabels"]> => Promise.resolve([]),
	);
const mockAssignLabel = vi
	.fn()
	.mockImplementation(
		(
			articleId: number,
			labelName: string,
		): ReturnType<ILabelService["assignLabel"]> => Promise.resolve({} as Label),
	);
const mockCreateLabel = vi
	.fn()
	.mockImplementation(
		(name: string): ReturnType<ILabelService["createLabel"]> =>
			Promise.resolve({} as Label),
	);
const mockDeleteLabel = vi
	.fn()
	.mockImplementation(
		(id: number): ReturnType<ILabelService["deleteLabel"]> => Promise.resolve(),
	);

const mockLabelService: ILabelService = {
	getLabels: mockGetLabels,
	assignLabel: mockAssignLabel,
	createLabel: mockCreateLabel,
	deleteLabel: mockDeleteLabel,
};

describe("Labels Route", () => {
	let app: Hono<{ Bindings: Env }>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = new Hono<{ Bindings: Env }>();

		vi.mock("../../../src/repositories/label", () => ({
			LabelRepository: vi.fn(),
		}));
		vi.mock("../../../src/repositories/articleLabel", () => ({
			ArticleLabelRepository: vi.fn(),
		}));
		vi.mock("../../../src/repositories/bookmark", () => ({
			DrizzleBookmarkRepository: vi.fn(),
		}));
		vi.mock("../../../src/services/label", () => ({
			LabelService: vi.fn(() => mockLabelService),
		}));

		app.route("/api/labels", labelsRouter);
	});

	describe("GET /api/labels", () => {
		it("全てのラベルを取得し、成功レスポンスを返すこと", async () => {
			const mockLabelsResult = [
				{
					id: 1,
					name: "go",
					createdAt: new Date(),
					updatedAt: new Date(),
					articleCount: 5,
				},
				{
					id: 2,
					name: "typescript",
					createdAt: new Date(),
					updatedAt: new Date(),
					articleCount: 10,
				},
			];
			mockGetLabels.mockResolvedValue(mockLabelsResult);

			const mockEnv: Env = { DB: {} as D1Database };
			const res = await app.request("/api/labels", {}, mockEnv);
			const body = (await res.json()) as {
				success: boolean;
				labels: (Label & { articleCount: number })[];
			};

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.labels).toHaveLength(mockLabelsResult.length);
			expect(body.labels[0].name).toBe(mockLabelsResult[0].name);
			expect(body.labels[0].articleCount).toBe(
				mockLabelsResult[0].articleCount,
			);
			expect(mockGetLabels).toHaveBeenCalledOnce();
		});

		it("サービスでエラーが発生した場合、500エラーレスポンスを返すこと", async () => {
			const error = new Error("Service error");
			mockGetLabels.mockRejectedValue(error);

			const mockEnv: Env = { DB: {} as D1Database };
			const res = await app.request("/api/labels", {}, mockEnv);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(500);
			expect(body.success).toBe(false);
			expect(body.message).toBe("Failed to fetch labels");
			expect(mockGetLabels).toHaveBeenCalledOnce();
		});
	});

	describe("POST /api/labels", () => {
		const newLabelName = "new-label";
		const createdLabel: Label = {
			id: 3,
			name: newLabelName,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		const mockEnv: Env = { DB: {} as D1Database };

		it("新しいラベルを作成し、成功レスポンス（201）を返すこと", async () => {
			mockCreateLabel.mockResolvedValue(createdLabel);

			const res = await app.request(
				"/api/labels",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: newLabelName }),
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; label: Label };

			expect(res.status).toBe(201);
			expect(body.success).toBe(true);
			expect(body.label.name).toBe(createdLabel.name);
			expect(body.label.id).toBe(createdLabel.id);
			expect(mockCreateLabel).toHaveBeenCalledWith(newLabelName);
		});

		it("リクエストボディにnameがない場合、400エラーレスポンスを返すこと", async () => {
			const res = await app.request(
				"/api/labels",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({}),
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(400);
			expect(body.success).toBe(false);
			expect(body.message).toContain("name is required");
			expect(mockCreateLabel).not.toHaveBeenCalled();
		});

		it("リクエストボディのnameが空文字列の場合、400エラーレスポンスを返すこと", async () => {
			const res = await app.request(
				"/api/labels",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: "  " }),
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(400);
			expect(body.success).toBe(false);
			expect(body.message).toContain("name is required");
			expect(mockCreateLabel).not.toHaveBeenCalled();
		});

		it("サービスでラベルが既に存在すると判断された場合、409エラーレスポンスを返すこと", async () => {
			const error = new Error(`Label "${newLabelName}" already exists`);
			mockCreateLabel.mockRejectedValue(error);

			const res = await app.request(
				"/api/labels",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: newLabelName }),
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(409);
			expect(body.success).toBe(false);
			expect(body.message).toBe(error.message);
			expect(mockCreateLabel).toHaveBeenCalledWith(newLabelName);
		});

		it("サービスで予期せぬエラーが発生した場合、500エラーレスポンスを返すこと", async () => {
			const error = new Error("Database connection failed");
			mockCreateLabel.mockRejectedValue(error);

			const res = await app.request(
				"/api/labels",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: newLabelName }),
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(500);
			expect(body.success).toBe(false);
			expect(body.message).toBe("Failed to create label");
			expect(mockCreateLabel).toHaveBeenCalledWith(newLabelName);
		});
	});

	describe("DELETE /api/labels/:id", () => {
		const mockEnv: Env = { DB: {} as D1Database };
		const labelId = 1;

		it("ラベルを削除し、成功レスポンスを返すこと", async () => {
			mockDeleteLabel.mockResolvedValue(undefined);

			const res = await app.request(
				`/api/labels/${labelId}`,
				{
					method: "DELETE",
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.message).toBe("Label deleted successfully");
			expect(mockDeleteLabel).toHaveBeenCalledWith(labelId);
		});

		it("不正なID形式の場合、400エラーレスポンスを返すこと", async () => {
			const res = await app.request(
				"/api/labels/invalid-id",
				{
					method: "DELETE",
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(400);
			expect(body.success).toBe(false);
			expect(body.message).toBe("Invalid label ID");
			expect(mockDeleteLabel).not.toHaveBeenCalled();
		});

		it("存在しないラベルの場合、404エラーレスポンスを返すこと", async () => {
			const error = new Error(`Label with id ${labelId} not found`);
			mockDeleteLabel.mockRejectedValue(error);

			const res = await app.request(
				`/api/labels/${labelId}`,
				{
					method: "DELETE",
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.message).toBe("Label not found");
			expect(mockDeleteLabel).toHaveBeenCalledWith(labelId);
		});

		it("サービスでエラーが発生した場合、500エラーレスポンスを返すこと", async () => {
			const error = new Error("Database connection failed");
			mockDeleteLabel.mockRejectedValue(error);

			const res = await app.request(
				`/api/labels/${labelId}`,
				{
					method: "DELETE",
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(500);
			expect(body.success).toBe(false);
			expect(body.message).toBe("Failed to delete label");
			expect(mockDeleteLabel).toHaveBeenCalledWith(labelId);
		});
	});
});
