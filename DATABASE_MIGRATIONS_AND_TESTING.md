# Database Migrations and Application Testing

This guide covers running database migrations and testing your deployed application.

---

## Step 1: Verify Backend Container Status

Before running migrations, ensure the backend is properly connected to the database.

```bash
# SSH into EC2
ssh -i "aramco.pem" ec2-user@ec2-3-226-97-116.compute-1.amazonaws.com

# Check container status
docker ps | grep aramco-backend

# Expected output:
# 90550baed471   backend   ...   Up 2 minutes   aramco-backend
```

### Check Backend Logs

```bash
# View recent logs
docker logs aramco-backend

# View live logs
docker logs -f aramco-backend

# Look for this success message:
# "[Nest] 19  - 11/28/2025, 6:30:37 AM     LOG [Bootstrap] 🚀 Application is running on: http://localhost:3000"
```

---

## Step 2: Run Database Migrations

### Get Backend Container ID

```bash
# Option 1: Get from running containers
CONTAINER_ID=$(docker ps -q -f name=aramco-backend)
echo $CONTAINER_ID

# Option 2: Use container name directly (easier)
CONTAINER_NAME="aramco-backend"
```

### Execute Migration Command

```bash
# Using container name
docker exec aramco-backend npm run migrate:latest

# Or using container ID
docker exec <CONTAINER_ID> npm run migrate:latest

# Expected output:
# > aramco-reviews-backend@1.0.0 migrate:latest
# Running migrations...
# [TypeORM] No migrations are pending
# Or:
# [TypeORM] 0001_initial_migration.ts migration executed successfully
```

### View Migration Status

```bash
# Show all migrations and their status
docker exec aramco-backend npm run typeorm migration:show

# Expected output:
# Migrations:
# ┌─────────────────────────────────────┬──────────────────┬──────────────┐
# │ Migration                           │ Status           │ Timestamp    │
# ├─────────────────────────────────────┼──────────────────┼──────────────┤
# │ InitialMigration1701174000000       │ Success          │ 1701174000   │
# └─────────────────────────────────────┴──────────────────┴──────────────┘
```

---

## Step 3: Seed Database (Optional)

If your application has a seed file for initial data:

```bash
# Run seed script
docker exec aramco-backend npm run seed

# Expected output:
# > aramco-reviews-backend@1.0.0 seed
# Seeding database...
# ✓ 10 stations created
# ✓ 50 reviews created
# ✓ 30 campaigns created
# Seeding complete!
```

---

## Step 4: Verify Database Connection

### Check Database Tables

```bash
# Connect to RDS from EC2
psql -h aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d aramco_reviews_db \
     -p 5432 << EOF
Shahnawaz20030611
\dt
\q
EOF

# Or interactive:
psql -h aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d aramco_reviews_db

# When prompted for password, enter: Shahnawaz20030611

# In psql prompt:
aramco_reviews_db=> \dt                    # List all tables
aramco_reviews_db=> SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
aramco_reviews_db=> \q                     # Exit
```

---

## Step 5: Test API Endpoints

### Health Check

```bash
# From EC2
curl -s http://localhost:3000/api/health

# From your local machine
curl -s http://ec2-3-226-97-116.compute-1.amazonaws.com:3000/api/health

# Expected response:
# {"status":"ok"}
```

### Get All Stations

```bash
# From EC2
curl -s http://localhost:3000/api/stations | jq '.'

# Expected response:
# [
#   {
#     "id": "station-1",
#     "name": "Aramco Station - Riyadh",
#     "location": "Riyadh, Saudi Arabia",
#     ...
#   }
# ]
```

### Login (if auth endpoints exist)

```bash
# Get authentication token
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password"
  }' | jq '.'

# Expected response:
# {
#   "access_token": "eyJhbGciOiJIUzI1NiIs...",
#   "expires_in": 86400
# }
```

### Swagger Documentation

Open in browser:
```
http://ec2-3-226-97-116.compute-1.amazonaws.com:3000/api/docs
```

- Use the Swagger UI to test all API endpoints
- View request/response schemas
- Test with actual data

---

## Step 6: Monitor Application

### View Real-time Logs

```bash
# Backend logs
docker logs -f aramco-backend

# Workers logs
docker logs -f aramco-workers

# Combined logs
docker logs -f aramco-backend aramco-workers
```

### Container Resource Usage

```bash
# View resource consumption
docker stats aramco-backend aramco-workers

# Expected output shows:
# CONTAINER ID  NAME              CPU %  MEM USAGE / LIMIT  NET I/O
# 90550baed471  aramco-backend    0.5%   150MiB / 1GiB      500KB / 250KB
# dcca9114a1b5  aramco-workers    0.2%   100MiB / 1GiB      100KB / 50KB
```

### Check Database Connections

```bash
# From EC2
psql -h aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d aramco_reviews_db \
     -c "SELECT count(*) as active_connections FROM pg_stat_activity;"
```

---

## Step 7: Backup Database

### Create Manual Backup

