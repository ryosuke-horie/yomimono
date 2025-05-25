/**
 * Buttonコンポーネントの単体テスト
 * スタイリング、プロパティ、インタラクションの検証
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
	it("正しくレンダリングされる", () => {
		render(<Button>テストボタン</Button>);

		const button = screen.getByRole("button", { name: "テストボタン" });
		expect(button).toBeInTheDocument();
		expect(button).toHaveTextContent("テストボタン");
	});

	it("デフォルトスタイルが適用される", () => {
		render(<Button>ボタン</Button>);

		const button = screen.getByRole("button");
		expect(button).toHaveClass("bg-blue-500", "text-white", "px-4", "py-2");
	});

	it('variant="secondary"のスタイルが適用される', () => {
		render(<Button variant="secondary">セカンダリボタン</Button>);

		const button = screen.getByRole("button");
		expect(button).toHaveClass("bg-gray-200", "text-gray-800");
	});

	it('variant="danger"のスタイルが適用される', () => {
		render(<Button variant="danger">削除</Button>);

		const button = screen.getByRole("button");
		expect(button).toHaveClass("bg-red-500", "text-white");
	});

	it('size="sm"のスタイルが適用される', () => {
		render(<Button size="sm">小さいボタン</Button>);

		const button = screen.getByRole("button");
		expect(button).toHaveClass("px-3", "py-1.5", "text-sm");
	});

	it('size="lg"のスタイルが適用される', () => {
		render(<Button size="lg">大きいボタン</Button>);

		const button = screen.getByRole("button");
		expect(button).toHaveClass("px-6", "py-3", "text-lg");
	});

	it("カスタムクラス名が追加される", () => {
		render(<Button className="custom-class">カスタムボタン</Button>);

		const button = screen.getByRole("button");
		expect(button).toHaveClass("custom-class");
	});

	it("disabled属性が適用される", () => {
		render(<Button disabled>無効ボタン</Button>);

		const button = screen.getByRole("button");
		expect(button).toBeDisabled();
	});

	it("クリックイベントが正しく動作する", async () => {
		const user = userEvent.setup();
		const handleClick = vi.fn();

		render(<Button onClick={handleClick}>クリック</Button>);

		const button = screen.getByRole("button");
		await user.click(button);

		expect(handleClick).toHaveBeenCalledOnce();
	});

	it("HTML button属性が正しく渡される", () => {
		render(
			<Button type="submit" form="test-form" data-testid="submit-btn">
				送信
			</Button>,
		);

		const button = screen.getByTestId("submit-btn");
		expect(button).toHaveAttribute("type", "submit");
		expect(button).toHaveAttribute("form", "test-form");
	});
});
