# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Only install production dependencies
COPY package*.json ./

RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

# Copy only built code from builder
COPY --from=builder /app/dist ./dist

CMD ["node", "dist/index"]
