# Complete ALB Setup Script for Aramco Reviews
# This script automates all ALB creation, target group setup, and registration

# Configuration
$AWS_REGION = "us-east-1"
$VPC_ID = "vpc-0f922cff9f0b598be"
$ALB_NAME = "aramco-backend-alb"
$TARGET_GROUP_NAME = "aramco-backend-targets"
$BACKEND_PORT = 3000

Write-Host "========================================" -ForegroundColor Green
Write-Host "ALB Complete Setup Script" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Step 0: Check AWS credentials
Write-Host "Step 0: Verifying AWS credentials..." -ForegroundColor Cyan
$identity = aws sts get-caller-identity | ConvertFrom-Json
Write-Host "✅ Authenticated as: $($identity.Arn)" -ForegroundColor Green
Write-Host ""

# Step 1: Get subnets
Write-Host "Step 1: Identifying subnets in VPC..." -ForegroundColor Cyan
$subnets = aws ec2 describe-subnets `
  --filters "Name=vpc-id,Values=$VPC_ID" `
  --region $AWS_REGION `
  --query 'Subnets[*].[SubnetId,AvailabilityZone,CidrBlock]' `
  --output json | ConvertFrom-Json

if ($subnets.Count -lt 2) {
    Write-Host "❌ Error: Found only $($subnets.Count) subnets. Need at least 2 in different AZs." -ForegroundColor Red
    exit 1
}

Write-Host "Found $($subnets.Count) subnets:" -ForegroundColor Green
$subnets | ForEach-Object { Write-Host "  - Subnet: $_[0], AZ: $_[1], CIDR: $_[2]" }

# Use first 2 subnets (should be in different AZs)
$SUBNET_1 = $subnets[0][0]
$SUBNET_2 = $subnets[1][0]
Write-Host "Using subnets: $SUBNET_1, $SUBNET_2" -ForegroundColor Yellow
Write-Host ""

# Step 2: Create ALB Security Group
Write-Host "Step 2: Creating ALB security group..." -ForegroundColor Cyan
$alb_sg = aws ec2 create-security-group `
  --group-name "$ALB_NAME-sg" `
  --description "Security group for ALB" `
  --vpc-id $VPC_ID `
  --region $AWS_REGION `
  --query 'GroupId' `
  --output text

Write-Host "✅ ALB Security Group created: $alb_sg" -ForegroundColor Green

# Allow HTTP
aws ec2 authorize-security-group-ingress `
  --group-id $alb_sg `
  --protocol tcp `
  --port 80 `
  --cidr 0.0.0.0/0 `
  --region $AWS_REGION | Out-Null
Write-Host "✅ HTTP (port 80) allowed" -ForegroundColor Green

# Allow HTTPS
aws ec2 authorize-security-group-ingress `
  --group-id $alb_sg `
  --protocol tcp `
  --port 443 `
  --cidr 0.0.0.0/0 `
  --region $AWS_REGION | Out-Null
Write-Host "✅ HTTPS (port 443) allowed" -ForegroundColor Green
Write-Host ""

# Step 3: Create Backend Security Group
Write-Host "Step 3: Creating backend security group..." -ForegroundColor Cyan
$backend_sg = aws ec2 create-security-group `
  --group-name "aramco-backend-sg" `
  --description "Security group for backend EC2 instances" `
  --vpc-id $VPC_ID `
  --region $AWS_REGION `
  --query 'GroupId' `
  --output text

Write-Host "✅ Backend Security Group created: $backend_sg" -ForegroundColor Green

# Allow ALB -> Backend on port 3000
aws ec2 authorize-security-group-ingress `
  --group-id $backend_sg `
  --protocol tcp `
  --port 3000 `
  --source-security-group-id $alb_sg `
  --region $AWS_REGION | Out-Null
Write-Host "✅ ALB can reach backend on port 3000" -ForegroundColor Green

# Allow SSH for debugging
aws ec2 authorize-security-group-ingress `
  --group-id $backend_sg `
  --protocol tcp `
  --port 22 `
  --cidr 0.0.0.0/0 `
  --region $AWS_REGION | Out-Null
Write-Host "✅ SSH (port 22) allowed for debugging" -ForegroundColor Green
Write-Host ""

# Step 4: Create ALB
Write-Host "Step 4: Creating Application Load Balancer..." -ForegroundColor Cyan
$alb_output = aws elbv2 create-load-balancer `
  --name $ALB_NAME `
  --subnets $SUBNET_1 $SUBNET_2 `
  --security-groups $alb_sg `
  --scheme internal `
  --type application `
  --region $AWS_REGION | ConvertFrom-Json

