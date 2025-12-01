# 🌐 Frontend Access Guide

## Quick Access

**Your frontend is now live at:**

```
http://aramco-reviews-frontend.s3-website-us-east-1.amazonaws.com
```

👆 **Copy this URL to your browser!**

---

## Available Access Methods

### 1️⃣ **S3 Website Endpoint** (RECOMMENDED)
```
http://aramco-reviews-frontend.s3-website-us-east-1.amazonaws.com
```
- ✅ Simplest URL
- ✅ Works over HTTP
- ✅ Automatic index.html routing
- ✅ 404.html error handling

### 2️⃣ **S3 Direct HTTPS URL**
```
https://s3.amazonaws.com/aramco-reviews-frontend/index.html
```
- ✅ HTTPS support
- ✅ Works directly with S3
- ⚠️ Requires full path to index.html

### 3️⃣ **CloudFront Distribution** (if configured)
- Check AWS Console → CloudFront → Distributions
- Look for origin pointing to `aramco-reviews-frontend`
- CloudFront URL will be provided there

---

## Frontend Configuration

**Environment Variables Used:**
```
NEXT_PUBLIC_API_BASE_URL=http://<ALB_DNS>
NEXT_PUBLIC_APP_NAME=Aramco Reviews Enterprise
NEXT_PUBLIC_APP_VERSION=1.0.0
```

Your frontend connects to the backend via the **Application Load Balancer**.

---

## AWS S3 Bucket Details

| Property | Value |
|----------|-------|
| **Bucket Name** | `aramco-reviews-frontend` |
| **Region** | `us-east-1` |
| **Website Hosting** | ✅ Enabled |
| **Index Document** | `index.html` |
| **Error Document** | `404.html` |
| **Public Access** | ✅ Enabled |

---

## Deployment Status

| Component | Status |
|-----------|--------|
| Frontend Build | ✅ Complete (0 errors, 3 warnings) |
| S3 Upload | ✅ Complete (150+ files) |
| Website Hosting | ✅ Enabled |
| Public Access | ✅ Configured |

---

## Testing the Frontend

### Test in Browser
1. Open: `http://aramco-reviews-frontend.s3-website-us-east-1.amazonaws.com`
2. Should see: Aramco Reviews Enterprise dashboard
3. Backend calls should route through ALB

### Test API Connection
Open browser console (F12) and check:
- No CORS errors
- API calls going to `http://<ALB_DNS>/api/...`

### Troubleshooting

**If page doesn't load:**
- Clear browser cache
- Try incognito/private mode
- Check S3 bucket has public read access

**If CORS errors appear:**
- Verify ALB is running
- Check backend security groups allow ALB traffic
- Verify CORS_ORIGINS environment variable on backend

**If images/styles missing:**
- Check S3 sync completed successfully
- Verify `_next/static` files are in S3 bucket

---

## Next Steps

1. ✅ **Access your frontend** at the URL above
2. ✅ **Test login/authentication** with your backend
3. ⭐ **(Optional) Set up CloudFront** for HTTPS and CDN
4. ⭐ **(Optional) Get custom domain** via Route 53

---

## Quick Commands

```bash
# Check S3 bucket contents
aws s3 ls s3://aramco-reviews-frontend --recursive

# View bucket website config
aws s3api get-bucket-website --bucket aramco-reviews-frontend

# Sync new build
aws s3 sync frontend/.next/static s3://aramco-reviews-frontend/static --exact-timestamps

# Get bucket policy
aws s3api get-bucket-policy --bucket aramco-reviews-frontend
```

---

**Frontend deployed successfully! 🎉**
