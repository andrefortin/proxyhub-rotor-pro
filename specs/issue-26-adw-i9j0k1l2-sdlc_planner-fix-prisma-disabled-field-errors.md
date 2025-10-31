# Bug: Fix Prisma Disabled Field TypeScript Errors

## Metadata

issue_number: `26`
adw_id: `i9j0k1l2`
issue_json: `{\"title\":\"API TypeScript Errors on Disabled Field\",\"body\":\"src/modules/providers/providers.service.ts:114:17 - error TS2353: Object literal may only specify known properties, and 'disabled' does not exist in type '(Without<ProxyUpdateManyMutationInput, ProxyUncheckedUpdateManyInput> & ProxyUncheckedUpdateManyInput) | (Without<...> & ProxyUpdateManyMutationInput)'.\\n\\n114         data: { disabled: !active },\\n                    ~~~~~~~~\\n\\n  node_modules/.prisma/client/index.d.ts:3980:5\\n    3980     data: XOR<ProxyUpdateManyMutationInput, ProxyUncheckedUpdateManyInput>\\n             ~~~~\\n    The expected type comes from property 'data' which is declared here on type '{ data: (Without<ProxyUpdateManyMutationInput, ProxyUncheckedUpdateManyInput> & ProxyUncheckedUpdateManyInput) | (Without<...> & ProxyUpdateManyMutationInput); where?: ProxyWhereInput; limit?: number; }'\\n\\nsrc/modules/proxies/proxies.service.ts:38:246 - error TS2353: Object literal may only specify known properties, and 'disabled' does not exist in type 'ProxySelect<DefaultArgs>'.\\n\\n38       select: { id: true, host: true, port: true, username: true, protocol: true, pool: true, providerId: true, country: true, city: true, region: true, latitude: true, longitude: true, asn: true, org: true, score: true, tags: true, meta: true, disabled: true },\\n                                                                                                                                                                                                                                                        ~~~~~~~~\\n\\n  node_modules/.prisma/client/index.d.ts:3851:5\\n    3851     select?: ProxySelect<ExtArgs> | null\\n             ~~~~~~\\n    The expected type comes from property 'select' which is declared here on type '{ select?: ProxySelect<DefaultArgs>; omit?: ProxyOmit<DefaultArgs>; include?: ProxyInclude<DefaultArgs>; ... 5 more ...; distinct?: ProxyScalarFieldEnum | ProxyScalarFieldEnum[]; }'\\n\\n[7:45:21 PM] Found 2 errors. Watching for file changes.`}`

## Bug Description

TypeScript compilation fails in the API with TS2353 errors related to the 'disabled' field on Proxy model. In providers.service.ts:114, updating proxy disabled field via updateMany fails as 'disabled' is not recognized in ProxyUpdateManyMutationInput. In proxies.service.ts:38, including 'disabled' in select for findMany is invalid per ProxySelect type. Expected: Code compiles without errors using 'disabled' field added to Prisma schema. Actual: Prisma client does not recognize 'disabled' despite schema having it, causing build errors in Docker and dev watch mode.

## Problem Statement

Out-of-sync Prisma client after adding 'disabled' field to Proxy model prevents API code from compiling, blocking development/builds as TypeScript types exclude the new field in updates and selects.

## Solution Statement

Regenerate Prisma client to include the 'disabled' field in generated types (ProxyUpdateManyMutationInput, ProxySelect). Verify schema has 'disabled' field correctly defined. Run prisma generate in docker/api build process if needed, but primarily execute generate locally and commit updated @prisma/client. No schema changes required as 'disabled' exists; ensure no migrations pending.

## Steps to Reproduce

1. Start dev environment: `docker compose up --build -d` or run npm watch in api.
2. In API container or locally: Run `npx tsc` or watch for errors.
3. Observe TS2353 errors for 'disabled' in providers.service.ts updateMany and proxies.service.ts select.
4. Check node_modules/.prisma/client/index.d.ts – 'disabled' missing from relevant types.
5. Confirm Prisma schema has `disabled Boolean @default(false)` in Proxy model.

## Root Cause Analysis

The 'disabled' field was added to Prisma schema but Prisma client was not regenerated post-update. Generated types (@prisma/client) remain outdated, excluding 'disabled' from ProxySelect (for selects) and ProxyUpdateManyMutationInput (for updates). This is common after schema changes without running `prisma generate`, causing type mismatches in code using the field. Docker build uses cached/old client; local watch inherits ungenerated client.

## Relevant Files

Use these files to fix the bug:

- `README.md`: Project setup confirms Prisma usage and migration/deploy steps, but no explicit generate mention.
- `apps/packages/api/prisma/schema.prisma`: Defines Proxy model with 'disabled Boolean @default(false)'; verify field exists, no changes needed.
- `apps/packages/api/src/modules/providers/providers.service.ts`: Contains updateMany at line 114 using { disabled: !active }; fix by regenerating client so type includes 'disabled'.
- `apps/packages/api/src/modules/proxies/proxies.service.ts`: Contains findMany select at line 38 including disabled; regenerate client to add to ProxySelect.
- `apps/packages/api/package.json`: Dependencies include @prisma/client; after generate, no version change.
- `docker-compose.yml`: API service build; add prisma generate to Dockerfile if recurrent, but fix via local generate + commit.

No new files needed.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Verify and Run Prisma Client Generation

- Run `docker compose exec api npx prisma generate` to update Prisma client in container (or locally in api dir: `cd apps/packages/api && npx prisma generate`).
- Verify no errors; check node_modules/.prisma/client/index.d.ts includes 'disabled' in ProxySelect and update inputs.
- If migration needed (unlikely), run `npx prisma migrate dev --name add-disabled-field`, but schema already has it.

### Step 2: Fix Service Files if Needed

- In providers.service.ts: Ensure updateMany uses correct where (providerId), data: { disabled: !active } – no code change, just type fix via generate.
- In proxies.service.ts: Ensure select includes all valid fields including disabled – no code change required.
- Run `npx tsc --noEmit` in api dir to confirm no TS errors.

### Step 3: Update Build Process for Consistency

- In apps/packages/api/Dockerfile, add `RUN npx prisma generate` after prisma install if missing.
- Rebuild: `docker compose up --build -d` and check logs for no TS errors.

### Step 4: Validation and Testing

- Run API build/test: Verify docker logs show no TS errors.
- Test functionality: Update a provider active status, confirm proxies disabled toggle works without runtime errors.
- Run `docker compose exec api npx prisma studio` to inspect Proxy disabled field.

## Validation Commands

Execute every command to validate the bug is fixed with zero regressions.

- Before: `cd apps/packages/api && npx tsc --noEmit` – expect 2 TS2353 errors on 'disabled'.
- Run `cd apps/packages/api && npx prisma generate` to fix types.
- After: `cd apps/packages/api && npx tsc --noEmit` – confirm 0 errors.
- `docker compose up --build -d` – check API container logs for no TS errors during startup.
- Test update: Use API endpoint to toggle provider, verify proxies update disabled field via Prisma studio or DB query.
- `docker compose exec api npx prisma db push` if schema mismatch, but focus on generate.

## Notes

- Primary fix: `npx prisma generate` syncs client with schema.
- Commit updated node_modules/.prisma/client/* if changed (usually yes after generate).
- No new libs; Prisma already in deps.
- If errors persist, check Prisma version compatibility or schema field type (Boolean correct).