#!/bin/bash
# AWS Backend Deployment Script
# Deploy NestJS backend to EC2 with RDS PostgreSQL

set -e

echo "🚀 Starting Backend Deployment to AWS..."

# Configuration
AWS_REGION="us-east-1"
EC2_INSTANCE_ID="i-1234567890abcdef0"  # Replace with your EC2 instance ID
RDS_ENDPOINT="your-rds-endpoint.rds.amazonaws.com"
DB_NAME="aramco_reviews"
DB_USER="postgres"

echo "📋 Configuration:"
echo "  - Region: $AWS_REGION"
echo "  - EC2 Instance: $EC2_INSTANCE_ID"
echo "  - RDS Endpoint: $RDS_ENDPOINT"

# Step 1: Build backend
echo ""
echo "🔨 Building backend..."
cd backend
npm install
npm run build
echo "✅ Backend built successfully"

# Step 2: Create .env file for production
echo ""
echo "⚙️  Creating production .env file..."
cat > .env.production << EOF
# Database
DATABASE_URL=postgresql://$DB_USER:\$DB_PASSWORD@$RDS_ENDPOINT:5432/$DB_NAME
DB_HOST=$RDS_ENDPOINT
DB_PORT=5432
DB_USER=$DB_USER
DB_NAME=$DB_NAME

# Server
NODE_ENV=production
PORT=3000

# CORS - Will be set during EC2 deployment
CORS_ORIGINS=https://d123.cloudfront.net

# JWT
JWT_SECRET=$(openssl rand -base64 32)

# AWS
AWS_REGION=$AWS_REGION
EOF

echo "✅ .env.production created (remember to set sensitive values)"

# Step 3: Create Docker image
echo ""
echo "🐳 Building Docker image..."
docker build -t aramco-backend:latest .

# Step 4: Push to ECR (optional, for better management)
echo ""
echo "📤 Tagging image for ECR (optional)..."
# aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin 123456789.dkr.ecr.$AWS_REGION.amazonaws.com
# docker tag aramco-backend:latest 123456789.dkr.ecr.$AWS_REGION.amazonaws.com/aramco-backend:latest
# docker push 123456789.dkr.ecr.$AWS_REGION.amazonaws.com/aramco-backend:latest

echo ""
echo "✅ Backend deployment package ready"
echo ""
echo "📝 Next steps:"
echo "1. SCP the docker image to EC2 or push to ECR"
echo "2. SSH into EC2 and run:"
echo "   docker run -d --name aramco-backend -p 3000:3000 --env-file .env.production aramco-backend:latest"
echo "3. Verify with: curl http://localhost:3000/api/health"
echo ""
