FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Remove dev dependencies to save space
RUN npm prune --omit=dev

# Remove unnecessary files
RUN rm -rf src tsconfig.json jest.config.js nest-cli.json .eslintrc.js .prettierrc

EXPOSE 3000

CMD ["node", "dist/main"]
