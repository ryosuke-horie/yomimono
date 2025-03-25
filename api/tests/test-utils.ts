import { vi } from "vitest";

const defaultFetchResponse = {
	text: () => Promise.resolve("<title>Example Title</title>"),
};

export const mockFetch = vi.fn().mockResolvedValue(defaultFetchResponse);
