# Secure AWS Backend-Frontend Connection Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Users (Browser)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                    HTTPS
                         │
        ┌────────────────▼────────────────┐
        │   CloudFront (CDN + HTTPS)      │
        │   - Caches static content       │
        │   - Handles SSL/TLS             │
        │   - DDoS protection             │
        └────────────────┬────────────────┘
                         │
                    HTTPS
                         │
        ┌────────────────▼────────────────┐
        │  AWS S3 Bucket                  │
        │  (Frontend Static Files)        │
        └────────────────┬────────────────┘
                         │
                  Same VPC Network
                         │
        ┌────────────────▼────────────────────────┐
        │   Security Group (Backend)               │
        │   - Only allows traffic from:            │
        │     * CloudFront IP ranges              │
        │     * S3 VPC endpoint                   │
        │     * Other EC2 instances               │
        └────────────────┬───────────────────────┘
                         │
        ┌────────────────▼───────────────────────┐
        │  EC2 Instance (Backend API)            │
        │  - NestJS Server (Port 3000)           │
        │  - No public IP needed                 │
        │  - Private subnet                      │
        └────────────────┬───────────────────────┘
                         │
        ┌────────────────▼───────────────────────┐
        │  RDS PostgreSQL Database               │
        │  - Private subnet only                 │
        │  - Security group restricted access    │
        └────────────────────────────────────────┘
```

---

## Option 1: CloudFront → ALB → EC2 (RECOMMENDED)

### Step 1: Create Application Load Balancer (ALB)

```bash
# Via AWS CLI
aws elbv2 create-load-balancer \
  --name aramco-backend-alb \
  --subnets subnet-12345 subnet-67890 \
  --security-groups sg-backend \
  --scheme internal \
  --type application \
  --region us-east-1
```

### Step 2: Create Target Group

```bash
aws elbv2 create-target-group \
  --name aramco-backend-targets \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-12345 \
  --health-check-protocol HTTP \
  --health-check-path /api/health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3
```

### Step 3: Register EC2 Instance

```bash
aws elbv2 register-targets \
  --target-group-arn arn:aws:elasticloadbalancing:us-east-1:123456789:targetgroup/aramco-backend-targets/abc123 \
  --targets Id=i-1234567890abcdef0,Port=3000
```

### Step 4: Update Frontend Environment

Update `.env` to use ALB endpoint (internal DNS):

```env
# frontend/.env
NEXT_PUBLIC_API_BASE_URL=http://aramco-backend-alb-123456.us-east-1.elb.amazonaws.com
```

### Step 5: Security Group Configuration

```bash
# Backend Security Group - Allow ALB traffic
aws ec2 authorize-security-group-ingress \
  --group-id sg-backend \
  --protocol tcp \
  --port 3000 \
  --source-security-group-id sg-alb

# ALB Security Group - Allow CloudFront traffic
aws ec2 authorize-security-group-ingress \
  --group-id sg-alb \
  --protocol tcp \
  --port 80 \
  --source-security-group-id sg-cloudfront
```

---

## Option 2: Private URL via Systems Manager Session Manager

No public IP, no ngrok needed:

```bash
# Create a tunnel through AWS Systems Manager
aws ssm start-session \
  --target i-1234567890abcdef0 \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters host=localhost,portNumber=3000,localPortNumber=3000
```

---

## Option 3: VPC Endpoint for Private Communication

### Create VPC Endpoint for Backend

```bash
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-12345 \
  --service-name com.amazonaws.us-east-1.ec2 \
  --vpc-endpoint-type Interface \
  --subnet-ids subnet-12345
```

---

## Complete Setup Steps

### 1. Deploy Backend to EC2

```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@backend-private-ip

# Clone repository
git clone https://github.com/shahk87654/aramco_reviews_Enterprise.git
cd aramco_reviews_Enterprise/backend

# Install dependencies
npm install

# Create .env file with AWS settings
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://user:password@rds-endpoint:5432/aramco_reviews
DB_HOST=rds-endpoint
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_NAME=aramco_reviews

# CORS - Allow S3 CloudFront domain
CORS_ORIGINS=https://d123.cloudfront.net,http://localhost:3001

# JWT
JWT_SECRET=your-secure-jwt-secret

# Email (if needed)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Node
NODE_ENV=production
PORT=3000
EOF

# Build
npm run build

# Start with PM2 or Docker
npm install -g pm2
pm2 start dist/main.js --name "aramco-backend"
pm2 save
pm2 startup

# Or with Docker
docker build -t aramco-backend .
docker run -d \
  --name aramco-backend \
  --env-file .env \
  -p 3000:3000 \
  aramco-backend
```

### 2. Update Frontend Environment Variable

```env
# frontend/.env - Use ALB internal DNS
NEXT_PUBLIC_API_BASE_URL=http://aramco-backend-alb-12345.us-east-1.elb.amazonaws.com

