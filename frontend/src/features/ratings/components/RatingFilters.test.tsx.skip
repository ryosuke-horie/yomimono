import { fireEvent, render, screen } from "@testing-library/react";
/**
 * RatingFiltersコンポーネントのテスト
 */
import { expect, test, vi } from "vitest";
import type { RatingFilters as RatingFiltersType } from "../types";
import { RatingFilters } from "./RatingFilters";

if (import.meta.vitest) {
	const defaultFilters: RatingFiltersType = {
		sortBy: "createdAt",
		order: "desc",
	};

	test("基本フィルターが正しく表示される", () => {
		const mockOnChange = vi.fn();
		render(<RatingFilters filters={defaultFilters} onChange={mockOnChange} />);

		// タイトル
		expect(screen.getByText("フィルター・ソート")).toBeInTheDocument();

		// ソート基準セレクト
		expect(screen.getByDisplayValue("評価日時")).toBeInTheDocument();
		expect(screen.getByDisplayValue("降順")).toBeInTheDocument();

		// コメントフィルター
		expect(screen.getByText("すべて")).toBeInTheDocument();
		expect(screen.getByText("あり")).toBeInTheDocument();
		expect(screen.getByText("なし")).toBeInTheDocument();
	});

	test("ソート基準の変更が正しく動作する", () => {
		const mockOnChange = vi.fn();
		render(<RatingFilters filters={defaultFilters} onChange={mockOnChange} />);

		const sortSelect = screen.getByDisplayValue("評価日時");
		fireEvent.change(sortSelect, { target: { value: "totalScore" } });

		expect(mockOnChange).toHaveBeenCalledWith({
			...defaultFilters,
			sortBy: "totalScore",
		});
	});

	test("ソート順の変更が正しく動作する", () => {
		const mockOnChange = vi.fn();
		render(<RatingFilters filters={defaultFilters} onChange={mockOnChange} />);

		const orderSelect = screen.getByDisplayValue("降順");
		fireEvent.change(orderSelect, { target: { value: "asc" } });

		expect(mockOnChange).toHaveBeenCalledWith({
			...defaultFilters,
			order: "asc",
		});
	});

	test("コメントフィルターの変更が正しく動作する", () => {
		const mockOnChange = vi.fn();
		render(<RatingFilters filters={defaultFilters} onChange={mockOnChange} />);

		// コメント「あり」を選択
		const commentButton = screen.getByText("あり");
		fireEvent.click(commentButton);

		expect(mockOnChange).toHaveBeenCalledWith({
			...defaultFilters,
			hasComment: true,
		});
	});

	test("詳細フィルターの展開・折りたたみが動作する", () => {
		const mockOnChange = vi.fn();
		render(<RatingFilters filters={defaultFilters} onChange={mockOnChange} />);

		// 初期状態では詳細フィルターは非表示
		expect(screen.queryByText("スコア範囲")).not.toBeInTheDocument();

		// 詳細フィルターボタンをクリック
		const expandButton = screen.getByText("詳細フィルター");
		fireEvent.click(expandButton);

		// 詳細フィルターが表示される
		expect(screen.getByText("スコア範囲")).toBeInTheDocument();
		expect(screen.getByText("表示件数")).toBeInTheDocument();

		// 簡易表示ボタンに変わる
		expect(screen.getByText("簡易表示")).toBeInTheDocument();
	});

	test("スコア範囲フィルターが正しく動作する", () => {
		const mockOnChange = vi.fn();
		render(<RatingFilters filters={defaultFilters} onChange={mockOnChange} />);

		// 詳細フィルターを展開
		fireEvent.click(screen.getByText("詳細フィルター"));

		// 最小スコアを変更
		const minScoreSlider = screen.getByDisplayValue("1");
		fireEvent.change(minScoreSlider, { target: { value: "5" } });

		expect(mockOnChange).toHaveBeenCalledWith({
			...defaultFilters,
			minScore: 5,
		});
	});

	test("表示件数の変更が正しく動作する", () => {
		const mockOnChange = vi.fn();
		render(<RatingFilters filters={defaultFilters} onChange={mockOnChange} />);

		// 詳細フィルターを展開
		fireEvent.click(screen.getByText("詳細フィルター"));

		// 表示件数を変更
		const limitSelect = screen.getByDisplayValue("20件");
		fireEvent.change(limitSelect, { target: { value: "50" } });

		expect(mockOnChange).toHaveBeenCalledWith({
			...defaultFilters,
			limit: 50,
		});
	});

	test("フィルターリセットが正しく動作する", () => {
		const activeFilters: RatingFiltersType = {
			sortBy: "totalScore",
			order: "asc",
			minScore: 5,
			maxScore: 8,
			hasComment: true,
			limit: 50,
		};

		const mockOnChange = vi.fn();
		render(<RatingFilters filters={activeFilters} onChange={mockOnChange} />);

		// フィルター適用中のバッジが表示される
		expect(screen.getByText("フィルター適用中")).toBeInTheDocument();

		// リセットボタンが表示される
		const resetButton = screen.getByText("リセット");
		expect(resetButton).toBeInTheDocument();

		// リセットボタンをクリック
		fireEvent.click(resetButton);

		expect(mockOnChange).toHaveBeenCalledWith({
			sortBy: "createdAt",
			order: "desc",
			minScore: undefined,
			maxScore: undefined,
			hasComment: undefined,
		});
	});

	test("フィルターが適用されていない場合はリセットボタンが表示されない", () => {
		const mockOnChange = vi.fn();
		render(<RatingFilters filters={defaultFilters} onChange={mockOnChange} />);

		// フィルター適用中バッジが表示されない
		expect(screen.queryByText("フィルター適用中")).not.toBeInTheDocument();

		// リセットボタンが表示されない
		expect(screen.queryByText("リセット")).not.toBeInTheDocument();
	});

	test("スコア範囲の矛盾を自動調整する", () => {
		const mockOnChange = vi.fn();
		render(<RatingFilters filters={defaultFilters} onChange={mockOnChange} />);

		// 詳細フィルターを展開
		fireEvent.click(screen.getByText("詳細フィルター"));

		// 最小スコアを最大値より大きく設定
		const minScoreSlider = screen.getByDisplayValue("1");
		fireEvent.change(minScoreSlider, { target: { value: "8" } });

		// 最大スコアも自動的に調整される
		expect(mockOnChange).toHaveBeenCalledWith({
			...defaultFilters,
			minScore: 8,
			maxScore: undefined, // 未設定の場合は調整されない
		});
	});
}
