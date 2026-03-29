# The Telescope

## Overview

**The Telescope** is a content-sharing web app where people can browse a feed, explore posts, publish new content, open post detail pages, and view user profiles. It includes sign-in and sign-up, a responsive layout with mobile navigation, and light/dark theme support. The UI talks to a backend API (typically proxied during local development).

## Tech stack

| Area | Technologies |
|------|----------------|
| **Runtime & language** | [Node.js](https://nodejs.org/), [TypeScript](https://www.typescriptlang.org/) |
| **UI** | [React 18](https://react.dev/), [Vite](https://vitejs.dev/) |
| **Routing** | [React Router](https://reactrouter.com/) v6 |
| **Server state & data fetching** | [TanStack Query](https://tanstack.com/query) (React Query) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/), [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate) |
| **Components** | [shadcn/ui](https://ui.shadcn.com/)-style primitives built on [Radix UI](https://www.radix-ui.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Theming** | [next-themes](https://github.com/pacocoursey/next-themes) (class-based light/dark) |
| **Toasts** | [Sonner](https://sonner.emilkowal.ski/), Radix toast |
| **Forms & validation** | [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/), [@hookform/resolvers](https://github.com/react-hook-form/resolvers) |
| **Linting ** | ESLint |

## Getting started

### Prerequisites

- **Node.js** 18+ (LTS recommended) and **npm** (or pnpm/yarn if you prefer)

### Steps

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment (optional)**

   Copy the example env file and adjust if your API is not served via the dev proxy:

   ```bash
   cp .env.example .env
   ```

   On Windows (Command Prompt): `copy .env.example .env`

   - If `VITE_API_URL` is unset, the app uses `/api` (relative URLs). In development, Vite proxies `/api` to the backend (see `vite.config.ts`).

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   The app is served at **http://localhost:8080** (configured in `vite.config.ts`). Ensure your backend is reachable where the proxy points (default proxy target: `http://localhost:3002` for `/api`).

4. **Other useful commands**

   | Command | Purpose |
   |---------|---------|
   | `npm run build` | Production build to `dist/` |
   | `npm run preview` | Preview the production build locally |
   | `npm run lint` | Run ESLint |
   | `npm test` | Run Vitest once |
   | `npm run test:watch` | Vitest in watch mode |
