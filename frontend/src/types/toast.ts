/**
 * Toast通知に関する型定義
 * Toast通知機能で使用される全ての型を統一的に管理
 */

/**
 * Toast通知のタイプ
 */
export type ToastType = "success" | "error" | "warning" | "info";

/**
 * Toast通知メッセージの構造
 */
export interface ToastMessage {
	/** Toast通知の一意識別子 */
	id: string;
	/** Toast通知のタイプ */
	type: ToastType;
	/** 表示するメッセージ */
	message: string;
	/** 自動非表示までの時間（ミリ秒） */
	duration?: number;
}

/**
 * Toast通知を表示するためのオプション
 */
export interface ToastOptions {
	/** Toast通知のタイプ */
	type: ToastType;
	/** 表示するメッセージ */
	message: string;
	/** 自動非表示までの時間（ミリ秒） */
	duration?: number;
}

/**
 * ToastコンテキストのAPI
 */
export interface ToastContextValue {
	/** Toast通知を表示する */
	showToast: (options: ToastOptions) => void;
	/** Toast通知を非表示にする */
	hideToast: (id: string) => void;
}

/**
 * ToastProviderのプロパティ
 */
export interface ToastProviderProps {
	children: React.ReactNode;
}

/**
 * Toastコンポーネントのプロパティ
 */
export interface ToastProps {
	/** Toast通知のメッセージ情報 */
	toast: ToastMessage;
	/** Toast通知を閉じる際のコールバック */
	onClose: (id: string) => void;
}

/**
 * ToastContainerコンポーネントのプロパティ
 */
export interface ToastContainerProps {
	/** 表示するToast通知のリスト */
	toasts: ToastMessage[];
	/** Toast通知を閉じる際のコールバック */
	onClose: (id: string) => void;
}

/**
 * QueryフックでToast通知を使用するためのオプション型
 * React Queryのクエリフックで共通的に使用される
 */
export interface QueryToastOptions {
	/** Toast通知を表示する関数 */
	showToast: (options: ToastOptions) => void;
}
