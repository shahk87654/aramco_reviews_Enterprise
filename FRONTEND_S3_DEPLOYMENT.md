# Frontend Deployment to AWS S3 & CloudFront

This guide covers deploying your Next.js frontend to AWS S3 with CloudFront CDN for free tier hosting.

---

## Step 1: Build Frontend

### Option A: Build Locally

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not done)
npm install

# Build for production
npm run build

# Expected output:
# ✓ Compiled successfully
# ○ Prerendered as static files
# You can now deploy the `.next` folder
```

### Option B: Build on EC2

```bash
# SSH into EC2
ssh -i "aramco.pem" ec2-user@ec2-3-226-97-116.compute-1.amazonaws.com

# Install Node.js if not present
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Build frontend
cd /home/ec2-user/aramco_reviews_Enterprise/frontend
npm install
npm run build

# Verify build output
ls -la .next/
```

---

## Step 2: Create S3 Bucket

### Via AWS Console

1. Go to **S3 Dashboard** → **Create bucket**
2. **Bucket name:** `aramco-reviews-frontend` (must be globally unique)
   - Use format: `aramco-reviews-frontend-<random-id>`
3. **Region:** Same as your EC2 (us-east-1)
4. **Block Public Access settings:** 
   - ❌ Uncheck "Block all public access"
   - ✅ Confirm you want to allow public access
5. Click **Create bucket**

### Via AWS CLI
-----------------------------------------------------------
```bash
aws s3 mb s3://aramco-reviews-frontend-$(date +%s) --region us-east-1
```----------------------------------------------------

---

## Step 3: Configure S3 Bucket for Static Website Hosting

1. Go to **S3 Dashboard** → Click your bucket → **Properties** tab
2. Scroll to **Static website hosting** section
3. Click **Edit**:
   - ✅ Enable static website hosting
   - **Hosting type:** Host a static website
   - **Index document:** `index.html`
   - **Error document:** `404.html` (for Next.js routing)
4. Click **Save changes**

**Note the endpoint:** Format will be `http://bucket-name.s3-website-us-east-1.amazonaws.com`
arn:aws:s3:::aramco-reviews-frontend
---

## Step 4: Update S3 Bucket Policy

