# Backend Troubleshooting & Recovery Guide

## Issue: Backend API Not Responding

### Quick Diagnosis
The backend containers may have crashed or stopped. Since we removed the SSH key for security, use AWS Console to restart.

---

## Solution: Restart Backend via AWS Console

### Step 1: Access EC2 Instance via Systems Manager
1. Open **AWS Console** → **EC2** → **Instances**
2. Select instance `i-0a0b975a200b52dcf` (Aramco)
3. Click **Connect** tab
4. Choose **EC2 Instance Connect** → **Connect**
5. You now have a terminal session to the instance

### Step 2: Check Container Status
```bash
docker ps -a
```

**Expected output:**
```
CONTAINER ID   IMAGE     COMMAND                STATUS
90550baed471   backend   "docker-entrypoint"   Up 16 hours
dcca9114a1b5  workers   "docker-entrypoint"   Up 16 hours
```

### Step 3: If Containers Are Down, Restart Them
```bash
# Restart backend
docker start aramco-backend

# Restart workers  
docker start aramco-workers

# Verify they're running
docker ps
```

### Step 4: Check Logs
```bash
# View backend logs
docker logs aramco-backend --tail 50

# View workers logs
docker logs aramco-workers --tail 20
```

### Step 5: If Still Not Working, Rebuild & Deploy
```bash
# Pull latest code
cd /home/ec2-user/aramco_reviews_Enterprise/backend
git pull

# Rebuild image
docker build -f Dockerfile -t backend .

# Stop old container
docker stop aramco-backend
docker rm aramco-backend

# Run new container
docker run -d --name aramco-backend --network host -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_HOST=aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com \
  -e DB_PORT=5432 \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=Shahnawaz20030611 \
  -e DB_NAME=aramco_reviews_db \
  -e DB_SSL=true \
  -e JWT_SECRET=aramco_jwt_secret_key_2025_secure \
  -e JWT_EXPIRATION=24h \
  backend

# Verify it's running
docker logs aramco-backend --tail 20
```

### Step 6: Test API
```bash
curl http://localhost:3000/api/stations | head -20
```

Should return JSON array of stations.

---

## Common Issues & Fixes

### Issue: Database Connection Timeout
**Error:** `connect ECONNREFUSED 172.31.69.92:5432`

**Fix:**
1. Verify RDS is running: AWS Console → RDS → Instances
2. Check Security Group: Allow inbound TCP 5432 from EC2
3. Verify credentials in docker run command

### Issue: Out of Memory
**Error:** `Cannot allocate memory`

**Fix:**
```bash
# Check available memory
free -h

# Remove old images
docker image prune -a

# Rebuild with less aggressive build
docker build --progress=plain -f Dockerfile -t backend .
```

### Issue: Port Already in Use
**Error:** `Address already in use :::3000`

**Fix:**
```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
docker run ... -p 3001:3000 ...
```

---

## API Health Check Commands

```bash
# Test stations endpoint
curl -s http://localhost:3000/api/stations | jq '.[0]' | head -20

# Test API docs (Swagger)
curl -s http://localhost:3000/api/docs | grep -i "swagger" | head -3

# Test database connection via API
curl -s http://localhost:3000/api/analytics/global-stats | jq .

# Test authentication
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aramco.com","password":"test123"}'
```

---

## Emergency Actions

### Force Restart Everything
```bash
# Stop all containers
docker stop $(docker ps -aq)

# Remove all containers
docker rm $(docker ps -aq)

# Clean up
docker system prune -a

# Rebuild and start fresh (see Step 5 above)
```

### Check Database Connectivity Directly
```bash
# Install PostgreSQL client if needed
sudo yum install -y postgresql

# Test connection
PGPASSWORD='Shahnawaz20030611' psql -h aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com \
  -U postgres -d aramco_reviews_db -c 'SELECT COUNT(*) FROM stations;'
```

---

## Monitoring & Prevention

### Set Up Auto-Restart
```bash
# Add restart policy to container
docker run ... --restart unless-stopped ...
```

### Monitor Disk Space
```bash
df -h
docker system df
```

### View Real-Time Metrics
```bash
docker stats aramco-backend
```

---

## Your Current Infrastructure

| Service | Status | Command |
|---------|--------|---------|
| Backend Container | Check with `docker ps` | `docker logs aramco-backend` |
| Workers Container | Check with `docker ps` | `docker logs aramco-workers` |
| RDS Database | Running | Host: `aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com` |
| API Endpoint | `http://ec2-3-226-97-116.compute-1.amazonaws.com:3000` | Test: `/api/stations` |

---

## Next: How to Access EC2 Terminal

Since SSH key was removed for security:

**Option A: AWS Systems Manager (Best)**
1. EC2 Console → Instance → Connect → EC2 Instance Connect
2. Launches browser terminal

**Option B: AWS SSM Session Manager**
1. IAM Role must have `AmazonSSMManagedInstanceCore` policy
2. AWS Console → Systems Manager → Session Manager → Start Session

**Option C: SSH with New Key Pair**
1. Create new key pair in EC2 Console
2. Use it to SSH to instance

---

## Debug Commands Summary

```bash
# All in one check
echo "=== Containers ===" && docker ps -a && \
echo -e "\n=== Backend Logs ===" && docker logs aramco-backend --tail 10 && \
echo -e "\n=== Database ===" && PGPASSWORD='Shahnawaz20030611' psql -h aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com -U postgres -d aramco_reviews_db -c 'SELECT NOW();' && \
echo -e "\n=== API ===" && curl -s http://localhost:3000/api/stations | head -c 200 && echo
```

**Take Action Now:**
1. Go to AWS EC2 Console
2. Select the Aramco instance
3. Click **Connect** → **EC2 Instance Connect**
4. Run the debug commands above to identify the issue
5. Follow the appropriate fix based on the output
