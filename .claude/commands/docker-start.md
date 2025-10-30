# Docker Start

Start the ProxyHub Rotor Pro services in development or production mode using Docker Compose.

## Purpose
Choose between production (optimized, built images) and development (hot-reload with debug logging) modes. This command will prompt you to select the mode and execute the appropriate startup, including image-based configs for workers/admin with nodemon for live reload, API volumes (mount package.json/prisma), healthchecks, and runtime npm installs.

## Instructions

1. Use the AskUserQuestion tool to prompt the user for the mode.

The question should be: \"Which Docker mode would you like to start? Choose one: Production (optimized builds, no hot-reload) or Development (hot-reload with debug logging).\"

Header: \"Docker Mode\"

Options:
- label: \"Production\", description: \"Start in production mode with docker compose up --build -d\"
- label: \"Development\", description: \"Start in development mode with docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d\"

Allow only single selection (multiSelect: false).

2. Based on the user's answer:

- If \"Production\": Run `docker compose up --build -d` using Bash.
  - After success, confirm with `docker compose ps`.
  - Run `docker compose exec -T api npx prisma migrate deploy` for migrations.

- If \"Development\":
  - Ensure docker-compose.dev.yml has fixes: workers/admin use `image: node:20-alpine` with runtime `npm ci` and `nodemon -L src/index.js` (or `npm run dev` for admin), API volumes for package.json/prisma/src, db healthcheck, restart policies.
  - Run `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d` using Bash (no --build to avoid Dockerfile errors).
  - After success, confirm with `docker compose -f docker-compose.yml -f docker-compose.dev.yml ps`.
  - Run `docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T api npx prisma db push --accept-data-loss` for dev schema sync.

3. If the user selects \"Other\", ask for clarification or default to Production.

4. Always output the status of running services for verification. Mention hot-reload via nodemon on worker/API/admin src changes (watch for restarts in logs).

## Output
- Success message with mode started and migrations applied.
- List of running services and ports.
- Note on how to stop: `docker compose down` (or with -f for dev). Logs: `docker compose logs -f <service>`.