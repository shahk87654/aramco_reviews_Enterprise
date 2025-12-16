# Free Deployment Guide for Aramco Reviews Enterprise

This guide provides step-by-step instructions for deploying your full-stack app (NestJS backend, Next.js frontend, and workers) using **AWS Free Tier** and **Vercel**. Both platforms offer generous free tiers, but be aware of limits (e.g., AWS free tier expires after 12 months, Vercel has usage caps). Your app uses Docker, so we'll leverage container services where possible.

## Prerequisites
- AWS account (sign up at aws.amazon.com; free tier available).
- Vercel account (sign up at vercel.com; free).
- GitHub repository with your code.
- Basic knowledge of AWS console and Vercel dashboard.
- Environment variables ready (e.g., API keys, secrets).

---

## Option 1: Deployment Using AWS Free Tier

AWS Free Tier includes 750 hours of EC2 t2.micro instances, 20 GB of EBS storage, 5 GB of S3, and more. We'll use EC2 for backend/workers, RDS for database, and S3 for static assets.

### Step 1: Set Up AWS Account and IAM
1. Sign up for AWS and enable Free Tier.
2. Create an IAM user with programmatic access (for CLI if needed).
3. Note your AWS credentials (access key, secret key).

### Step 2: Launch EC2 Instance for Backend and Workers
1. Go to EC2 Dashboard > Launch Instance.
2. Choose **Amazon Linux 2** (free tier eligible).
3. Select **t2.micro** (free tier).
4. Configure security group: Allow SSH (port 22), HTTP (80), HTTPS (443), and your app ports (e.g., 3000 for backend).
5. Launch and connect via SSH.

**Your Instance Details:**
- **Instance ID:** `i-0a0b975a200b52dcf`
- **Public DNS:** `ec2-3-226-97-116.compute-1.amazonaws.com`
- **SSH Key:** `aramco.pem`
- **Connect Command:** `ssh -i "aramco.pem" ec2-user@ec2-3-226-97-116.compute-1.amazonaws.com`

### Step 3: Install Docker on EC2
1. SSH into your EC2 instance using: `ssh -i "aramco.pem" ec2-user@ec2-3-226-97-116.compute-1.amazonaws.com`
2. Update packages: `sudo yum update -y`
3. Install Docker: `sudo amazon-linux-extras install docker -y`
4. Start Docker: `sudo service docker start`
5. Add user to docker group: `sudo usermod -a -G docker ec2-user`
6. Reconnect SSH after step 5.

### Step 4: Clone Repository and Build Images
1. Install Git: `sudo yum install git -y`
2. Clone your repo: `git clone https://github.com/shahk87654/aramco_reviews_Enterprise.git`
3. Navigate to project: `cd aramco_reviews_Enterprise`
4. Build Docker images:
   - Backend: `docker build -f backend/Dockerfile -t backend ./backend`
   - Workers: `docker build -f workers/Dockerfile -t workers ./workers`

### Step 5: Set Up Free RDS Database (PostgreSQL)
1. Go to RDS Dashboard > Create Database.
2. Choose **PostgreSQL**, free tier (db.t2.micro).
3. Set database name, username, password.
4. Note the endpoint (host) and port.
5. In EC2 security group, allow inbound from RDS (port 5432).

### Step 6: Run Backend and Workers on EC2
1. Create a docker-compose.yml for local orchestration (since AWS free tier doesn't include ECS):
   ```yaml
   version: '3.8'
   services:
     backend:
       image: backend
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - DB_HOST=<RDS endpoint>
         - DB_PORT=5432
         - DB_USERNAME=<username>
         - DB_PASSWORD=<password>
         - DB_NAME=<db name>
         - DB_SSL=true
         # Add other env vars
     workers:
       image: workers
       environment:
         - NODE_ENV=production
         # Same DB env vars
   ```
2. Run: `docker-compose up -d`
3. Check logs: `docker-compose logs`

### Step 7: Set Up Domain and SSL (Optional, Free with Route 53)
1. Register a domain via Route 53 (first domain free for 1 year).
2. Point domain to EC2 elastic IP.
3. Use AWS Certificate Manager for free SSL.

### Step 8: Deploy Frontend to S3 (Static Hosting)
1. Build frontend locally or on EC2: `cd frontend && npm run build`
2. Upload build folder to S3 bucket (free 5 GB).
3. Enable static website hosting in S3.
4. Use CloudFront for CDN (free tier: 1 TB transfer).

### Step 9: Run Migrations and Test
1. SSH into EC2, run migrations: `docker exec -it <backend-container> npm run migrate:latest`
2. Test endpoints: `curl http://localhost:3000/health`
3. Access frontend via S3 URL.

### Step 10: Monitoring and Scaling
- Use CloudWatch (free metrics).
- For scaling, upgrade to paid instances if needed.

---

## Option 2: Deployment Using Vercel (Frontend) + AWS (Backend/Workers)

Vercel excels for Next.js; use AWS for backend/workers/database.

### Step 1: Deploy Frontend to Vercel
1. Sign up at vercel.com and connect GitHub.
2. Import your repo, select frontend folder.
3. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
4. Set environment variables:
   - `NEXT_PUBLIC_API_URL=<backend URL>`
5. Deploy. Note the URL (e.g., `https://aramco-reviews.vercel.app`).

### Step 2: Deploy Backend to AWS (Same as Option 1, Steps 2-6)
- Follow AWS steps above for EC2, Docker, RDS.
- Ensure backend exposes API for frontend.

### Step 3: Deploy Workers to AWS Lambda (Free Tier)
1. Go to Lambda Dashboard > Create Function.
2. Choose container image, upload your workers Docker image.
3. Set environment variables (DB, etc.).
4. Configure triggers (e.g., API Gateway or EventBridge for scheduled tasks).
5. Free tier: 1M requests/month.

### Step 4: Integrate and Test
1. Update Vercel env vars with backend URL.
2. Redeploy frontend.
3. Test full flow: Frontend calls backend, workers process.

---

## General Tips
- **Costs:** Monitor AWS billing; free tier limits apply.
- **Security:** Use IAM roles, VPC for isolation.
- **Updates:** Push to GitHub; redeploy manually or automate with CodePipeline (free tier available).
- **Troubleshooting:** Check logs in EC2/CloudWatch/Vercel dashboard.
- If issues, provide error details for help.

This should get your app deployed for free. Choose based on your needs!
