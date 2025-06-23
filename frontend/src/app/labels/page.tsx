"use client";

import { LabelCleanup } from "@/features/labels/components/LabelCleanup";
import { LabelCreateForm } from "@/features/labels/components/LabelCreateForm";
import { LabelDeleteConfirm } from "@/features/labels/components/LabelDeleteConfirm";
import { LabelEditForm } from "@/features/labels/components/LabelEditForm";
import { LabelList } from "@/features/labels/components/LabelList";
import { useManageLabels } from "@/features/labels/hooks/useManageLabels";

export default function LabelsPage() {
	const {
		labels,
		isLoadingLabels,
		labelsError,

		isCreateFormOpen,
		openCreateForm,
		closeCreateForm,
		createLabel,
		isCreatingLabel,
		createLabelError,

		editingLabelId: _editingLabelId,
		startEdit,
		cancelEdit,
		getEditingLabel,
		updateLabelDescription,
		isUpdatingLabel,
		updateLabelError,

		deleteConfirmLabelId: _deleteConfirmLabelId,
		openDeleteConfirm,
		closeDeleteConfirm,
		getDeleteConfirmLabel,
		deleteLabel,
		isDeletingLabel,
		deleteLabelError,

		cleanupUnusedLabels,
		isCleaningUpLabels,
		cleanupLabelsError,
	} = useManageLabels();

	const editingLabel = getEditingLabel();
	const deleteConfirmLabel = getDeleteConfirmLabel();

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-2xl font-bold text-gray-900">ラベル設定</h1>
				<button
					type="button"
					onClick={openCreateForm}
					className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-4 w-4 mr-2"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 6v6m0 0v6m0-6h6m-6 0H6"
						/>
					</svg>
					新しいラベルを作成
				</button>
			</div>

			{isLoadingLabels ? (
				<div className="text-center py-8">
					<div className="inline-block animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full" />
					<p className="mt-2 text-gray-600">ラベルを読み込み中...</p>
				</div>
			) : labelsError ? (
				<div className="bg-red-50 p-4 rounded-md text-red-700 mb-4">
					<p className="font-medium">ラベルの読み込みに失敗しました</p>
					<p className="text-sm mt-1">{labelsError.message}</p>
				</div>
			) : (
				<>
					{/* ラベル作成フォーム */}
					{isCreateFormOpen && (
						<LabelCreateForm
							onSubmit={(name, description) => createLabel(name, description)}
							onCancel={closeCreateForm}
							isSubmitting={isCreatingLabel}
							error={createLabelError}
						/>
					)}

					{/* ラベル編集フォーム */}
					{editingLabel && (
						<LabelEditForm
							label={editingLabel}
							onSubmit={(id, description) =>
								updateLabelDescription(id, description)
							}
							onCancel={cancelEdit}
							isSubmitting={isUpdatingLabel}
							error={updateLabelError}
						/>
					)}

					{/* 未使用ラベルクリーンアップ */}
					<LabelCleanup
						labels={labels}
						onCleanup={cleanupUnusedLabels}
						isLoading={isCleaningUpLabels}
						error={cleanupLabelsError}
					/>

					{/* ラベル一覧 */}
					<div className="bg-white rounded-lg shadow-md p-1">
						<div className="p-4 border-b border-gray-200">
							<h2 className="text-lg font-medium text-gray-900">
								登録済みラベル一覧
							</h2>
							<p className="text-sm text-gray-500 mt-1">
								ラベルの説明文は、MCPによる自動ラベリングの参考になります。
							</p>
						</div>
						<LabelList
							labels={labels}
							onEdit={startEdit}
							onDelete={openDeleteConfirm}
						/>
					</div>

					{/* 削除確認モーダル */}
					{deleteConfirmLabel && (
						<LabelDeleteConfirm
							label={deleteConfirmLabel}
							onConfirm={deleteLabel}
							onCancel={closeDeleteConfirm}
							isDeleting={isDeletingLabel}
							error={deleteLabelError}
						/>
					)}
				</>
			)}
		</div>
	);
}
