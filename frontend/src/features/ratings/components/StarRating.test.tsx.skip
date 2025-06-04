import { render, screen } from "@testing-library/react";
/**
 * StarRatingコンポーネントのテスト
 */
import { expect, test } from "vitest";
import { StarRating } from "./StarRating";

if (import.meta.vitest) {
	test("10点満点の評価を5つ星で表示する", () => {
		render(<StarRating score={10} />);

		// 10点は5つ星満点
		const stars = screen.getAllByRole("img", { hidden: true });
		expect(stars).toHaveLength(5);
	});

	test("5点の評価を2.5つ星で表示する", () => {
		render(<StarRating score={5} />);

		// タイトル属性で確認
		const container = screen.getByTitle("評価: 5.0/10");
		expect(container).toBeInTheDocument();
	});

	test("showNumberがtrueの場合、数値も表示する", () => {
		render(<StarRating score={7.5} showNumber />);

		const numberDisplay = screen.getByText("7.5/10");
		expect(numberDisplay).toBeInTheDocument();
	});

	test("showNumberがfalseの場合、数値は表示しない", () => {
		render(<StarRating score={7.5} showNumber={false} />);

		const numberDisplay = screen.queryByText("7.5/10");
		expect(numberDisplay).not.toBeInTheDocument();
	});

	test("サイズプロパティが正しく適用される", () => {
		const { rerender } = render(<StarRating score={8} size="sm" />);

		// sm サイズの確認
		let stars = screen.getAllByRole("img", { hidden: true });
		expect(stars[0]).toHaveClass("w-4", "h-4");

		// md サイズの確認
		rerender(<StarRating score={8} size="md" />);
		stars = screen.getAllByRole("img", { hidden: true });
		expect(stars[0]).toHaveClass("w-5", "h-5");

		// lg サイズの確認
		rerender(<StarRating score={8} size="lg" />);
		stars = screen.getAllByRole("img", { hidden: true });
		expect(stars[0]).toHaveClass("w-6", "h-6");
	});

	test("0点の評価を空の星で表示する", () => {
		render(<StarRating score={0} />);

		const container = screen.getByTitle("評価: 0.0/10");
		expect(container).toBeInTheDocument();
	});

	test("異常値でもエラーにならない", () => {
		expect(() => {
			render(<StarRating score={-1} />);
		}).not.toThrow();

		expect(() => {
			render(<StarRating score={15} />);
		}).not.toThrow();
	});
}
