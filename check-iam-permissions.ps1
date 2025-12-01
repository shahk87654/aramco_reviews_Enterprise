#!/usr/bin/env pwsh
# Check and attempt to fix IAM permissions

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IAM Permissions Check & Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get current user
$identity = aws sts get-caller-identity | ConvertFrom-Json
$user_arn = $identity.Arn
$account_id = $identity.Account

Write-Host "Current User: $user_arn" -ForegroundColor Yellow
Write-Host "Account ID: $account_id" -ForegroundColor Yellow
Write-Host ""

# Extract username
$user_name = $user_arn.Split('/')[-1]
Write-Host "Username: $user_name" -ForegroundColor Yellow
Write-Host ""

# Test if user can describe EC2 subnets
Write-Host "Testing EC2 permissions..." -ForegroundColor Cyan
$test = aws ec2 describe-subnets --region us-east-1 --max-results 1 2>&1
if ($test -like "*UnauthorizedOperation*" -or $test -like "*AccessDenied*") {
    Write-Host "❌ EC2 permissions NOT available" -ForegroundColor Red
    $ec2_ok = $false
} else {
    Write-Host "✅ EC2 permissions OK" -ForegroundColor Green
    $ec2_ok = $true
}

# Test if user can describe ELBv2
Write-Host "Testing ELBv2 permissions..." -ForegroundColor Cyan
$test = aws elbv2 describe-load-balancers --region us-east-1 2>&1
if ($test -like "*AccessDenied*" -or $test -like "*UnauthorizedOperation*") {
    Write-Host "❌ ELBv2 permissions NOT available" -ForegroundColor Red
    $elbv2_ok = $false
} else {
    Write-Host "✅ ELBv2 permissions OK" -ForegroundColor Green
    $elbv2_ok = $true
}

# Test if user can list S3 buckets
Write-Host "Testing S3 permissions..." -ForegroundColor Cyan
$test = aws s3 ls 2>&1
if ($test -like "*AccessDenied*" -or $test -like "*NoSuchBucket*") {
    Write-Host "❌ S3 permissions NOT available" -ForegroundColor Red
    $s3_ok = $false
} else {
    Write-Host "✅ S3 permissions OK" -ForegroundColor Green
    $s3_ok = $true
}

# Test if user can manage IAM policies
Write-Host "Testing IAM permissions..." -ForegroundColor Cyan
$test = aws iam list-user-policies --user-name $user_name 2>&1
if ($test -like "*AccessDenied*" -or $test -like "*UnauthorizedOperation*") {
    Write-Host "❌ IAM permissions NOT available" -ForegroundColor Red
    $iam_ok = $false
} else {
    Write-Host "✅ IAM permissions OK" -ForegroundColor Green
    $iam_ok = $true
}

Write-Host ""

# Summary
if ($ec2_ok -and $elbv2_ok -and $s3_ok) {
    Write-Host "✅ ALL PERMISSIONS OK!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run the ALB setup script:" -ForegroundColor Cyan
    Write-Host "  PowerShell -ExecutionPolicy Bypass -File setup-alb-complete.ps1" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "❌ MISSING PERMISSIONS" -ForegroundColor Red
    Write-Host ""
    Write-Host "Required permissions:" -ForegroundColor Yellow
    if (!$ec2_ok) { Write-Host "  - EC2 (describe instances, security groups)" }
    if (!$elbv2_ok) { Write-Host "  - ELBv2 (create/manage load balancers)" }
    if (!$s3_ok) { Write-Host "  - S3 (upload frontend builds)" }
    Write-Host ""
    
    if ($iam_ok) {
        Write-Host "IAM Permissions Available - Attempting to fix..." -ForegroundColor Cyan
        
        # Try to attach PowerUser policy
        Write-Host "Attaching PowerUserAccess policy to $user_name..." -ForegroundColor Yellow
        $result = aws iam attach-user-policy `
            --user-name $user_name `
            --policy-arn arn:aws:iam::aws:policy/PowerUserAccess 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Policy attached successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Waiting 10 seconds for policy to propagate..." -ForegroundColor Cyan
            Start-Sleep -Seconds 10
            
            Write-Host "Testing EC2 permissions again..." -ForegroundColor Cyan
            $test = aws ec2 describe-subnets --region us-east-1 --max-results 1 2>&1
            if ($test -like "*UnauthorizedOperation*") {
                Write-Host "⚠️  Permissions still not available, please wait a few more seconds" -ForegroundColor Yellow
                Start-Sleep -Seconds 10
            } else {
                Write-Host "✅ Permissions updated! You can now run the setup script." -ForegroundColor Green
            }
        } else {
            Write-Host "❌ Failed to attach policy: $result" -ForegroundColor Red
            Write-Host ""
            Write-Host "See FIX_IAM_PERMISSIONS.md for manual instructions" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Cannot auto-fix - IAM permissions not available" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "See FIX_IAM_PERMISSIONS.md for manual instructions" -ForegroundColor Yellow
    }
    
    exit 1
}
