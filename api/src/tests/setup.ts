import { vi } from "vitest";

const defaultFetchResponse = {
	text: () => Promise.resolve("<title>Example Title</title>"),
};

const mockFetch = vi.fn().mockResolvedValue(defaultFetchResponse);

vi.stubGlobal("fetch", mockFetch);

afterEach(() => {
	vi.clearAllMocks();
});
