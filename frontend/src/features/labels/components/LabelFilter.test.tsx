/**
 * LabelFilter コンポーネントのテスト
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import type { Label } from "../types";
import { LabelFilter } from "./LabelFilter";

const mockLabels: Label[] = [
	{ id: 1, name: "技術", description: "技術記事" },
	{ id: 2, name: "ビジネス", description: null },
	{ id: 3, name: "ライフハック", description: "生活の知恵" },
];

describe("LabelFilter", () => {
	test("すべてのラベルと「すべて」ボタンが表示される", () => {
		const mockOnLabelSelect = vi.fn();

		render(
			<LabelFilter
				labels={mockLabels}
				selectedLabelName={undefined}
				onLabelSelect={mockOnLabelSelect}
			/>,
		);

		// 「すべて」ボタンが表示される
		expect(screen.getByText("すべて")).toBeInTheDocument();

		// 各ラベルが表示される
		expect(screen.getByText("技術")).toBeInTheDocument();
		expect(screen.getByText("ビジネス")).toBeInTheDocument();
		expect(screen.getByText("ライフハック")).toBeInTheDocument();
	});

	test("選択されていない状態では「すべて」ボタンが選択スタイルになる", () => {
		const mockOnLabelSelect = vi.fn();

		render(
			<LabelFilter
				labels={mockLabels}
				selectedLabelName={undefined}
				onLabelSelect={mockOnLabelSelect}
			/>,
		);

		const allButton = screen.getByText("すべて");
		expect(allButton).toHaveClass("bg-blue-500", "text-white");
	});

	test("特定のラベルが選択されている状態ではそのラベルが選択スタイルになる", () => {
		const mockOnLabelSelect = vi.fn();

		render(
			<LabelFilter
				labels={mockLabels}
				selectedLabelName="技術"
				onLabelSelect={mockOnLabelSelect}
			/>,
		);

		const allButton = screen.getByText("すべて");
		const techButton = screen.getByText("技術");
		const businessButton = screen.getByText("ビジネス");

		// 「すべて」ボタンは非選択スタイル
		expect(allButton).toHaveClass("bg-gray-100", "text-gray-700");

		// 「技術」ボタンは選択スタイル
		expect(techButton).toHaveClass("bg-blue-500", "text-white");

		// 「ビジネス」ボタンは非選択スタイル
		expect(businessButton).toHaveClass("bg-gray-100", "text-gray-700");
	});

	test("「すべて」ボタンをクリックするとundefinedでonLabelSelectが呼ばれる", async () => {
		const mockOnLabelSelect = vi.fn();
		const user = userEvent.setup();

		render(
			<LabelFilter
				labels={mockLabels}
				selectedLabelName="技術"
				onLabelSelect={mockOnLabelSelect}
			/>,
		);

		const allButton = screen.getByText("すべて");
		await user.click(allButton);

		expect(mockOnLabelSelect).toHaveBeenCalledWith(undefined);
	});

	test("ラベルボタンをクリックするとそのラベル名でonLabelSelectが呼ばれる", async () => {
		const mockOnLabelSelect = vi.fn();
		const user = userEvent.setup();

		render(
			<LabelFilter
				labels={mockLabels}
				selectedLabelName={undefined}
				onLabelSelect={mockOnLabelSelect}
			/>,
		);

		const techButton = screen.getByText("技術");
		await user.click(techButton);

		expect(mockOnLabelSelect).toHaveBeenCalledWith("技術");
	});

	test("複数のラベルボタンをクリックできる", async () => {
		const mockOnLabelSelect = vi.fn();
		const user = userEvent.setup();

		render(
			<LabelFilter
				labels={mockLabels}
				selectedLabelName={undefined}
				onLabelSelect={mockOnLabelSelect}
			/>,
		);

		const techButton = screen.getByText("技術");
		const businessButton = screen.getByText("ビジネス");

		await user.click(techButton);
		expect(mockOnLabelSelect).toHaveBeenCalledWith("技術");

		await user.click(businessButton);
		expect(mockOnLabelSelect).toHaveBeenCalledWith("ビジネス");

		expect(mockOnLabelSelect).toHaveBeenCalledTimes(2);
	});

	test("ラベルが空の場合は「すべて」ボタンのみ表示される", () => {
		const mockOnLabelSelect = vi.fn();

		render(
			<LabelFilter
				labels={[]}
				selectedLabelName={undefined}
				onLabelSelect={mockOnLabelSelect}
			/>,
		);

		expect(screen.getByText("すべて")).toBeInTheDocument();
		expect(screen.queryByText("技術")).not.toBeInTheDocument();
	});
});