$ALB_ARN = $alb_output.LoadBalancers[0].LoadBalancerArn
$ALB_DNS = $alb_output.LoadBalancers[0].DNSName

Write-Host "✅ ALB created successfully" -ForegroundColor Green
Write-Host "   ARN: $ALB_ARN" -ForegroundColor Yellow
Write-Host "   DNS: $ALB_DNS" -ForegroundColor Yellow
Write-Host ""

# Step 5: Create Target Group
Write-Host "Step 5: Creating target group..." -ForegroundColor Cyan
$tg_output = aws elbv2 create-target-group `
  --name $TARGET_GROUP_NAME `
  --protocol HTTP `
  --port $BACKEND_PORT `
  --vpc-id $VPC_ID `
  --health-check-protocol HTTP `
  --health-check-path /api/health `
  --health-check-interval-seconds 30 `
  --health-check-timeout-seconds 5 `
  --healthy-threshold-count 2 `
  --unhealthy-threshold-count 3 `
  --matcher HttpCode=200 `
  --region $AWS_REGION | ConvertFrom-Json

$TG_ARN = $tg_output.TargetGroups[0].TargetGroupArn

Write-Host "✅ Target Group created successfully" -ForegroundColor Green
Write-Host "   ARN: $TG_ARN" -ForegroundColor Yellow
Write-Host "   Health Check: /api/health (every 30s)" -ForegroundColor Yellow
Write-Host ""

# Step 6: Get EC2 Instance
Write-Host "Step 6: Finding backend EC2 instance..." -ForegroundColor Cyan
$instances = aws ec2 describe-instances `
  --filters "Name=vpc-id,Values=$VPC_ID" `
  --query 'Reservations[*].Instances[?State.Name==`running`].[InstanceId,PrivateIpAddress,Tags[?Key==`Name`].Value|[0]]' `
  --region $AWS_REGION `
  --output json | ConvertFrom-Json

if ($instances.Count -eq 0) {
    Write-Host "❌ Error: No running EC2 instances found in VPC" -ForegroundColor Red
    exit 1
}

Write-Host "Found running instances:" -ForegroundColor Green
$instances | ForEach-Object { Write-Host "  - Instance: $_[0], IP: $_[1], Name: $_[2]" }

# Use first instance
$INSTANCE_ID = $instances[0][0]
$INSTANCE_IP = $instances[0][1]
Write-Host "Using instance: $INSTANCE_ID ($INSTANCE_IP)" -ForegroundColor Yellow
Write-Host ""

# Step 7: Register Instance with Target Group
Write-Host "Step 7: Registering instance with target group..." -ForegroundColor Cyan
aws elbv2 register-targets `
  --target-group-arn $TG_ARN `
  --targets "Id=$INSTANCE_ID,Port=$BACKEND_PORT" `
  --region $AWS_REGION | Out-Null

Write-Host "✅ Instance registered: $INSTANCE_ID on port $BACKEND_PORT" -ForegroundColor Green

# Wait and check health
Write-Host "Waiting for health check (30 seconds)..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

$health = aws elbv2 describe-target-health `
  --target-group-arn $TG_ARN `
  --region $AWS_REGION | ConvertFrom-Json

$state = $health.TargetHealthDescriptions[0].TargetHealth.State
Write-Host "Target State: $state" -ForegroundColor Yellow
Write-Host ""

# Step 8: Create Listener
Write-Host "Step 8: Creating ALB listener..." -ForegroundColor Cyan
$listener_output = aws elbv2 create-listener `
  --load-balancer-arn $ALB_ARN `
  --protocol HTTP `
  --port 80 `
  --default-actions "Type=forward,TargetGroupArn=$TG_ARN" `
  --region $AWS_REGION | ConvertFrom-Json

$LISTENER_ARN = $listener_output.Listeners[0].ListenerArn

Write-Host "✅ Listener created successfully" -ForegroundColor Green
Write-Host "   ARN: $LISTENER_ARN" -ForegroundColor Yellow
Write-Host "   Route: Port 80 → Target Group → Port $BACKEND_PORT" -ForegroundColor Yellow
Write-Host ""

