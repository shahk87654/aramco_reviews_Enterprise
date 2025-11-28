#!/bin/bash
cd /home/ec2-user/aramco_reviews_Enterprise/frontend
git pull
npm install
npm run build
PORT=3001 npm run start
