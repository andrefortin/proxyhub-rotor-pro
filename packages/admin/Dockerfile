FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/index.html ./index.html
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/vite.config.* ./
RUN npm ci --only=production && npm cache clean --force

EXPOSE 4173

CMD ["npm", "run", "preview"]