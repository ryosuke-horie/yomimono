# Effective Yomimono Labeler MCP Server

This directory contains the MCP (Model Context Protocol) server responsible for automatically labeling saved articles in the Effective Yomimono application. It interacts with the backend API to fetch unlabeled articles and assign labels based on predefined logic (currently placeholder, intended for LLM integration).

## Overview

The server exposes a single tool:

- **`autoLabelArticles`**: Fetches unlabeled articles from the API, determines appropriate labels (using placeholder logic for now), and updates the articles via the API.

## Setup

1.  **Install Dependencies**:
    ```bash
    cd mcp
    bun install
    ```
2.  **Environment Variables**:
    - Create a `.env` file in the `mcp` directory (or set environment variables directly).
    - Define the backend API base URL:
      ```
      API_BASE_URL=https://your-api-endpoint.com
      ```
      Replace `https://your-api-endpoint.com` with the actual URL of your deployed API (e.g., `https://effective-yomimono-api.ryosuke-horie37.workers.dev`).

## Running the Server

```bash
# Ensure API_BASE_URL is set (e.g., via .env or export)
bun run src/index.ts
```

The server will start and listen for MCP messages via standard input/output (stdio).

## Connecting with a Client

You can use an MCP client like the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) to connect to the running server and interact with the `autoLabelArticles` tool.

## Development

- **Linting/Formatting**: Uses Biome. Run `bun run biome check .` or `bun run biome format --write .`.
- **Static Analysis**: Uses knip. Run `bun run knip`.
