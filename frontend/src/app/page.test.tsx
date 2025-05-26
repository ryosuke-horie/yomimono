/**
 * メインページのテスト
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Page from "./page";

// Next.js router のモック
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
	}),
}));

const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

describe("メインページ", () => {
	it("ページが正しくレンダリングされる", () => {
		const wrapper = createWrapper();
		render(<Page />, { wrapper });

		expect(screen.getByText("記事を追加")).toBeInTheDocument();
	});
});
