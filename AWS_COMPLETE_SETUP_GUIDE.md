# Complete AWS Setup Guide - Secure Backend & Frontend

## Quick Start (5 Minutes)

### What You'll Get:
✅ Frontend on S3 + CloudFront (HTTPS)
✅ Backend on EC2 (Private - No public IP needed)
✅ Secure connection via ALB (Application Load Balancer)
✅ Database on RDS PostgreSQL (Private)
✅ No ngrok required - Enterprise-grade security

---

## Architecture

```
Internet Users
     ↓
CloudFront (HTTPS/CDN) ← Caches frontend
     ↓
S3 Bucket ← Static files
     ↓ (same VPC)
ALB (Internal) ← Routes traffic
     ↓
EC2 Backend ← NestJS server
     ↓
RDS Database ← PostgreSQL
```

---

## Prerequisites

```bash
# AWS CLI installed
aws --version

# AWS credentials configured
aws configure

# Verify permissions
aws ec2 describe-instances --region us-east-1
```

---

## Step 1: Create VPC & Subnets (5 min)

### Via AWS Console (Easiest)

1. Go to VPC Dashboard
2. Click "Create VPC"
3. Name: `aramco-vpc`
4. CIDR: `10.0.0.0/16`
5. Create public + private subnets

### Via CLI

```bash
# Create VPC
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --query 'Vpc.VpcId' \
  --output text)

echo "VPC ID: $VPC_ID"

# Create Public Subnet
PUBLIC_SUBNET=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --region us-east-1 \
  --query 'Subnet.SubnetId' \
  --output text)

# Create Private Subnet
PRIVATE_SUBNET=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --region us-east-1 \
  --query 'Subnet.SubnetId' \
  --output text)

echo "Public Subnet: $PUBLIC_SUBNET"
echo "Private Subnet: $PRIVATE_SUBNET"
```

---

## Step 2: Create EC2 Instance (5 min)

### Via AWS Console

1. Go to EC2 Dashboard
2. Click "Launch Instance"
3. **AMI:** Ubuntu 22.04 LTS
4. **Instance Type:** t3.medium
5. **VPC:** aramco-vpc
6. **Subnet:** Private Subnet
7. **Security Group:** Create new (backend-sg)
8. **Key Pair:** Create and download
9. Click "Launch"

### Via CLI

```bash
# Create instance
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-12345 \
  --subnet-id $PRIVATE_SUBNET \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "Instance ID: $INSTANCE_ID"
```

---

## Step 3: Create RDS Database (10 min)

### Via AWS Console

1. Go to RDS Dashboard
2. Click "Create Database"
3. **Engine:** PostgreSQL 15
4. **DB Instance:** db.t3.micro
5. **Name:** aramco-reviews
6. **Master Username:** postgres
7. **Password:** (Generate strong password)
8. **VPC:** aramco-vpc
9. **Subnet Group:** Create new
10. **Security Group:** rds-sg (private)
11. Click "Create"

### Via CLI

```bash
aws rds create-db-instance \
  --db-instance-identifier aramco-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password "YourSecurePassword123!" \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-rds \
  --db-subnet-group-name aramco-db-subnet \
  --publicly-accessible false \
  --storage-encrypted

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier aramco-db \
  --query 'DBInstances[0].Endpoint.Address'
```

---

## Step 4: Deploy Backend (10 min)

### Option A: Using SSH Bastion Host

```bash
# Create a small t3.nano in public subnet as bastion
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.nano \
  --key-name your-key-pair \
  --security-group-ids sg-bastion \
  --subnet-id $PUBLIC_SUBNET

# SSH through bastion to private instance
ssh -i your-key.pem -J ec2-user@bastion ubuntu@private-ip
```

### Option B: Using Systems Manager Session Manager (Recommended - No SSH needed)

```bash
# Attach IAM role to EC2 instance
aws ec2 associate-iam-instance-profile \
  --iam-instance-profile Name=EC2-SSM-Role \
  --instance-id $INSTANCE_ID

# Start session
aws ssm start-session --target $INSTANCE_ID

# Now you're in the instance!
```

### Deploy Backend Commands

```bash
# In EC2 instance
sudo apt update
sudo apt install -y git docker.io nodejs npm

# Clone repo
git clone https://github.com/shahk87654/aramco_reviews_Enterprise.git
cd aramco_reviews_Enterprise/backend

# Create .env
cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:YourPassword@rds-endpoint:5432/aramco_reviews
DB_HOST=rds-endpoint
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YourPassword
DB_NAME=aramco_reviews

NODE_ENV=production
PORT=3000

CORS_ORIGINS=https://d123.cloudfront.net

JWT_SECRET=$(openssl rand -base64 32)

AWS_REGION=us-east-1
EOF

# Build and start
docker build -t aramco-backend .
docker run -d \
  --name aramco-backend \
  --env-file .env \
  -p 3000:3000 \
  aramco-backend

# Verify
curl http://localhost:3000/api/health
```

---

## Step 5: Setup ALB (Application Load Balancer) - 10 min

Run the script:

```bash
bash setup-aws-infrastructure.sh
```

Or manually:

