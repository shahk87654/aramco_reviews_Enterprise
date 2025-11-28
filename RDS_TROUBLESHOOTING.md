# RDS Connection Troubleshooting - Connection Timed Out

## ⚠️ Issue Detected

**Error:** `Connection timed out` when trying to connect from EC2 to RDS

**Root Cause:** The RDS security group does not have an inbound rule allowing the EC2 instance to connect on port 5432.

---

## ✅ IMMEDIATE FIX REQUIRED

You must complete **Step 2.2** before proceeding. Follow these exact steps:

### Step 1: Find Your EC2 Security Group ID

Go to **AWS Console > EC2 Dashboard > Instances**

1. Find your running instance (Aramco)
2. Click on it
3. Scroll down to **Security** tab
4. Under **Security groups**, note the security group ID and name
   - **Example:** `sg-0123456789abcdef0` (launch-wizard-1)

### Step 2: Update RDS Security Group Inbound Rules

Go to **AWS Console > RDS Dashboard > Databases > aramco-reviews-db**

1. Scroll to **Connectivity & security** section
2. Under **VPC security groups**, click on the security group name (currently `default`)
3. You'll be taken to **EC2 Dashboard > Security Groups**
4. Select the security group (sg-094bc9ef8677be442 - default)
5. Click on the **Inbound rules** tab
6. Click **Edit inbound rules**

### Step 3: Add PostgreSQL Inbound Rule

Click **Add rule** and configure:

- **Type:** PostgreSQL
- **Protocol:** TCP
- **Port range:** 5432
- **Source:** Select from dropdown:
  - Type the security group ID from Step 1 (e.g., sg-0123456789abcdef0)
  - OR search for the security group name (e.g., launch-wizard-1)

Example:
```
Type:     PostgreSQL
Protocol: TCP
Port:     5432
Source:   sg-0123456789abcdef0 (launch-wizard-1)
```

Click **Save rules**

### Step 4: Verify Rule was Added

The rule should now appear in the Inbound rules table:
```
Type         | Protocol | Port range | Source          | Description
PostgreSQL   | TCP      | 5432       | sg-xxxxxxxxxx   | -
```

---

## Wait and Retry

After the security group rule is saved:

1. **Wait 30 seconds** for AWS to propagate the rule
2. Go back to your terminal
3. Run the test connection again:

```bash
ssh -i "aramco.pem" ec2-user@ec2-3-226-97-116.compute-1.amazonaws.com

# Test connection
psql -h aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d aramco_reviews_db \
     -p 5432 \
     -c "SELECT version();"
```

**Expected successful output:**
```
version
───────────────────────────────────────────────────────────────────────────
PostgreSQL 15.x on ... (Vendor specific database version)
(1 row)
```

---

## Interactive Connection Test (Optional)

If you want to connect interactively and explore:

```bash
ssh -i "aramco.pem" ec2-user@ec2-3-226-97-116.compute-1.amazonaws.com

# Connect to database interactively
psql -h aramco-reviews-db.c6jo024ey7uz.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d aramco_reviews_db \
     -p 5432

# You'll be prompted for password: Shahnawaz20030611

# Once connected, try these commands:
\dt                              # List all tables
\du                              # List all users
SELECT COUNT(*) FROM pg_tables;  # Count tables in public schema
\q                               # Exit
```

---

## Troubleshooting Checklist

After adding the security group rule, verify:

- [ ] Rule appears in RDS security group inbound rules
- [ ] Rule has correct port (5432)
- [ ] Rule source is your EC2 security group ID
- [ ] 30+ seconds have passed since rule was added
- [ ] RDS status is "Available" (not "Modifying" or "Backing-up")

---

## Alternative: Create Dedicated RDS Security Group (Optional)

If you prefer more isolation, create a new security group:

1. Go to **EC2 Dashboard > Security Groups > Create security group**
2. **Name:** `aramco-rds-sg`
3. **Description:** Security group for Aramco RDS database
4. **VPC:** vpc-0e0947bd8382c6967 (same as RDS)
5. Add **Inbound rule:**
   - **Type:** PostgreSQL
   - **Port:** 5432
   - **Source:** Your EC2 security group
6. Click **Create security group**

Then update RDS to use this new security group:

1. Go to **RDS Dashboard > Databases > aramco-reviews-db**
2. Click **Modify** (top right)
3. Under **Connectivity**, change **VPC security group** to `aramco-rds-sg`
4. Click **Continue** and **Apply immediately**

---

## Quick Summary

| Component | Issue | Fix |
|-----------|-------|-----|
| Security Group | Missing inbound rule | Add PostgreSQL/5432 rule from EC2 SG |
| RDS | Cannot accept connections | Ensure rule is added and propagated |
| EC2 | Can't connect to RDS | Update RDS security group |

Once the security group rule is added and the connection succeeds, you can proceed to **Step 5: Create docker-compose.yml**.
