/**
 * useManageLabels フックのテスト
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Label } from "../types";
import { useManageLabels } from "./useManageLabels";

// API関数のモック
vi.mock("../queries/api", () => ({
	fetchLabels: vi.fn(),
	createLabel: vi.fn(),
	updateLabelDescription: vi.fn(),
	deleteLabel: vi.fn(),
}));

const mockLabels: Label[] = [
	{ id: 1, name: "技術", description: "技術記事" },
	{ id: 2, name: "ビジネス", description: null },
	{ id: 3, name: "ライフハック", description: "生活の知恵" },
];

describe("useManageLabels", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		vi.clearAllMocks();
	});

	function createWrapper() {
		return ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	}

	test("初期状態: デフォルト値が設定される", () => {
		const { result } = renderHook(() => useManageLabels(), {
			wrapper: createWrapper(),
		});

		expect(result.current.editingLabelId).toBeNull();
		expect(result.current.isCreateFormOpen).toBe(false);
		expect(result.current.deleteConfirmLabelId).toBeNull();
		expect(result.current.getEditingLabel()).toBeUndefined();
		expect(result.current.getDeleteConfirmLabel()).toBeUndefined();
	});

	test("作成フォーム: 開く/閉じる操作", () => {
		const { result } = renderHook(() => useManageLabels(), {
			wrapper: createWrapper(),
		});

		expect(result.current.isCreateFormOpen).toBe(false);

		act(() => {
			result.current.openCreateForm();
		});

		expect(result.current.isCreateFormOpen).toBe(true);

		act(() => {
			result.current.closeCreateForm();
		});

		expect(result.current.isCreateFormOpen).toBe(false);
	});

	test("編集機能: 編集開始/キャンセル操作", async () => {
		// ラベルデータをクエリクライアントに設定
		queryClient.setQueryData(["labels", "list"], mockLabels);

		const { result } = renderHook(() => useManageLabels(), {
			wrapper: createWrapper(),
		});

		expect(result.current.editingLabelId).toBeNull();
		expect(result.current.getEditingLabel()).toBeUndefined();

		act(() => {
			result.current.startEdit(2);
		});

		expect(result.current.editingLabelId).toBe(2);
		expect(result.current.getEditingLabel()).toEqual(mockLabels[1]);

		act(() => {
			result.current.cancelEdit();
		});

		expect(result.current.editingLabelId).toBeNull();
		expect(result.current.getEditingLabel()).toBeUndefined();
	});

	test("削除確認: 削除確認ダイアログ開く/閉じる操作", async () => {
		// ラベルデータをクエリクライアントに設定
		queryClient.setQueryData(["labels", "list"], mockLabels);

		const { result } = renderHook(() => useManageLabels(), {
			wrapper: createWrapper(),
		});

		expect(result.current.deleteConfirmLabelId).toBeNull();
		expect(result.current.getDeleteConfirmLabel()).toBeUndefined();

		act(() => {
			result.current.openDeleteConfirm(3);
		});

		expect(result.current.deleteConfirmLabelId).toBe(3);
		expect(result.current.getDeleteConfirmLabel()).toEqual(mockLabels[2]);

		act(() => {
			result.current.closeDeleteConfirm();
		});

		expect(result.current.deleteConfirmLabelId).toBeNull();
		expect(result.current.getDeleteConfirmLabel()).toBeUndefined();
	});

	test("getEditingLabel: 存在しないIDの場合undefinedを返す", async () => {
		queryClient.setQueryData(["labels", "list"], mockLabels);

		const { result } = renderHook(() => useManageLabels(), {
			wrapper: createWrapper(),
		});

		act(() => {
			result.current.startEdit(999); // 存在しないID
		});

		expect(result.current.editingLabelId).toBe(999);
		expect(result.current.getEditingLabel()).toBeUndefined();
	});

	test("getDeleteConfirmLabel: 存在しないIDの場合undefinedを返す", async () => {
		queryClient.setQueryData(["labels", "list"], mockLabels);

		const { result } = renderHook(() => useManageLabels(), {
			wrapper: createWrapper(),
		});

		act(() => {
			result.current.openDeleteConfirm(999); // 存在しないID
		});

		expect(result.current.deleteConfirmLabelId).toBe(999);
		expect(result.current.getDeleteConfirmLabel()).toBeUndefined();
	});
});
