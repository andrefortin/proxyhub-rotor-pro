FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm i
COPY . .
RUN npx prisma generate && npm run build
CMD ["node", "dist/main.js"]
