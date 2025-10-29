FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev && npm cache clean --force
ENV PATH="/app/node_modules/.bin:${PATH}"
COPY src ./src
CMD ["nodemon", "-L", "src/index.js"]
