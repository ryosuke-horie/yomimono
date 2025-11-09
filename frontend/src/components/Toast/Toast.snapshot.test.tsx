import { render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import type { ToastMessage } from "@/types/toast";
import { Toast } from "./Toast";

describe("Toast snapshot", () => {
	test("success toastの基本レイアウトをスナップショット検証する", () => {
		const toast: ToastMessage = {
			id: "snapshot-success",
			type: "success",
			message: "保存が完了しました",
		};

		const { container } = render(<Toast toast={toast} onClose={vi.fn()} />);

		expect(container).toMatchSnapshot();
	});

	test("各タイプのトーストをまとめてスナップショットで検証する", () => {
		const toasts: ToastMessage[] = [
			{
				id: "snapshot-error",
				type: "error",
				message: "送信に失敗しました",
			},
			{
				id: "snapshot-warning",
				type: "warning",
				message: "注意が必要です",
			},
			{
				id: "snapshot-info",
				type: "info",
				message: "追加の情報があります",
			},
		];

		const { container } = render(
			toasts.map((toast) => (
				<Toast key={toast.id} toast={toast} onClose={vi.fn()} />
			)),
		);

		expect(container).toMatchSnapshot();
	});
});
