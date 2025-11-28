#!/bin/bash
set -e

echo "Starting EC2 setup..."

# Step 1: Update packages
echo "Updating packages..."
sudo yum update -y

# Step 2: Install Docker
echo "Installing Docker..."
sudo yum install docker -y
sudo systemctl start docker
sudo usermod -a -G docker ec2-user

# Step 3: Install Git
echo "Installing Git..."
sudo yum install git -y

# Step 4: Clone repository
echo "Cloning repository..."
cd /home/ec2-user
git clone https://github.com/shahk87654/aramco_reviews_Enterprise.git
cd aramco_reviews_Enterprise

# Step 5: Build Docker images
echo "Building Docker images..."
echo "Building backend image..."
docker build -f backend/Dockerfile -t backend ./backend

echo "Building workers image..."
docker build -f workers/Dockerfile -t workers ./workers

echo "Setup complete!"
docker images
