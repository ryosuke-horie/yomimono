import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// 環境に応じた設定
const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
	out: "./drizzle",
	schema: "./src/db/schema.ts",
	dialect: "sqlite",
	driver: isProd ? "d1-http" : "better-sqlite",
	dbCredentials: isProd
		? {
				accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
				databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
				token: process.env.CLOUDFLARE_D1_TOKEN!,
		  }
		: {
				url: "sqlite.db",
		  },
});
