#!/bin/bash
# Setup Security Groups and ALB
# Run this after creating VPC and EC2 instances

AWS_REGION="us-east-1"
VPC_ID="vpc-0f922cff9f0b598be"
BACKEND_SG_ID="sg-01470590a821ad41f"
ALB_SG_ID="sg-alb"
RDS_SG_ID="default (sg-094bc9ef8677be442)"

echo "🔐 Setting up AWS Security Groups and Load Balancer..."

# Step 1: Create Backend Security Group
echo ""
echo "1️⃣  Creating Backend Security Group..."
BACKEND_SG=$(aws ec2 create-security-group \
  --group-name aramco-backend-sg \
  --description "Backend API security group for Aramco Reviews" \
  --vpc-id $VPC_ID \
  --region $AWS_REGION \
  --query 'GroupId' \
  --output text)

echo "✅ Backend SG created: $BACKEND_SG"

# Step 2: Create ALB Security Group
echo ""
echo "2️⃣  Creating ALB Security Group..."
ALB_SG=$(aws ec2 create-security-group \
  --group-name aramco-alb-sg \
  --description "Application Load Balancer security group" \
  --vpc-id $VPC_ID \
  --region $AWS_REGION \
  --query 'GroupId' \
  --output text)

echo "✅ ALB SG created: $ALB_SG"

# Step 3: Create RDS Security Group
echo ""
echo "3️⃣  Creating RDS Security Group..."
RDS_SG=$(aws ec2 create-security-group \
  --group-name aramco-rds-sg \
  --description "RDS PostgreSQL security group" \
  --vpc-id $VPC_ID \
  --region $AWS_REGION \
  --query 'GroupId' \
  --output text)

echo "✅ RDS SG created: $RDS_SG"

# Step 4: Configure security group rules
echo ""
echo "4️⃣  Configuring security group rules..."

# Allow ALB to Backend
aws ec2 authorize-security-group-ingress \
  --group-id $BACKEND_SG \
  --protocol tcp \
  --port 3000 \
  --source-security-group-id $ALB_SG \
  --region $AWS_REGION 2>/dev/null || echo "   ⚠️  Rule already exists"

# Allow SSH to Backend (for debugging)
aws ec2 authorize-security-group-ingress \
  --group-id $BACKEND_SG \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0 \
  --region $AWS_REGION 2>/dev/null || echo "   ⚠️  SSH rule already exists"

# Allow HTTPS to ALB (from internet)
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0 \
  --region $AWS_REGION 2>/dev/null || echo "   ⚠️  HTTPS rule already exists"

# Allow HTTP to ALB (will redirect to HTTPS)
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region $AWS_REGION 2>/dev/null || echo "   ⚠️  HTTP rule already exists"

# Allow Backend to RDS
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG \
  --protocol tcp \
  --port 5432 \
  --source-security-group-id $BACKEND_SG \
  --region $AWS_REGION 2>/dev/null || echo "   ⚠️  RDS rule already exists"

echo "✅ Security group rules configured"

# Step 5: Create Application Load Balancer
echo ""
echo "5️⃣  Creating Application Load Balancer..."
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name aramco-backend-alb \
  --subnets subnet-12345678 subnet-87654321 \
  --security-groups $ALB_SG \
  --scheme internal \
  --type application \
  --region $AWS_REGION \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)

ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --region $AWS_REGION \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

echo "✅ ALB created: $ALB_DNS"

# Step 6: Create Target Group
echo ""
echo "6️⃣  Creating Target Group..."
TG_ARN=$(aws elbv2 create-target-group \
  --name aramco-backend-targets \
  --protocol HTTP \
  --port 3000 \
  --vpc-id $VPC_ID \
  --health-check-protocol HTTP \
  --health-check-path /api/health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --region $AWS_REGION \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

echo "✅ Target Group created: $TG_ARN"

# Step 7: Create ALB Listener
echo ""
echo "7️⃣  Creating ALB Listener..."
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN \
  --region $AWS_REGION

echo "✅ ALB Listener created"

echo ""
echo "📝 Summary:"
echo "  - Backend Security Group: $BACKEND_SG"
echo "  - ALB Security Group: $ALB_SG"
echo "  - RDS Security Group: $RDS_SG"
echo "  - ALB ARN: $ALB_ARN"
echo "  - ALB DNS: $ALB_DNS"
echo "  - Target Group: $TG_ARN"
echo ""
echo "🎯 Next steps:"
echo "  1. Update frontend .env with: NEXT_PUBLIC_API_BASE_URL=http://$ALB_DNS"
echo "  2. Register EC2 instance with target group:"
echo "     aws elbv2 register-targets --target-group-arn $TG_ARN --targets Id=i-xxxxx,Port=3000"
echo "  3. Rebuild and deploy frontend"
echo ""
