/**
 * Toast通知用のオプション型定義
 * 各種フックでToast通知を使用する際の共通インターフェース
 */

export interface ToastOptions {
	showToast: (options: {
		type: "success" | "error" | "info";
		message: string;
		duration?: number;
	}) => void;
}
