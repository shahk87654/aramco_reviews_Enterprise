# AWS S3 Frontend Deployment Guide

This guide explains how to deploy the Aramco Reviews Frontend to AWS S3 for static hosting.

## Prerequisites

1. **AWS Account** - Create one at https://aws.amazon.com/
2. **AWS CLI** - Install from https://aws.amazon.com/cli/
3. **Credentials** - Configure AWS credentials:
   ```bash
   aws configure
   # Enter: Access Key ID, Secret Access Key, Default region (us-east-1), Default format (json)
   ```
4. **Node.js** - Version 18+ installed

## Step 1: Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://aramco-reviews-frontend

# Enable public read access (if needed for public site)
aws s3api put-bucket-acl --bucket aramco-reviews-frontend --acl public-read

# Enable versioning for rollback capability
aws s3api put-bucket-versioning \
  --bucket aramco-reviews-frontend \
  --versioning-configuration Status=Enabled
```

## Step 2: Configure S3 for Static Website Hosting

```bash
# Enable static website hosting
aws s3 website s3://aramco-reviews-frontend/ \
  --index-document index.html \
  --error-document index.html

# Bucket policy for public read access
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

aws s3api put-bucket-policy \
  --bucket aramco-reviews-frontend \
  --policy file://bucket-policy.json
```

## Step 3: Build and Deploy Frontend

### Option A: Using NPM Script (Recommended)

```bash
# From frontend directory
cd frontend

# Build and deploy to S3
npm run deploy:s3
```

### Option B: Manual Deployment

```bash
# Build the project
npm run build

# Sync the build output to S3
aws s3 sync .next/static s3://aramco-reviews-frontend/static --acl public-read

# Upload build files
aws s3 sync out/ s3://aramco-reviews-frontend/ --acl public-read
```

### Option C: Using PowerShell Script (Windows)

```powershell
# Use the provided PowerShell script
.\deploy-to-s3.ps1
```

## Step 4: Configure CloudFront (Optional - Recommended for Performance)

CloudFront provides caching and CDN distribution:

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name aramco-reviews-frontend.s3.amazonaws.com \
  --default-root-object index.html
```

## Step 5: Access Your Site

### S3 Website Endpoint
```
http://aramco-reviews-frontend.s3-website-us-east-1.amazonaws.com
```

### Via CloudFront (if configured)
```
https://d1234567890.cloudfront.net
```

## Deployment Commands Summary

```bash
# Build
npm run build

# Deploy to S3 (sync static files)
aws s3 sync .next/static s3://aramco-reviews-frontend/static --acl public-read

# Deploy full build
aws s3 sync out/ s3://aramco-reviews-frontend/ --acl public-read

# List files in bucket
aws s3 ls s3://aramco-reviews-frontend/ --recursive

# Delete old files before redeployment (optional)
aws s3 rm s3://aramco-reviews-frontend/ --recursive
```

## Environment Variables for Backend API

Update the frontend environment to point to your backend API:

1. Create `.env.local` in the frontend directory:
```
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

2. Rebuild and redeploy:
```bash
npm run build
npm run deploy:s3
```

## Troubleshooting

### 404 Errors on Refresh
- Set error document to `index.html` in S3 website configuration
- Ensure routing is configured correctly

### Files Not Updating
- Clear CloudFront cache: `aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"`
- Or use `--delete` flag: `aws s3 sync out/ s3://aramco-reviews-frontend/ --delete --acl public-read`

### Permission Denied
- Verify AWS credentials: `aws sts get-caller-identity`
- Check bucket policy allows PutObject action

### High Costs
- Use S3 Intelligent-Tiering for automatic cost optimization
- Set up CloudFront to reduce S3 requests
- Use S3 lifecycle policies to archive old versions

## Rollback to Previous Version

Since we enabled versioning, you can rollback:

```bash
# List versions
aws s3api list-object-versions --bucket aramco-reviews-frontend

# Restore specific version
aws s3api get-object \
  --bucket aramco-reviews-frontend \
  --key index.html \
  --version-id VERSION_ID \
  index.html
```

## Monitoring and Logs

```bash
# Enable CloudTrail for audit logging
aws cloudtrail create-trail --name aramco-reviews-audit --s3-bucket-name aramco-reviews-logs

# Enable S3 access logs
aws s3api put-bucket-logging \
  --bucket aramco-reviews-frontend \
  --bucket-logging-status LoggingEnabled={TargetBucket=aramco-reviews-logs,TargetPrefix=s3-logs/}
```

## Security Best Practices

1. **Enable HTTPS**: Use CloudFront with ACM certificate
2. **Bucket Encryption**: Enable S3 server-side encryption
3. **Access Control**: Use IAM policies instead of bucket ACL when possible
4. **CORS**: Configure CORS if backend is on different domain

```bash
# Enable encryption
aws s3api put-bucket-encryption \
  --bucket aramco-reviews-frontend \
  --server-side-encryption-configuration 'Rules=[{ApplyServerSideEncryptionByDefault={SSEAlgorithm=AES256}}]'

# Configure CORS
cat > cors.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedOrigins": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors --bucket aramco-reviews-frontend --cors-configuration file://cors.json
```

## Cost Estimation

- **S3 Storage**: ~$0.023 per GB/month (minimal for frontend)
- **Data Transfer**: Free for first 100 GB/month
- **PUT/GET Requests**: $0.005 per 1000 requests
- **CloudFront**: Variable based on data transfer (~$0.085/GB)

For a typical frontend site: **$1-10/month**

## Next Steps

1. Configure custom domain via Route 53
2. Set up CloudFront for HTTPS and caching
3. Configure monitoring and alerts
4. Implement CI/CD pipeline for automatic deployments
