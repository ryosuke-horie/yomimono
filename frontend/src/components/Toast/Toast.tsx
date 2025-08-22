/**
 * Toast通知コンポーネント
 * 画面上部に表示される一時的な通知メッセージ
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import {
	FiAlertCircle,
	FiAlertTriangle,
	FiCheckCircle,
	FiInfo,
	FiX,
} from "react-icons/fi";
import type { ToastProps, ToastType } from "@/types/toast";

// アニメーション時間の定数（CSSと同期）
const ANIMATION_DURATION = 300;

const getToastStyles = (type: ToastType) => {
	switch (type) {
		case "success":
			return "bg-green-500 text-white";
		case "error":
			return "bg-red-500 text-white";
		case "warning":
			return "bg-yellow-500 text-gray-800";
		case "info":
			return "bg-blue-500 text-white";
		default:
			return "bg-gray-500 text-white";
	}
};

const getToastIcon = (type: ToastType) => {
	switch (type) {
		case "success":
			return <FiCheckCircle className="w-5 h-5" />;
		case "error":
			return <FiAlertCircle className="w-5 h-5" />;
		case "warning":
			return <FiAlertTriangle className="w-5 h-5" />;
		case "info":
			return <FiInfo className="w-5 h-5" />;
		default:
			return null;
	}
};

export function Toast({ toast, onClose }: ToastProps) {
	const [isClosing, setIsClosing] = useState(false);

	const handleClose = useCallback(() => {
		setIsClosing(true);
		// アニメーション完了後に実際に削除
		setTimeout(() => onClose(toast.id), ANIMATION_DURATION);
	}, [onClose, toast.id]);

	useEffect(() => {
		if (toast.duration) {
			const timer = setTimeout(() => {
				handleClose();
			}, toast.duration);

			return () => clearTimeout(timer);
		}
	}, [toast.duration, handleClose]);

	return (
		<div
			className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
				isClosing ? "animate-toast-slide-out" : "animate-toast-slide-in"
			} ${getToastStyles(toast.type)}`}
			role="alert"
			aria-live="polite"
		>
			{getToastIcon(toast.type)}
			<span className="flex-1">{toast.message}</span>
			<button
				type="button"
				onClick={handleClose}
				className="hover:opacity-80 transition-opacity"
				aria-label="閉じる"
			>
				<FiX className="w-5 h-5" />
			</button>
		</div>
	);
}
