# Deployment script for AWS S3 frontend deployment
# Run from the frontend directory: .\deploy-to-s3.ps1

param(
    [string]$BucketName = "aramco-reviews-frontend",
    [string]$AwsProfile = "default",
    [switch]$DeleteOld = $false,
    [switch]$SkipBuild = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AWS S3 Frontend Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if AWS CLI is installed
try {
    $awsVersion = aws --version
    Write-Host "✓ AWS CLI found: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ AWS CLI not found. Install from https://aws.amazon.com/cli/" -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Verify AWS credentials
Write-Host "`nVerifying AWS credentials..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity --profile $AwsProfile --output json | ConvertFrom-Json
    Write-Host "✓ AWS Account: $($identity.Account)" -ForegroundColor Green
    Write-Host "✓ AWS User: $($identity.Arn)" -ForegroundColor Green
} catch {
    Write-Host "✗ AWS credentials not configured. Run: aws configure" -ForegroundColor Red
    exit 1
}

# Build the project
if (-not $SkipBuild) {
    Write-Host "`nBuilding project..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Build completed successfully" -ForegroundColor Green
}

# Check if bucket exists
Write-Host "`nChecking S3 bucket: $BucketName" -ForegroundColor Yellow
try {
    aws s3api head-bucket --bucket $BucketName --profile $AwsProfile 2>$null
    Write-Host "✓ Bucket exists" -ForegroundColor Green
} catch {
    Write-Host "✗ Bucket does not exist. Creating..." -ForegroundColor Yellow
    try {
        aws s3 mb "s3://$BucketName" --profile $AwsProfile
        Write-Host "✓ Bucket created" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to create bucket: $_" -ForegroundColor Red
        exit 1
    }
}

# Delete old files if requested
if ($DeleteOld) {
    Write-Host "`nDeleting old files from S3..." -ForegroundColor Yellow
    aws s3 rm "s3://$BucketName" --recursive --profile $AwsProfile
    Write-Host "✓ Old files deleted" -ForegroundColor Green
}

# Deploy to S3
Write-Host "`nDeploying to S3..." -ForegroundColor Yellow

# Sync static files
Write-Host "Uploading static assets..." -ForegroundColor Yellow
aws s3 sync ".next/static" "s3://$BucketName/static" `
    --acl public-read `
    --profile $AwsProfile `
    --delete

# Sync public files
if (Test-Path "public") {
    Write-Host "Uploading public files..." -ForegroundColor Yellow
    aws s3 sync "public" "s3://$BucketName" `
        --acl public-read `
        --profile $AwsProfile
}

# Upload main files from .next/standalone if it exists
if (Test-Path ".next/standalone") {
    Write-Host "Uploading application files..." -ForegroundColor Yellow
    aws s3 sync ".next/standalone" "s3://$BucketName" `
        --acl public-read `
        --profile $AwsProfile
}

Write-Host "`n✓ Deployment completed successfully!" -ForegroundColor Green

# Display S3 website URL
$s3Endpoint = "http://$BucketName.s3-website-us-east-1.amazonaws.com"
Write-Host "`nYour site is available at:" -ForegroundColor Cyan
Write-Host $s3Endpoint -ForegroundColor Yellow

# List deployed files
Write-Host "`nDeployed files:" -ForegroundColor Yellow
aws s3 ls "s3://$BucketName/" --recursive --human-readable --profile $AwsProfile | Select-Object -First 10

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Configure custom domain: https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/" -ForegroundColor White
Write-Host "2. Set up CloudFront for HTTPS: https://docs.aws.amazon.com/cloudfront/" -ForegroundColor White
Write-Host "3. Enable monitoring: https://docs.aws.amazon.com/AmazonCloudWatch/" -ForegroundColor White

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
