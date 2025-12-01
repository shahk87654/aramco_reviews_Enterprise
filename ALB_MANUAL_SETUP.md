# Complete Manual ALB Setup Guide

## Prerequisites ✅

Before starting, you need:
- ✅ AWS Account with CLI configured
- ✅ VPC ID: `vpc-0f922cff9f0b598be`
- ✅ EC2 Instance ID (backend server)
- ✅ At least 2 subnets in different AZs (public subnets for ALB)
- ✅ RDS endpoint (if using database)

---

## Step 1: Identify Your Subnets

First, get your VPC's subnets for ALB placement:

```bash
# List all subnets in your VPC
aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=vpc-0f922cff9f0b598be" \
  --region us-east-1 \
  --query 'Subnets[*].[SubnetId,AvailabilityZone,CidrBlock]' \
  --output table
```

**Expected Output:**
```
| Subnet ID          | Availability Zone | CIDR Block    |
|--------------------+------------------+--------------|
| subnet-12345678    | us-east-1a       | 10.0.1.0/24   |
| subnet-87654321    | us-east-1b       | 10.0.2.0/24   |
```

📝 **Note down your 2 subnet IDs** (preferably in different AZs)

---

## Step 2: Create Security Groups

### 2a. ALB Security Group

```bash
# Create ALB security group
ALB_SG=$(aws ec2 create-security-group \
  --group-name aramco-alb-sg \
  --description "ALB for Aramco Reviews Backend" \
  --vpc-id vpc-0f922cff9f0b598be \
  --region us-east-1 \
  --query 'GroupId' \
  --output text)

echo "ALB Security Group: $ALB_SG"
```

