# Manual ALB Setup via AWS Console

Since your IAM user lacks ELBv2 permissions, you'll need to use the AWS Management Console OR ask an admin to grant permissions.

## Quick Path: Request Admin to Grant ELBv2 Permissions

Ask your AWS administrator to run this command (they need Admin access):

```bash
aws iam attach-user-policy \
  --user-name aramco \
  --policy-arn arn:aws:iam::aws:policy/ElasticLoadBalancingFullAccess
```

After that, run: `PowerShell -ExecutionPolicy Bypass -File setup-alb-complete.ps1`

---

## Alternative: Manual Setup via AWS Console

If you can't wait for admin approval, follow these manual steps:

### Step 1: Create ALB Security Group
1. Go to AWS Console → EC2 → Security Groups
2. Click "Create security group"
3. Fill in:
   - Name: `aramco-alb-sg`
   - Description: `Security group for ALB`
   - VPC: Select `vpc-0f922cff9f0b598be`
4. Add Inbound Rules:
   - Type: HTTP, Port: 80, Source: 0.0.0.0/0
   - Type: HTTPS, Port: 443, Source: 0.0.0.0/0
5. Click "Create security group"
6. **Note down the Security Group ID** (sg-xxxxxxxx)

### Step 2: Create Backend Security Group
1. Go to AWS Console → EC2 → Security Groups
2. Click "Create security group"
3. Fill in:
   - Name: `aramco-backend-sg`
   - Description: `Backend EC2 instances`
   - VPC: Select `vpc-0f922cff9f0b598be`
4. Add Inbound Rules:
   - Type: Custom TCP, Port: 3000, Source: Select the ALB SG you just created
   - Type: SSH, Port: 22, Source: 0.0.0.0/0
5. Click "Create security group"
6. **Note down the Security Group ID** (sg-xxxxxxxx)

### Step 3: Assign Backend SG to EC2 Instance
1. Go to AWS Console → EC2 → Instances
2. Find your backend instance in VPC `vpc-0f922cff9f0b598be`
3. Right-click → Security → Change security groups
4. Select the `aramco-backend-sg` you created
5. Click "Assign security groups"

### Step 4: Create Application Load Balancer
1. Go to AWS Console → EC2 → Load Balancers
2. Click "Create load balancer"
3. Select "Application Load Balancer"
4. Fill in:
   - Name: `aramco-backend-alb`
   - Scheme: Internal (important!)
   - VPC: `vpc-0f922cff9f0b598be`
5. Availability Zones:
   - Select at least 2 subnets in different AZs
   - Click "Next"
6. Configure Security Groups:
   - Select `aramco-alb-sg`
   - Click "Next"
7. Configure Routing:
   - Click "Create target group"
   - Name: `aramco-backend-targets`
   - Protocol: HTTP, Port: 3000
   - Target type: Instances
   - Click "Next"
8. Register Targets:
   - Select your backend EC2 instance
   - Port: 3000
   - Click "Register"
9. Review and Create
   - Click "Create"
10. **Note down ALB DNS Name** (e.g., `aramco-backend-alb-123456.us-east-1.elb.amazonaws.com`)

### Step 5: Configure Target Group Health Check
1. Go to AWS Console → EC2 → Target Groups
2. Select `aramco-backend-targets`
3. Click "Edit health check settings"
4. Set:
   - Health check path: `/api/health`
   - Interval: 30 seconds
   - Timeout: 5 seconds
   - Healthy threshold: 2
   - Unhealthy threshold: 3
5. Click "Save"

### Step 6: Verify Target Health
1. In Target Groups, select `aramco-backend-targets`
2. Click "Targets" tab
3. Wait 30-60 seconds
4. Status should change to "healthy" ✅

If status stays "unhealthy":
- SSH into EC2 instance
- Check if backend is running: `curl http://localhost:3000/api/health`
- Check security groups allow traffic

### Step 7: Test ALB
```bash
# Get ALB DNS from AWS Console
curl http://aramco-backend-alb-123456.us-east-1.elb.amazonaws.com/api/health

# Should return: {"status":"ok"}
```

### Step 8: Update Frontend .env
1. Open `frontend/.env`
2. Update:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://aramco-backend-alb-123456.us-east-1.elb.amazonaws.com
   ```
   (Replace with your actual ALB DNS)
3. Save

### Step 9: Rebuild and Deploy Frontend
```powershell
cd frontend
npm run build
aws s3 sync .next s3://aramco-reviews-frontend/ --exact-timestamps
```

---

## Checklist

- [ ] ALB Security Group created (`aramco-alb-sg`)
- [ ] Backend Security Group created (`aramco-backend-sg`)
- [ ] Backend EC2 instance assigned to security group
- [ ] Application Load Balancer created (`aramco-backend-alb`)
- [ ] Target Group created (`aramco-backend-targets`)
- [ ] Backend instance registered as target
- [ ] Target health shows "healthy" ✅
- [ ] curl test returns `{"status":"ok"}`
- [ ] frontend/.env updated with ALB DNS
- [ ] Frontend rebuilt
- [ ] Frontend deployed to S3

---

## Save Configuration

After manual setup, create a file `ALB_CONFIG.json`:

```json
{
  "region": "us-east-1",
  "vpc_id": "vpc-0f922cff9f0b598be",
  "alb_name": "aramco-backend-alb",
  "alb_dns": "aramco-backend-alb-123456.us-east-1.elb.amazonaws.com",
  "alb_security_group": "sg-xxxxxxxx",
  "backend_security_group": "sg-xxxxxxxx",
  "target_group_name": "aramco-backend-targets",
  "backend_port": 3000,
  "instance_id": "i-xxxxxxxx",
  "frontend_api_url": "http://aramco-backend-alb-123456.us-east-1.elb.amazonaws.com"
}
```

---

## For Future: Ask Admin to Grant Permissions

Have an AWS Administrator run this:

```bash
# Option 1: Grant ELBv2 Full Access
aws iam attach-user-policy \
  --user-name aramco \
  --policy-arn arn:aws:iam::aws:policy/ElasticLoadBalancingFullAccess

# Option 2: Grant PowerUser (broader access)
aws iam attach-user-policy \
  --user-name aramco \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess
```

After permissions are granted, you can use `setup-alb-complete.ps1` for future deployments.
