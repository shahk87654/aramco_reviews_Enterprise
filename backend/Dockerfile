FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps && npm cache clean --force

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
