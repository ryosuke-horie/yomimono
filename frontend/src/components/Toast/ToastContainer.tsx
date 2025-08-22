/**
 * Toast通知のコンテナコンポーネント
 * 複数のToast通知を管理し、画面右上に表示する
 */
"use client";

import type { ToastContainerProps } from "@/types/toast";
import { Toast } from "./Toast";

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
	if (toasts.length === 0) return null;

	return (
		<div
			className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full sm:max-w-md"
			style={{
				// コンテナ全体のスムーズな高さ変化
				transition: "height 0.3s ease-out",
			}}
		>
			{toasts.map((toast, index) => (
				<div
					key={toast.id}
					style={{
						// 複数のToast表示時にずらしたアニメーション
						animationDelay: `${index * 50}ms`,
					}}
				>
					<Toast toast={toast} onClose={onClose} />
				</div>
			))}
		</div>
	);
}
