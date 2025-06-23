/**
 * QueryProviderコンポーネントのテスト
 * TanStack Query QueryClientProviderの設定とラッピングをテスト
 */
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QueryProvider } from "./QueryProvider";

// テスト用コンポーネント：QueryClientの設定確認用
function TestComponent() {
	const queryClient = useQueryClient();

	return (
		<div>
			<div data-testid="query-client-exists">
				{queryClient ? "QueryClient exists" : "QueryClient not found"}
			</div>
			<div data-testid="stale-time">
				{String(queryClient.getDefaultOptions().queries?.staleTime || 0)}
			</div>
		</div>
	);
}

// エラー境界用テスト：QueryProviderなしでuseQueryClientを使用
function _ComponentWithoutProvider() {
	const queryClient = useQueryClient();

	if (queryClient) {
		return <div data-testid="no-error">No error</div>;
	}

	return <div data-testid="error">Error caught</div>;
}

describe("QueryProvider", () => {
	it("子要素が正しくレンダリングされる", () => {
		render(
			<QueryProvider>
				<div data-testid="test-child">Test Child</div>
			</QueryProvider>,
		);

		expect(screen.getByTestId("test-child")).toBeInTheDocument();
		expect(screen.getByText("Test Child")).toBeInTheDocument();
	});

	it("QueryClientが正しく提供される", () => {
		render(
			<QueryProvider>
				<TestComponent />
			</QueryProvider>,
		);

		expect(screen.getByTestId("query-client-exists")).toHaveTextContent(
			"QueryClient exists",
		);
	});

	it("QueryClientのデフォルトオプションが正しく設定される", () => {
		render(
			<QueryProvider>
				<TestComponent />
			</QueryProvider>,
		);

		// staleTimeが5分（300000ms）に設定されていることを確認
		expect(screen.getByTestId("stale-time")).toHaveTextContent("300000");
	});

	it("複数の子コンポーネントが正しく機能する", () => {
		render(
			<QueryProvider>
				<div data-testid="child-1">Child 1</div>
				<div data-testid="child-2">Child 2</div>
				<TestComponent />
			</QueryProvider>,
		);

		expect(screen.getByTestId("child-1")).toBeInTheDocument();
		expect(screen.getByTestId("child-2")).toBeInTheDocument();
		expect(screen.getByTestId("query-client-exists")).toHaveTextContent(
			"QueryClient exists",
		);
	});

	it("QueryClientインスタンスが再レンダリング時に保持される", () => {
		let capturedQueryClient: QueryClient | null = null;

		function CaptureQueryClient() {
			const queryClient = useQueryClient();
			if (!capturedQueryClient) {
				capturedQueryClient = queryClient;
			}
			return (
				<div data-testid="same-instance">
					{capturedQueryClient === queryClient
						? "Same instance"
						: "Different instance"}
				</div>
			);
		}

		const { rerender } = render(
			<QueryProvider>
				<CaptureQueryClient />
			</QueryProvider>,
		);

		expect(screen.getByTestId("same-instance")).toHaveTextContent(
			"Same instance",
		);

		// 再レンダリング
		rerender(
			<QueryProvider>
				<CaptureQueryClient />
			</QueryProvider>,
		);

		expect(screen.getByTestId("same-instance")).toHaveTextContent(
			"Same instance",
		);
	});

	it("ネストされたコンポーネントでもQueryClientにアクセスできる", () => {
		function NestedComponent() {
			return (
				<div>
					<TestComponent />
				</div>
			);
		}

		render(
			<QueryProvider>
				<NestedComponent />
			</QueryProvider>,
		);

		expect(screen.getByTestId("query-client-exists")).toHaveTextContent(
			"QueryClient exists",
		);
	});

	it("QueryClientのデフォルト設定の詳細確認", () => {
		function DetailedOptionsTest() {
			const queryClient = useQueryClient();
			const defaultOptions = queryClient.getDefaultOptions();

			return (
				<div>
					<div data-testid="stale-time-value">
						{String(defaultOptions.queries?.staleTime)}
					</div>
					<div data-testid="has-queries-config">
						{defaultOptions.queries
							? "has queries config"
							: "no queries config"}
					</div>
				</div>
			);
		}

		render(
			<QueryProvider>
				<DetailedOptionsTest />
			</QueryProvider>,
		);

		expect(screen.getByTestId("stale-time-value")).toHaveTextContent("300000");
		expect(screen.getByTestId("has-queries-config")).toHaveTextContent(
			"has queries config",
		);
	});
});
