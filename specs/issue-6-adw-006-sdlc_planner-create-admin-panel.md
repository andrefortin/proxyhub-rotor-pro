# Feature: Create Admin Panel

## Metadata

issue_number: `2`
adw_id: `2`
issue_json: `{"title": "Create Admin Panel", "body": "create a new module that will have its root in the apps/packages/ folder it will be the Admin Panel for this project. We will use typescript, bun, tailwind, and industry standard styling and component design, we need a light and dark mode toggle, a left side-nav bar, and its own dockerfile because we will build it with the dockercompose, we will use vite as well."}`

## Feature Description

This feature creates a new Admin Panel as a dedicated package under apps/packages/, built with TypeScript, Bun for package management, Tailwind CSS for styling, and Vite for bundling and development server. The panel will include a left sidebar navigation for easy access to sections like dashboard, proxies, providers, and settings. It will support light and dark mode toggling for improved user experience. A custom Dockerfile will be added to enable building and running the panel via Docker Compose, integrating seamlessly with the existing monorepo structure. This admin panel will serve as the central UI for managing the ProxyHub Rotator Pro application, providing an intuitive interface for administrators to monitor and configure system components.

## User Story

As a system administrator
I want a dedicated admin panel with modern UI, navigation, and theme support
So that I can efficiently manage proxies, providers, pools, and other resources through a user-friendly interface.

## Problem Statement

The project lacks a structured, modern admin panel. While there are mentions of an existing UI at localhost:4173, it needs to be properly scaffolded as a new package with best practices for styling (Tailwind), build tools (Vite, Bun), theme management (light/dark modes), and navigation (left sidebar). Additionally, without a dedicated Dockerfile, integration into the Docker Compose workflow is incomplete, hindering containerized deployment.

## Solution Statement

Scaffold a new package at apps/packages/admin/ using Vite for React/TypeScript setup, integrate Tailwind CSS with PostCSS for styling, and implement a basic layout with a left sidebar nav (using components for links to routes like /dashboard, /proxies) and a theme toggle (using localStorage and CSS classes). Use industry-standard component design: modular, reusable components (e.g., Button, Card) with Tailwind utilities. Add a Dockerfile for building the static assets and serving via Nginx or similar in production. Update docker-compose.yml to include the new service. Ensure the panel fetches data from the API (e.g., /v1/proxies) and displays it, starting with a simple dashboard page.

## Relevant Files

Use these files to implement the feature:

- `README.md`: Provides project overview, existing Admin UI mentions (localhost:4173), and integration patterns for API consumption.
- `apps/packages/api/src/modules/proxies/proxies.controller.ts`: Relevant for API endpoints the admin panel will consume (e.g., GET /v1/proxies).
- `docker-compose.dev.yml`: Existing Docker Compose config; extend to include admin service.
- `apps/packages/admin/package.json`: (If exists) Current admin package setup; update for Bun, Vite, Tailwind.
- `.claude/commands/test_e2e.md`: Instructions for creating E2E tests.
- `.claude/commands/e2e/test_basic_query.md`: Example E2E test for UI validation.

### New Files

- `apps/packages/admin/vite.config.ts`: Vite configuration for the admin panel.
- `apps/packages/admin/postcss.config.js`: PostCSS config for Tailwind.
- `apps/packages/admin/tailwind.config.js`: Tailwind CSS configuration, including dark mode support.
- `apps/packages/admin/src/main.tsx`: Entry point with React root, theme provider.
- `apps/packages/admin/src/App.tsx`: Main app component with layout (sidebar, routes).
- `apps/packages/admin/src/components/Sidebar.tsx`: Left navigation component.
- `apps/packages/admin/src/components/ThemeToggle.tsx`: Light/dark mode toggle.
- `apps/packages/admin/src/pages/Dashboard.tsx`: Initial dashboard page fetching API data.
- `apps/packages/admin/Dockerfile`: Custom Dockerfile for building and serving the admin panel.
- `.claude/commands/e2e/test_admin-panel.md`: New E2E test file validating panel loads, navigation, and theme toggle.

## Implementation Plan

### Phase 1: Foundation

Set up the new package structure under apps/packages/admin/ with Bun for dependencies, initialize Vite with React+TS template, install Tailwind and configure PostCSS. Define basic routing (using React Router) and global styles. Add theme management via CSS variables and class toggling.

### Phase 2: Core Implementation

Build the layout: Create Sidebar component with links to routes, ThemeToggle in header. Implement responsive design with Tailwind. Add initial Dashboard page that fetches and displays proxy list/stats from API. Ensure components follow industry standards (e.g., accessible, semantic HTML).

### Phase 3: Integration

Update docker-compose.yml to build and expose the admin service (port 4173). Configure environment variables for API base URL. Add scripts in package.json for dev, build, preview. Test integration with existing API and ensure dark mode persists across sessions.

## Step by Step Tasks

