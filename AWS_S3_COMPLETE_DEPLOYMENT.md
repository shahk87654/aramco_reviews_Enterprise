# AWS Deployment Guide - Frontend on S3 + Backend on EC2

Complete guide for deploying Aramco Reviews Enterprise using AWS services.

## Architecture Overview

```
┌─────────────────┐
│   S3 Frontend   │ (Static Next.js app)
│   CloudFront    │ (CDN + HTTPS)
└────────┬────────┘
         │
         └──► EC2 Backend (NestJS API)
              RDS Database (PostgreSQL)
              Workers (Lambda/EC2)
```

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured: `aws configure`
- Node.js 18+ installed
- Docker installed (for local testing)
- Git installed

---

## Part 1: Frontend Deployment (AWS S3)

### Step 1: Set Up S3 Bucket

```bash
# Navigate to frontend directory
cd frontend

# Create S3 bucket (Windows PowerShell)
.\setup-s3-bucket.ps1

# Or manually create bucket
aws s3 mb s3://aramco-reviews-frontend
```

### Step 2: Configure Static Website Hosting

```bash
# Enable static website hosting
aws s3 website s3://aramco-reviews-frontend/ \
  --index-document index.html \
  --error-document index.html

# Enable versioning for rollback capability
aws s3api put-bucket-versioning \
  --bucket aramco-reviews-frontend \
  --versioning-configuration Status=Enabled
```

### Step 3: Configure Bucket Policy for Public Access

```bash
# Create bucket policy file
cat > bucket-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::aramco-reviews-frontend/*"
    }
  ]
}
EOF

# Apply policy
aws s3api put-bucket-policy \
  --bucket aramco-reviews-frontend \
  --policy file://bucket-policy.json
```

### Step 4: Build and Deploy Frontend

```bash
# Build the Next.js project
npm run build

# Deploy to S3 with public read access
npm run deploy:s3

# Verify deployment
aws s3 ls s3://aramco-reviews-frontend/ --recursive
```

### Step 5: Access Your Site

```
Website URL: http://aramco-reviews-frontend.s3-website-us-east-1.amazonaws.com
```

---

## Part 2: Backend Deployment (AWS EC2)

### Step 1: Launch EC2 Instance

```bash
# Create security group
aws ec2 create-security-group \
  --group-name aramco-backend-sg \
  --description "Security group for Aramco backend"

# Add security group rules
aws ec2 authorize-security-group-ingress \
  --group-name aramco-backend-sg \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name aramco-backend-sg \
  --protocol tcp \
  --port 3000 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name aramco-backend-sg \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

### Step 2: Install Docker on EC2

```bash
# SSH into instance
ssh -i "your-key.pem" ec2-user@your-instance-dns

# Update system
sudo yum update -y

# Install Docker
sudo amazon-linux-extras install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in
exit
```

### Step 3: Deploy Backend with Docker

```bash
# Clone repository
git clone https://github.com/shahk87654/aramco_reviews_Enterprise.git
cd aramco_reviews_Enterprise

# Create .env file with backend configuration
cat > backend/.env << 'EOF'
NODE_ENV=production
DB_HOST=your-rds-endpoint
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-password
DB_NAME=aramco_reviews_db
DB_SSL=true
JWT_SECRET=your-jwt-secret-here
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://aramco-reviews-frontend.s3-website-us-east-1.amazonaws.com
EOF

# Build and run backend
docker build -f backend/Dockerfile -t aramco-backend ./backend
docker run -d \
  -p 3000:3000 \
  --env-file backend/.env \
  --restart always \
  --name aramco-backend \
  aramco-backend

# Verify it's running
docker ps
docker logs aramco-backend
```

---

## Part 3: Database Setup (AWS RDS)

### Step 1: Create RDS PostgreSQL Database

```bash
# Create DB security group
aws ec2 create-security-group \
  --group-name aramco-db-sg \
  --description "Security group for Aramco database"

# Allow EC2 to connect to database
aws ec2 authorize-security-group-ingress \
  --group-name aramco-db-sg \
  --protocol tcp \
  --port 5432 \
  --source-security-group-name aramco-backend-sg
```

### Step 2: Create Database Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier aramco-reviews-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password your-password \
  --allocated-storage 20 \
  --db-name aramco_reviews_db \
  --vpc-security-group-ids sg-xxxxxx \
  --publicly-accessible false \
  --backup-retention-period 7 \
  --multi-az false
```

### Step 3: Run Migrations

