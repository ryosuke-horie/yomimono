/**
 * Vitestテストセットアップファイル
 * グローバル設定とモックの定義
 */
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

// テスト実行後のクリーンアップ
afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

// 環境変数の設定
beforeAll(() => {
	process.env.NEXT_PUBLIC_API_URL = "http://localhost:3001";
});

// グローバル設定
beforeAll(() => {
	// ResizeObserverのモック
	global.ResizeObserver = vi.fn().mockImplementation(() => ({
		observe: vi.fn(),
		unobserve: vi.fn(),
		disconnect: vi.fn(),
	}));

	// IntersectionObserverのモック
	global.IntersectionObserver = vi.fn().mockImplementation(() => ({
		observe: vi.fn(),
		unobserve: vi.fn(),
		disconnect: vi.fn(),
	}));

	// matchMediaのモック
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn().mockImplementation((query) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
});

// Next.jsルーターのモック
vi.mock("next/navigation", () => ({
	useRouter: vi.fn(() => ({
		push: vi.fn(),
		replace: vi.fn(),
		refresh: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		prefetch: vi.fn(),
	})),
	useSearchParams: vi.fn(() => new URLSearchParams()),
	usePathname: vi.fn(() => "/"),
	useParams: vi.fn(() => ({})),
}));

// Next.js Imageのモック
vi.mock("next/image", () => ({
	default: (props: Record<string, unknown>) => {
		const { createElement } = require("react");
		return createElement("img", { ...props, alt: props.alt });
	},
}));
