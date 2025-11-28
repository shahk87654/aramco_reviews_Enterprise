# Aggressive Docker and disk cleanup script
# Use when facing "No space left on device" errors

Write-Host "========================================" -ForegroundColor Red
Write-Host "AGGRESSIVE DISK CLEANUP" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# Stop all containers
Write-Host "[1/8] Stopping all Docker containers..." -ForegroundColor Yellow
docker stop $(docker ps -q) 2>$null | Out-Null
Start-Sleep -Seconds 2
Write-Host "✓ Containers stopped" -ForegroundColor Green

# Remove all containers
Write-Host "[2/8] Removing all containers..." -ForegroundColor Yellow
docker rm $(docker ps -aq) -f 2>$null | Out-Null
Write-Host "✓ Containers removed" -ForegroundColor Green

# Remove all images
Write-Host "[3/8] Removing all Docker images..." -ForegroundColor Yellow
docker rmi $(docker images -q) -f 2>$null | Out-Null
Write-Host "✓ Images removed" -ForegroundColor Green

# Remove all volumes
Write-Host "[4/8] Removing all Docker volumes..." -ForegroundColor Yellow
docker volume rm $(docker volume ls -q) 2>$null | Out-Null
Write-Host "✓ Volumes removed" -ForegroundColor Green

# Remove all networks
Write-Host "[5/8] Removing all custom networks..." -ForegroundColor Yellow
docker network rm $(docker network ls -q --filter type=custom) 2>$null | Out-Null
Write-Host "✓ Networks removed" -ForegroundColor Green

# Prune everything
Write-Host "[6/8] Pruning all Docker resources..." -ForegroundColor Yellow
docker system prune -f --all --volumes 2>$null | Out-Null
docker builder prune -f --all 2>$null | Out-Null
Write-Host "✓ All Docker resources pruned" -ForegroundColor Green

# Clean local node_modules
Write-Host "[7/8] Removing local node_modules..." -ForegroundColor Yellow
$paths = @(
    ".\backend\node_modules",
    ".\frontend\node_modules",
    ".\workers\node_modules",
    ".\node_modules",
    ".\backend\.next",
    ".\frontend\.next",
    ".\backend\dist",
    ".\workers\dist",
    ".\frontend\.next"
)

foreach ($path in $paths) {
    if (Test-Path $path) {
        Write-Host "  - Removing $path" -ForegroundColor Gray
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "✓ Local dependencies cleaned" -ForegroundColor Green

# Check disk space
Write-Host "[8/8] Checking available disk space..." -ForegroundColor Yellow
$diskSpace = Get-Volume | Where-Object { $_.DriveLetter -eq "C" }
$freeGB = [math]::Round($diskSpace.SizeRemaining / 1GB, 2)
$totalGB = [math]::Round($diskSpace.Size / 1GB, 2)
$percentFree = [math]::Round(($diskSpace.SizeRemaining / $diskSpace.Size) * 100, 2)

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ CLEANUP COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Disk Space (C Drive):" -ForegroundColor Cyan
Write-Host "  Free: $freeGB GB" -ForegroundColor White
Write-Host "  Total: $totalGB GB" -ForegroundColor White
Write-Host "  Available: $percentFree%" -ForegroundColor White
Write-Host ""

if ($percentFree -lt 20) {
    Write-Host "WARNING: Less than 20% disk space available!" -ForegroundColor Yellow
    Write-Host "Consider deleting other files or moving to a larger drive." -ForegroundColor Yellow
} else {
    Write-Host "Sufficient disk space available for Docker operations" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next: Run setup-local.ps1 to rebuild everything" -ForegroundColor Cyan
Write-Host ""
