/**
 * Toast通知を管理するカスタムフック
 * Toast通知の表示・非表示を制御する
 */
"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useState } from "react";
import {
	ToastContainer,
	type ToastMessage,
	type ToastType,
} from "@/components/Toast";

interface ToastContextValue {
	showToast: (options: {
		type: ToastType;
		message: string;
		duration?: number;
	}) => void;
	hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
	children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
	const [toasts, setToasts] = useState<ToastMessage[]>([]);

	const showToast = useCallback(
		({
			type,
			message,
			duration = 3000,
		}: {
			type: ToastType;
			message: string;
			duration?: number;
		}) => {
			const id = Date.now().toString();
			const newToast: ToastMessage = {
				id,
				type,
				message,
				duration,
			};

			setToasts((prev) => [...prev, newToast]);
		},
		[],
	);

	const hideToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

	return (
		<ToastContext.Provider value={{ showToast, hideToast }}>
			{children}
			<ToastContainer toasts={toasts} onClose={hideToast} />
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
}

// Vitest unit tests
if (import.meta.vitest) {
	const { describe, test, expect, vi } = import.meta.vitest;
	const { renderHook, act, waitFor } = await import("@testing-library/react");
	const { render, screen } = await import("@testing-library/react");
	const userEvent = (await import("@testing-library/user-event")).default;

	describe("useToast", () => {
		test("ToastProviderなしでuseToastを使用するとエラーが発生する", () => {
			// エラーをキャッチしてテスト
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			expect(() => {
				renderHook(() => useToast());
			}).toThrow("useToast must be used within a ToastProvider");

			consoleSpy.mockRestore();
		});

		test("showToastで新しいToastが表示される", async () => {
			const wrapper = ({ children }: { children: ReactNode }) => (
				<ToastProvider>{children}</ToastProvider>
			);

			const { result } = renderHook(() => useToast(), { wrapper });

			act(() => {
				result.current.showToast({
					type: "success",
					message: "テストメッセージ",
				});
			});

			// ToastProviderを含む完全なコンポーネントをレンダリング
			const TestComponent = () => {
				const { showToast } = useToast();
				return (
					<button
						type="button"
						onClick={() =>
							showToast({ type: "success", message: "ボタンからのメッセージ" })
						}
					>
						Show Toast
					</button>
				);
			};

			render(
				<ToastProvider>
					<TestComponent />
				</ToastProvider>,
			);

			const button = screen.getByText("Show Toast");
			await userEvent.click(button);

			await waitFor(() => {
				expect(screen.getByText("ボタンからのメッセージ")).toBeInTheDocument();
			});
		});

		test("hideToastでToastが非表示になる", async () => {
			const TestComponent = () => {
				const { showToast } = useToast();
				return (
					<button
						type="button"
						onClick={() => {
							// showToast内部でIDが自動生成されるため、この方法では制御できない
							// 代わりに、Toastコンポーネントの閉じるボタンをクリックする
							showToast({
								type: "info",
								message: "閉じるテスト",
								duration: 10000, // 自動で閉じないように長めに設定
							});
						}}
					>
						Show
					</button>
				);
			};

			render(
				<ToastProvider>
					<TestComponent />
				</ToastProvider>,
			);

			const showButton = screen.getByText("Show");
			await userEvent.click(showButton);

			await waitFor(() => {
				expect(screen.getByText("閉じるテスト")).toBeInTheDocument();
			});

			// Toastコンポーネントの閉じるボタンをクリック
			const closeButton = screen.getByLabelText("閉じる");
			await userEvent.click(closeButton);

			await waitFor(() => {
				expect(screen.queryByText("閉じるテスト")).not.toBeInTheDocument();
			});
		});

		test("複数のToastを同時に表示できる", async () => {
			const TestComponent = () => {
				const { showToast } = useToast();
				return (
					<button
						type="button"
						onClick={() => {
							showToast({ type: "success", message: "成功1" });
							showToast({ type: "error", message: "エラー1" });
							showToast({ type: "info", message: "情報1" });
						}}
					>
						Show Multiple
					</button>
				);
			};

			render(
				<ToastProvider>
					<TestComponent />
				</ToastProvider>,
			);

			const button = screen.getByText("Show Multiple");
			await userEvent.click(button);

			await waitFor(() => {
				expect(screen.getByText("成功1")).toBeInTheDocument();
				expect(screen.getByText("エラー1")).toBeInTheDocument();
				expect(screen.getByText("情報1")).toBeInTheDocument();
			});
		});

		test("durationが指定された場合、自動的にToastが非表示になる", async () => {
			vi.useFakeTimers({ shouldAdvanceTime: true });

			const TestComponent = () => {
				const { showToast } = useToast();
				return (
					<button
						type="button"
						onClick={() => {
							showToast({
								type: "info",
								message: "自動で消える",
								duration: 2000,
							});
						}}
					>
						Show Auto Hide
					</button>
				);
			};

			const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

			render(
				<ToastProvider>
					<TestComponent />
				</ToastProvider>,
			);

			const button = screen.getByText("Show Auto Hide");
			await user.click(button);

			await waitFor(() => {
				expect(screen.getByText("自動で消える")).toBeInTheDocument();
			});

			// 2秒経過させる
			await act(async () => {
				vi.advanceTimersByTime(2000);
			});

			await waitFor(() => {
				expect(screen.queryByText("自動で消える")).not.toBeInTheDocument();
			});

			vi.useRealTimers();
		});
	});
}