```bash
# Backup database to file
pg_dump -h aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com \
        -U postgres \
        -d aramco_reviews_db \
        --password \
        > backup_$(date +%Y%m%d_%H%M%S).sql

# When prompted, enter password: Shahnawaz20030611

# File saved as: backup_20251128_063037.sql
```

### Backup via AWS Console

1. Go to **RDS Dashboard** → **Databases** → **aramco-reviews-db**
2. Click **Actions** → **Create snapshot**
3. Enter snapshot name: `backup-20251128`
4. Click **Create snapshot**
5. Wait for completion (shows "available")

---

## Step 8: Test Frontend-Backend Integration

Once frontend is deployed to S3/CloudFront:

```bash
# Test API call from frontend
curl -s http://aramco-reviews-frontend.s3-website-us-east-1.amazonaws.com

# Check if frontend can reach backend
# Open browser console (F12) and check for any API errors
```

### Verify CORS Configuration

If frontend can't reach backend, check CORS:

```bash
# Test CORS header
curl -i -X OPTIONS http://localhost:3000/api/stations \
  -H "Origin: http://aramco-reviews-frontend.s3-website-us-east-1.amazonaws.com" \
  -H "Access-Control-Request-Method: GET"

# Expected response includes:
# Access-Control-Allow-Origin: *
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH
```

---

## Step 9: Common Issues and Solutions

### Migration Fails

**Error:** `QueryFailedError: relation "users" does not exist`

**Solution:**
```bash
# Ensure migrations run in correct order
docker exec aramco-backend npm run typeorm migration:revert

# Then re-run
docker exec aramco-backend npm run migrate:latest
```

### Database Connection Error

**Error:** `FATAL: password authentication failed for user "postgres"`

**Solution:**
```bash
# Verify RDS endpoint and credentials
echo "Host: aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com"
echo "Port: 5432"
echo "User: postgres"
echo "Database: aramco_reviews_db"

# Test connection
psql -h aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com \
     -U postgres -c "SELECT 1"
```

### Container Not Running

**Error:** `docker: Error response from daemon: no such container`

**Solution:**
```bash
# Check all containers (running and stopped)
docker ps -a

# If stopped, start it
docker start aramco-backend

# If missing, redeploy
docker run -d --name aramco-backend ... backend
```

### API Not Responding

**Error:** `Connection refused`

**Solution:**
```bash
# Check if service is listening on port 3000
curl http://localhost:3000

# Check logs for startup errors
docker logs aramco-backend

# Verify port binding
docker port aramco-backend

# If not binding correctly, restart
docker restart aramco-backend
```

---

## Step 10: Post-Deployment Checklist

- [ ] Migrations executed successfully
- [ ] Database tables created
- [ ] Health check endpoint responding
- [ ] All API endpoints returning data
- [ ] Frontend can reach backend
- [ ] Swagger documentation accessible
- [ ] No database connection errors in logs
- [ ] CORS headers properly configured
- [ ] Database backup created
- [ ] Application memory/CPU usage normal

---

## Monitoring and Maintenance

### Daily Checks

```bash
# SSH into EC2 daily to run:
ssh -i "aramco.pem" ec2-user@ec2-3-226-97-116.compute-1.amazonaws.com

# Check containers are running
docker ps

# Check logs for errors
docker logs --since 24h aramco-backend | grep -i error

# Check disk usage
df -h
```

### Weekly Tasks

```bash
# Update Docker images
docker pull backend:latest
docker pull workers:latest

# Backup database
pg_dump -h aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com \
        -U postgres -d aramco_reviews_db > weekly_backup.sql

# Check AWS costs
# Go to AWS Console > Billing > Cost Management
```

### Monthly Tasks

```bash
# Review CloudWatch logs
# Monitor RDS performance
# Check security group rules
# Update application dependencies
# Review AWS billing
```

---

## Advanced: Automated Health Checks

Create a health check script:

```bash
#!/bin/bash
# health-check.sh

BACKEND_URL="http://ec2-3-226-97-116.compute-1.amazonaws.com:3000"
DB_HOST="aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com"

# Check backend
if curl -s "$BACKEND_URL/api/health" | grep -q "ok"; then
  echo "✅ Backend: OK"
else
  echo "❌ Backend: FAILED"
fi

# Check database
if psql -h $DB_HOST -U postgres -d aramco_reviews_db -c "SELECT 1" 2>/dev/null; then
  echo "✅ Database: OK"
else
  echo "❌ Database: FAILED"
fi

# Check containers
if docker ps | grep -q aramco-backend; then
  echo "✅ Backend Container: OK"
else
  echo "❌ Backend Container: NOT RUNNING"
fi
```

Run with: `bash health-check.sh`

---

## Next Steps

1. ✅ Run migrations
2. ✅ Seed database (if applicable)
3. ✅ Test API endpoints
4. ✅ Deploy frontend
5. ✅ Test frontend-backend integration
6. → Set up monitoring (CloudWatch)
7. → Configure custom domain
8. → Enable HTTPS/SSL
