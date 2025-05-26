/**
 * LabelEditForm コンポーネントの単体テスト
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LabelEditForm } from "./LabelEditForm";

const mockLabel = {
	id: 1,
	name: "JavaScript",
	description: "JavaScript関連の記事",
	createdAt: "2023-01-01T00:00:00Z",
};

describe("LabelEditForm", () => {
	it("ラベル編集フォームが正しくレンダリングされる", () => {
		render(
			<LabelEditForm label={mockLabel} onSubmit={vi.fn()} onCancel={vi.fn()} />,
		);

		expect(screen.getByText("ラベル説明文の編集")).toBeInTheDocument();
		expect(screen.getByText("JavaScript")).toBeInTheDocument();
		expect(screen.getByLabelText("説明文")).toBeInTheDocument();
	});

	it("説明文の初期値が正しく設定される", () => {
		render(
			<LabelEditForm label={mockLabel} onSubmit={vi.fn()} onCancel={vi.fn()} />,
		);

		const textarea = screen.getByLabelText("説明文") as HTMLTextAreaElement;
		expect(textarea.value).toBe("JavaScript関連の記事");
	});

	it("送信中状態でボタンが無効化される", () => {
		render(
			<LabelEditForm
				label={mockLabel}
				onSubmit={vi.fn()}
				onCancel={vi.fn()}
				isSubmitting={true}
			/>,
		);

		expect(screen.getByText("保存中...")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "保存中..." })).toBeDisabled();
		expect(screen.getByRole("button", { name: "キャンセル" })).toBeDisabled();
	});
});
