/**
 * ラベル管理のための包括的なカスタムフック
 * 作成、編集、削除の状態管理とAPI呼び出しを統合
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
	createLabel,
	deleteLabel,
	fetchLabels,
	updateLabelDescription,
} from "../queries/api";
import { labelKeys } from "../queries/queryKeys";
import type { Label } from "../types";

export function useManageLabels() {
	const [editingLabelId, setEditingLabelId] = useState<number | null>(null);
	const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
	const [deleteConfirmLabelId, setDeleteConfirmLabelId] = useState<
		number | null
	>(null);
	const queryClient = useQueryClient();

	// ラベル一覧の取得
	const {
		data: labels = [],
		isLoading: isLoadingLabels,
		error: labelsError,
	} = useQuery<Label[], Error>({
		queryKey: labelKeys.lists(),
		queryFn: fetchLabels,
		staleTime: 1000 * 60 * 5, // 5分間はキャッシュを有効に
	});

	// ラベル作成ミューテーション
	const createLabelMutation = useMutation({
		mutationFn: ({
			name,
			description,
		}: { name: string; description?: string }) =>
			createLabel(name, description),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: labelKeys.lists() });
			setIsCreateFormOpen(false);
		},
	});

	// ラベル説明文更新ミューテーション
	const updateLabelMutation = useMutation({
		mutationFn: ({
			id,
			description,
		}: {
			id: number;
			description: string | null;
		}) => updateLabelDescription(id, description),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: labelKeys.lists() });
			setEditingLabelId(null);
		},
	});

	// ラベル削除ミューテーション
	const deleteLabelMutation = useMutation({
		mutationFn: (id: number) => deleteLabel(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: labelKeys.lists() });
			setDeleteConfirmLabelId(null);
		},
	});

	// 編集開始
	const startEdit = (labelId: number) => {
		setEditingLabelId(labelId);
	};

	// 編集キャンセル
	const cancelEdit = () => {
		setEditingLabelId(null);
	};

	// 作成フォームを開く
	const openCreateForm = () => {
		setIsCreateFormOpen(true);
	};

	// 作成フォームを閉じる
	const closeCreateForm = () => {
		setIsCreateFormOpen(false);
	};

	// 削除確認ダイアログを開く
	const openDeleteConfirm = (labelId: number) => {
		setDeleteConfirmLabelId(labelId);
	};

	// 削除確認ダイアログを閉じる
	const closeDeleteConfirm = () => {
		setDeleteConfirmLabelId(null);
	};

	// 編集中のラベルを取得
	const getEditingLabel = (): Label | undefined => {
		if (editingLabelId === null) return undefined;
		return labels.find((label) => label.id === editingLabelId);
	};

	// 削除確認中のラベルを取得
	const getDeleteConfirmLabel = (): Label | undefined => {
		if (deleteConfirmLabelId === null) return undefined;
		return labels.find((label) => label.id === deleteConfirmLabelId);
	};

	return {
		labels,
		isLoadingLabels,
		labelsError,

		isCreateFormOpen,
		openCreateForm,
		closeCreateForm,
		createLabel: (name: string, description?: string) =>
			createLabelMutation.mutate({ name, description }),
		isCreatingLabel: createLabelMutation.isPending,
		createLabelError: createLabelMutation.error,

		editingLabelId,
		startEdit,
		cancelEdit,
		getEditingLabel,
		updateLabelDescription: (id: number, description: string | null) =>
			updateLabelMutation.mutate({ id, description }),
		isUpdatingLabel: updateLabelMutation.isPending,
		updateLabelError: updateLabelMutation.error,

		deleteConfirmLabelId,
		openDeleteConfirm,
		closeDeleteConfirm,
		getDeleteConfirmLabel,
		deleteLabel: (id: number) => deleteLabelMutation.mutate(id),
		isDeletingLabel: deleteLabelMutation.isPending,
		deleteLabelError: deleteLabelMutation.error,
	};
}

if (import.meta.vitest) {
	const { QueryClient, QueryClientProvider } = await import(
		"@tanstack/react-query"
	);
	const { renderHook, act } = await import("@testing-library/react");
	const { vi, describe, it, expect, beforeEach } = import.meta.vitest;
	const React = await import("react");
	type ReactNode = React.ReactNode;

	// API関数のモック
	vi.mock("../queries/api", () => ({
		createLabel: vi.fn(),
		deleteLabel: vi.fn(),
		fetchLabels: vi.fn(),
		updateLabelDescription: vi.fn(),
	}));

	const createTestWrapper = () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
					staleTime: 0,
					gcTime: 0,
				},
				mutations: {
					retry: false,
				},
			},
		});

		return ({ children }: { children: ReactNode }) => {
			return React.createElement(
				QueryClientProvider,
				{ client: queryClient },
				children,
			);
		};
	};

	describe("useManageLabels", () => {
		let wrapper: ({ children }: { children: ReactNode }) => React.ReactElement;

		beforeEach(() => {
			wrapper = createTestWrapper();
			vi.clearAllMocks();
		});

		it("ラベル管理フックが正しく初期化される", async () => {
			const { fetchLabels } = await import("../queries/api");
			vi.mocked(fetchLabels).mockResolvedValue([]);

			const { result } = renderHook(() => useManageLabels(), { wrapper });

			expect(result.current.labels).toEqual([]);
			expect(result.current.isCreateFormOpen).toBe(false);
			expect(result.current.editingLabelId).toBe(null);
			expect(result.current.deleteConfirmLabelId).toBe(null);
		});

		it("作成フォームの開閉が正しく動作する", async () => {
			const { fetchLabels } = await import("../queries/api");
			vi.mocked(fetchLabels).mockResolvedValue([]);

			const { result } = renderHook(() => useManageLabels(), { wrapper });

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

		it("編集状態の管理が正しく動作する", async () => {
			const { fetchLabels } = await import("../queries/api");
			vi.mocked(fetchLabels).mockResolvedValue([]);

			const { result } = renderHook(() => useManageLabels(), { wrapper });

			expect(result.current.editingLabelId).toBe(null);

			act(() => {
				result.current.startEdit(1);
			});

			expect(result.current.editingLabelId).toBe(1);

			act(() => {
				result.current.cancelEdit();
			});

			expect(result.current.editingLabelId).toBe(null);
		});

		it("削除確認ダイアログの管理が正しく動作する", async () => {
			const { fetchLabels } = await import("../queries/api");
			vi.mocked(fetchLabels).mockResolvedValue([]);

			const { result } = renderHook(() => useManageLabels(), { wrapper });

			expect(result.current.deleteConfirmLabelId).toBe(null);

			act(() => {
				result.current.openDeleteConfirm(2);
			});

			expect(result.current.deleteConfirmLabelId).toBe(2);

			act(() => {
				result.current.closeDeleteConfirm();
			});

			expect(result.current.deleteConfirmLabelId).toBe(null);
		});
	});
}
