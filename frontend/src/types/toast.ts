export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
	id: string;
	type: ToastType;
	message: string;
	duration?: number;
}

export interface ToastOptions {
	type: ToastType;
	message: string;
	duration?: number;
}

export interface ToastContextValue {
	showToast: (options: ToastOptions) => void;
	hideToast: (id: string) => void;
}

export interface ToastProviderProps {
	children: React.ReactNode;
}

export interface ToastProps {
	toast: ToastMessage;
	onClose: (id: string) => void;
}

export interface ToastContainerProps {
	toasts: ToastMessage[];
	onClose: (id: string) => void;
}

export interface QueryToastOptions {
	showToast: (options: ToastOptions) => void;
}
