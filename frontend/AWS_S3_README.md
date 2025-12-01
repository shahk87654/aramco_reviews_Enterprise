# AWS S3 Frontend Deployment - Quick Reference

This directory contains a Next.js frontend application configured for AWS S3 deployment.

## Quick Start

### 1. One-Time Setup (Create S3 Bucket)

```bash
# PowerShell (Windows)
.\deploy-quick.ps1 -SetupOnly

# Or manually
aws s3 mb s3://aramco-reviews-frontend
aws s3 website s3://aramco-reviews-frontend/ --index-document index.html --error-document index.html
```

### 2. Deploy Frontend

```bash
# Option 1: Using npm script (fastest)
npm run deploy:s3

# Option 2: Using PowerShell script (with more options)
.\deploy-to-s3.ps1

# Option 3: Using bash script (Linux/Mac)
chmod +x deploy-to-s3.sh
./deploy-to-s3.sh
```

### 3. Access Your Site

```
http://aramco-reviews-frontend.s3-website-us-east-1.amazonaws.com
```

## Commands

### Build
```bash
npm run build          # Build for production
npm run dev           # Run dev server locally
npm run lint          # Fix linting issues
```

### Deploy
```bash
npm run deploy:s3           # Build + Deploy to S3
npm run deploy:s3:standalone # Deploy standalone build
```

### Development
```bash
npm run dev            # Start dev server
npm run type-check     # Check TypeScript types
npm run format         # Format code with Prettier
```

## Environment Variables

Create `.env.local` in this directory:

```bash
NEXT_PUBLIC_API_URL=http://your-backend-api.com
NEXT_PUBLIC_ANALYTICS_ID=optional-analytics-id
```

## Deployment Scripts

### `deploy-quick.ps1` (Windows PowerShell)
Fast deployment with validation:
```bash
.\deploy-quick.ps1                    # Deploy to default bucket
.\deploy-quick.ps1 -SetupOnly         # Only setup, don't deploy
.\deploy-quick.ps1 -BucketName my-bucket
```

### `deploy-to-s3.ps1` (Windows PowerShell)
Advanced deployment with options:
```bash
.\deploy-to-s3.ps1                    # Deploy
.\deploy-to-s3.ps1 -DeleteOld         # Delete old files before deploy
.\deploy-to-s3.ps1 -SkipBuild         # Skip build, deploy existing
```

### `deploy-to-s3.sh` (Linux/Mac Bash)
Unix-friendly deployment:
```bash
./deploy-to-s3.sh                     # Deploy
./deploy-to-s3.sh aramco-reviews-frontend default --delete-old
```

## S3 Bucket Configuration

Required bucket settings:
- ✓ Static website hosting enabled
- ✓ Index document: `index.html`
- ✓ Error document: `index.html` (for SPA routing)
- ✓ Public read access enabled
- ✓ Versioning enabled (optional)
- ✓ Encryption enabled (optional)

## Deployment Process

1. **Build**: Next.js generates optimized production build in `.next/`
2. **Upload**: AWS CLI syncs files to S3 bucket with public read ACL
3. **Invalidate**: Old files are kept (versioning), new files override them
4. **Access**: Files available immediately at S3 website endpoint

## Cost Estimation

| Item | Cost |
|------|------|
| S3 Storage (50MB) | ~$0.001/month |
| PUT Requests (100) | ~$0.0005/month |
| GET Requests (10K) | ~$0.001/month |
| **Total** | **~$0.01-1/month** |

## Troubleshooting

### 404 on Page Refresh
Ensure error document is set to `index.html` in S3 website configuration.

### Permission Denied
- Check AWS credentials: `aws sts get-caller-identity`
- Verify IAM permissions include S3:PutObject
- Check bucket policy allows public read

### Files Not Updating
- Clear browser cache (Ctrl+Shift+Delete)
- Check S3 bucket has latest files: `aws s3 ls s3://aramco-reviews-frontend/ --recursive`
- Wait a few seconds for S3 eventual consistency

### CORS Issues
Configure bucket CORS if backend is on different domain:
```json
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
```

## Production Setup (Optional)

### 1. Custom Domain with Route 53
```bash
# Create hosted zone
aws route53 create-hosted-zone --name yourdomain.com --caller-reference $(date +%s)

# Create alias to S3
aws route53 change-resource-record-sets --hosted-zone-id ZONE_ID --change-batch file://changes.json
```

### 2. HTTPS with CloudFront
```bash
# Create CloudFront distribution pointing to S3
aws cloudfront create-distribution --origin-domain-name aramco-reviews-frontend.s3.amazonaws.com
```

### 3. Performance Optimization
- Enable CloudFront caching
- Use S3 Intelligent-Tiering
- Enable gzip compression
- Set long expiration for assets

## Monitoring

### View Deployment Status
```bash
# List all files
aws s3 ls s3://aramco-reviews-frontend/ --recursive

# Check specific file
aws s3api head-object --bucket aramco-reviews-frontend --key index.html

# View file versions (if versioning enabled)
aws s3api list-object-versions --bucket aramco-reviews-frontend
```

### CloudWatch Metrics
- S3 bucket size
- Request count
- Error rates

## Rollback

If deployment has issues:

```bash
# View previous versions
aws s3api list-object-versions --bucket aramco-reviews-frontend

# Restore specific version
aws s3api get-object \
  --bucket aramco-reviews-frontend \
  --key index.html \
  --version-id VERSION_ID \
  index.html
```

## References

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment/static-exports)
- [AWS CLI S3 Reference](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/s3/)
- [Complete AWS Deployment Guide](../AWS_S3_COMPLETE_DEPLOYMENT.md)

## Support

For issues or questions:
1. Check CloudWatch logs
2. Review AWS S3 documentation
3. Verify environment variables
4. Check IAM permissions
