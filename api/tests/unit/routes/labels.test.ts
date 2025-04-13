import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Label } from "../../../src/db/schema"; // Import Label for typing
import type { Env } from "../../../src/index"; // Import Env for context typing
import type { ILabelService } from "../../../src/interfaces/service/label";
import labelsRouter from "../../../src/routes/labels"; // Import the router itself

// --- Mock Service Methods ---
const mockGetLabels = vi.fn();
const mockAssignLabel = vi.fn();
const mockCreateLabel = vi.fn(); // Add mock for createLabel
// --- End Mock Service Methods ---

// Mock LabelService using mocked methods
const mockLabelService: ILabelService = {
	getLabels: mockGetLabels,
	assignLabel: mockAssignLabel,
	createLabel: mockCreateLabel, // Add createLabel to the mock service
};

// Mock the service constructor/instance creation if needed,
// but here we'll inject the mock directly.

describe("Labels Route", () => {
	let app: Hono<{ Bindings: Env }>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = new Hono<{ Bindings: Env }>();

		// Mock the service instance within the route handler's scope
		// This requires adjusting how services are instantiated in the actual route,
		// or using a more advanced mocking technique (e.g., dependency injection container mock).
		// For simplicity, let's assume the route can access a mocked service.
		// A common pattern is to pass service instances during app setup.
		// We'll simulate this by directly using the mock in the test request handler.

		// Mount the router, but intercept calls to use the mock service
		app.use("*", (c, next) => {
			// Inject mock service into context or similar mechanism if possible
			// For this test, we'll rely on the route handler using the globally mocked service
			// This is a simplification; real DI mocking might be needed for complex apps.
			return next();
		});
		// Mount the actual router logic, assuming it can somehow get the service
		// (In real app, service is created inside handler, need to mock dependencies there)
		// Let's refine the test setup: We test the router logic directly.

		// Re-create app and mount router with mocked service accessible
		app = new Hono<{ Bindings: Env }>();
		// Mock dependencies used inside the route handler
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
			LabelService: vi.fn(() => mockLabelService), // Return the mock instance
		}));

		app.route("/api/labels", labelsRouter); // Mount the router we want to test
	});

	describe("GET /api/labels", () => {
		it("全てのラベルを取得し、成功レスポンスを返すこと", async () => {
			const mockLabelsResult = [
				// Use a different name to avoid conflict
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
			mockGetLabels.mockResolvedValue(mockLabelsResult); // Use specific mock

			// Simulate environment for the request
			const mockEnv: Env = { DB: {} as D1Database };

			const res = await app.request("/api/labels", {}, mockEnv);
			// Add type assertion for the response body
			const body = (await res.json()) as {
				success: boolean;
				labels: (Label & { articleCount: number })[];
			};

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			// Dates will be serialized, compare relevant fields or use custom matcher
			expect(body.labels).toHaveLength(mockLabelsResult.length);
			expect(body.labels[0].name).toBe(mockLabelsResult[0].name);
			expect(body.labels[0].articleCount).toBe(
				mockLabelsResult[0].articleCount,
			);
			expect(mockGetLabels).toHaveBeenCalledOnce(); // Check specific mock
		});

		it("サービスでエラーが発生した場合、500エラーレスポンスを返すこと", async () => {
			const error = new Error("Service error");
			mockGetLabels.mockRejectedValue(error); // Use specific mock

			const mockEnv: Env = { DB: {} as D1Database };
			const res = await app.request("/api/labels", {}, mockEnv);
			// Add type assertion for the error response body
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(500);
			expect(body.success).toBe(false);
			expect(body.message).toBe("Failed to fetch labels");
			expect(mockGetLabels).toHaveBeenCalledOnce(); // Check specific mock
		});
	});

	describe("POST /api/labels", () => {
		const newLabelName = "new-label";
		const createdLabel: Label = {
			id: 3,
			name: newLabelName, // Assume normalization happens in service
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
					body: JSON.stringify({}), // Missing name
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
					body: JSON.stringify({ name: "  " }), // Empty after trim
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(400);
			expect(body.success).toBe(false);
			expect(body.message).toContain("name is required");
			expect(mockCreateLabel).not.toHaveBeenCalled();
		});

		// このテストケースは、ルートハンドラーのバリデーションによってカバーされるため、
		// "リクエストボディのnameが空文字列の場合" のテストケースと実質的に同じ。
		// サービスが呼び出されないことを確認する。
		it("サービス呼び出し前にラベル名が空と判断された場合、400エラーレスポンスを返すこと", async () => {
			// mockCreateLabel が呼び出されないことを確認するため、ここではモック設定は不要

			const res = await app.request(
				"/api/labels",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: " " }), // Will be empty after normalization
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(400);
			expect(body.success).toBe(false);
			expect(body.message).toBe(
				"name is required and must be a non-empty string",
			);
			// ルートハンドラーのバリデーションで弾かれるため、サービスは呼び出されない
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
});