1. Go to **S3 Dashboard** → Your bucket → **Permissions** tab
2. Scroll to **Bucket policy**
3. Click **Edit**
4. Paste this policy (replace `YOUR-BUCKET-NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

5. Click **Save changes**

---
-----------------------------------------------------------------------------------------------------------------------------------
## Step 5: Upload Frontend Build to S3

### Option A: Using AWS Console

1. Open your S3 bucket
2. Click **Upload**
3. Select the `.next` folder contents (or build output)
4. Click **Upload**

**Important:** Upload the **contents** of `.next`, not the folder itself.

### Option B: Using AWS CLI

```bash
# From your local machine (in the frontend directory)
cd frontend

# Sync build to S3
aws s3 sync .next/ s3://aramco-reviews-frontend/ --delete

# Or upload the entire build
aws s3 cp .next s3://aramco-reviews-frontend/ --recursive
```

### Option C: Using AWS CLI from EC2

```bash
# SSH into EC2
ssh -i "aramco.pem" ec2-user@ec2-3-226-97-116.compute-1.amazonaws.com

# Install AWS CLI if not present
sudo yum install -y aws-cli

# Configure AWS credentials
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Default region: us-east-1
# Default output: json

# Navigate to frontend
cd /home/ec2-user/aramco_reviews_Enterprise/frontend

# Sync build to S3
aws s3 sync .next/ s3://aramco-reviews-frontend/ --delete
```

---

## Step 6: Create CloudFront Distribution (Optional but Recommended)

CloudFront provides free tier CDN with 1 TB/month data transfer.

### Via AWS Console

1. Go to **CloudFront Dashboard** → **Create distribution**
2. **Origin configuration:**
   - **Origin domain:** Select your S3 bucket
   - **S3 access:** Use CloudFront Origin Access Identity (OAI)
3. **Default cache behavior:**
   - **Compress objects automatically:** ✅ Enable
   - **Viewer protocol policy:** Redirect HTTP to HTTPS
   - **Allowed HTTP methods:** GET, HEAD, OPTIONS
4. **Settings:**
   - **Price class:** Use all edge locations
5. Click **Create distribution**

**Note the domain name:** `d123abc.cloudfront.net`

### Update CloudFront OAI Bucket Policy

1. After distribution is created, go back to your **S3 bucket**
2. Update bucket policy with CloudFront OAI ARN (provided in CloudFront settings)
3. This restricts S3 access to CloudFront only

---

## Step 7: Configure Frontend API Endpoint

Update your Next.js environment variables to point to your backend API:

### Create `.env.production` in frontend directory

```env
NEXT_PUBLIC_API_URL=http://ec2-3-226-97-116.compute-1.amazonaws.com:3000
```

Or for CloudFront:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com:3000
```

### Rebuild and Deploy

```bash
# Rebuild with new environment variables
npm run build

# Deploy to S3
aws s3 sync .next/ s3://aramco-reviews-frontend/ --delete

# Invalidate CloudFront cache (if using)
aws cloudfront create-invalidation --distribution-id D123ABC --paths "/*"
```

---

## Step 8: Access Your Frontend

### Via S3 Static Website URL
- `http://aramco-reviews-frontend.s3-website-us-east-1.amazonaws.com`

### Via CloudFront URL
- `https://d123abc.cloudfront.net`

### Via Custom Domain (Optional)
1. Update Route 53 to point to CloudFront distribution
2. Use AWS Certificate Manager for HTTPS

---

## Step 9: Test Frontend

1. Open the frontend URL in browser
2. Verify all pages load correctly
3. Check browser console for API connection errors
4. Test API calls to your backend

```bash
# Test API connectivity
curl -H "Origin: http://your-frontend-url" \
     http://ec2-3-226-97-116.compute-1.amazonaws.com:3000/api/stations
```

---

## Troubleshooting

### "Access Denied" when accessing S3
- Verify bucket policy is correct
- Ensure public access is not blocked
- Check S3 bucket permissions

### Files not updating after upload
- Invalidate CloudFront cache
- Clear browser cache
- Check if correct files were uploaded

### Frontend can't reach backend
- Verify backend security group allows port 3000
- Check CORS configuration in backend
- Verify API URL in environment variables

### 403 Forbidden on S3
- Ensure bucket policy allows `s3:GetObject`
- Verify bucket is public (if not using CloudFront OAI)

---

## Cost Estimate

| Service | Free Tier | Price After |
|---------|-----------|-------------|
| S3 Storage (5GB) | **FREE** | $0.023/GB |
| S3 Data Transfer | **FREE** (1GB/month) | $0.09/GB |
| CloudFront (1TB) | **FREE** | $0.085/GB |
| **Total Monthly** | **~$0** | **$0-5** |

---

## Next Steps

1. ✅ Build frontend
2. ✅ Create S3 bucket
3. ✅ Enable static hosting
4. ✅ Upload build files
5. ✅ Configure CloudFront (optional)
6. ✅ Test accessibility
7. → Run database migrations (see next section)
8. → Set up custom domain (optional)

---

## Advanced: Automated Deployment

Create a deployment script to automate frontend updates:

```bash
#!/bin/bash
# deploy-frontend.sh

set -e

echo "Building frontend..."
cd frontend
npm install
npm run build

echo "Uploading to S3..."
aws s3 sync .next/ s3://aramco-reviews-frontend/ --delete

echo "Invalidating CloudFront..."
aws cloudfront create-invalidation --distribution-id D123ABC --paths "/*"

echo "✅ Frontend deployment complete!"
```

Run with: `bash deploy-frontend.sh`
