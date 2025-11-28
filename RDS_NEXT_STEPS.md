# RDS Setup - Next Steps (Steps 2.2 onwards)

Your RDS PostgreSQL database has been successfully created! Here's the information and remaining steps:

## ✅ Your RDS Configuration

**Database Details:**
- **DB Identifier:** `aramco-reviews-db`
- **Endpoint:** `aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com`
- **Port:** 5432
- **Master Username:** `postgres`
- **Master Password:** `Shahnawaz20030611`
- **Database Name:** `aramco_reviews_db`
- **Instance Class:** db.t4g.micro (Free tier)
- **Region:** us-east-1f
- **VPC:** vpc-0e0947bd8382c6967
- **Status:** Available (after backing-up completes)

---

## Step 2.2: Update RDS Security Group (COMPLETE THIS NOW)

Your RDS is currently using the **default** security group. We need to allow your EC2 instance to connect.

### Option A: Update Default Security Group (Simpler)

1. Go to **AWS Console > EC2 Dashboard > Security Groups**
2. Find and select the **default** security group (sg-094bc9ef8677be442)
3. Click on **Inbound rules** tab
4. Click **Edit inbound rules**
5. Click **Add rule**:
   - **Type:** PostgreSQL
   - **Protocol:** TCP
   - **Port range:** 5432
   - **Source:** 
     - Select your EC2 security group (e.g., `launch-wizard-1`)
     - OR enter your EC2 instance's security group ID
   - Click **Save rules**

### Option B: Create New Security Group (More Secure)

1. Go to **AWS Console > EC2 Dashboard > Security Groups**
2. Click **Create security group**:
   - **Name:** `aramco-db-sg`
   - **Description:** Security group for Aramco RDS database
   - **VPC:** vpc-0e0947bd8382c6967 (same as your RDS)
3. Add **Inbound rule**:
   - **Type:** PostgreSQL
   - **Port:** 5432
   - **Source:** Select your EC2 instance's security group
4. Click **Create security group**
5. Go back to **RDS Dashboard > Databases > aramco-reviews-db**
6. Click **Modify** (top right)
7. Under **Connectivity**, change **VPC security group** to the new `aramco-db-sg`
8. Click **Continue** and **Apply immediately**

---

## Step 3: Verify Security Group Rule

After updating security group rules:

1. Go to **RDS Dashboard > Databases > aramco-reviews-db**
2. Under **Connectivity & security**, verify:
   - ✅ Endpoint shows: `aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com`
   - ✅ Port shows: 5432
   - ✅ VPC security groups show your rule allowing inbound on 5432

---

## Step 4: Test Connection from EC2

SSH into your EC2 instance and test the connection:

```bash
# SSH into EC2
ssh -i "aramco.pem" ec2-user@ec2-3-226-97-116.compute-1.amazonaws.com

# Install PostgreSQL client
sudo yum install postgresql15-client -y

# Test connection to RDS
psql -h aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d aramco_reviews_db \
     -p 5432

# When prompted, enter password: Shahnawaz20030611
```

**Expected output if successful:**
```
aramco_reviews_db=>
```

If you see this prompt, the connection is working! Type `\q` to exit.

**Common errors & fixes:**
- `FATAL: Ident authentication failed` - Rare, check username
- `could not connect to server` - Check security group rules
- `Connection timed out` - Verify RDS status is "Available" (not "Backing-up")

---

## Step 5: Create docker-compose.yml on EC2

SSH into your EC2 instance:

```bash
ssh -i "aramco.pem" ec2-user@ec2-3-226-97-116.compute-1.amazonaws.com
cd /home/ec2-user/aramco_reviews_Enterprise
```

Create the `docker-compose.yml` file:

```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    image: backend
    container_name: aramco-backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com
      - DB_PORT=5432
      - DB_USERNAME=postgres
      - DB_PASSWORD=Shahnawaz20030611
      - DB_NAME=aramco_reviews_db
      - DB_SSL=true
      - JWT_SECRET=aramco_jwt_secret_key_2025_secure
      - JWT_EXPIRATION=24h
    restart: always
    depends_on:
      - workers
    networks:
      - aramco-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  workers:
    image: workers
    container_name: aramco-workers
    environment:
      - NODE_ENV=production
      - DB_HOST=aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com
      - DB_PORT=5432
      - DB_USERNAME=postgres
      - DB_PASSWORD=Shahnawaz20030611
      - DB_NAME=aramco_reviews_db
      - DB_SSL=true
    restart: always
    networks:
      - aramco-network

networks:
  aramco-network:
    driver: bridge
EOF
```

Verify the file was created:
```bash
cat docker-compose.yml
```

---

## Step 6: Start Containers with docker-compose

```bash
# Start backend and workers
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f workers

# Stop containers (if needed)
docker-compose down
```

**Expected output after `docker-compose up -d`:**
```
✔ Container aramco-workers  Started                                              
✔ Container aramco-backend  Started
```

---

## Step 7: Run Database Migrations

Once backend is running and database connection is verified:

```bash
# Get backend container name or ID
BACKEND_CONTAINER=$(docker-compose ps -q backend)

# Run migrations
docker exec $BACKEND_CONTAINER npm run migrate:latest

# Check migration results
docker exec $BACKEND_CONTAINER npm run typeorm migration:show
```

---

## Step 8: Verify Services are Running

Test the backend API:

```bash
# Test from EC2
curl http://localhost:3000/health

# Expected response:
# {"status":"ok"}
```

Test from your local machine:

```bash
# Replace with your EC2 public IP
curl http://ec2-3-226-97-116.compute-1.amazonaws.com:3000/health
```

If this doesn't work, check EC2 security group allows inbound on port 3000.

---

## Summary of Your RDS Setup

| Setting | Value |
|---------|-------|
| **Endpoint** | aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com |
| **Port** | 5432 |
| **Username** | postgres |
| **Password** | Shahnawaz20030611 |
| **Database** | aramco_reviews_db |
| **Instance** | db.t4g.micro |
| **Backup** | Enabled (7 days) |
| **SSL** | Enabled |

---

## ⚠️ Security Reminders

1. **Never commit credentials to GitHub!** Use environment variables only
2. **Rotate password regularly** in production
3. **Backup your database** - RDS handles automatic backups
4. **Monitor access** via CloudWatch
5. **Use strong passwords** - already done! ✅

---

## Troubleshooting Checklist

- [ ] RDS status is "Available" (not "Backing-up" or "Creating")
- [ ] Security group allows inbound PostgreSQL (5432) from EC2
- [ ] EC2 security group allows outbound to RDS
- [ ] Docker images (backend, workers) are built locally
- [ ] Database credentials are correct in docker-compose.yml
- [ ] EC2 has Docker and docker-compose installed

---

## Next Steps After Verification

1. ✅ Update security group (Step 2.2) - **DO THIS FIRST**
2. ✅ Test connection from EC2 (Step 4)
3. ✅ Create docker-compose.yml (Step 5)
4. ✅ Start containers (Step 6)
5. ✅ Run migrations (Step 7)
6. ✅ Verify API is working (Step 8)

Once all are complete, your full-stack application will be running on AWS!
