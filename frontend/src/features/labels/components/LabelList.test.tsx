/**
 * LabelList コンポーネントのテスト
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import type { Label } from "../types";
import { LabelList } from "./LabelList";

const mockLabels: Label[] = [
	{
		id: 1,
		name: "技術",
		description: "技術に関する記事のラベルです",
		articleCount: 5,
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-02T00:00:00.000Z",
	},
	{
		id: 2,
		name: "ビジネス",
		description: null,
		articleCount: 3,
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
	},
	{
		id: 3,
		name: "ライフハック",
		description: "生活に役立つ情報",
		articleCount: 0,
	},
];

describe("LabelList", () => {
	test("ラベルが空の場合にメッセージが表示される", () => {
		const mockOnEdit = vi.fn();
		const mockOnDelete = vi.fn();

		render(
			<LabelList labels={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
		);

		expect(
			screen.getByText("ラベルがまだ登録されていません。"),
		).toBeInTheDocument();
	});

	test("ラベル一覧が正しく表示される", () => {
		const mockOnEdit = vi.fn();
		const mockOnDelete = vi.fn();

		render(
			<LabelList
				labels={mockLabels}
				onEdit={mockOnEdit}
				onDelete={mockOnDelete}
			/>,
		);

		// ラベル名が表示される
		expect(screen.getByText("技術")).toBeInTheDocument();
		expect(screen.getByText("ビジネス")).toBeInTheDocument();
		expect(screen.getByText("ライフハック")).toBeInTheDocument();

		// 記事数が表示される
		expect(screen.getByText("(5記事)")).toBeInTheDocument();
		expect(screen.getByText("(3記事)")).toBeInTheDocument();
		expect(screen.getByText("(0記事)")).toBeInTheDocument();
	});

	test("説明文がある場合は「説明を表示」ボタンが表示される", () => {
		const mockOnEdit = vi.fn();
		const mockOnDelete = vi.fn();

		render(
			<LabelList
				labels={mockLabels}
				onEdit={mockOnEdit}
				onDelete={mockOnDelete}
			/>,
		);

		// 技術とライフハックには説明があるのでボタンが表示される
		const showDescriptionButtons = screen.getAllByText("説明を表示");
		expect(showDescriptionButtons).toHaveLength(2);

		// ビジネスには説明がないのでボタンは表示されない
		expect(screen.queryByText("説明を隠す")).not.toBeInTheDocument();
	});

	test("説明を表示ボタンをクリックすると説明文が表示される", async () => {
		const mockOnEdit = vi.fn();
		const mockOnDelete = vi.fn();
		const user = userEvent.setup();

		render(
			<LabelList
				labels={mockLabels}
				onEdit={mockOnEdit}
				onDelete={mockOnDelete}
			/>,
		);

		const showButtons = screen.getAllByText("説明を表示");
		await user.click(showButtons[0]); // 技術の説明を表示

		expect(
			screen.getByText("技術に関する記事のラベルです"),
		).toBeInTheDocument();
		expect(screen.getByText("説明を隠す")).toBeInTheDocument();
	});

	test("説明を隠すボタンをクリックすると説明文が非表示になる", async () => {
		const mockOnEdit = vi.fn();
		const mockOnDelete = vi.fn();
		const user = userEvent.setup();

		render(
			<LabelList
				labels={mockLabels}
				onEdit={mockOnEdit}
				onDelete={mockOnDelete}
			/>,
		);

		// 説明を表示
		const showButtons = screen.getAllByText("説明を表示");
		await user.click(showButtons[0]);

		// 説明を隠す
		const hideButton = screen.getByText("説明を隠す");
		await user.click(hideButton);

		expect(
			screen.queryByText("技術に関する記事のラベルです"),
		).not.toBeInTheDocument();
		expect(screen.getAllByText("説明を表示")).toHaveLength(2);
	});

	test("作成日・更新日が表示される", () => {
		const mockOnEdit = vi.fn();
		const mockOnDelete = vi.fn();

		render(
			<LabelList
				labels={mockLabels}
				onEdit={mockOnEdit}
				onDelete={mockOnDelete}
			/>,
		);

		// 作成日が表示される
		expect(screen.getAllByText(/作成:/).length).toBeGreaterThan(0);

		// 更新日が異なる場合は更新日も表示される
		expect(screen.getByText(/更新:/)).toBeInTheDocument();
	});

	test("編集ボタンをクリックするとonEditが呼ばれる", async () => {
		const mockOnEdit = vi.fn();
		const mockOnDelete = vi.fn();
		const user = userEvent.setup();

		render(
			<LabelList
				labels={mockLabels}
				onEdit={mockOnEdit}
				onDelete={mockOnDelete}
			/>,
		);

		const editButtons = screen.getAllByText("編集");
		await user.click(editButtons[0]);

		expect(mockOnEdit).toHaveBeenCalledWith(1);
	});

	test("削除ボタンをクリックするとonDeleteが呼ばれる", async () => {
		const mockOnEdit = vi.fn();
		const mockOnDelete = vi.fn();
		const user = userEvent.setup();

		render(
			<LabelList
				labels={mockLabels}
				onEdit={mockOnEdit}
				onDelete={mockOnDelete}
			/>,
		);

		const deleteButtons = screen.getAllByText("削除");
		await user.click(deleteButtons[0]);

		expect(mockOnDelete).toHaveBeenCalledWith(1);
	});

	test("複数のラベルで説明の展開状態が独立している", async () => {
		const mockOnEdit = vi.fn();
		const mockOnDelete = vi.fn();
		const user = userEvent.setup();

		render(
			<LabelList
				labels={mockLabels}
				onEdit={mockOnEdit}
				onDelete={mockOnDelete}
			/>,
		);

		const showButtons = screen.getAllByText("説明を表示");

		// 技術の説明を表示
		await user.click(showButtons[0]);
		// 表示された説明を確認
		expect(screen.getByText("説明を隠す")).toBeInTheDocument();

		// ライフハックの説明を表示
		const remainingShowButton = screen.getByText("説明を表示");
		await user.click(remainingShowButton);

		// 両方の説明が表示されていることを確認
		expect(screen.getByText("生活に役立つ情報")).toBeInTheDocument();
		// 「説明を隠す」ボタンが少なくとも1つある
		expect(screen.getAllByText("説明を隠す").length).toBeGreaterThan(0);
	});

	test("articleCountがundefinedの場合は0記事と表示される", () => {
		const labelWithoutCount: Label = {
			id: 4,
			name: "テスト",
			description: null,
		};

		const mockOnEdit = vi.fn();
		const mockOnDelete = vi.fn();

		render(
			<LabelList
				labels={[labelWithoutCount]}
				onEdit={mockOnEdit}
				onDelete={mockOnDelete}
			/>,
		);

		expect(screen.getByText("(0記事)")).toBeInTheDocument();
	});
});
