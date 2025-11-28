# AWS RDS PostgreSQL Setup Guide

This guide walks you through setting up a free-tier PostgreSQL database on AWS RDS for the Aramco Reviews Enterprise application.

## Step 1: Create RDS Instance

### 1.1 Navigate to RDS Dashboard
1. Go to [AWS RDS Console](https://console.aws.amazon.com/rds/)
2. Click **Create database**

### 1.2 Configure Database Engine
1. Select **PostgreSQL**
2. Choose **Free tier** template (if available)
3. Click **Create database**

### 1.3 Database Configuration
Configure the following settings:

**Identifier & Authentication:**
- **DB instance identifier:** `aramco-reviews-db` (or your preferred name)
- **Master username:** `postgres` (default)
- **Master password:** Use a strong password (save this securely!)
  - Example pattern: `Aramco@2025#YourPassword`
- **Confirm password:** Re-enter the same password

**DB Instance Class:**
- Select **db.t3.micro** (free tier eligible)
- Enable storage auto-scaling (optional but recommended)
- **Allocated storage:** 20 GB (free tier limit)

**Connectivity:**
- **Publicly accessible:** No (keep internal for security)
- **VPC:** Default VPC
- **VPC security group:** Create new security group named `aramco-db-sg`
- **Availability Zone:** No preference

**Database Options:**
- **Database name:** `aramco_reviews_db`
- **Port:** 5432 (default)
- **DB parameter group:** default.postgres15
- **DB option group:** default (no options)
- **Backup retention period:** 7 days (free tier default)

**Monitoring & Logging:**
- Enable **Enhanced monitoring** (optional): Disable for cost savings
- Enable **Performance Insights** (optional): Disable for cost savings



### 1.4 Create Database
1. Review all settings
2. Click **Create database**
3. Wait 5-10 minutes for the instance to be created and available

## Step 2: Configure Security Group

### 2.1 Allow EC2 to Connect
1. Go to **EC2 Dashboard > Security Groups**
2. Find the security group for your EC2 instance (e.g., `launch-wizard-1`)
3. Note the security group ID (e.g., `sg-0123456789abcdef0`)

### 2.2 Update RDS Security Group
1. Go to **RDS Dashboard > Databases**
2. Click on your database (`aramco-reviews-db`)
3. Under **Connectivity & security**, click the security group link (`aramco-db-sg`)
4. Go to **Inbound rules** tab
5. Click **Edit inbound rules**
6. Add new rule:
   - **Type:** PostgreSQL
   - **Protocol:** TCP
   - **Port:** 5432
   - **Source:** Select security group of your EC2 instance (or enter IP)
   - Click **Save rules**

## Step 3: Get Database Endpoint

1. Go to **RDS Dashboard > Databases**
2. Click on your database (`aramco-reviews-db`)
3. Under **Connectivity & security**, copy the **Endpoint**
   - Format: `aramco-reviews-db.xxxxxxxxxxxxx.us-east-1.rds.amazonaws.com`

## Step 4: Test Connection (Optional)

### From Local Machine (if publicly accessible):
```bash
psql -h <endpoint> -U postgres -d aramco_reviews_db
# Enter password when prompted
```

### From EC2 Instance:
```bash
ssh -i "aramco.pem" ec2-user@ec2-3-226-97-116.compute-1.amazonaws.com
sudo yum install postgresql -y
psql -h <endpoint> -U postgres -d aramco_reviews_db
# Enter password when prompted
```

If connection succeeds, you'll see:
```
aramco_reviews_db=>
```

Type `\q` to exit.

## Step 5: Environment Variables for Application

Update your `.env` or pass these variables to docker-compose:

```env
DB_HOST=<your-rds-endpoint>
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=<your-strong-password>
DB_NAME=aramco_reviews_db
DB_SSL=true
```

## Step 6: Update docker-compose.yml

```yaml
version: '3.8'
services:
  backend:
    image: backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=aramco-reviews-db.xxxxxxxxxxxxx.us-east-1.rds.amazonaws.com
      - DB_PORT=5432
      - DB_USERNAME=postgres
      - DB_PASSWORD=YourStrongPassword123!
      - DB_NAME=aramco_reviews_db
      - DB_SSL=true
    depends_on:
      - workers

  workers:
    image: workers
    environment:
      - NODE_ENV=production
      - DB_HOST=aramco-reviews-db.xxxxxxxxxxxxx.us-east-1.rds.amazonaws.com
      - DB_PORT=5432
      - DB_USERNAME=postgres
      - DB_PASSWORD=YourStrongPassword123!
      - DB_NAME=aramco_reviews_db
      - DB_SSL=true
```

## Step 7: Run Database Migrations

Once the backend is running:

```bash
# SSH into EC2
ssh -i "aramco.pem" ec2-user@ec2-3-226-97-116.compute-1.amazonaws.com

# Run migrations
cd /home/ec2-user/aramco_reviews_Enterprise
docker exec -it <backend-container-id> npm run migrate:latest
```

## Cost Estimates (Free Tier)

- **RDS db.t3.micro:** Free for 12 months (750 hours/month)
- **Storage:** 20 GB free per month
- **Backup:** Included in free tier
- **Data transfer:** Minimal charges for cross-AZ or external transfer

**Important:** Free tier expires after 12 months. Monitor your AWS billing dashboard.

## Troubleshooting

### Connection Timeout
- Ensure security group allows inbound on port 5432
- Verify EC2 and RDS are in the same VPC
- Check database status is "Available"

### Authentication Failed
- Verify username and password are correct
- Ensure no special characters are causing issues in password

### Database Creation Failed
- Check RDS instance status in dashboard
- Review CloudWatch logs for errors
- Ensure free tier eligibility hasn't been exceeded

## Security Best Practices

1. **Never commit passwords to GitHub** - Use environment variables
2. **Use strong passwords:** Mix of uppercase, lowercase, numbers, special characters
3. **Keep backups enabled:** RDS handles automated backups
4. **Monitor access:** Use CloudWatch and RDS Enhanced Monitoring
5. **Rotate credentials** regularly in production
