/**
 * Toast通知のプロバイダーコンポーネント
 * アプリケーション全体でToast通知機能を提供する
 */
"use client";

import { createContext, useCallback, useRef, useState } from "react";
import { ToastContainer } from "@/components/Toast";
import type {
	ToastContextValue,
	ToastMessage,
	ToastOptions,
	ToastProviderProps,
} from "@/types/toast";

export const ToastContext = createContext<ToastContextValue | undefined>(
	undefined,
);

export function ToastProvider({ children }: ToastProviderProps) {
	const [toasts, setToasts] = useState<ToastMessage[]>([]);
	const toastIdCounter = useRef(0);

	const showToast = useCallback(
		({ type, message, duration = 3000 }: ToastOptions) => {
			toastIdCounter.current += 1;
			const id = `${Date.now()}-${toastIdCounter.current}`;
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

// Vitest unit tests
if (import.meta.vitest) {
	const { describe, test, expect, vi } = import.meta.vitest;
	const { render, screen } = await import("@testing-library/react");
	const { act, waitFor } = await import("@testing-library/react");
	const userEvent = (await import("@testing-library/user-event")).default;
	const { useContext } = await import("react");

	describe("ToastProvider", () => {
		test("子コンポーネントとToastContainerをレンダリングする", () => {
			render(
				<ToastProvider>
					<div>Test Child</div>
				</ToastProvider>,
			);

			expect(screen.getByText("Test Child")).toBeInTheDocument();
		});

		test("showToastで新しいToastが表示される", async () => {
			const TestComponent = () => {
				const context = useContext(ToastContext);
				if (!context) throw new Error("Context not found");
				const { showToast } = context;
				return (
					<button
						type="button"
						onClick={() =>
							showToast({ type: "success", message: "テストメッセージ" })
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
				expect(screen.getByText("テストメッセージ")).toBeInTheDocument();
			});
		});

		test("hideToastでToastが非表示になる", async () => {
			const TestComponent = () => {
				const context = useContext(ToastContext);
				if (!context) throw new Error("Context not found");
				const { showToast } = context;
				return (
					<button
						type="button"
						onClick={() => {
							showToast({
								type: "info",
								message: "閉じるテスト",
								duration: 10000,
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

			const closeButton = screen.getByLabelText("閉じる");
			await userEvent.click(closeButton);

			await waitFor(() => {
				expect(screen.queryByText("閉じるテスト")).not.toBeInTheDocument();
			});
		});

		test("複数のToastを同時に表示できる", async () => {
			const TestComponent = () => {
				const context = useContext(ToastContext);
				if (!context) throw new Error("Context not found");
				const { showToast } = context;
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
				const context = useContext(ToastContext);
				if (!context) throw new Error("Context not found");
				const { showToast } = context;
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
