# Disk Space Error Resolution Guide

## Problem Summary
```
ERROR: failed to solve: no space left on device
docker: Error response from daemon: no space left on device
```

**Root Cause:** Cloud environment has insufficient disk space (~5.5GB available, but Docker builds need more)

## Quick Fix (Immediate)

```bash
# 1. Stop all containers
docker stop $(docker ps -q) 2>/dev/null || true

# 2. Aggressive cleanup
docker system prune -af --volumes
docker rmi $(docker images -q) 2>/dev/null || true

# 3. Remove build artifacts
rm -rf backend/node_modules backend/.next backend/dist
rm -rf workers/node_modules workers/.next workers/dist
rm -rf frontend/node_modules frontend/.next frontend/dist

# 4. Clear system temp
rm -rf /tmp/* /var/tmp/* 2>/dev/null || true
rm -rf ~/.npm ~/.cache 2>/dev/null || true

# 5. Check freed space
df -h /
```

## Root Cause Analysis

The environment has:
- **Total:** 16GB
- **Used:** 9.4GB (58%)
- **Available:** 5.5GB (42%)

Docker builds consume:
1. **Base image:** ~50-100MB (node:18-alpine)
2. **npm install:** ~800MB-1.5GB (node_modules)
3. **Build artifacts:** ~500MB-1GB
4. **Layer cache:** ~500MB+

**Total needed per build:** ~2-3GB minimum

## Permanent Solutions

### Option 1: Use Pre-built Images (Recommended)
Instead of building in the cloud, build locally and push to Docker Hub:

```bash
# Local machine
docker build -t yourusername/backend:latest backend/
docker build -t yourusername/workers:latest workers/
docker push yourusername/backend:latest
docker push yourusername/workers:latest

# On cloud
docker pull yourusername/backend:latest
docker pull yourusername/workers:latest
docker run -d --name aramco-backend yourusername/backend:latest
```

### Option 2: Multi-stage Build Optimization

Update `backend/Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/main.js"]
```

### Option 3: Increase Cloud Storage
```bash
# On AWS CloudShell - request storage increase via AWS Console
# Typical limits: 1GB-1TB depending on account
```

### Option 4: Use Smaller Base Image
Replace `node:18-alpine` with `node:18-slim` or even `node:18-bullseye` (smaller final image)

## Prevention Strategy

1. **Add .dockerignore files:**
   ```bash
   # backend/.dockerignore
   node_modules
   .git
   .next
   dist
   coverage
   .env
   *.log
   .DS_Store
   ```

2. **Enable Docker BuildKit** (more efficient):
   ```bash
   export DOCKER_BUILDKIT=1
   docker build .
   ```

3. **Use layer caching:**
   ```bash
   docker build --cache-from backend:latest -t backend:latest .
   ```

4. **Regular cleanup:**
   ```bash
   # Run weekly
   docker system prune -af --volumes
   ```

## Testing the Fix

After cleanup:

```bash
# 1. Verify disk space
df -h

# 2. Try building backend
cd backend
docker build -f Dockerfile -t backend:test .

# 3. Check if containers run
docker run --rm backend:test node -v

# 4. Clean up test image
docker rmi backend:test
```

## Alternative: Kubernetes on AWS

Instead of Docker/EC2, consider:
- **AWS ECS** (Elastic Container Service)
- **AWS EKS** (Kubernetes)
- **AWS Lambda** (Serverless for workers)

These handle scaling and storage automatically.

## Monitoring

Add to crontab:
```bash
# Check disk weekly
0 0 * * 0 df -h > /tmp/disk_check.log

# Auto-cleanup monthly
0 2 1 * * docker system prune -af --volumes
```

## Support Resources

- Docker Best Practices: https://docs.docker.com/develop/dev-best-practices/
- AWS CloudShell Limits: https://docs.aws.amazon.com/cloudshell/latest/userguide/limits.html
- Node.js Docker Optimization: https://snyk.io/blog/10-best-practices-to-containerize-nodejs-web-applications/
