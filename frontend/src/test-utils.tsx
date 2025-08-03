/**
 * テストユーティリティ
 * Vitestと@testing-library/reactの共通設定
 */

import {
	render as rtlRender,
	renderHook as rtlRenderHook,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

// Re-export everything
export * from "@testing-library/react";
export { userEvent, vi, test, expect };

// Custom render with providers if needed
export function render(ui: React.ReactElement, options = {}) {
	return rtlRender(ui, options);
}

export function renderHook<TProps, TResult>(
	callback: (props: TProps) => TResult,
	options = {},
) {
	return rtlRenderHook(callback, options);
}

// User event setup
export const user = userEvent.setup();