```bash
# Create ALB
ALB=$(aws elbv2 create-load-balancer \
  --name aramco-backend-alb \
  --subnets subnet-1 subnet-2 \
  --security-groups sg-alb \
  --scheme internal \
  --type application)

# Get ALB DNS
ALB_DNS=$(echo $ALB | jq -r '.LoadBalancers[0].DNSName')
echo "ALB DNS: $ALB_DNS"

# Create target group
TG=$(aws elbv2 create-target-group \
  --name aramco-targets \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-123 \
  --health-check-path /api/health)

TG_ARN=$(echo $TG | jq -r '.TargetGroups[0].TargetGroupArn')

# Register EC2 instance
aws elbv2 register-targets \
  --target-group-arn $TG_ARN \
  --targets Id=$INSTANCE_ID,Port=3000

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN
```

---

## Step 6: Update Frontend (5 min)

Update `frontend/.env`:

```env
NEXT_PUBLIC_API_BASE_URL=http://aramco-backend-alb-12345.us-east-1.elb.amazonaws.com
```

Rebuild:

```bash
cd frontend
npm run build
aws s3 sync .next s3://aramco-reviews-frontend/ --exact-timestamps
```

---

## Step 7: Setup CloudFront (HTTPS) - 5 min

```bash
aws cloudfront create-distribution \
  --distribution-config '{
    "CallerReference": "aramco-reviews",
    "Origins": {
      "Quantity": 1,
      "Items": [{
        "Id": "S3",
        "DomainName": "aramco-reviews-frontend.s3.amazonaws.com",
        "S3OriginConfig": {}
      }]
    },
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3",
      "ViewerProtocolPolicy": "redirect-to-https",
      "AllowedMethods": {"Quantity": 7, "Items": ["GET","HEAD","POST","PUT","DELETE","PATCH","OPTIONS"]},
      "ForwardedValues": {"QueryString": false, "Cookies": {"Forward": "none"}}
    },
    "Enabled": true
  }'

# Get CloudFront domain
aws cloudfront list-distributions \
  --query 'DistributionList.Items[0].DomainName'
```

---

## Step 8: Optional - Route 53 Custom Domain

```bash
# Create private hosted zone
aws route53 create-hosted-zone \
  --name internal.aramco-reviews.com \
  --vpc VPCRegion=us-east-1,VPCId=vpc-123 \
  --caller-reference $(date +%s)

# Create record for backend
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123 \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.internal.aramco-reviews.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "'$ALB_DNS'",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'

# Use in frontend .env
NEXT_PUBLIC_API_BASE_URL=https://api.internal.aramco-reviews.com
```

---

## Testing

### Test Backend Health

```bash
curl -X GET http://alb-dns/api/health

# Expected:
# {"status":"ok"}
```

### Test Frontend

```bash
# Visit CloudFront domain
https://d123.cloudfront.net

# Check browser console for API calls
# All requests should go to ALB
```

### Monitor

```bash
# Check ALB targets
aws elbv2 describe-target-health \
  --target-group-arn $TG_ARN

# Check EC2 logs
aws ssm start-session --target $INSTANCE_ID
tail -f /var/log/docker.log
```

---

## Cleanup (Delete Resources)

```bash
# Delete ALB
aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN

# Terminate EC2
aws ec2 terminate-instances --instance-ids $INSTANCE_ID

# Delete RDS
aws rds delete-db-instance \
  --db-instance-identifier aramco-db \
  --skip-final-snapshot

# Delete VPC
aws ec2 delete-vpc --vpc-id $VPC_ID
```

---

## Cost Estimate

| Component | Hourly | Monthly |
|-----------|--------|---------|
| ALB | ~$0.022 | ~$16 |
| EC2 (t3.medium) | ~$0.042 | ~$30 |
| RDS (t3.micro) | ~$0.07 | ~$50 |
| S3 + CloudFront | - | ~$5 |
| Data Transfer | - | ~$5 |
| **Total** | - | **~$106** |

*Compared to ngrok: $120/month for basic plan*

---

## Security Checklist

- ✅ Backend in private subnet (no public IP)
- ✅ No SSH exposure (use Session Manager)
- ✅ Security groups restrict traffic
- ✅ Database encrypted at rest
- ✅ HTTPS via CloudFront
- ✅ No ngrok (no tunnel exposure)
- ✅ IAM roles for EC2 permissions
- ✅ ALB handles load balancing

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't connect to EC2 | Use AWS Systems Manager Session Manager |
| 502 Bad Gateway | Check target group health, EC2 logs |
| Slow responses | Check EC2 CPU/Memory utilization |
| CORS errors | Update CORS_ORIGINS in backend .env |
| Database won't connect | Check RDS security group rules |

---

## Next Steps

1. ✅ Create VPC + Subnets
2. ✅ Launch EC2 instance
3. ✅ Create RDS database
4. ✅ Deploy backend to EC2
5. ✅ Create ALB + Target Group
6. ✅ Update frontend .env
7. ✅ Deploy frontend to S3
8. ✅ Create CloudFront distribution
9. ✅ Test end-to-end
10. ✅ Monitor with CloudWatch

**You're production-ready! 🚀**

No more ngrok. Pure AWS security.