```bash
# Get RDS endpoint
aws rds describe-db-instances \
  --db-instance-identifier aramco-reviews-db \
  --query 'DBInstances[0].Endpoint.Address'

# SSH into EC2 and run migrations
docker exec aramco-backend npm run migrate:latest
```

---

## Part 4: Connect Frontend to Backend

### Step 1: Update Frontend Environment

```bash
# Create .env.local in frontend directory
cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://your-ec2-public-dns:3000
EOF
```

### Step 2: Rebuild and Redeploy

```bash
cd frontend
npm run build
npm run deploy:s3
```

---

## Part 5: Production Configuration

### Step 1: Set Up Custom Domain (Route 53)

```bash
# Create hosted zone for your domain
aws route53 create-hosted-zone \
  --name yourdomain.com \
  --caller-reference $(date +%s)

# Create S3 alias record
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch file://route53-changes.json
```

### Step 2: Set Up CloudFront for HTTPS (Recommended)

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name aramco-reviews-frontend.s3.amazonaws.com \
  --default-root-object index.html \
  --enabled true
```

### Step 3: Enable CORS on Backend

```bash
# Update backend .env
CORS_ORIGIN=https://yourdomain.com
```

---

## Monitoring and Maintenance

### CloudWatch Monitoring

```bash
# View EC2 metrics
aws cloudwatch list-metrics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization

# Create alarm for high CPU
aws cloudwatch put-metric-alarm \
  --alarm-name aramco-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### Backup and Recovery

```bash
# Create RDS snapshot
aws rds create-db-snapshot \
  --db-instance-identifier aramco-reviews-db \
  --db-snapshot-identifier aramco-db-snapshot-$(date +%Y%m%d)

# Restore from snapshot if needed
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier aramco-reviews-db-restored \
  --db-snapshot-identifier aramco-db-snapshot-20231201
```

### S3 Lifecycle Policy (Archive old versions)

```bash
cat > lifecycle.json << 'EOF'
{
  "Rules": [
    {
      "Id": "ArchiveOldVersions",
      "Status": "Enabled",
      "NoncurrentVersionTransitions": [
        {
          "NoncurrentDays": 30,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket aramco-reviews-frontend \
  --lifecycle-configuration file://lifecycle.json
```

---

## Cost Estimation

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| EC2 t2.micro | $0-10 | Free tier: 750 hrs/month |
| RDS db.t3.micro | $0-20 | Free tier: 750 hrs/month, 20GB storage |
| S3 Storage | $0.50-2 | ~$0.023/GB, typical frontend: 50MB |
| S3 Requests | $1-5 | Depends on traffic |
| CloudFront | $0-50 | ~$0.085/GB, free tier: 1TB/month |
| **Total** | **$5-90** | Varies with usage |

---

## Troubleshooting

### Frontend Returns 404

```bash
# Verify S3 website configuration
aws s3api get-bucket-website \
  --bucket aramco-reviews-frontend

# Check index.html exists
aws s3 ls s3://aramco-reviews-frontend/
```

### Backend Connection Issues

```bash
# SSH into EC2 and check logs
docker logs aramco-backend

# Test database connection
docker exec aramco-backend psql \
  -h your-rds-endpoint \
  -U postgres \
  -d aramco_reviews_db
```

### High AWS Costs

1. Stop/terminate unused EC2 instances
2. Check CloudFront cache settings
3. Review S3 storage policies
4. Consider using AWS Cost Explorer

---

## Deployment Checklist

- [ ] S3 bucket created and configured
- [ ] Frontend built and deployed to S3
- [ ] EC2 instance running with Docker
- [ ] Backend Docker container running
- [ ] RDS database created and accessible
- [ ] Database migrations completed
- [ ] Frontend environment variables updated
- [ ] CORS configured
- [ ] Custom domain setup (optional)
- [ ] CloudFront distribution created (optional)
- [ ] Monitoring and alerts configured
- [ ] Backup strategy implemented

---

## Quick Deploy Commands

```bash
# Quick redeploy frontend
npm run deploy:s3

# Quick check backend logs
docker logs -f aramco-backend

# Quick database backup
aws rds create-db-snapshot \
  --db-instance-identifier aramco-reviews-db \
  --db-snapshot-identifier backup-$(date +%s)
```

---

## Support Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [NestJS AWS Deployment](https://docs.nestjs.com/deployment)
- [Docker Documentation](https://docs.docker.com/)
- [AWS CLI Documentation](https://docs.aws.amazon.com/cli/)
