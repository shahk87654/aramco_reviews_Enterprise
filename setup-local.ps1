# Comprehensive local setup script for Aramco Reviews Enterprise
# Purpose: Clean, rebuild, and run Docker containers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Aramco Reviews Enterprise - Local Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean Docker resources
Write-Host "[1/6] Cleaning Docker resources..." -ForegroundColor Yellow
docker system prune -f --all --volumes 2>$null | Out-Null
docker builder prune -f --all 2>$null | Out-Null
Write-Host "✓ Docker cleanup complete" -ForegroundColor Green
Write-Host ""

# Step 2: Remove old containers if they exist
Write-Host "[2/6] Removing old containers..." -ForegroundColor Yellow
$containers = @("aramco_backend", "aramco_worker", "aramco_postgres", "aramco_redis", "aramco_rabbitmq", "aramco_frontend")
foreach ($container in $containers) {
    docker rm -f $container 2>$null | Out-Null
}
Write-Host "✓ Old containers removed" -ForegroundColor Green
Write-Host ""

# Step 3: Clean local node_modules to save disk space
Write-Host "[3/6] Cleaning local node_modules..." -ForegroundColor Yellow
$nodeDirs = @(
    "backend/node_modules",
    "frontend/node_modules",
    "workers/node_modules",
    "node_modules"
)
foreach ($dir in $nodeDirs) {
    if (Test-Path $dir) {
        Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "✓ Node modules cleaned" -ForegroundColor Green
Write-Host ""

# Step 4: Build Docker images
Write-Host "[4/6] Building Docker images..." -ForegroundColor Yellow

Write-Host "  - Building backend image..." -ForegroundColor Cyan
docker build --no-cache -f backend/Dockerfile -t aramco_backend ./backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Backend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Backend built successfully" -ForegroundColor Green

Write-Host "  - Building workers image..." -ForegroundColor Cyan
docker build --no-cache -f workers/Dockerfile -t aramco_worker ./workers
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Workers build failed" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Workers built successfully" -ForegroundColor Green
Write-Host ""

# Step 5: Start Docker Compose services
Write-Host "[5/6] Starting Docker Compose services..." -ForegroundColor Yellow
docker-compose -f infrastructure/docker-compose.yml up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Docker Compose startup failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker Compose services started" -ForegroundColor Green
Write-Host ""

# Step 6: Wait for services to be healthy
Write-Host "[6/6] Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Display service status
Write-Host "Service Status:" -ForegroundColor Cyan
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host ""
Write-Host "Useful endpoints:" -ForegroundColor Cyan
Write-Host "  - Backend API: http://localhost:3000" -ForegroundColor White
Write-Host "  - Redis: localhost:6379" -ForegroundColor White
Write-Host "  - RabbitMQ: http://localhost:15672 (guest/guest)" -ForegroundColor White
Write-Host "  - PostgreSQL: localhost:5432" -ForegroundColor White
Write-Host ""
