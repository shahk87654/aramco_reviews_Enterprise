# ALB Setup - Permission Status & Next Steps

## Current Status ⚠️

Your AWS IAM user `aramco` has:
- ✅ S3 Permissions (can deploy frontend)
- ✅ Partial EC2 Permissions  
- ❌ ELBv2 Permissions (needed for ALB)
- ❌ IAM Permissions (can't self-fix)

## What You Need

To create the Application Load Balancer, you need ELBv2 permissions.

## 3 Options to Move Forward

### Option 1: Request AWS Admin (RECOMMENDED) ⭐
**Best for: Production environments, team workflows**

Send this to your AWS account administrator:

> "Please grant the IAM user `aramco` (ARN: `arn:aws:iam::868433374871:user/aramco`) the following permissions:
> 
> Policy ARN: `arn:aws:iam::aws:policy/ElasticLoadBalancingFullAccess`
> 
> Command to execute (requires admin credentials):
> ```bash
> aws iam attach-user-policy \
>   --user-name aramco \
>   --policy-arn arn:aws:iam::aws:policy/ElasticLoadBalancingFullAccess
> ```
> 
> After this, I can automatically deploy the ALB using the setup script."

**After permissions granted:**
```powershell
PowerShell -ExecutionPolicy Bypass -File setup-alb-complete.ps1
```

---

### Option 2: Manual AWS Console Setup 
**Best for: Immediate setup, learning AWS console**

Follow step-by-step instructions in: **MANUAL_ALB_CONSOLE_SETUP.md**

This guide walks you through:
1. Creating security groups ✅
2. Creating the ALB manually ✅
3. Setting up target groups ✅
4. Testing connectivity ✅
5. Updating frontend ✅

Estimated time: 15-20 minutes

---

### Option 3: Use Admin Credentials Temporarily
**Best for: Urgent deployments, development**

If you have access to AWS console with admin credentials:

1. Sign in with admin account
2. Go to: https://console.aws.amazon.com/iam/
3. Navigate to Users → `aramco`
4. Click "Add permissions" → "Attach existing policies"
5. Search for: `ElasticLoadBalancingFullAccess`
6. Click "Attach policies"
7. Wait 1-2 minutes for permissions to propagate
8. Sign back in as `aramco` user
9. Run: `PowerShell -ExecutionPolicy Bypass -File setup-alb-complete.ps1`

---

## Files Created for You

| File | Purpose |
|------|---------|
| `setup-alb-complete.ps1` | Automated setup (requires ELBv2 permissions) |
| `ALB_MANUAL_SETUP.md` | Step-by-step CLI commands |
| `MANUAL_ALB_CONSOLE_SETUP.md` | Step-by-step AWS Console instructions |
| `FIX_IAM_PERMISSIONS.md` | Detailed permission fixing guide |
| `check-iam-permissions.ps1` | Automated permission checker |

---

## What These Scripts Do

### `setup-alb-complete.ps1` (Automated - Requires ELBv2 permissions)
✅ Identifies subnets in your VPC
✅ Creates security groups (ALB + Backend)
✅ Creates Application Load Balancer
✅ Creates target group with health checks
✅ Finds and registers your EC2 instance
✅ Creates listener (port 80 → port 3000)
✅ Tests ALB connectivity
✅ Updates frontend .env
✅ Rebuilds frontend
✅ Deploys frontend to S3
✅ Saves configuration to ALB_CONFIG.json

**Time to complete: 3-5 minutes**

---

## After ALB is Created

Regardless of which method you use (automated, manual console, or CLI), here's what happens next:

### 1. Backend Deployment (You need to do this)
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@<instance-ip>

# Clone backend repo (if not already done)
git clone <your-backend-repo>
cd backend

# Create .env.production
cat > .env.production << EOF
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/db
JWT_SECRET=your-secret-key
CORS_ORIGINS=https://your-cloudfront-domain.cloudfront.net
NODE_ENV=production
EOF

# Build and run
npm install
npm run build
npm run start:prod
```

Or use Docker:
```bash
docker build -t aramco-backend .
docker run -d -p 3000:3000 --env-file .env.production aramco-backend
```

### 2. Test ALB Health Check
```bash
curl http://<ALB-DNS>/api/health
# Should return: {"status":"ok"}
```

### 3. Test Frontend → Backend Connection
1. Visit your frontend (S3 URL)
2. Open browser DevTools (F12)
3. Check Network tab
4. Verify requests go to ALB endpoint
5. Check response is successful

### 4. Monitor Health
```bash
# Watch target health continuously
while true; do
  aws elbv2 describe-target-health \
    --target-group-arn $TG_ARN \
    --region us-east-1 \
    --query 'TargetHealthDescriptions[*].[Target.Id,TargetHealth.State]' \
    --output table
  sleep 5
done
```

---

## Recommendation

**I suggest Option 1 (Request Admin)** because:
1. Most secure approach (least privilege)
2. Reusable for future deployments
3. Takes 5 minutes for admin to do
4. Enables full automation for your team

Then use `setup-alb-complete.ps1` which handles everything automatically.

---

## Questions?

- **Q: How long does the admin permission grant take?**
  A: 2-5 minutes, then 1-2 more minutes for AWS to propagate

- **Q: Can I do this without admin?**
  A: Yes, use MANUAL_ALB_CONSOLE_SETUP.md (15-20 minutes via AWS Console)

- **Q: What if ELBv2 permission request is denied?**
  A: Ask for `PowerUserAccess` instead, which includes ELBv2 + more

- **Q: Is the automated script safe?**
  A: Yes, it only creates internal load balancers in your private VPC

- **Q: Can I undo/delete the ALB?**
  A: Yes, included in the troubleshooting section of scripts

---

## Next Action

Choose ONE of these 3 paths:

**Option 1 (Admin):** Forward the admin request above and wait for response
**Option 2 (Console):** Open MANUAL_ALB_CONSOLE_SETUP.md and follow steps
**Option 3 (Temporary Admin):** Use admin credentials to grant permissions

Let me know which path you want to take! 🚀
