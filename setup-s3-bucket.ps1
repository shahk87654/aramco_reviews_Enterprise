# Complete AWS S3 Deployment Configuration Script

$bucketName = "aramco-reviews-frontend"
$region = "us-east-1"

Write-Host "AWS S3 Setup and Configuration" -ForegroundColor Cyan

# 1. Create bucket
Write-Host "`nCreating S3 bucket..." -ForegroundColor Yellow
aws s3 mb s3://$bucketName --region $region

# 2. Enable versioning
Write-Host "`nEnabling versioning..." -ForegroundColor Yellow
aws s3api put-bucket-versioning `
  --bucket $bucketName `
  --versioning-configuration Status=Enabled

# 3. Enable public read access
Write-Host "`nConfiguring public read access..." -ForegroundColor Yellow
aws s3api put-bucket-acl --bucket $bucketName --acl public-read

# 4. Enable static website hosting
Write-Host "`nEnabling static website hosting..." -ForegroundColor Yellow
aws s3 website s3://$bucketName/ `
  --index-document index.html `
  --error-document index.html

# 5. Create and apply bucket policy
Write-Host "`nApplying bucket policy for public access..." -ForegroundColor Yellow
$policy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Principal = "*"
            Action = "s3:GetObject"
            Resource = "arn:aws:s3:::$bucketName/*"
        }
    )
} | ConvertTo-Json

$policy | Out-File -FilePath bucket-policy.json -Encoding utf8
aws s3api put-bucket-policy `
  --bucket $bucketName `
  --policy file://bucket-policy.json

# 6. Enable encryption
Write-Host "`nEnabling encryption..." -ForegroundColor Yellow
aws s3api put-bucket-encryption `
  --bucket $bucketName `
  --server-side-encryption-configuration 'Rules=[{ApplyServerSideEncryptionByDefault={SSEAlgorithm=AES256}}]'

# 7. Configure CORS
Write-Host "`nConfiguring CORS..." -ForegroundColor Yellow
$cors = @{
    CORSRules = @(
        @{
            AllowedHeaders = @("*")
            AllowedMethods = @("GET", "HEAD")
            AllowedOrigins = @("*")
            MaxAgeSeconds = 3000
        }
    )
} | ConvertTo-Json

$cors | Out-File -FilePath cors.json -Encoding utf8
aws s3api put-bucket-cors --bucket $bucketName --cors-configuration file://cors.json

# 8. Enable logging
Write-Host "`nEnabling access logging..." -ForegroundColor Yellow
$loggingBucket = "$bucketName-logs"
aws s3 mb s3://$loggingBucket --region $region 2>$null || Write-Host "Logging bucket already exists"

aws s3api put-bucket-logging `
  --bucket $bucketName `
  --bucket-logging-status "LoggingEnabled={TargetBucket=$loggingBucket,TargetPrefix=s3-logs/}"

# 9. Display configuration
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "S3 Bucket Configuration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nBucket Name: $bucketName" -ForegroundColor Yellow
Write-Host "Website Endpoint: http://$bucketName.s3-website-$region.amazonaws.com" -ForegroundColor Yellow
Write-Host "REST API Endpoint: https://$bucketName.s3.amazonaws.com" -ForegroundColor Yellow

Write-Host "`nConfiguration Summary:" -ForegroundColor Cyan
Write-Host "✓ Bucket created" -ForegroundColor Green
Write-Host "✓ Versioning enabled" -ForegroundColor Green
Write-Host "✓ Static website hosting configured" -ForegroundColor Green
Write-Host "✓ Public read access enabled" -ForegroundColor Green
Write-Host "✓ Encryption enabled (AES256)" -ForegroundColor Green
Write-Host "✓ CORS configured" -ForegroundColor Green
Write-Host "✓ Access logging enabled" -ForegroundColor Green

# Clean up
Remove-Item -Path bucket-policy.json -Force
Remove-Item -Path cors.json -Force

Write-Host "`nYou can now deploy with:" -ForegroundColor Cyan
Write-Host "npm run deploy:s3" -ForegroundColor Yellow
