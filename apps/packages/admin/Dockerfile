FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev && npm cache clean --force
ENV PATH="/app/node_modules/.bin:${PATH}"
COPY . .
EXPOSE 5173 24678
CMD ["npm", "run", "dev"]