# Or use Route 53 private hosted zone
NEXT_PUBLIC_API_BASE_URL=https://api.internal.aramco-reviews.com
```

### 3. Rebuild and Deploy Frontend

```bash
cd frontend
npm run build
aws s3 sync .next s3://aramco-reviews-frontend/ --exact-timestamps
```

### 4. Create CloudFront Distribution

```bash
# Create CloudFront distribution pointing to S3
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

#### cloudfront-config.json:
```json
{
  "CallerReference": "aramco-reviews-frontend",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3Origin",
        "DomainName": "aramco-reviews-frontend.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "AllowedMethods": {
      "Quantity": 7,
      "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    },
    "TargetOriginId": "S3Origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": { "Forward": "none" }
    },
    "MinTTL": 0
  },
  "Enabled": true
}
```

### 5. Configure Security Groups

```bash
# Backend Security Group
aws ec2 create-security-group \
  --group-name aramco-backend-sg \
  --description "Backend API security group" \
  --vpc-id vpc-12345

# Allow ALB to backend
aws ec2 authorize-security-group-ingress \
  --group-id sg-backend \
  --protocol tcp \
  --port 3000 \
  --source-security-group-id sg-alb

# Allow RDS access
aws ec2 authorize-security-group-ingress \
  --group-id sg-rds \
  --protocol tcp \
  --port 5432 \
  --source-security-group-id sg-backend

# ALB Security Group
aws ec2 create-security-group \
  --group-name aramco-alb-sg \
  --description "ALB security group" \
  --vpc-id vpc-12345

# Allow HTTPS from CloudFront
aws ec2 authorize-security-group-ingress \
  --group-id sg-alb \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

---

## Environment Configuration

### Frontend (.env)

```env
# Development
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# Production (ALB)
NEXT_PUBLIC_API_BASE_URL=http://aramco-backend-alb-12345.us-east-1.elb.amazonaws.com

# Or with Route 53 private hosted zone
NEXT_PUBLIC_API_BASE_URL=https://api.internal.aramco-reviews.com

NEXT_PUBLIC_APP_NAME=Aramco Reviews Enterprise
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@rds-endpoint:5432/aramco_reviews
DB_HOST=rds-endpoint
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=secure-password
DB_NAME=aramco_reviews

# Server
NODE_ENV=production
PORT=3000

# CORS
CORS_ORIGINS=https://d123cloudfront.net,https://aramco-reviews.com

# JWT
JWT_SECRET=your-secure-secret

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=key
AWS_SECRET_ACCESS_KEY=secret
```

---

## Testing the Connection

### Test Backend Health

```bash
# From your local machine (through EC2 tunnel or ALB)
curl -X GET http://alb-endpoint/api/health

# Response should be:
# {"status":"ok"}
```

### Test Frontend API Calls

```bash
# Deploy frontend and check Network tab in browser DevTools
# All API calls should go to ALB endpoint
# Status codes should be 200 (success) or 401 (unauthorized if not logged in)
```

### Monitor with CloudWatch

```bash
# ALB Target Health
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:us-east-1:123456789:targetgroup/aramco-backend-targets/abc123

# EC2 Logs
aws logs tail /aws/ec2/aramco-backend --follow

# RDS Logs
aws rds describe-db-logs --db-instance-identifier aramco-db
```

---

## Security Best Practices

✅ **Implemented:**
- ✓ No ngrok (no exposed public tunnels)
- ✓ Private subnets for backend
- ✓ Security groups restrict traffic
- ✓ ALB handles HTTPS termination
- ✓ VPC isolation between tiers
- ✓ IAM roles for EC2 instance
- ✓ Encryption in transit (HTTPS)
- ✓ Encryption at rest (S3, RDS)

**Additional Steps:**
- [ ] Enable AWS WAF on CloudFront
- [ ] Enable VPC Flow Logs
- [ ] Set up CloudTrail for auditing
- [ ] Use Secrets Manager for credentials
- [ ] Enable MFA for AWS console access

---

## Cost Analysis

| Service | Monthly Cost |
|---------|--------------|
| S3 (Frontend) | ~$0.50 |
| CloudFront | ~$0.85/GB (first 10GB free) |
| ALB | ~$16 |
| EC2 (t3.medium) | ~$30 |
| RDS (t3.micro) | ~$50 |
| Data Transfer | ~$5 |
| **Total** | **~$100/month** |

*Compared to ngrok which costs $120/month for basic*

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | Check security group rules, EC2 health |
| Slow API responses | Check EC2 CPU/Memory, RDS connections |
| CORS errors | Update CORS_ORIGINS env var |
| Connection refused | Verify ALB target is healthy |
| DNS resolution fails | Check Route 53 private zone |

---

## Next Steps

1. ✅ Create ALB
2. ✅ Deploy backend to EC2
3. ✅ Configure security groups
4. ✅ Update frontend environment
5. ✅ Rebuild and deploy frontend
6. ✅ Create CloudFront distribution
7. ✅ Test end-to-end connectivity
8. ✅ Set up monitoring and alerts

**Questions?** Check AWS documentation or ask in the AWS console chat.
