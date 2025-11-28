#!/bin/bash
# Comprehensive disk cleanup script for cloud environment

set -e

echo "=== DISK CLEANUP & OPTIMIZATION SCRIPT ==="
echo ""

# 1. Remove all non-essential files and directories
echo "[1/6] Removing non-essential source files..."
rm -rf backend/src backend/tsconfig.json backend/nest-cli.json backend/jest.config.js backend/package-lock.json
rm -rf workers/src workers/tsconfig.json workers/package-lock.json
rm -rf frontend/.next frontend/node_modules frontend/tsconfig.json frontend/postcss.config.js frontend/tailwind.config.js
rm -rf frontend/package-lock.json
rm -rf docs/
rm -rf test/
rm -rf .git/
echo "✓ Removed source files"

# 2. Prune Docker system
echo "[2/6] Pruning Docker system..."
docker system prune -af --volumes 2>/dev/null || true
echo "✓ Docker cleaned"

# 3. Clear npm cache globally
echo "[3/6] Clearing npm cache..."
npm cache clean --force 2>/dev/null || true
rm -rf ~/.npm
echo "✓ NPM cache cleared"

# 4. Remove temp files
echo "[4/6] Removing temporary files..."
rm -rf /tmp/* 2>/dev/null || true
echo "✓ Temp files removed"

# 5. Check disk space
echo "[5/6] Current disk usage:"
df -h | grep -E "^/dev/|^Filesystem"
echo ""

# 6. Report available space
AVAILABLE=$(df / | awk 'NR==2 {print $4}')
echo "[6/6] Available disk space: ${AVAILABLE}K ($(( AVAILABLE / 1024 ))MB)"
echo ""

if [ $AVAILABLE -lt 2097152 ]; then
    echo "⚠️  WARNING: Less than 2GB available!"
    echo "Consider using smaller base images or pre-built artifacts"
else
    echo "✓ Sufficient disk space available for Docker builds"
fi
