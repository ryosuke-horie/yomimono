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

# Check if namespace already exists
EXISTING_NAMESPACE=$(wrangler kv:namespace list --compatibility-date=2024-09-26 | grep "\"$KV_NAMESPACE_NAME\"" | awk '{print $2}' | tr -d '"')

if [ -z "$EXISTING_NAMESPACE" ]; then
  # Create new namespace
  echo "Creating new KV namespace: $KV_NAMESPACE_NAME"
  KV_NAMESPACE_ID=$(wrangler kv:namespace create "$KV_NAMESPACE_NAME" --compatibility-date=2024-09-26 --preview false | grep "id =" | awk '{print $3}' | tr -d '"')
else
  # Use existing namespace
  echo "Using existing KV namespace: $EXISTING_NAMESPACE"
  KV_NAMESPACE_ID=$EXISTING_NAMESPACE
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