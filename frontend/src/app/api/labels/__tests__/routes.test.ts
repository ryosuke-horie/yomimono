import { afterEach, describe, expect, it, vi, type Mock } from "vitest";
import { fetchFromApi } from "@/lib/bff/client";
import { GET as getLabels, POST as createLabel } from "../route";
import { GET as getLabel, PATCH as updateLabel, DELETE as deleteLabel } from "../[id]/route";
import { DELETE as cleanupLabels } from "../cleanup/route";
import type { NextRequest } from "next/server";
import type {
	LabelsResponse,
	LabelResponse,
	MessageResponse,
	LabelCleanupResponse,
} from "@/lib/openapi/server/schemas";

vi.mock("@/lib/bff/client", () => ({
	fetchFromApi: vi.fn(),
}));

const mockedFetchFromApi = fetchFromApi as unknown as Mock;

afterEach(() => {
	vi.clearAllMocks();
});

describe("labels route handlers", () => {
	describe("GET /api/labels", () => {
		it("正常にラベル一覧を取得できる", async () => {
			const mockData: LabelsResponse = {
				labels: [
					{ id: 1, name: "tech", color: "#000000", count: 10 },
					{ id: 2, name: "news", color: "#ff0000", count: 5 },
				],
			};

			mockedFetchFromApi.mockResolvedValueOnce({
				data: mockData,
				status: 200,
			});

			const response = await getLabels();
			const json = await response.json();

			expect(mockedFetchFromApi).toHaveBeenCalledWith("/api/labels");
			expect(response.status).toBe(200);
			expect(json).toEqual(mockData);
		});
	});

	describe("POST /api/labels", () => {
		it("正常にラベルを作成できる", async () => {
			const mockData: LabelResponse = {
				label: { id: 1, name: "tech", color: "#000000", count: 0 },
			};
			const requestBody = { name: "tech", color: "#000000" };

			mockedFetchFromApi.mockResolvedValueOnce({
				data: mockData,
				status: 201,
			});

			const request = new Request("http://localhost/api/labels", {
				method: "POST",
				body: JSON.stringify(requestBody),
			}) as unknown as NextRequest;

			const response = await createLabel(request);
			const json = await response.json();

			expect(mockedFetchFromApi).toHaveBeenCalledWith(
				"/api/labels",
				expect.objectContaining({
					method: "POST",
					body: requestBody,
				}),
			);
			expect(response.status).toBe(201);
			expect(json).toEqual(mockData);
		});

		it("不正なJSONの場合は400エラー", async () => {
			const request = new Request("http://localhost/api/labels", {
				method: "POST",
				body: "{ invalid json",
			}) as unknown as NextRequest;

			const response = await createLabel(request);
			
			expect(response.status).toBe(400);
			const json = await response.json();
			expect(json.code).toBe("BAD_REQUEST");
		});
	});

	describe("GET /api/labels/[id]", () => {
		it("指定したIDのラベルを取得できる", async () => {
			const mockData: LabelResponse = {
				label: { id: 1, name: "tech", color: "#000000", count: 10 },
			};

			mockedFetchFromApi.mockResolvedValueOnce({
				data: mockData,
				status: 200,
			});

			const params = Promise.resolve({ id: "1" });
			const request = new Request("http://localhost/api/labels/1") as unknown as NextRequest;
			
			const response = await getLabel(request, { params });
			const json = await response.json();

			expect(mockedFetchFromApi).toHaveBeenCalledWith("/api/labels/1");
			expect(response.status).toBe(200);
			expect(json).toEqual(mockData);
		});

		it("不正なIDの場合は400エラー", async () => {
			const params = Promise.resolve({ id: "invalid" });
			const request = new Request("http://localhost/api/labels/invalid") as unknown as NextRequest;

			const response = await getLabel(request, { params });
			
			expect(response.status).toBe(400);
			const json = await response.json();
			expect(json.code).toBe("BAD_REQUEST");
		});
	});

	describe("PATCH /api/labels/[id]", () => {
		it("正常にラベルを更新できる", async () => {
			const mockData: LabelResponse = {
				label: { id: 1, name: "updated", color: "#ffffff", count: 10 },
			};
			const requestBody = { name: "updated", color: "#ffffff" };

			mockedFetchFromApi.mockResolvedValueOnce({
				data: mockData,
				status: 200,
			});

			const params = Promise.resolve({ id: "1" });
			const request = new Request("http://localhost/api/labels/1", {
				method: "PATCH",
				body: JSON.stringify(requestBody),
			}) as unknown as NextRequest;

			const response = await updateLabel(request, { params });
			const json = await response.json();

			expect(mockedFetchFromApi).toHaveBeenCalledWith(
				"/api/labels/1",
				expect.objectContaining({
					method: "PATCH",
					body: requestBody,
				}),
			);
			expect(response.status).toBe(200);
			expect(json).toEqual(mockData);
		});
	});

	describe("DELETE /api/labels/[id]", () => {
		it("正常にラベルを削除できる", async () => {
			const mockData: MessageResponse = {
				message: "Label deleted successfully",
			};

			mockedFetchFromApi.mockResolvedValueOnce({
				data: mockData,
				status: 200,
			});

			const params = Promise.resolve({ id: "1" });
			const request = new Request("http://localhost/api/labels/1", {
				method: "DELETE",
			}) as unknown as NextRequest;

			const response = await deleteLabel(request, { params });
			const json = await response.json();

			expect(mockedFetchFromApi).toHaveBeenCalledWith(
				"/api/labels/1",
				expect.objectContaining({
					method: "DELETE",
				}),
			);
			expect(response.status).toBe(200);
			expect(json).toEqual(mockData);
		});
	});

	describe("DELETE /api/labels/cleanup", () => {
		it("未使用ラベルを一括削除できる", async () => {
			const mockData: LabelCleanupResponse = {
				message: "Cleanup successful",
				deletedCount: 5,
			};

			mockedFetchFromApi.mockResolvedValueOnce({
				data: mockData,
				status: 200,
			});

			const response = await cleanupLabels();
			const json = await response.json();

			expect(mockedFetchFromApi).toHaveBeenCalledWith(
				"/api/labels/cleanup",
				expect.objectContaining({
					method: "DELETE",
				}),
			);
			expect(response.status).toBe(200);
			expect(json).toEqual(mockData);
		});
	});
});
