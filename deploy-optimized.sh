#!/bin/bash
# Optimized deployment script - minimal disk footprint

set -e

REPO_DIR=$(pwd)
NODE_ENV="production"

echo "=== OPTIMIZED DEPLOYMENT ==="
echo "Directory: $REPO_DIR"
echo ""

# Step 1: Aggressive cleanup before builds
echo "[STEP 1/5] Pre-build cleanup..."
rm -rf backend/src backend/test backend/tsconfig.json backend/jest.config.js
rm -rf workers/src workers/test workers/tsconfig.json
rm -rf frontend/.next frontend/node_modules frontend/src
rm -rf docs .git .gitignore .env.example
rm -rf *.md *.ps1 *.sh *.js
rm -rf /tmp/* 2>/dev/null || true
docker system prune -af --volumes 2>/dev/null || true
echo "✓ Cleanup complete"

# Step 2: Check available space
echo "[STEP 2/5] Checking disk space..."
AVAILABLE=$(df / | awk 'NR==2 {print int($4/1024)}')  # Convert to MB
echo "Available: ${AVAILABLE}MB"

if [ $AVAILABLE -lt 1500 ]; then
    echo "❌ INSUFFICIENT DISK SPACE: Need at least 1.5GB, have ${AVAILABLE}MB"
    exit 1
fi
echo "✓ Sufficient space available"

# Step 3: Build backend with minimal footprint
echo "[STEP 3/5] Building backend Docker image..."
cd "$REPO_DIR/backend"
docker build -f Dockerfile -t backend:latest \
  --build-arg NODE_ENV=production \
  --squash . 2>&1 | tail -20
cd "$REPO_DIR"
echo "✓ Backend built"

# Step 4: Build workers with minimal footprint
echo "[STEP 4/5] Building workers Docker image..."
cd "$REPO_DIR/workers"
docker build -f Dockerfile -t workers:latest \
  --build-arg NODE_ENV=production \
  --squash . 2>&1 | tail -20
cd "$REPO_DIR"
echo "✓ Workers built"

# Step 5: Run containers
echo "[STEP 5/5] Starting containers..."

# Stop existing containers
docker rm -f aramco-backend 2>/dev/null || true
docker rm -f aramco-workers 2>/dev/null || true

# Start backend
docker run -d --name aramco-backend --network host \
  -e NODE_ENV=production \
  -e DB_HOST=${DB_HOST:-aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com} \
  -e DB_PORT=${DB_PORT:-5432} \
  -e DB_USERNAME=${DB_USERNAME:-postgres} \
  -e DB_PASSWORD=${DB_PASSWORD:-Shahnawaz20030611} \
  -e DB_NAME=${DB_NAME:-aramco_reviews_db} \
  -e DB_SSL=true \
  -e JWT_SECRET=${JWT_SECRET:-aramco_jwt_secret_key_2025_secure} \
  -e JWT_EXPIRATION=24h \
  --restart unless-stopped \
  backend:latest
echo "✓ Backend started"

# Start workers
docker run -d --name aramco-workers --network host \
  -e NODE_ENV=production \
  -e DB_HOST=${DB_HOST:-aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com} \
  -e DB_PORT=${DB_PORT:-5432} \
  -e DB_USERNAME=${DB_USERNAME:-postgres} \
  -e DB_PASSWORD=${DB_PASSWORD:-Shahnawaz20030611} \
  -e DB_NAME=${DB_NAME:-aramco_reviews_db} \
  -e DB_SSL=true \
  --restart unless-stopped \
  workers:latest
echo "✓ Workers started"

# Verify
echo ""
echo "[VERIFICATION]"
sleep 3
docker ps -a
echo ""
echo "✓ Deployment complete!"
echo "Backend running at: http://localhost:3000"
