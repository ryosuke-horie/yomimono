#!/bin/bash

# Check if required environment variables are set
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "CLOUDFLARE_API_TOKEN is not set"
  exit 1
fi

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo "CLOUDFLARE_ACCOUNT_ID is not set"
  exit 1
fi

# Create KV namespace if it doesn't exist
echo "Creating KV namespace for Next.js incremental cache..."
KV_NAMESPACE_NAME="effective-yomimono-next-cache"

# Try to create namespace (it will fail if it already exists)
echo "Attempting to create KV namespace: $KV_NAMESPACE_NAME"
CREATE_OUTPUT=$(wrangler kv namespace create "$KV_NAMESPACE_NAME" 2>&1 || true)
echo "Create output: $CREATE_OUTPUT"

# Extract ID from creation output or list existing namespaces
if echo "$CREATE_OUTPUT" | grep -q "id = "; then
  # Successfully created new namespace
  KV_NAMESPACE_ID=$(echo "$CREATE_OUTPUT" | grep 'id = "' | sed 's/.*id = "\([^"]*\)".*/\1/')
  echo "Created new KV namespace with ID: $KV_NAMESPACE_ID"
else
  # Namespace might already exist, list all namespaces
  echo "Namespace might already exist, listing all namespaces..."
  LIST_OUTPUT=$(wrangler kv namespace list 2>&1)
  echo "List output: $LIST_OUTPUT"
  
  # Parse JSON output to find our namespace ID
  # Look for the ID that appears right before our namespace title
  KV_NAMESPACE_ID=$(echo "$LIST_OUTPUT" | grep -B1 "\"title\": \"$KV_NAMESPACE_NAME\"" | head -1 | sed -n 's/.*"id": "\([^"]*\)".*/\1/p')
  
  if [ -z "$KV_NAMESPACE_ID" ]; then
    echo "Failed to find namespace ID in list output"
    exit 1
  fi
  
  echo "Found existing KV namespace with ID: $KV_NAMESPACE_ID"
fi

if [ -z "$KV_NAMESPACE_ID" ]; then
  echo "Failed to get KV namespace ID"
  exit 1
fi

echo "KV namespace ID: $KV_NAMESPACE_ID"

# Update wrangler.jsonc with the actual KV namespace ID
sed -i.bak "s/PLACEHOLDER_KV_NAMESPACE_ID/$KV_NAMESPACE_ID/g" wrangler.jsonc

# Remove backup file
rm -f wrangler.jsonc.bak

echo "Updated wrangler.jsonc with KV namespace ID"