### Setup Package and Tools

- Initialize `apps/packages/admin/` if not fully set up: Run `bun init`, install Vite (`bun add -d vite @vitejs/plugin-react`), Tailwind (`bun add -d tailwindcss postcss autoprefixer`), React (`bun add react react-dom @types/react @types/react-dom`), React Router (`bun add react-router-dom`).
- Create `vite.config.ts` with React plugin and base path if needed.
- Generate `tailwind.config.js` with dark mode: 'class', and content paths for src/**.
- Create `postcss.config.js` with Tailwind plugins.
- Update `package.json` scripts: "dev": "vite", "build": "tsc && vite build", "preview": "vite preview".

### Implement Core Layout and Components

- In `src/App.tsx`, set up router with routes for / (Dashboard), /proxies, etc.
- Create `src/components/Sidebar.tsx`: Use Tailwind for vertical nav with links (RouterLink), icons if possible (add lucide-react or similar).
- Create `src/components/Layout.tsx`: Wrapper with Sidebar, main content area, and header with ThemeToggle.
- Implement `src/components/ThemeToggle.tsx`: Button that toggles 'dark' class on document.body, saves to localStorage.
- Add global CSS in `src/index.css`: Import Tailwind, set base styles for dark mode (e.g., @layer base { :root { --bg: white; } [data-theme='dark'] { --bg: black; } }).

### Build Initial Dashboard Page

- Create `src/pages/Dashboard.tsx`: Use useEffect to fetch from API (e.g., /v1/proxies/sample), display in cards/tables with Tailwind.
- Ensure responsive design: Mobile-friendly sidebar (collapsible if needed).
- Add error handling for API calls (e.g., fallback UI).

### Create E2E Test

- Read `.claude/commands/test_e2e.md` and `.claude/commands/e2e/test_basic_query.md` for format.
- Create `.claude/commands/e2e/test_admin-panel.md`: Test steps: Start admin dev server, load localhost:4173, verify sidebar visible and clickable, toggle theme and confirm color change, navigate to dashboard and see proxy data (minimal steps with expected screenshots).

### Docker Integration

- Create `apps/packages/admin/Dockerfile`: Multi-stage build with Bun for deps, Vite build, then serve static files with Nginx.
- Update `docker-compose.dev.yml`: Add admin service, build context ./apps/packages/admin, ports 4173:80, depends_on api.

### Testing and Validation

- Run `bun install` in admin, `bun run dev`, verify at localhost:4173.
- Test theme toggle, navigation, API integration.
- Run validation commands to ensure no regressions.

## Testing Strategy

### Unit Tests

- Test ThemeToggle: Mount component, simulate click, assert class toggle and localStorage set.
- Test API fetch in Dashboard: Mock fetch, assert data renders in components.
- Use Vitest or Jest for component snapshots and interactions.

### Edge Cases

- Dark mode persistence: Reload page, verify theme restores.
- No API response: Dashboard shows loading/error state.
- Mobile view: Sidebar collapses, responsive nav works.
- Build errors: Ensure TypeScript strict mode passes.

## Acceptance Criteria

- Admin panel runs at http://localhost:4173 with Vite dev server.
- Left sidebar navigation with at least 3-4 links (Dashboard, Proxies, Providers, Settings), responsive.
- Theme toggle switches between light/dark modes, persists on reload.
- Dashboard page fetches and displays proxy data from API without errors.
- Dockerfile builds successfully, integrates into docker-compose up.
- All Tailwind classes apply correctly, industry-standard styling (clean, accessible).
- No TypeScript errors, build succeeds.

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- `cd apps/packages/admin && bun install` - Install dependencies.
- `cd apps/packages/admin && bun run dev` - Start dev server, manually verify UI at localhost:4173 (sidebar, toggle, dashboard data).
- `cd apps/packages/admin && bun run build` - Build for production, check dist/ folder.
- `docker compose up --build admin` - Test Docker build and run, access via container port.
- Read `.claude/commands/test_e2e.md`, then read and execute `.claude/commands/e2e/test_admin-panel.md` to validate this functionality works.
- `cd apps/packages/admin && bun tsc --noEmit` - Type check.
- `cd apps/packages/api && uv run pytest` - Run server tests to validate the feature works with zero regressions (ensure API compatibility).
- `cd apps/packages/admin && bun tsc --noEmit` - Run frontend type checks to validate the feature works with zero regressions.
- `cd apps/packages/admin && bun run build` - Run frontend build to validate the feature works with zero regressions.

## Notes

- Use Bun for faster installs/builds, but ensure compatibility with existing monorepo.
- For icons in sidebar, add lucide-react (`bun add lucide-react`).
- API base URL: Use VITE_API_URL env var, default to http://localhost:3000.
- Future: Add authentication guard for admin routes.
- No new server-side libs needed; focus on frontend.
- Ensure accessibility: ARIA labels for nav, keyboard navigation for toggle.