#!/bin/bash
set -e

# Navigate to the repo
cd /home/cloudshell-user/aramco_reviews_Enterprise

echo "📦 Building backend image..."
cd backend
docker build -f Dockerfile -t backend . || { echo "❌ Backend build failed"; exit 1; }
cd ..

echo "✅ Backend image built successfully"

echo "📦 Building workers image..."
cd workers
docker build -f Dockerfile -t workers . || { echo "❌ Workers build failed"; exit 1; }
cd ..

echo "✅ Workers image built successfully"

echo "🧹 Stopping existing containers..."
docker stop aramco-backend aramco-workers 2>/dev/null || true
docker rm aramco-backend aramco-workers 2>/dev/null || true

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
  --restart unless-stopped \
  backend

echo "✅ Backend container started"

echo "🚀 Starting workers container..."
docker run -d --name aramco-workers --network host \
  -e NODE_ENV=production \
  -e DB_HOST=aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com \
  -e DB_PORT=5432 \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=Shahnawaz20030611 \
  -e DB_NAME=aramco_reviews_db \
  -e DB_SSL=true \
  --restart unless-stopped \
  workers

echo "✅ Workers container started"

echo "📋 Checking container status..."
docker ps

echo "🧪 Testing API..."
sleep 5
curl -s http://localhost:3000/api/stations | head -c 200
echo ""
echo ""
echo "✅ All done!"
