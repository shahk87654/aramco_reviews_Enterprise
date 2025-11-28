# ARAMCO REVIEWS ENTERPRISE - COMPLETE DEPLOYMENT RESOLUTION

## Current Issue Summary

**Problem**: Disk space exhaustion on CloudShell (64% full, only 5.5GB available)
- Docker builds failing with "no space left on device"
- Unable to compile backend and workers containers
- Services unable to start

**Environment**: Linux CloudShell (remote) + Local Windows development

---

## IMMEDIATE ACTIONS REQUIRED

### Step 1: ON YOUR LOCAL MACHINE (Windows)

The scripts and configuration files have been prepared for you. To run everything locally:

#### Option A: Automated Setup (Recommended)

```powershell
# 1. Navigate to project directory
cd "C:\Users\shahk\OneDrive\Desktop\New folder\Aramco Reviews Enterprise"

# 2. Run the complete setup
.\setup-local.ps1
```

This will:
- Clean Docker resources (removes unused images, containers, volumes)
- Remove old containers if they exist
- Delete local node_modules to free space
- Build fresh Docker images (backend & workers)
- Start all services via docker-compose
- Wait for services to become healthy
- Display endpoint URLs

#### Option B: Manual Steps

If the automated script has issues, use manual steps:

```powershell
# Install/verify Docker is running
# Open Docker Desktop - ensure it's running before proceeding

# Navigate to project
cd "C:\Users\shahk\OneDrive\Desktop\New folder\Aramco Reviews Enterprise"

# Clean up Docker resources
docker system prune -f --all --volumes
docker builder prune -f --all

# Start services
docker-compose -f infrastructure/docker-compose.yml up -d

# Wait 30 seconds for services to start
Start-Sleep -Seconds 30

# Check status
docker ps
docker-compose -f infrastructure/docker-compose.yml logs -f
```

---

### Step 2: RESOLVE CLOUDSHELL DISK SPACE ISSUE

You CANNOT continue deployment to CloudShell until disk space is freed. 

#### Fix the CloudShell environment:

```bash
# SSH into CloudShell or run these commands there:

# 1. Stop all containers
docker stop $(docker ps -q)

# 2. Remove all containers
docker rm $(docker ps -aq) -f

# 3. Remove all images
docker rmi $(docker images -q) -f

# 4. Remove all volumes
docker volume rm $(docker volume ls -q)

# 5. Aggressive cleanup
docker system prune -f --all --volumes
docker builder prune -f --all

# 6. Clean npm cache
rm -rf ~/.npm ~/.cache

# 7. Check disk space
df -h

# Expected output should show >50% available space
```

---

## SERVICE INFORMATION

### Local Development (Windows)

After running setup-local.ps1:

| Service | URL | Username | Password |
|---------|-----|----------|----------|
| Backend API | http://localhost:3000 | - | - |
| Frontend | http://localhost:3001 | - | - |
| RabbitMQ Admin | http://localhost:15672 | guest | guest |
| Grafana | http://localhost:3002 | admin | admin |
| PostgreSQL | localhost:5432 (psql CLI) | postgres | postgres |
| Redis | localhost:6379 (redis-cli) | - | - |
| Prometheus | http://localhost:9090 | - | - |

### CloudShell Deployment (after disk cleanup)

Once disk space is freed on CloudShell:

```bash
# Navigate to project
cd /home/cloudshell-user/aramco_reviews_Enterprise

# Add .dockerignore files (already in repo)
echo "node_modules
.git
.next
dist
coverage
.env
*.log
.DS_Store" > backend/.dockerignore

echo "node_modules
.git
dist
coverage
.env
*.log
.DS_Store" > workers/.dockerignore

# Build with memory limits
cd backend && docker build --memory 1g -t aramco_backend . && cd ..
cd workers && docker build --memory 1g -t aramco_worker . && cd ..

# Start docker-compose
docker-compose -f infrastructure/docker-compose.yml up -d
```

---

## TROUBLESHOOTING

### Local Issues

#### "Docker is not installed"
- Install Docker Desktop: https://www.docker.com/products/docker-desktop
- Launch Docker Desktop application
- Wait for it to fully start

#### "Port already in use"
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F

# Or use different port in docker-compose.yml
# Change "3000:3000" to "3001:3000" for example
```

#### "Container exits immediately"
```powershell
# Check container logs
docker logs aramco_backend
docker logs aramco_worker
docker logs aramco_frontend

