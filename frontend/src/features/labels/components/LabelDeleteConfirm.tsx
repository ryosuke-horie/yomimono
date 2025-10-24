"use client";

import { useEffect, useId, useRef } from "react";
import type { Label } from "../types";

interface Props {
	label: Label;
	onConfirm: (id: number) => void;
	onCancel: () => void;
	isDeleting?: boolean;
	error?: Error | null;
}

export function LabelDeleteConfirm({
	label,
	onConfirm,
	onCancel,
	isDeleting = false,
	error = null,
}: Props) {
	const dialogRef = useRef<HTMLDivElement>(null);
	const modalHeadlineId = useId();

	// ESCキーでモーダルを閉じる
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onCancel();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [onCancel]);

	// モーダルが開いたらフォーカスをトラップする
	useEffect(() => {
		// フォーカス可能な要素を取得
		const focusableElements = dialogRef.current?.querySelectorAll(
			'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
		) as NodeListOf<HTMLElement>;

		if (focusableElements && focusableElements.length > 0) {
			// 最初の要素にフォーカスを当てる
			focusableElements[0].focus();
		}
	}, []);

	const handleConfirm = () => {
		onConfirm(label.id);
	};

	// キーボードイベントハンドラー
	const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			onCancel();
		}
	};

	const handleDialogKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.stopPropagation();
		}
	};

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			{/* 背景のオーバーレイ - クリックでキャンセル */}
			<button
				type="button"
				className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
				onClick={onCancel}
				onKeyDown={handleOverlayKeyDown}
				aria-label="ダイアログを閉じる"
			>
				<span className="sr-only">ダイアログを閉じます</span>
			</button>

			<div className="flex items-end sm:items-center justify-center min-h-full p-4 text-center sm:p-0">
				{/* モーダルコンテンツ */}
				<div
					ref={dialogRef}
					className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full"
					role="dialog"
					aria-modal="true"
					aria-labelledby={modalHeadlineId}
					onClick={(e) => e.stopPropagation()}
					onKeyDown={handleDialogKeyDown}
				>
					<div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
						<div className="sm:flex sm:items-start">
							<div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
								<svg
									className="h-6 w-6 text-red-600"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
									focusable="false"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
									/>
								</svg>
							</div>
							<div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
								<h3
									className="text-lg leading-6 font-medium text-gray-900"
									id={modalHeadlineId}
								>
									ラベルを削除しますか？
								</h3>
								<div className="mt-2">
									<p className="text-sm text-gray-500">
										ラベル「{label.name}
										」を削除します。この操作は取り消せません。
										{label.articleCount && label.articleCount > 0 ? (
											<span className="block mt-2 text-red-600 font-medium">
												このラベルは現在 {label.articleCount}
												件の記事に使用されています。削除すると、これらの記事からラベルが削除されます。
											</span>
										) : null}
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* エラーメッセージ */}
					{error && (
						<div className="px-4 py-3 bg-red-50 text-red-700 text-sm">
							{error.message}
						</div>
					)}

					<div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
						<button
							type="button"
							onClick={handleConfirm}
							disabled={isDeleting}
							className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isDeleting ? "削除中..." : "削除する"}
						</button>
						<button
							type="button"
							onClick={onCancel}
							disabled={isDeleting}
							className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
						>
							キャンセル
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
