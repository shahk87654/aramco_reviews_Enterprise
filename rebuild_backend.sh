#!/bin/bash
set -e

# Find repo in common locations
if [ -d "/root/aramco_reviews_Enterprise" ]; then
  REPO_DIR="/root/aramco_reviews_Enterprise"
elif [ -d "/home/ec2-user/aramco_reviews_Enterprise" ]; then
  REPO_DIR="/home/ec2-user/aramco_reviews_Enterprise"
elif [ -d "$HOME/aramco_reviews_Enterprise" ]; then
  REPO_DIR="$HOME/aramco_reviews_Enterprise"
else
  # Search for it
  REPO_DIR=$(find ~ -type d -name "aramco_reviews_Enterprise" 2>/dev/null | head -1)
  if [ -z "$REPO_DIR" ]; then
    echo "❌ Repository not found in /root, /home, or home directories"
    echo "Current directory: $(pwd)"
    echo "Files here:"
    ls -la
    exit 1
  fi
fi

echo "📍 Found repo at: $REPO_DIR"
cd "$REPO_DIR"
echo "Working directory: $(pwd)"
ls -la

# Build backend
echo "🔨 Building backend..."
cd backend
docker build -f Dockerfile -t backend . 2>&1 | grep -E "Building|FINISHED|ERROR" | tail -5
cd ..

# Build workers
echo "🔨 Building workers..."
cd workers
docker build -f Dockerfile -t workers . 2>&1 | grep -E "Building|FINISHED|ERROR" | tail -5
cd ..

# Start backend
echo "🚀 Starting backend container..."
docker run -d --name aramco-backend --network host -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_HOST=aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com \
  -e DB_PORT=5432 \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=Shahnawaz20030611 \
  -e DB_NAME=aramco_reviews_db \
  -e DB_SSL=true \
  -e JWT_SECRET=aramco_jwt_secret_key_2025_secure \
  -e JWT_EXPIRATION=24h \
  backend

# Start workers
echo "🚀 Starting workers container..."
docker run -d --name aramco-workers --network host \
  -e NODE_ENV=production \
  -e DB_HOST=aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com \
  -e DB_PORT=5432 \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=Shahnawaz20030611 \
  -e DB_NAME=aramco_reviews_db \
  -e DB_SSL=true \
  workers

sleep 3
echo "✅ Container Status:"
docker ps

sleep 5
echo "🔍 Testing API..."
RESULT=$(curl -s http://localhost:3000/api/stations 2>&1 | head -c 500)
echo "$RESULT"

if echo "$RESULT" | grep -q '"name"'; then
  echo -e "\n✅ BACKEND IS WORKING!"
else
  echo -e "\n❌ API not responding yet, check logs:"
  docker logs aramco-backend --tail 20
fi