# Common issues:
# - Database not ready: wait longer, check postgres logs
# - Missing env vars: check docker-compose.yml
# - Build errors: rebuild with --no-cache
```

#### "No space left on device"
```powershell
# Clean aggressively
docker system prune -f --all --volumes
docker builder prune -f --all

# Remove node_modules
Remove-Item -Path "backend/node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "frontend/node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "workers/node_modules" -Recurse -Force -ErrorAction SilentlyContinue

# Restart Docker
# In Docker Desktop: Preferences > Reset > Reset Docker Engine
```

### CloudShell Issues

#### "Build fails - npm install hangs"
```bash
# Increase timeout
docker build --build-arg BUILDKIT_STEP_LOG_MAX_SIZE=10485760 -t backend ./backend

# Or use --progress=plain for verbose output
docker build --progress=plain -t backend ./backend
```

#### "Database connection timeout"
```bash
# Verify RDS is accessible
psql -h aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d aramco_reviews_db

# Test from container
docker run --rm -it postgres:15-alpine psql \
  -h aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com \
  -U postgres \
  -d aramco_reviews_db
```

---

## DOCKER COMPOSE UPDATES

The docker-compose.yml has been optimized with:

1. **.dockerignore files** - Exclude node_modules, build artifacts, git history
2. **Restart policies** - All services restart unless stopped
3. **Health checks** - Services verify they're ready before dependents start
4. **Explicit networks** - All services on `aramco-network` bridge
5. **Image tags** - Named images for easier reference
6. **Volume management** - Named volumes with explicit drivers

---

## NEXT STEPS

### Immediate (Now)
1. ✓ Run `setup-local.ps1` on your Windows machine
2. ✓ Verify all services are running: `docker ps`
3. ✓ Test endpoints (backend, frontend, databases)

### Short-term (Today)
1. Fix CloudShell disk space (aggressive cleanup)
2. Rebuild containers on CloudShell
3. Deploy to AWS infrastructure

### Long-term
1. Implement CI/CD pipeline to automate builds
2. Set up container registry (ECR) for image storage
3. Configure RDS backups and monitoring
4. Implement log aggregation (CloudWatch)

---

## FILE MANIFEST - WHAT WAS CREATED/MODIFIED

### Created Files:
- `setup-local.ps1` - Automated Windows setup script
- `cleanup-docker.ps1` - Aggressive cleanup script
- `LOCAL_SETUP_GUIDE.md` - Comprehensive local setup documentation
- `.dockerignore` (backend) - Excludes unnecessary files from Docker builds
- `.dockerignore` (workers) - Excludes unnecessary files from Docker builds
- `.dockerignore` (frontend) - Excludes unnecessary files from Docker builds
- `DEPLOYMENT_RESOLUTION.md` - This file

### Modified Files:
- `infrastructure/docker-compose.yml` - Optimized with health checks, restart policies, networks
- Backend Dockerfile - Already optimized (two-stage build)
- Workers Dockerfile - Already optimized (two-stage build)

---

## QUICK COMMAND REFERENCE

### Windows PowerShell

```powershell
# Setup
.\setup-local.ps1

# Monitor
docker ps
docker-compose -f infrastructure/docker-compose.yml logs -f

# Stop
docker-compose -f infrastructure/docker-compose.yml stop

# Clean
.\cleanup-docker.ps1

# Rebuild specific service
docker-compose -f infrastructure/docker-compose.yml build --no-cache backend
docker-compose -f infrastructure/docker-compose.yml up -d backend
```

### CloudShell (Linux)

```bash
# Disk cleanup
docker system prune -f --all --volumes
rm -rf ~/.npm ~/.cache

# Build
docker build -t backend ./backend
docker build -t workers ./workers

# Run
docker-compose -f infrastructure/docker-compose.yml up -d

# Monitor
docker logs -f aramco_backend
docker ps
```

---

## CRITICAL SUCCESS FACTORS

1. **Disk Space** - Must have 15GB+ available for local development
2. **Docker Running** - Docker Desktop must be running before commands
3. **Port Availability** - Ports 3000, 3001, 5432, 6379, 5672, 15672 must be free
4. **Health Checks** - Services wait for dependencies before starting
5. **Networks** - All services communicate via `aramco-network` bridge

---

## SUPPORT

If issues persist:

1. Check logs: `docker logs <container_name>`
2. Verify networking: `docker network inspect aramco-network`
3. Inspect container: `docker inspect <container_name>`
4. Reset everything: `cleanup-docker.ps1` then `setup-local.ps1`

---

**Last Updated**: November 28, 2025
**Status**: Ready for deployment
**Next Action**: Run setup-local.ps1
