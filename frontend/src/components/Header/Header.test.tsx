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
	test("ヘッダーが正しく表示される", () => {
		vi.mocked(usePathname).mockReturnValue("/");

		render(<Header />);

		expect(screen.getByText("Yomimono")).toBeInTheDocument();
		expect(screen.getByText("未読一覧")).toBeInTheDocument();
		expect(screen.getByText("お気に入り")).toBeInTheDocument();
		expect(screen.getByText("最近読んだ記事")).toBeInTheDocument();
		expect(screen.getByText("ラベル設定")).toBeInTheDocument();
	});

	test("現在のページが正しくアクティブになる", () => {
		vi.mocked(usePathname).mockReturnValue("/favorites");

		render(<Header />);

		const favoriteLink = screen.getByText("お気に入り").closest("a");
		expect(favoriteLink).toHaveClass(
			"text-blue-600",
			"border-b-2",
			"border-blue-600",
		);
	});

	test("非アクティブなリンクは異なるスタイルを持つ", () => {
		vi.mocked(usePathname).mockReturnValue("/");

		render(<Header />);

		const favoriteLink = screen.getByText("お気に入り").closest("a");
		expect(favoriteLink).toHaveClass("text-gray-600", "hover:text-blue-500");
		expect(favoriteLink).not.toHaveClass(
			"text-blue-600",
			"border-b-2",
			"border-blue-600",
		);
	});

	test("メニューボタンでモバイルメニューを切り替えできる", () => {
		vi.mocked(usePathname).mockReturnValue("/");

		render(<Header />);

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

	test("すべてのナビゲーションリンクが正しいパスを持つ", () => {
		vi.mocked(usePathname).mockReturnValue("/");

		render(<Header />);

		expect(screen.getByText("未読一覧").closest("a")).toHaveAttribute(
			"href",
			"/",
		);
		expect(screen.getByText("お気に入り").closest("a")).toHaveAttribute(
			"href",
			"/favorites",
		);
		expect(screen.getByText("最近読んだ記事").closest("a")).toHaveAttribute(
			"href",
			"/recent",
		);
		expect(screen.getByText("ラベル設定").closest("a")).toHaveAttribute(
			"href",
			"/labels",
		);
	});
});
