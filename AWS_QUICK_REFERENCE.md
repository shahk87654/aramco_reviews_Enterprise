# AWS Secure Connection - Quick Reference Card

## 🎯 One-Minute Overview

**Problem:** ngrok exposes your backend to the public internet  
**Solution:** AWS native security with private backend + ALB

**What changes:**
- Frontend API endpoint: `https://unstereotyped-presubsistent-madilynn.ngrok-free.dev` → `http://aramco-backend-alb-xxxxx.us-east-1.elb.amazonaws.com`
- Backend stays private (no public IP)
- Everything encrypted and secure

---

## ⚡ 10-Minute Setup (TL;DR)

```bash
# 1. Create VPC with private subnet
aws ec2 create-vpc --cidr-block 10.0.0.0/16
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24

# 2. Launch EC2 in private subnet
aws ec2 run-instances --instance-type t3.medium --subnet-id subnet-xxx

# 3. Create RDS database
aws rds create-db-instance --db-instance-identifier aramco-db

# 4. Setup ALB
bash setup-aws-infrastructure.sh

# 5. Deploy backend to EC2
# Use AWS Systems Manager Session Manager (no SSH needed)
aws ssm start-session --target i-xxxxx

# 6. Update frontend .env
NEXT_PUBLIC_API_BASE_URL=http://alb-dns

# 7. Rebuild frontend
cd frontend && npm run build && aws s3 sync .next s3://aramco-reviews-frontend/

# 8. Create CloudFront
# Use AWS Console for this (1 click)
```

Done! 🎉

---

## 📊 Architecture in 30 Seconds

```
Browser
   ↓
CloudFront (CDN + HTTPS)
   ↓
S3 (Frontend)
   ↓ [Inside AWS VPC - Private]
ALB (Router)
   ↓
EC2 Private (Backend)
   ↓
RDS Private (Database)
```

**Key Difference from ngrok:**
- With ngrok: Public tunnel exposed to internet ❌
- With ALB: Private subnet, only accessible from CloudFront/S3 ✅

---

## 🔐 Security Matrix

| Layer | ngrok | AWS ALB |
|-------|:-----:|:-------:|
| Public Exposure | ❌ | ✅ |
| Encryption | ⚠️ | ✅ |
| IP Filtering | ❌ | ✅ |
| DDoS Protection | ❌ | ✅ |
| Cost | 💰 $120/mo | 💰 $106/mo |

---

## 📝 Configuration Files

### frontend/.env
```env
NEXT_PUBLIC_API_BASE_URL=http://aramco-backend-alb-12345.us-east-1.elb.amazonaws.com
```

### backend/.env
```env
CORS_ORIGINS=https://d123.cloudfront.net
DATABASE_URL=postgresql://postgres:pwd@rds-endpoint:5432/aramco_reviews
```

---

## 🧪 Quick Tests

```bash
# Test backend (from EC2)
curl http://localhost:3000/api/health

# Test from ALB
curl http://alb-dns/api/health

# Test from browser DevTools
# Network tab → check API calls go to ALB endpoint
```

---

## 🚨 Troubleshooting (30 seconds)

| Problem | Fix |
|---------|-----|
| 502 Bad Gateway | Check EC2 security group: Allow ALB → EC2 port 3000 |
| CORS Error | Update `CORS_ORIGINS` in backend .env |
| Can't connect to EC2 | Use `aws ssm start-session --target i-xxxxx` |
| Slow response | Check EC2 CPU: `top` |
| DB connection fails | Check RDS SG: Allow EC2 → RDS port 5432 |

---

## 💬 Command Reference

```bash
# SSH alternative (doesn't require keys)
aws ssm start-session --target i-xxxxx

# Test ALB endpoint
aws elbv2 describe-target-health --target-group-arn arn:aws:...

# Check backend logs
docker logs aramco-backend

# Monitor EC2
aws cloudwatch get-metric-statistics --metric-name CPUUtilization ...

# Deploy frontend
aws s3 sync .next s3://aramco-reviews-frontend/ --exact-timestamps

# Check ALB DNS
aws elbv2 describe-load-balancers --names aramco-backend-alb
```

---

## 📋 Pre-Flight Checklist

- [ ] AWS credentials configured: `aws configure`
- [ ] VPC created with private subnet
- [ ] EC2 instance launched
- [ ] RDS database created
- [ ] Security groups configured
- [ ] ALB + Target Group created
- [ ] Backend deployed to EC2
- [ ] Frontend .env updated with ALB DNS
- [ ] Frontend rebuilt and deployed
- [ ] CloudFront distribution created
- [ ] Health checks passing

---

## 🎓 Learning Resources

1. **AWS_COMPLETE_SETUP_GUIDE.md** - Full guide (read this!)
2. **AWS_SECURE_BACKEND_FRONTEND_CONNECTION.md** - Architecture details
3. AWS Docs: https://docs.aws.amazon.com/ec2/
4. ALB: https://docs.aws.amazon.com/elasticloadbalancing/latest/application/

---

## 💡 Pro Tips

### Tip 1: Never Use Public Endpoints for Backend
Always use private subnets + security groups

### Tip 2: Keep Secrets in AWS Secrets Manager
```bash
aws secretsmanager create-secret --name aramco/db-password
```

### Tip 3: Monitor Everything
Setup CloudWatch alarms for CPU, disk, connections

### Tip 4: Automate with Terraform (Advanced)
Infrastructure as Code = reproducible, version-controlled

---

## ✅ When You're Done

Your system should have:
- ✅ Backend in private subnet (no public IP)
- ✅ Database in private subnet
- ✅ Frontend on S3 behind CloudFront
- ✅ Secure internal connection via ALB
- ✅ HTTPS for all public connections
- ✅ Security groups restricting all access
- ✅ No ngrok exposing your backend

**You're production-ready! 🚀**

---

## ❓ Quick Q&A

**Q: Do I need ngrok anymore?**
A: No! AWS ALB replaces it (and it's more secure + cheaper)

**Q: Will this work for production?**
A: Yes! This is enterprise-grade security

**Q: How much does it cost?**
A: ~$106/month (vs $130 with ngrok)

**Q: Can I still develop locally?**
A: Yes! Change `.env` to `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000`

**Q: How do I access the backend from the internet?**
A: Through CloudFront → S3 → ALB (never directly to backend)

**Q: What if EC2 goes down?**
A: ALB will show 502 error. Health checks will auto-remove it from rotation once you add more instances

**Q: Is the connection encrypted?**
A: Yes! CloudFront uses HTTPS. ALB uses internal VPC. Everything encrypted.

---

**Need help? Read AWS_COMPLETE_SETUP_GUIDE.md** ⬆️
