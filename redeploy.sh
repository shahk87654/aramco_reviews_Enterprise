#!/bin/bash
set -e

echo "🚀 Rebuilding and deploying Aramco Reviews backend..."

cd /home/ec2-user/aramco_reviews_Enterprise

# Pull latest code
echo "📥 Pulling latest code..."
git pull

# Build backend image
echo "🔨 Building backend image..."
cd backend
docker build -f Dockerfile -t backend .
cd ..

# Build workers image
echo "🔨 Building workers image..."
cd workers
docker build -f Dockerfile -t workers .
cd ..

# Run backend container
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

# Run workers container
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

# Wait for services to start
sleep 5

# Check status
echo "✅ Checking status..."
docker ps -a

# Test API
echo "🔍 Testing API..."
sleep 5
curl -s http://localhost:3000/api/stations | head -c 200
echo -e "\n\n✅ Deployment complete!"
