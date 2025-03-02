import type { ApiBookmarkResponse } from "@/types/api";
import type { Bookmark } from "@/types/bookmark";
import { API_BASE_URL } from "./config";

interface ApiError extends Error {
  status?: number;
}

export async function getUnreadBookmarks(): Promise<Bookmark[]> {
  try {
    const response = await fetch(`/api/bookmarks/unread`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    try {
      const data: ApiBookmarkResponse = JSON.parse(text);
      console.log("API Response:", { status: response.status, data });
      if (!data.success) {
        const error = new Error(
          data.message || "未読ブックマークの取得に失敗しました",
        );
        Object.assign(error, { status: response.status });
        throw error;
      }
      return data.bookmarks || [];
    } catch (e) {
      if (e instanceof SyntaxError) {
        console.error("JSON parse error:", e);
        console.error("Response text:", text);
        console.error("Response status:", response.status);
        throw new Error("レスポンスの解析に失敗しました");
      }
      throw e;
    }
  } catch (error) {
    console.error("API error:", error);
    throw error;
  }
}

export async function markBookmarkAsRead(id: number): Promise<void> {
  try {
    const response = await fetch(`/api/bookmarks/${id}/read`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Response Error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url: `/api/bookmarks/${id}/read`,
        method: "PATCH"
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as ApiBookmarkResponse;
    console.log("API Response:", {
      status: response.status,
      data
    });
    if (!data.success) {
      throw new Error(data.message || "ブックマークの更新に失敗しました");
    }
  } catch (error) {
    console.error("API error:", {
      error,
      url: `/api/bookmarks/${id}/read`,
      method: "PATCH"
    });
    throw error;
  }
}