**Save this ID:** `sg-xxxxxxxx` (you'll need it)

### 2b. Allow HTTP Traffic to ALB

```bash
# Allow HTTP (port 80)
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region us-east-1

echo "✅ HTTP (port 80) allowed"
```

### 2c. Allow HTTPS Traffic to ALB (Optional - for production)

```bash
# Allow HTTPS (port 443)
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0 \
  --region us-east-1

echo "✅ HTTPS (port 443) allowed"
```

### 2d. Backend Security Group

```bash
# If you already have one, get its ID
# Or create a new one:
BACKEND_SG=$(aws ec2 create-security-group \
  --group-name aramco-backend-sg \
  --description "Backend EC2 instances" \
  --vpc-id vpc-0f922cff9f0b598be \
  --region us-east-1 \
  --query 'GroupId' \
  --output text)

echo "Backend Security Group: $BACKEND_SG"
```

### 2e. Allow ALB → Backend Communication

```bash
# Allow port 3000 from ALB to backend
aws ec2 authorize-security-group-ingress \
  --group-id $BACKEND_SG \
  --protocol tcp \
  --port 3000 \
  --source-security-group-id $ALB_SG \
  --region us-east-1

echo "✅ ALB can reach backend on port 3000"
```

### 2f. Allow SSH to Backend (for debugging)

```bash
# Allow SSH access (optional, for management)
aws ec2 authorize-security-group-ingress \
  --group-id $BACKEND_SG \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0 \
  --region us-east-1

echo "✅ SSH (port 22) allowed"
```

---

## Step 3: Create Application Load Balancer

```bash
# Create the ALB
ALB=$(aws elbv2 create-load-balancer \
  --name aramco-backend-alb \
  --subnets subnet-12345678 subnet-87654321 \
  --security-groups $ALB_SG \
  --scheme internal \
  --type application \
  --region us-east-1)

# Extract ALB ARN
ALB_ARN=$(echo $ALB | jq -r '.LoadBalancers[0].LoadBalancerArn')
ALB_DNS=$(echo $ALB | jq -r '.LoadBalancers[0].DNSName')

echo "ALB ARN: $ALB_ARN"
echo "ALB DNS: $ALB_DNS"
```

⚠️ **Replace `subnet-12345678 subnet-87654321`** with your actual subnet IDs from Step 1

📝 **Save these values:**
- ALB ARN
- ALB DNS (e.g., `aramco-backend-alb-123456.us-east-1.elb.amazonaws.com`)

---

## Step 4: Create Target Group

Target groups define where traffic is sent.

```bash
# Create target group
TG=$(aws elbv2 create-target-group \
  --name aramco-backend-targets \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-0f922cff9f0b598be \
  --health-check-protocol HTTP \
  --health-check-path /api/health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --matcher HttpCode=200 \
  --region us-east-1)

# Extract Target Group ARN
TG_ARN=$(echo $TG | jq -r '.TargetGroups[0].TargetGroupArn')

echo "Target Group ARN: $TG_ARN"
```

📝 **Save this ARN** - you'll use it to register instances

---

## Step 5: Register EC2 Instance as Target

```bash
# Register your EC2 instance
# Replace i-1234567890abcdef0 with your EC2 instance ID
INSTANCE_ID="i-1234567890abcdef0"

aws elbv2 register-targets \
  --target-group-arn $TG_ARN \
  --targets Id=$INSTANCE_ID,Port=3000 \
  --region us-east-1

echo "✅ Instance $INSTANCE_ID registered to target group"
```

⚠️ **Replace `i-1234567890abcdef0`** with your actual EC2 instance ID

### Verify Target Registration:

```bash
# Check target health
aws elbv2 describe-target-health \
  --target-group-arn $TG_ARN \
  --region us-east-1 \
  --query 'TargetHealthDescriptions[*].[Target.Id,TargetHealth.State,TargetHealth.Reason]' \
  --output table
```

**Expected Output:**
```
| Instance ID           | State        | Reason                      |
|-----------------------+--------------+-----------------------------|
| i-1234567890abcdef0  | healthy      | N/A                         |
```

⏳ **Wait 30-60 seconds** if it shows "initializing" - ALB performs health checks

---

## Step 6: Create ALB Listener

Listeners route traffic from ALB to target groups.

```bash
# Create listener on port 80
LISTENER=$(aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN \
  --region us-east-1)

LISTENER_ARN=$(echo $LISTENER | jq -r '.Listeners[0].ListenerArn')

echo "✅ Listener created: $LISTENER_ARN"
echo "✅ Traffic on port 80 → Target Group → Backend port 3000"
```

### Verify Listener:

```bash
aws elbv2 describe-listeners \
  --load-balancer-arn $ALB_ARN \
  --region us-east-1 \
  --query 'Listeners[*].[ListenerArn,Port,Protocol]' \
  --output table
```

---

## Step 7: Test the ALB

### 7a. Get ALB DNS Name

```bash
# Get ALB endpoint
aws elbv2 describe-load-balancers \
  --names aramco-backend-alb \
  --region us-east-1 \
  --query 'LoadBalancers[0].DNSName' \
  --output text
```

**Output:** `aramco-backend-alb-123456.us-east-1.elb.amazonaws.com`

### 7b. Test from Your Local Machine

```bash
# Test the backend health endpoint
curl http://aramco-backend-alb-123456.us-east-1.elb.amazonaws.com/api/health
```

**Expected Response:**
```json
{"status":"ok"}
```

### 7c. Test with Verbose Output (Debug)

```bash
# Verbose curl to see all details
curl -v http://aramco-backend-alb-123456.us-east-1.elb.amazonaws.com/api/health

# Or using wget
wget -O- http://aramco-backend-alb-123456.us-east-1.elb.amazonaws.com/api/health
```

---

## Step 8: Update Frontend Configuration

Now update your frontend to use the ALB endpoint.

### 8a. Update frontend/.env

```bash
cd frontend
cat > .env << EOF
NEXT_PUBLIC_API_BASE_URL=http://aramco-backend-alb-123456.us-east-1.elb.amazonaws.com
NEXT_PUBLIC_APP_NAME=Aramco Reviews Enterprise
NEXT_PUBLIC_APP_VERSION=1.0.0
EOF
```

⚠️ **Replace the ALB DNS name** with your actual endpoint

### 8b. Rebuild Frontend

```bash
npm run build
```

### 8c. Deploy to S3

```bash
aws s3 sync .next s3://aramco-reviews-frontend/ --exact-timestamps
```

---

## Step 9: Monitor ALB Health

### Check Target Health Continuously:

```bash
# Watch target health every 5 seconds
watch -n 5 'aws elbv2 describe-target-health \
  --target-group-arn $TG_ARN \
  --region us-east-1 \
  --query "TargetHealthDescriptions[*].[Target.Id,TargetHealth.State]" \
  --output table'

# Press Ctrl+C to exit
```

### Check ALB Metrics:

```bash
# View target response times
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value=app/aramco-backend-alb/1234567890abcdef \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average \
  --region us-east-1
```

---

## Step 10: Optional - Add HTTPS (Production)

### 10a. Create/Import SSL Certificate in ACM

```bash
# List existing certificates
aws acm list-certificates --region us-east-1

# Or request a new certificate (requires domain verification)
aws acm request-certificate \
  --domain-name api.aramco-reviews.com \
  --validation-method DNS \
  --region us-east-1
```

### 10b. Add HTTPS Listener

```bash
# Add HTTPS listener
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:us-east-1:123456789:certificate/xxxxx \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN \
  --region us-east-1
```

### 10c. Redirect HTTP to HTTPS

```bash
# Modify HTTP listener to redirect to HTTPS
aws elbv2 modify-listener \
  --listener-arn $LISTENER_ARN \
  --default-actions Type=redirect,RedirectConfig="{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}" \
  --region us-east-1
```

---

## Troubleshooting

### Issue 1: "Targets are Unhealthy"

```bash
# Check backend is running
aws ssm start-session --target i-1234567890abcdef0
# Inside EC2:
curl http://localhost:3000/api/health

# Check security group rules
aws ec2 describe-security-groups \
  --group-ids $BACKEND_SG \
  --region us-east-1 \
  --query 'SecurityGroups[0].IpPermissions' \
  --output table
```

### Issue 2: "502 Bad Gateway"

```bash
# Check if backend is responding
curl http://$(aws ssm start-session --target i-1234567890abcdef0)
# Need to SSH/Session Manager into EC2 to debug

# Check ALB logs (enable if needed)
aws elbv2 describe-load-balancer-attributes \
  --load-balancer-arn $ALB_ARN \
  --region us-east-1
```

### Issue 3: "Can't Connect to ALB"

```bash
# Verify ALB security group allows your traffic
aws ec2 describe-security-groups \
  --group-ids $ALB_SG \
  --region us-east-1 \
  --query 'SecurityGroups[0].IpPermissions' \
  --output table

# Test from same VPC
# SSH into any EC2 in VPC and try:
curl http://alb-dns/api/health
```

---

## Summary of Key IDs to Save

```
AWS Region: us-east-1
VPC ID: vpc-0f922cff9f0b598be

ALB Security Group: sg-xxxxxxxx
Backend Security Group: sg-xxxxxxxx
RDS Security Group: sg-xxxxxxxx

ALB ARN: arn:aws:elasticloadbalancing:us-east-1:123456789:loadbalancer/app/aramco-backend-alb/1234567890abcdef
ALB DNS: aramco-backend-alb-123456.us-east-1.elb.amazonaws.com

Target Group ARN: arn:aws:elasticloadbalancing:us-east-1:123456789:targetgroup/aramco-backend-targets/1234567890abcdef
Target Group Name: aramco-backend-targets

Listener ARN: arn:aws:elasticloadbalancing:us-east-1:123456789:listener/app/aramco-backend-alb/1234567890abcdef/1234567890abcdef

EC2 Instance ID: i-1234567890abcdef0

Frontend Environment: NEXT_PUBLIC_API_BASE_URL=http://aramco-backend-alb-123456.us-east-1.elb.amazonaws.com
```

---

## Quick Commands Cheat Sheet

```bash
# List all ALBs
aws elbv2 describe-load-balancers --region us-east-1

# List all target groups
aws elbv2 describe-target-groups --region us-east-1

# Check target health
aws elbv2 describe-target-health --target-group-arn $TG_ARN --region us-east-1

# View listeners
aws elbv2 describe-listeners --load-balancer-arn $ALB_ARN --region us-east-1

# Deregister a target
aws elbv2 deregister-targets --target-group-arn $TG_ARN --targets Id=i-xxxxx,Port=3000

# Delete ALB
aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN

# Delete target group
aws elbv2 delete-target-group --target-group-arn $TG_ARN
```

---

## Next Steps

1. ✅ Run Steps 1-9 above
2. ✅ Verify ALB is working with curl test
3. ✅ Update frontend .env
4. ✅ Rebuild frontend
5. ✅ Deploy frontend to S3
6. ✅ Test frontend connections
7. ⭐ (Optional) Add HTTPS with ACM certificate

**You're done! Your ALB is now routing traffic securely.** 🎉
