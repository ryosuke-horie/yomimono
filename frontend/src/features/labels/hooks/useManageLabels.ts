import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
	cleanupUnusedLabels,
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
		}: {
			name: string;
			description?: string;
		}) => createLabel(name, description),
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

	// 未使用ラベルクリーンアップミューテーション
	const cleanupLabelsMutation = useMutation({
		mutationFn: cleanupUnusedLabels,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: labelKeys.lists() });
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

		cleanupUnusedLabels: () => cleanupLabelsMutation.mutate(),
		isCleaningUpLabels: cleanupLabelsMutation.isPending,
		cleanupLabelsError: cleanupLabelsMutation.error,
	};
}
