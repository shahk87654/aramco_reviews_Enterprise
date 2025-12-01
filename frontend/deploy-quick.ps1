#!/usr/bin/env powershell

# AWS S3 Frontend Deployment - Quick Start Script
# This script automates the complete deployment process

param(
    [string]$BucketName = "aramco-reviews-frontend",
    [string]$AwsRegion = "us-east-1",
    [string]$AwsProfile = "default",
    [switch]$SetupOnly = $false
)

$ErrorActionPreference = "Stop"

function Write-Header {
    param([string]$Message)
    Write-Host "`n" -ForegroundColor Cyan
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "=" * 60 -ForegroundColor Cyan
}

function Write-Step {
    param([string]$Message)
    Write-Host "`n► $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# Main script
Write-Header "AWS S3 Frontend Deployment"

# Check prerequisites
Write-Step "Checking prerequisites..."
$checks = @{
    "AWS CLI" = { aws --version 2>$null }
    "Node.js" = { node --version 2>$null }
    "npm" = { npm --version 2>$null }
}

foreach ($check in $checks.GetEnumerator()) {
    try {
        $result = & $check.Value
        Write-Success "$($check.Key): $result"
    }
    catch {
        Write-Error-Custom "$($check.Key) not found. Please install it."
        exit 1
    }
}

# Verify AWS credentials
Write-Step "Verifying AWS credentials..."
try {
    $identity = aws sts get-caller-identity --profile $AwsProfile 2>$null | ConvertFrom-Json
    Write-Success "AWS Account: $($identity.Account)"
    Write-Success "AWS User/Role: $($identity.Arn)"
}
catch {
    Write-Error-Custom "AWS credentials not configured. Run: aws configure --profile $AwsProfile"
    exit 1
}

# Check if bucket exists
Write-Step "Checking S3 bucket: $BucketName"
try {
    aws s3api head-bucket --bucket $BucketName --profile $AwsProfile 2>$null
    Write-Success "Bucket exists"
}
catch {
    Write-Host "Bucket does not exist. Creating..." -ForegroundColor Yellow
    try {
        aws s3 mb "s3://$BucketName" --region $AwsRegion --profile $AwsProfile
        Write-Success "Bucket created"
    }
    catch {
        Write-Error-Custom "Failed to create bucket: $_"
        exit 1
    }
}

# Configure bucket for static website hosting
Write-Step "Configuring bucket for static website hosting..."
try {
    # Enable static website hosting
    aws s3 website "s3://$BucketName/" `
        --index-document index.html `
        --error-document index.html `
        --profile $AwsProfile
    Write-Success "Static website hosting enabled"

    # Enable versioning
    aws s3api put-bucket-versioning `
        --bucket $BucketName `
        --versioning-configuration Status=Enabled `
        --profile $AwsProfile
    Write-Success "Versioning enabled"

    # Apply bucket policy for public read access
    $policy = @{
        Version = "2012-10-17"
        Statement = @(
            @{
                Effect = "Allow"
                Principal = "*"
                Action = "s3:GetObject"
                Resource = "arn:aws:s3:::$BucketName/*"
            }
        )
    }
    
    $policyJson = $policy | ConvertTo-Json -Depth 10
    $policyJson | Out-File -FilePath "bucket-policy.json" -Encoding utf8 -Force
    
    aws s3api put-bucket-policy `
        --bucket $BucketName `
        --policy file://bucket-policy.json `
        --profile $AwsProfile
    Write-Success "Bucket policy applied"

    Remove-Item "bucket-policy.json" -Force -ErrorAction SilentlyContinue
}
catch {
    Write-Error-Custom "Failed to configure bucket: $_"
    exit 1
}

# If setup only, stop here
if ($SetupOnly) {
    Write-Host "`n✓ S3 bucket setup complete!" -ForegroundColor Green
    Write-Host "`nYou can now deploy with:" -ForegroundColor Cyan
    Write-Host "npm run deploy:s3" -ForegroundColor Yellow
    exit 0
}

# Build frontend
Write-Step "Building Next.js frontend..."
try {
    npm run build
    Write-Success "Build completed"
}
catch {
    Write-Error-Custom "Build failed: $_"
    exit 1
}

# Deploy to S3
Write-Step "Deploying to S3..."
try {
    # Sync static files
    Write-Host "Uploading static assets..." -ForegroundColor Yellow
    aws s3 sync ".next/static" "s3://$BucketName/static" `
        --acl public-read `
        --profile $AwsProfile `
        --delete

    # Sync public files if they exist
    if (Test-Path "public") {
        Write-Host "Uploading public files..." -ForegroundColor Yellow
        aws s3 sync "public" "s3://$BucketName" `
            --acl public-read `
            --profile $AwsProfile
    }

    Write-Success "Files uploaded to S3"
}
catch {
    Write-Error-Custom "Deployment failed: $_"
    exit 1
}

# Display deployment information
Write-Header "Deployment Complete!"

$s3Endpoint = "http://$BucketName.s3-website-$AwsRegion.amazonaws.com"
Write-Host "`nYour site is now live at:" -ForegroundColor Cyan
Write-Host $s3Endpoint -ForegroundColor Yellow

Write-Host "`nS3 Bucket Details:" -ForegroundColor Cyan
Write-Host "  Bucket Name: $BucketName" -ForegroundColor White
Write-Host "  Region: $AwsRegion" -ForegroundColor White
Write-Host "  Website URL: $s3Endpoint" -ForegroundColor White
Write-Host "  REST Endpoint: https://$BucketName.s3.amazonaws.com" -ForegroundColor White

# Show deployed files
Write-Host "`nDeployed files:" -ForegroundColor Cyan
aws s3 ls "s3://$BucketName/" --recursive --human-readable --profile $AwsProfile | Select-Object -First 15

# Next steps
Write-Host "`n" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Green
Write-Host "  1. Test your site: Open $s3Endpoint in your browser" -ForegroundColor White
Write-Host "  2. Configure backend URL: Update .env.local with your API URL" -ForegroundColor White
Write-Host "  3. Set up custom domain: Use Route 53 for DNS" -ForegroundColor White
Write-Host "  4. Configure HTTPS: Use CloudFront with ACM certificate" -ForegroundColor White
Write-Host "  5. Monitor costs: Check AWS Cost Explorer regularly" -ForegroundColor White

Write-Host "`nFor more information, see: AWS_S3_COMPLETE_DEPLOYMENT.md" -ForegroundColor Cyan
