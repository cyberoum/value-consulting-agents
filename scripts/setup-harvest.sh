#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Cortex — One-time harvest token setup
# Run once per machine. Never needs to be run again after a git pull.
#
# Usage:
#   ./scripts/setup-harvest.sh ghp_xxxxxxxxxxxx
#
# Get the token from: 1Password → "Cortex Harvest Token"
# ─────────────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CORTEX_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$CORTEX_DIR/.env"

TOKEN="$1"

if [ -z "$TOKEN" ]; then
    echo ""
    echo "  ❌  No token provided."
    echo ""
    echo "  Usage:  ./scripts/setup-harvest.sh <token>"
    echo "  Token:  1Password → 'Cortex Harvest Token'"
    echo ""
    exit 1
fi

# Validate it looks like a GitHub token
if [[ ! "$TOKEN" == ghp_* ]] && [[ ! "$TOKEN" == github_pat_* ]]; then
    echo ""
    echo "  ⚠️   That doesn't look like a GitHub token (should start with ghp_ or github_pat_)"
    echo "  Get it from 1Password → 'Cortex Harvest Token'"
    echo ""
    exit 1
fi

# Validate token against GitHub API (check it actually works)
echo "  Validating token with GitHub..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/user")

if [ "$HTTP_STATUS" != "200" ]; then
    echo ""
    echo "  ⚠️   Token validation failed (HTTP $HTTP_STATUS)."
    echo "  The token may be expired, revoked, or have insufficient permissions."
    echo "  Get a fresh one from 1Password → 'Cortex Harvest Token'"
    echo ""
    exit 1
fi

# Ensure .env is in .gitignore
if ! grep -q "^\.env$" "$CORTEX_DIR/.gitignore" 2>/dev/null; then
    echo ".env" >> "$CORTEX_DIR/.gitignore"
    echo "  Added .env to .gitignore"
fi

# Remove any existing CORTEX_HARVEST_TOKEN line and append fresh
touch "$ENV_FILE"
grep -v "^CORTEX_HARVEST_TOKEN=" "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
echo "CORTEX_HARVEST_TOKEN=$TOKEN" >> "$ENV_FILE"

# Restrict .env file permissions (owner read/write only)
chmod 600 "$ENV_FILE"

echo ""
echo "  ✅  Harvest token saved to .env (permissions: 600)"
echo ""
echo "  That's it. From now on, every pipeline run will automatically"
echo "  push anonymised learnings back to the shared knowledge base."
echo "  You don't need to do anything else."
echo ""
