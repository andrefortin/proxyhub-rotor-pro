FROM node:20
RUN apt-get update && apt-get install -y build-essential python3 && rm -rf /var/lib/apt/lists/*

# Install postgresql-client for pg_isready
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*
WORKDIR /app/api
COPY apps/packages/api/package.json apps/packages/api/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --include=dev --legacy-peer-deps; else npm install --include=dev --legacy-peer-deps; fi
COPY apps/packages/api/src ./src
COPY apps/packages/api/tsconfig.json ./
COPY ../../prisma ./prisma
RUN npx prisma generate && npx nest build
CMD ["sh", "-c", "npx prisma generate && npx nest start --watch"]
