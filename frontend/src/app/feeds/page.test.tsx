import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FeedsPage from "./page";

// FeedListPageコンポーネントをモック
vi.mock("@/features/feeds/pages/FeedListPage", () => ({
	FeedListPage: () => <div data-testid="feed-list-page">Feed List Page</div>,
}));

describe("FeedsPage", () => {
	it("FeedListPageコンポーネントを正しくレンダリングする", () => {
		render(<FeedsPage />);

		expect(screen.getByTestId("feed-list-page")).toBeInTheDocument();
		expect(screen.getByText("Feed List Page")).toBeInTheDocument();
	});

	it("単純なラッパーコンポーネントとして機能する", () => {
		const { container } = render(<FeedsPage />);

		// FeedListPageがレンダリングされていることを確認
		expect(container.firstChild).toHaveAttribute(
			"data-testid",
			"feed-list-page",
		);
	});
});
