# Install Dependencies

Install npm dependencies for all packages in apps/packages to generate package-lock.json files needed for Docker builds. This ensures reproducible installs and fixes any missing lockfiles.

## Purpose

Prepare the project for building Docker images by installing dependencies in admin (React), api (NestJS), and workers (Node.js).

## Instructions

Use TodoWrite to track the installation process.

1. cd apps/packages/admin && npm install && cd ../../..
2. cd apps/packages/api && npm install && cd ../../..
3. cd apps/packages/workers/aggregator && npm install && cd ../../..
4. cd apps/packages/workers/alerts && npm install && cd ../../..
5. cd apps/packages/workers/health && npm install && cd ../../..
6. cd apps/packages/workers/importer && npm install && cd ../../..
7. Verify all package-lock.json files exist

Execute the above Bash commands sequentially using the Bash tool.

After all installs, run `docker compose up --build -d` to test.

## Output

Confirm success with: `find apps/packages -name package-lock.json` (should list 6 files).
