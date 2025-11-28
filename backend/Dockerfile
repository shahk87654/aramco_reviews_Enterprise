FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy everything except node_modules
COPY package*.json tsconfig.json nest-cli.json ./
COPY src ./src

# Install all dependencies  
RUN npm install --legacy-peer-deps && npm cache clean --force

# Build application
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]
