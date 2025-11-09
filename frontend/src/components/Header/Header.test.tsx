import { fireEvent, render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { describe, expect, test, vi } from "vitest";
import { Header } from ".";

// Next.jsのナビゲーションをモック
vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
	useRouter: vi.fn(() => ({
		push: vi.fn(),
		refresh: vi.fn(),
	})),
}));

describe("Header", () => {
	const renderHeader = (path = "/") => {
		vi.mocked(usePathname).mockReturnValue(path);

		return render(<Header />);
	};

	test("ヘッダーが正しく表示される", () => {
		renderHeader();

		expect(screen.getByText("Yomimono")).toBeInTheDocument();
		expect(screen.getByText("未読一覧")).toBeInTheDocument();
		expect(screen.getByText("お気に入り")).toBeInTheDocument();
		expect(screen.getByText("最近読んだ記事")).toBeInTheDocument();
		expect(screen.getByText("ラベル設定")).toBeInTheDocument();
	});

	test("メニューボタンでモバイルメニューを切り替えできる", () => {
		renderHeader();

		const menuButton = screen.getByRole("button");
		expect(menuButton).toBeInTheDocument();

		// メニューが最初は非表示（条件付きレンダリングで存在しない）
		expect(screen.queryByText("未読一覧")).toBeInTheDocument(); // デスクトップメニューには存在

		// モバイルメニューのリンクは最初は表示されていない（条件付きレンダリング）
		const mobileMenuItems = screen.queryAllByText("未読一覧");
		expect(mobileMenuItems).toHaveLength(1); // デスクトップメニューのみ

		// メニューボタンをクリック
		fireEvent.click(menuButton);

		// モバイルメニューが表示される（2つめの「未読一覧」が追加される）
		const mobileMenuItemsAfterClick = screen.getAllByText("未読一覧");
		expect(mobileMenuItemsAfterClick).toHaveLength(2); // デスクトップとモバイル

		// もう一度クリックして非表示
		fireEvent.click(menuButton);
		const mobileMenuItemsAfterSecondClick = screen.queryAllByText("未読一覧");
		expect(mobileMenuItemsAfterSecondClick).toHaveLength(1); // デスクトップのみ
	});

	test("デスクトップ表示のスナップショット", () => {
		const { container } = renderHeader();

		expect(container).toMatchSnapshot();
	});

	test("モバイルメニュー展開時のスナップショット", () => {
		const { container } = renderHeader();
		const toggleButton = screen.getByRole("button");

		fireEvent.click(toggleButton);

		expect(container).toMatchSnapshot();
	});

	describe("ナビゲーションリンクの構造", () => {
		test("デフォルトの選択状態はスナップショットで担保する", () => {
			const { container } = renderHeader();
			const nav = container.querySelector("nav");
			if (!nav) {
				throw new Error("ナビゲーションが見つかりません");
			}

			expect(nav).toMatchSnapshot();
		});
	});
});
