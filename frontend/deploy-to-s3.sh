#!/bin/bash

# AWS S3 Frontend Deployment Script
# Usage: ./deploy-to-s3.sh [bucket-name] [aws-profile] [--delete-old] [--skip-build]

set -e

BUCKET_NAME="${1:-aramco-reviews-frontend}"
AWS_PROFILE="${2:-default}"
DELETE_OLD=false
SKIP_BUILD=false
REGION="us-east-1"

# Parse arguments
while [[ $# -gt 2 ]]; do
    case $3 in
        --delete-old)
            DELETE_OLD=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        *)
            echo "Unknown option: $3"
            exit 1
            ;;
    esac
done

echo "========================================"
echo "AWS S3 Frontend Deployment Script"
echo "========================================"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "✗ AWS CLI not found. Install from https://aws.amazon.com/cli/"
    exit 1
fi
echo "✓ AWS CLI found: $(aws --version)"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "✗ Node.js not found. Install from https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js found: $(node --version)"

# Verify AWS credentials
echo ""
echo "Verifying AWS credentials..."
if ! aws sts get-caller-identity --profile "$AWS_PROFILE" > /dev/null 2>&1; then
    echo "✗ AWS credentials not configured. Run: aws configure"
    exit 1
fi
ACCOUNT_ID=$(aws sts get-caller-identity --profile "$AWS_PROFILE" --query Account --output text)
echo "✓ AWS Account: $ACCOUNT_ID"

# Build the project
if [ "$SKIP_BUILD" = false ]; then
    echo ""
    echo "Building project..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "✗ Build failed!"
        exit 1
    fi
    echo "✓ Build completed successfully"
fi

# Check if bucket exists
echo ""
echo "Checking S3 bucket: $BUCKET_NAME"
if ! aws s3api head-bucket --bucket "$BUCKET_NAME" --profile "$AWS_PROFILE" 2>/dev/null; then
    echo "✗ Bucket does not exist. Creating..."
    aws s3 mb "s3://$BUCKET_NAME" --profile "$AWS_PROFILE"
    echo "✓ Bucket created"
else
    echo "✓ Bucket exists"
fi

# Delete old files if requested
if [ "$DELETE_OLD" = true ]; then
    echo ""
    echo "Deleting old files from S3..."
    aws s3 rm "s3://$BUCKET_NAME" --recursive --profile "$AWS_PROFILE"
    echo "✓ Old files deleted"
fi

# Deploy to S3
echo ""
echo "Deploying to S3..."

# Sync static files
echo "Uploading static assets..."
aws s3 sync ".next/static" "s3://$BUCKET_NAME/static" \
    --acl public-read \
    --profile "$AWS_PROFILE" \
    --delete

# Sync public files
if [ -d "public" ]; then
    echo "Uploading public files..."
    aws s3 sync "public" "s3://$BUCKET_NAME" \
        --acl public-read \
        --profile "$AWS_PROFILE"
fi

# Upload main files from .next if it exists
if [ -f ".next/routes-manifest.json" ]; then
    echo "Uploading application files..."
    aws s3 cp ".next" "s3://$BUCKET_NAME/.next" \
        --recursive \
        --acl public-read \
        --profile "$AWS_PROFILE"
fi

echo ""
echo "✓ Deployment completed successfully!"

# Display S3 website URL
S3_ENDPOINT="http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo ""
echo "Your site is available at:"
echo "$S3_ENDPOINT"

# List deployed files
echo ""
echo "Deployed files:"
aws s3 ls "s3://$BUCKET_NAME/" --recursive --human-readable --profile "$AWS_PROFILE" | head -10

echo ""
echo "Next steps:"
echo "1. Configure custom domain"
echo "2. Set up CloudFront for HTTPS"
echo "3. Enable monitoring and alerts"

echo ""
echo "========================================"
echo "Deployment Complete!"
echo "========================================"
