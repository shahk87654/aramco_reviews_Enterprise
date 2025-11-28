# Aramco Reviews Enterprise - Local Setup & Troubleshooting Guide

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- 15GB+ free disk space
- Windows PowerShell 5.1 or higher

### One-Command Setup
```powershell
# Navigate to project root
cd C:\Users\shahk\OneDrive\Desktop\New\ folder\Aramco\ Reviews\ Enterprise

# Run setup
.\setup-local.ps1
```

---

## What the Setup Script Does

1. **Cleans Docker resources** - Removes unused images, containers, and build cache
2. **Removes old containers** - Deletes any existing aramco-* containers
3. **Cleans node_modules** - Frees disk space by removing local dependencies
4. **Builds Docker images** - Compiles backend and workers images from scratch (--no-cache)
5. **Starts Docker Compose** - Launches all services defined in docker-compose.yml
6. **Waits for health checks** - Ensures all services are running before completing

---

## Services & Access Points

| Service | URL | Status |
|---------|-----|--------|
| Backend API | http://localhost:3000 | Port 3000 |
| Frontend | http://localhost:3001 | Port 3001 |
| PostgreSQL | localhost:5432 | Port 5432 |
| Redis | localhost:6379 | Port 6379 |
| RabbitMQ Admin | http://localhost:15672 | guest/guest |
| Prometheus | http://localhost:9090 | Port 9090 |
| Grafana | http://localhost:3002 | admin/admin |

---

## Manual Commands

### View running containers
```powershell
docker ps
```

### View container logs
```powershell
# Backend
docker logs aramco_backend -f

# Worker
docker logs aramco_worker -f

# Frontend
docker logs aramco_frontend -f
```

### Stop all services
```powershell
docker-compose -f infrastructure/docker-compose.yml down
```

### Stop all services and remove volumes
```powershell
docker-compose -f infrastructure/docker-compose.yml down -v
```

### Rebuild specific service
```powershell
docker-compose -f infrastructure/docker-compose.yml build --no-cache backend
docker-compose -f infrastructure/docker-compose.yml up -d backend
```

---

## Troubleshooting

### Issue: "No space left on device"

**Cause**: Disk is full (usually from previous Docker builds)

**Solution**:
```powershell
# Nuclear option - removes ALL Docker data
docker system prune -f --all --volumes
docker builder prune -f --all

# Clean node_modules from local disk
Remove-Item -Path "backend/node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "frontend/node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "workers/node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
```

### Issue: Container exits immediately

**Check logs**:
```powershell
docker logs <container_name>
```

**Common causes**:
- Missing environment variables
- Database not ready
- Port already in use

### Issue: Database connection errors

**Verify PostgreSQL is running**:
```powershell
docker exec aramco_postgres pg_isready -U postgres
```

**Connect to database**:
```powershell
docker exec -it aramco_postgres psql -U postgres -d aramco_reviews
```

### Issue: Port already in use

**Check which process is using the port**:
```powershell
netstat -ano | findstr :3000
```

**Kill the process**:
```powershell
taskkill /PID <PID> /F
```

Or use a different port by updating docker-compose.yml

### Issue: Backend/Worker build fails

**Clear Docker buildkit cache**:
```powershell
docker builder prune -f --all
```

**Rebuild with verbose output**:
```powershell
docker-compose -f infrastructure/docker-compose.yml build --no-cache --progress=plain backend
```

---

## Disk Space Management

### Check disk usage
```powershell
# Check Docker disk usage
docker system df

# Check total disk space
Get-Volume
```

### Free up space aggressively
```powershell
# Remove all unused images, containers, volumes, networks
docker system prune -f --all --volumes

# Remove build cache
docker builder prune -f --all

# Remove dangling images
docker images --filter "dangling=true" -q | ForEach-Object { docker rmi $_ }

# Remove all stopped containers
docker container prune -f
```

---

## Development Workflow

### Running locally without Docker
```powershell
# Backend
cd backend
npm install
npm run build
npm start

# In another terminal - Workers
cd workers
npm install
npm start

# In another terminal - Frontend
cd frontend
npm install
npm run dev
```

### Building for production
```powershell
# Build images with production settings
docker-compose -f infrastructure/docker-compose.yml -f docker-compose.prod.yml build

# Start services
docker-compose -f infrastructure/docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Database Management

### Access database shell
```powershell
docker exec -it aramco_postgres psql -U postgres -d aramco_reviews
```

### Run migrations
```powershell
docker exec aramco_backend npm run migrate:latest
```

### Seed database
```powershell
docker exec aramco_backend npm run seed
```

### Backup database
```powershell
docker exec aramco_postgres pg_dump -U postgres aramco_reviews > backup.sql
```

### Restore database
```powershell
docker exec -i aramco_postgres psql -U postgres < backup.sql
```

---

## Performance Tips

1. **Allocate sufficient Docker resources**:
   - Docker Desktop Settings → Resources → Memory: 4GB+
   - CPUs: 4+

2. **Use .dockerignore files**:
   - Already configured to exclude node_modules, .git, dist, coverage

3. **Build once, run many times**:
   - Initial build takes ~3-5 minutes
   - Subsequent runs start instantly

4. **Monitor containers**:
   ```powershell
   docker stats
   ```

---

## Useful Docker Compose Commands

```powershell
# Start services
docker-compose -f infrastructure/docker-compose.yml up -d

# Stop services
docker-compose -f infrastructure/docker-compose.yml stop

# Restart services
docker-compose -f infrastructure/docker-compose.yml restart

# View logs of all services
docker-compose -f infrastructure/docker-compose.yml logs -f

# View logs of specific service
docker-compose -f infrastructure/docker-compose.yml logs -f backend

# Scale a service
docker-compose -f infrastructure/docker-compose.yml up -d --scale worker=3

# Execute command in container
docker-compose -f infrastructure/docker-compose.yml exec backend bash

# Remove all services and volumes
docker-compose -f infrastructure/docker-compose.yml down -v
```

---

## Environment Variables

Edit `infrastructure/docker-compose.yml` to modify:
- `NODE_ENV` - development/production
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` - PostgreSQL connection
- `REDIS_HOST`, `REDIS_PORT` - Redis connection
- `RABBITMQ_URL` - RabbitMQ connection
- `NEXT_PUBLIC_API_URL` - Frontend API endpoint

---

## Emergency Reset

```powershell
# Stop everything
docker-compose -f infrastructure/docker-compose.yml down -v

# Remove all Docker data
docker system prune -f --all --volumes

# Clean project files
Remove-Item -Path "backend/node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "frontend/node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "workers/node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue

# Re-run setup
.\setup-local.ps1
```

---

## Getting Help

Check individual service logs:
```powershell
docker logs aramco_backend
docker logs aramco_worker  
docker logs aramco_frontend
docker logs aramco_postgres
docker logs aramco_redis
docker logs aramco_rabbitmq
```

Inspect container configuration:
```powershell
docker inspect aramco_backend
```

View network configuration:
```powershell
docker network inspect aramco-network
```
