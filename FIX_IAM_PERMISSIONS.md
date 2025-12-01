# Fix IAM Permissions for ALB Setup

## Problem
The IAM user `aramco` doesn't have permissions to manage EC2, ELBv2, and related AWS services.

## Solution

You need to attach policies to the `aramco` user. There are 2 options:

### Option 1: Quick Fix (For Testing/Development Only)
Attach PowerUser policy (has most permissions, but not recommended for production):

```bash
aws iam attach-user-policy \
  --user-name aramco \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess
```

### Option 2: Recommended (Least Privilege)
Create a custom policy with only needed permissions:

1. Go to AWS IAM Console: https://console.aws.amazon.com/iam/
2. Click "Users" → Select `aramco` user
3. Click "Add permissions" → "Create inline policy"
4. Select "JSON" tab and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeSubnets",
        "ec2:DescribeSecurityGroups",
        "ec2:CreateSecurityGroup",
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:RevokeSecurityGroupIngress",
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceStatus",
        "ec2:CreateTags",
        "ec2:DeleteSecurityGroup",
        "elasticloadbalancing:CreateLoadBalancer",
        "elasticloadbalancing:DescribeLoadBalancers",
        "elasticloadbalancing:DescribeTargetGroups",
        "elasticloadbalancing:CreateTargetGroup",
        "elasticloadbalancing:RegisterTargets",
        "elasticloadbalancing:DeregisterTargets",
        "elasticloadbalancing:CreateListener",
        "elasticloadbalancing:DescribeListeners",
        "elasticloadbalancing:DescribeTargetHealth",
        "elasticloadbalancing:ModifyListener",
        "elasticloadbalancing:DeleteListener",
        "elasticloadbalancing:DeleteLoadBalancer",
        "elasticloadbalancing:DeleteTargetGroup",
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket",
        "s3:DeleteObject",
        "cloudwatch:PutMetricAlarm",
        "cloudwatch:GetMetricStatistics",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```

5. Click "Review policy"
6. Name it: `ALBSetupPolicy`
7. Click "Create policy"

### Option 3: AWS CLI (If you have admin access)
```bash
# Create the policy document
cat > /tmp/alb-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "elasticloadbalancing:*",
        "s3:*",
        "cloudwatch:*",
        "logs:*"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Create policy
aws iam create-policy \
  --policy-name ALBSetupPolicy \
  --policy-document file:///tmp/alb-policy.json

# Attach to user
aws iam attach-user-policy \
  --user-name aramco \
  --policy-arn arn:aws:iam::868433374871:policy/ALBSetupPolicy
```

## After Fixing Permissions

Once permissions are attached, run the complete setup script:

```powershell
PowerShell -ExecutionPolicy Bypass -File setup-alb-complete.ps1
```

This will:
1. ✅ Get your VPC subnets
2. ✅ Create ALB security group
3. ✅ Create backend security group
4. ✅ Create Application Load Balancer
5. ✅ Create target group with health checks
6. ✅ Find and register EC2 instance
7. ✅ Create ALB listener
8. ✅ Test ALB connectivity
9. ✅ Save configuration to ALB_CONFIG.json
10. ✅ Update frontend .env
11. ✅ Rebuild frontend
12. ✅ Deploy frontend to S3

---

## If You Can't Fix IAM Permissions

If you don't have access to modify IAM policies, ask your AWS administrator to:
1. Attach `PowerUserAccess` policy to user `aramco`
2. Or attach the custom `ALBSetupPolicy` from Option 2 above

Then run the setup script.

---

## Verify Permissions Work

Test if permissions are fixed:

```bash
aws ec2 describe-subnets --region us-east-1 --query 'Subnets[0].SubnetId' --output text
```

If this returns a Subnet ID, permissions are fixed! ✅
