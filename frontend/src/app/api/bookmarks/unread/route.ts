import { API_BASE_URL } from "@/lib/api/config";
import type { ApiResponse } from "@/types/api";
import type { Bookmark } from "@/types/bookmark";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const response = await fetch(`${API_BASE_URL}/api/bookmarks/unread`, {
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			cache: "no-store",
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = (await response.json()) as ApiResponse<Bookmark>;

		if (!data.success) {
			return NextResponse.json(
				{ success: false, message: data.message || "API request failed" },
				{ status: 400 },
			);
		}

		return NextResponse.json(data);
	} catch (error) {
		console.error("API error:", error);
		return NextResponse.json(
			{ success: false, message: "ブックマークの取得に失敗しました" },
			{ status: 500 },
		);
	}
}
