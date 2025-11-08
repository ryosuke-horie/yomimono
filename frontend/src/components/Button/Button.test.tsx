import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
	test("デフォルトスタイルのスナップショット", () => {
		const { container } = render(<Button>デフォルトボタン</Button>);

		expect(container).toMatchSnapshot();
	});

	test("バリアントとサイズの組み合わせをスナップショット検証する", () => {
		const { container } = render(
			<>
				<Button variant="primary" size="sm">
					Primary Small
				</Button>
				<Button variant="primary" size="lg">
					Primary Large
				</Button>
				<Button variant="secondary" size="md">
					Secondary Medium
				</Button>
				<Button variant="danger" size="md">
					Danger Medium
				</Button>
				<Button className="custom-class" variant="secondary" size="lg">
					Secondary Large Custom
				</Button>
			</>,
		);

		expect(container).toMatchSnapshot();
	});
});
