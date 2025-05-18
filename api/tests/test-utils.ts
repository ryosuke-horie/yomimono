import type { D1Database } from "@cloudflare/workers-types";
import { vi } from "vitest";

const defaultFetchResponse = {
	text: () => Promise.resolve("<title>Example Title</title>"),
};

export const mockFetch = vi.fn().mockResolvedValue(defaultFetchResponse);

// TODO: 不要になったので削除予定
