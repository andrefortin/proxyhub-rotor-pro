FROM node:20-alpine
WORKDIR /app
COPY packages/api/package.json .
COPY packages/api/package-lock.json .
RUN npm ci || npm i
COPY packages/api/src ./src
COPY prisma ./prisma
RUN npx prisma generate && npm run build
CMD ["node", "dist/main.js"]
