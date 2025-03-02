import { API_BASE_URL } from "@/lib/api/config";
import type { ApiResponse } from "@/types/api";
import type { Bookmark } from "@/types/bookmark";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		console.log("Config API_BASE_URL:", API_BASE_URL);
		const url = `${API_BASE_URL}/bookmarks/unread`;
		const options = {
			method: "GET",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		} as const;

		console.log("Request details:", {
			url,
			method: options.method,
			headers: options.headers,
		});

		const response = await fetch(url, options);

		if (!response.ok) {
			const errorText = await response.text();
			console.log("Response error:", {
				status: response.status,
				statusText: response.statusText,
				body: errorText,
			});
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
			{
				success: false,
				message: "ブックマークの取得に失敗しました",
			},
			{ status: 500 },
		);
	}
}