# Step 9: Test ALB
Write-Host "Step 9: Testing ALB health check..." -ForegroundColor Cyan
Start-Sleep -Seconds 5
$health = aws elbv2 describe-target-health `
  --target-group-arn $TG_ARN `
  --region $AWS_REGION | ConvertFrom-Json

$state = $health.TargetHealthDescriptions[0].TargetHealth.State
$reason = $health.TargetHealthDescriptions[0].TargetHealth.Reason

Write-Host "Target Health Status: $state" -ForegroundColor $(if($state -eq 'healthy') {'Green'} else {'Yellow'})
Write-Host "Reason: $reason" -ForegroundColor Gray
Write-Host ""

# Step 10: Display summary
Write-Host "========================================" -ForegroundColor Green
Write-Host "ALB SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Configuration Summary:" -ForegroundColor Cyan
Write-Host ""
Write-Host "ALB Details:" -ForegroundColor Yellow
Write-Host "  ARN:  $ALB_ARN"
Write-Host "  DNS:  $ALB_DNS"
Write-Host "  SG:   $alb_sg"
Write-Host ""
Write-Host "Target Group Details:" -ForegroundColor Yellow
Write-Host "  ARN:  $TG_ARN"
Write-Host "  Port: $BACKEND_PORT"
Write-Host ""
Write-Host "Backend Configuration:" -ForegroundColor Yellow
Write-Host "  Instance: $INSTANCE_ID"
Write-Host "  IP:       $INSTANCE_IP"
Write-Host "  SG:       $backend_sg"
Write-Host ""
Write-Host "Frontend .env Configuration:" -ForegroundColor Yellow
Write-Host "  NEXT_PUBLIC_API_BASE_URL=http://$ALB_DNS"
Write-Host ""

# Step 11: Save configuration to file
Write-Host "Step 11: Saving configuration to ALB_CONFIG.json..." -ForegroundColor Cyan
$config = @{
    region = $AWS_REGION
    vpc_id = $VPC_ID
    alb_name = $ALB_NAME
    alb_arn = $ALB_ARN
    alb_dns = $ALB_DNS
    alb_security_group = $alb_sg
    backend_security_group = $backend_sg
    target_group_name = $TARGET_GROUP_NAME
    target_group_arn = $TG_ARN
    backend_port = $BACKEND_PORT
    instance_id = $INSTANCE_ID
    instance_ip = $INSTANCE_IP
    listener_arn = $LISTENER_ARN
    subnets = @($SUBNET_1, $SUBNET_2)
    frontend_api_url = "http://$ALB_DNS"
}

$config | ConvertTo-Json | Out-File -FilePath "ALB_CONFIG.json" -Encoding UTF8
Write-Host "✅ Configuration saved to ALB_CONFIG.json" -ForegroundColor Green
Write-Host ""

# Step 12: Update frontend .env
Write-Host "Step 12: Updating frontend .env..." -ForegroundColor Cyan
$env_content = @"
NEXT_PUBLIC_API_BASE_URL=http://$ALB_DNS
NEXT_PUBLIC_APP_NAME=Aramco Reviews Enterprise
NEXT_PUBLIC_APP_VERSION=1.0.0
"@

Set-Content -Path "frontend\.env" -Value $env_content -Encoding UTF8
Write-Host "✅ frontend/.env updated" -ForegroundColor Green
Write-Host ""

# Step 13: Rebuild and deploy frontend
Write-Host "Step 13: Rebuilding frontend..." -ForegroundColor Cyan
Push-Location frontend
npm run build
$buildResult = $LASTEXITCODE
Pop-Location

if ($buildResult -eq 0) {
    Write-Host "✅ Frontend build successful" -ForegroundColor Green
    
    Write-Host "Step 14: Deploying to S3..." -ForegroundColor Cyan
    Push-Location frontend
    aws s3 sync ".next/static" "s3://aramco-reviews-frontend/static" --exact-timestamps
    aws s3 sync ".next" "s3://aramco-reviews-frontend/" --exclude "static/*" --exact-timestamps
    Pop-Location
    Write-Host "✅ Frontend deployed to S3" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "🎉 ALL SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Ensure backend is running on EC2 instance: $INSTANCE_ID"
Write-Host "2. Test ALB endpoint: curl http://$ALB_DNS/api/health"
Write-Host "3. Verify frontend is connecting to backend via ALB"
Write-Host "4. Monitor target health: aws elbv2 describe-target-health --target-group-arn $TG_ARN --region $AWS_REGION"
Write-Host ""
