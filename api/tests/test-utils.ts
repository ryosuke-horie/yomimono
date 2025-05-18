import type { D1Database } from "@cloudflare/workers-types";
import { vi } from "vitest";

const defaultFetchResponse = {
	text: () => Promise.resolve("<title>Example Title</title>"),
};

export const mockFetch = vi.fn().mockResolvedValue(defaultFetchResponse);

export type TestDatabase = D1Database;

export const createTestDatabase = async (): Promise<TestDatabase> => {
	// D1Database互換のモックオブジェクトを作成
	const mockDatabase: TestDatabase = {
		prepare: vi.fn().mockReturnThis(),
		bind: vi.fn().mockReturnThis(),
		all: vi.fn().mockResolvedValue({ results: [] }),
		first: vi.fn().mockResolvedValue(null),
		run: vi.fn().mockResolvedValue({ meta: { changes: 0 }, success: true }),
		batch: vi.fn().mockResolvedValue([]),
		exec: vi.fn().mockResolvedValue(null),
		dump: vi.fn().mockResolvedValue([]),
		// biome-ignore lint/suspicious/noExplicitAny: テスト用のモックオブジェクトであるため
	} as any;

	return mockDatabase;
};
