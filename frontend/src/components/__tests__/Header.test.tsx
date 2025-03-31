import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "../Header";

// next/navigationのモック
vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
}));

// next/linkのモック
vi.mock("next/link", () => {
	return {
		__esModule: true,
		default: ({
			children,
			href,
			className,
		}: {
			children: React.ReactNode;
			href: string;
			className?: string;
		}) => {
			return (
				<a href={href} className={className}>
					{children}
				</a>
			);
		},
	};
});

describe("Header", () => {
	it("アプリ名が表示される", () => {
		const usePathname = vi.mocked(vi.fn());
		usePathname.mockReturnValue("/");

		render(<Header />);
		expect(screen.getByText("ブックマークアプリ")).toBeDefined();
	});

	it("未読一覧へのリンクが表示される", () => {
		const usePathname = vi.mocked(vi.fn());
		usePathname.mockReturnValue("/");

		render(<Header />);
		const link = screen.getByText("未読一覧");
		const anchor = link.closest("a");
		expect(anchor).not.toBeNull();
		expect(anchor?.getAttribute("href")).toBe("/");
	});

	it("現在のパスがルートの場合、未読一覧リンクがアクティブになる", () => {
		const usePathname = vi.mocked(vi.fn());
		usePathname.mockReturnValue("/");

		render(<Header />);
		const link = screen.getByText("未読一覧");
		const anchor = link.closest("a");
		expect(anchor?.className).toContain("text-gray-600");
		expect(anchor?.className).toContain("hover:text-blue-500");
	});

	it("現在のパスがルート以外の場合、未読一覧リンクが非アクティブになる", () => {
		const usePathname = vi.mocked(vi.fn());
		usePathname.mockReturnValue("/other");

		render(<Header />);
		const link = screen.getByText("未読一覧");
		const anchor = link.closest("a");
		expect(anchor?.className).toContain("text-gray-600");
		expect(anchor?.className).not.toContain("border-b-2");
	});

	it("ヘッダーが適切なスタイルを持つ", () => {
		const usePathname = vi.mocked(vi.fn());
		usePathname.mockReturnValue("/");

		render(<Header />);
		const header = screen.getByRole("banner");
		expect(header.className).toContain("shadow-sm");
	});

	it("アプリ名のリンクがホームページを指している", () => {
		const usePathname = vi.mocked(vi.fn());
		usePathname.mockReturnValue("/");

		render(<Header />);
		const appNameLink = screen.getByText("ブックマークアプリ");
		const anchor = appNameLink.closest("a");
		expect(anchor).not.toBeNull();
		expect(anchor?.getAttribute("href")).toBe("/");
	});
});
